import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createVerificationCode, formatBillOfLadingNumber, isValidBookingNumber, SCAC_CODE, isValidContainerNumber } from "../utils/numbering.js";
import type { CreateBillOfLadingInput, AmendBillOfLadingInput } from "../validators/bill-of-lading.js";
import { renderBillOfLading, hashForDocument, type BillOfLadingDocument } from "@megazen/document-engine";

type Context = { tenantId: string; userId: string | undefined };

const decimal = (value: number | undefined): Prisma.Decimal | undefined =>
  value === undefined ? undefined : new Prisma.Decimal(value);

async function buildDocument(id: string, tenantId: string): Promise<BillOfLadingDocument> {
  const bill = await prisma.billOfLading.findFirstOrThrow({
    where: { id, tenantId },
    include: { containers: { include: { container: true } }, booking: true }
  });
  return {
    blNumber: bill.blNumber,
    version: bill.version,
    status: bill.status,
    documentType: bill.copyType,
    issueDate: bill.issueDate ?? bill.createdAt,
    issuePlace: bill.placeOfIssue,
    placeOfReceipt: bill.placeOfReceipt ?? bill.booking?.origin ?? "",
    portOfLoading: bill.portOfLoading,
    portOfDischarge: bill.portOfDischarge,
    placeOfDelivery: bill.placeOfDelivery,
    shipperName: bill.shipperName,
    shipperAddress: bill.shipperAddress,
    consigneeName: bill.consigneeName,
    consigneeAddress: bill.consigneeAddress,
    notifyPartyName: bill.notifyPartyName,
    notifyPartyAddress: bill.notifyPartyAddress,
    vesselName: bill.vesselName,
    voyageNumber: bill.voyageNumber,
    numberOfOriginals: bill.numberOfOriginals,
    freightTerms: bill.freightTerms,
    marksAndNumbers: bill.marksAndNumbers,
    description: bill.description || bill.booking?.cargoDescription || "",
    grossWeight: bill.totalGrossWeight?.toNumber() ?? bill.booking?.weight.toNumber() ?? null,
    measurement: bill.totalMeasurement?.toNumber() ?? bill.booking?.volume?.toNumber() ?? null,
    packageCount: bill.totalPackages,
    currency: bill.currency,
    declaredValue: bill.declaredValue?.toNumber() ?? null,
    termsText: bill.termsText,
    verificationCode: bill.verificationToken,
    documentHash: bill.documentHash,
    containers: bill.containers.map((item) => ({
      containerNumber: item.containerNumber,
      sealNumber: item.sealNumber,
      packageCount: item.packageCount,
      packageType: item.containerType,
      grossWeight: item.grossWeight?.toNumber() ?? null,
      measurement: item.measurement?.toNumber() ?? null
    }))
  };
}

export async function createBillOfLading(context: Context, input: CreateBillOfLadingInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirstOrThrow({ where: { bookingNumber: input.bookingNumber, tenantId: context.tenantId } });
    if (!isValidBookingNumber(booking.bookingNumber)) {
      throw new Error("BOOKING_NUMBER_INVALID_FOR_BILL_OF_LADING");
    }

    const existingBill = await tx.billOfLading.findFirst({
      where: { bookingId: booking.id, tenantId: context.tenantId },
      select: { id: true, blNumber: true },
    });
    if (existingBill) {
      throw new Error("BILL_OF_LADING_ALREADY_EXISTS_FOR_BOOKING");
    }

    const customer = await tx.customer.findFirstOrThrow({ where: { id: booking.customerId, tenantId: context.tenantId } });
    const shipment = await tx.shipment.findFirst({ where: { bookingId: booking.id, tenantId: context.tenantId } });
    if (shipment?.blNumber && shipment.blNumber !== formatBillOfLadingNumber(booking.bookingNumber)) {
      throw new Error("SHIPMENT_BILL_OF_LADING_REFERENCE_CONFLICT");
    }

    const requestedContainerIds = input.containerIds.length > 0
      ? [...new Set(input.containerIds)]
      : booking.containerId
        ? [booking.containerId]
        : [];
    if (requestedContainerIds.length > 0 && !booking.containerId) {
      throw new Error("CONTAINER_NOT_ASSIGNED_TO_BOOKING");
    }
    if (requestedContainerIds.some((containerId) => containerId !== booking.containerId)) {
      throw new Error("CONTAINER_NOT_ASSIGNED_TO_BOOKING");
    }
    const containers = requestedContainerIds.length === 0
      ? []
      : await tx.container.findMany({
          where: { id: { in: requestedContainerIds }, tenantId: context.tenantId }
        });
    if (containers.length !== requestedContainerIds.length) throw new Error("ONE_OR_MORE_CONTAINERS_NOT_FOUND");
    if (containers.some((container) => !isValidContainerNumber(container.containerNumber))) {
      throw new Error("CONTAINER_NUMBER_PREFIX_INVALID");
    }

    const bill = await tx.billOfLading.create({
      data: {
        blNumber: formatBillOfLadingNumber(booking.bookingNumber),
        scac: SCAC_CODE,
        version: 1,
        status: "DRAFT",
        copyType: "ORIGINAL",
        bookingId: booking.id,
        shipmentId: shipment?.id,
        customerId: customer.id,
        carrierName: input.carrierName,
        carrierAddress: input.carrierAddress,
        agentName: input.agentName,
        agentAddress: input.agentAddress,
        shipperName: input.shipperName,
        shipperAddress: input.shipperAddress,
        consigneeName: input.consigneeName,
        consigneeAddress: input.consigneeAddress,
        notifyPartyName: input.notifyPartyName,
        notifyPartyAddress: input.notifyPartyAddress,
        placeOfReceipt: input.placeOfReceipt,
        portOfLoading: input.portOfLoading,
        portOfDischarge: input.portOfDischarge,
        placeOfDelivery: input.placeOfDelivery,
        vesselName: input.vesselName,
        voyageNumber: input.voyageNumber,
        freightTerms: input.freightTerms,
        placeOfIssue: input.placeOfIssue,
        issueDate: null,
        numberOfOriginals: input.numberOfOriginals,
        description: input.description,
        marksAndNumbers: input.marksAndNumbers,
        totalPackages: input.totalPackages,
        totalGrossWeight: decimal(input.totalGrossWeight),
        totalMeasurement: decimal(input.totalMeasurement),
        currency: input.currency,
        declaredValue: decimal(input.declaredValue),
        termsText: input.termsText,
        verificationToken: createVerificationCode(),
        tenantId: context.tenantId,
        createdById: context.userId ?? null,
        containers: {
          create: containers.map((container) => ({
            containerId: container.id,
            containerNumber: container.containerNumber,
            containerType: container.type
          }))
        }
      },
      include: { containers: true, booking: true, customer: true }
    });

    if (shipment) {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: { blNumber: bill.blNumber }
      });
    }

    await tx.billOfLadingVersion.create({
      data: { billOfLadingId: bill.id, version: 1, status: "DRAFT", createdById: context.userId ?? null }
    });
    await tx.eventLog.create({
      data: {
        entityType: "BILL_OF_LADING",
        entityId: bill.id,
        action: "CREATED",
        userId: context.userId ?? null,
        data: { blNumber: bill.blNumber, version: 1 },
        tenantId: context.tenantId
      }
    });
    return bill;
  });
}

export async function getBillOfLading(context: Context, id: string) {
  return prisma.billOfLading.findFirstOrThrow({
    where: { id, tenantId: context.tenantId },
    include: { booking: true, shipment: true, customer: true, containers: { include: { container: true } }, versions: { orderBy: { version: "desc" } }, approvals: { orderBy: { createdAt: "desc" } } }
  });
}

export async function listBillOfLadings(context: Context) {
  return prisma.billOfLading.findMany({
    where: { tenantId: context.tenantId },
    include: { booking: true, shipment: true, customer: true, containers: { include: { container: true } } },
    orderBy: { updatedAt: "desc" }
  });
}

export async function amendBillOfLading(context: Context, id: string, input: AmendBillOfLadingInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.billOfLading.findFirstOrThrow({
      where: { id, tenantId: context.tenantId },
      include: { containers: true }
    });
    if (existing.status !== "ISSUED" && existing.status !== "AMENDED") throw new Error("Only an issued Bill of Lading can be amended.");
    const previousAmendments = await tx.billOfLadingVersion.count({
      where: { billOfLadingId: id, status: "AMENDED" }
    });
    if (previousAmendments >= 3) throw new Error("MAX_BILL_OF_LADING_AMENDMENTS");

    const nextVersion = existing.version + 1;

    let amendmentContainerIds: string[] | undefined;
    if (input.containerIds) {
      amendmentContainerIds = [...new Set(input.containerIds)];
      if (amendmentContainerIds.length > 0 && !existing.bookingId) {
        throw new Error("BOOKING_NOT_LINKED_TO_BILL_OF_LADING");
      }
      if (amendmentContainerIds.length > 0) {
        const booking = await tx.booking.findFirstOrThrow({
          where: { id: existing.bookingId ?? undefined, tenantId: context.tenantId },
          select: { containerId: true },
        });
        if (amendmentContainerIds.some((containerId) => containerId !== booking.containerId)) {
          throw new Error("CONTAINER_NOT_ASSIGNED_TO_BOOKING");
        }
        const amendmentContainers = await tx.container.findMany({
          where: { id: { in: amendmentContainerIds }, tenantId: context.tenantId },
          select: { id: true, containerNumber: true },
        });
        if (amendmentContainers.length !== amendmentContainerIds.length) {
          throw new Error("ONE_OR_MORE_CONTAINERS_NOT_FOUND");
        }
        if (amendmentContainers.some((container) => !isValidContainerNumber(container.containerNumber))) {
          throw new Error("CONTAINER_NUMBER_PREFIX_INVALID");
        }
      }
    }

    const updateResult = await tx.billOfLading.updateMany({
      where: { id, tenantId: context.tenantId, version: existing.version, status: existing.status },
      data: {
        version: nextVersion,
        status: "REVIEW",
        carrierName: input.carrierName ?? existing.carrierName,
        carrierAddress: input.carrierAddress ?? existing.carrierAddress,
        agentName: input.agentName ?? existing.agentName,
        agentAddress: input.agentAddress ?? existing.agentAddress,
        shipperName: input.shipperName ?? existing.shipperName,
        shipperAddress: input.shipperAddress ?? existing.shipperAddress,
        consigneeName: input.consigneeName ?? existing.consigneeName,
        consigneeAddress: input.consigneeAddress ?? existing.consigneeAddress,
        notifyPartyName: input.notifyPartyName ?? existing.notifyPartyName,
        notifyPartyAddress: input.notifyPartyAddress ?? existing.notifyPartyAddress,
        placeOfReceipt: input.placeOfReceipt ?? existing.placeOfReceipt,
        portOfLoading: input.portOfLoading ?? existing.portOfLoading,
        portOfDischarge: input.portOfDischarge ?? existing.portOfDischarge,
        placeOfDelivery: input.placeOfDelivery ?? existing.placeOfDelivery,
        vesselName: input.vesselName ?? existing.vesselName,
        voyageNumber: input.voyageNumber ?? existing.voyageNumber,
        freightTerms: input.freightTerms ?? existing.freightTerms,
        description: input.description ?? existing.description,
        marksAndNumbers: input.marksAndNumbers ?? existing.marksAndNumbers,
        totalPackages: input.totalPackages ?? existing.totalPackages,
        totalGrossWeight: input.totalGrossWeight !== undefined ? decimal(input.totalGrossWeight) : existing.totalGrossWeight,
        totalMeasurement: input.totalMeasurement !== undefined ? decimal(input.totalMeasurement) : existing.totalMeasurement,
        currency: input.currency ?? existing.currency,
        declaredValue: input.declaredValue !== undefined ? decimal(input.declaredValue) : existing.declaredValue,
        termsText: input.termsText ?? existing.termsText,
        verificationToken: createVerificationCode(),
        issueDate: null,
        documentHash: null,
        pdfStorageKey: null,
        ...(input.containerIds ? {
          containers: {
            deleteMany: {},
            create: (await tx.container.findMany({ where: { id: { in: amendmentContainerIds ?? [] }, tenantId: context.tenantId } })).map((c) => ({
              containerId: c.id, containerNumber: c.containerNumber, containerType: c.type
            }))
          }
        } : {})
      }
    });
    if (updateResult.count !== 1) throw new Error("BL_AMENDMENT_CONFLICT");
    const updated = await tx.billOfLading.findFirstOrThrow({
      where: { id, tenantId: context.tenantId },
      include: { containers: true }
    });
    await tx.billOfLadingVersion.create({
      data: { billOfLadingId: id, version: nextVersion, status: "AMENDED", reason: input.reason, createdById: context.userId ?? null }
    });
    await tx.eventLog.create({
      data: { entityType: "BILL_OF_LADING", entityId: id, action: "AMENDED", userId: context.userId ?? null, data: { previousVersion: existing.version, newVersion: nextVersion, reason: input.reason }, tenantId: context.tenantId }
    });
    return updated;
  });
}

export async function issueBillOfLading(context: Context, id: string) {
  const bill = await prisma.billOfLading.findFirstOrThrow({
    where: { id, tenantId: context.tenantId },
    include: { containers: { include: { container: true } }, booking: true }
  });
  if (bill.status !== "APPROVED") throw new Error("BL_NOT_APPROVED");

  const document = await buildDocument(id, context.tenantId);
  // The final issued PDF must itself show ISSUED. Workflow status is excluded
  // from the content hash, so the hash remains stable across release/surrender.
  const issuanceDate = new Date();
  const finalDocument = {
    ...document,
    status: "ISSUED",
    issueDate: issuanceDate
  };
  const contentHash = hashForDocument(finalDocument);
  const documentWithHash = { ...finalDocument, documentHash: contentHash };
  const pdf = await renderBillOfLading(documentWithHash);
  const pdfHash = crypto.createHash("sha256").update(pdf).digest("hex");
  const filename = `MEGAZEN_BL_${bill.blNumber}_V${bill.version}.pdf`;

  await prisma.$transaction(async (tx) => {
    const transitioned = await tx.billOfLading.updateMany({
      where: { id: bill.id, tenantId: context.tenantId, status: "APPROVED", version: bill.version },
      data: {
        status: "ISSUED",
        issueDate: issuanceDate,
        documentHash: contentHash,
        pdfStorageKey: filename
      }
    });
    if (transitioned.count !== 1) {
      throw new Error("BL_ISSUANCE_CONFLICT");
    }
    await tx.billOfLadingVersion.update({
      where: { billOfLadingId_version: { billOfLadingId: bill.id, version: bill.version } },
      data: {
        status: "ISSUED",
        issueDate: issuanceDate,
        documentHash: contentHash,
        pdfStorageKey: filename
      }
    });
    await tx.eventLog.create({
      data: { entityType: "BILL_OF_LADING", entityId: bill.id, action: "ISSUED", userId: context.userId ?? null, data: { version: bill.version, documentHash: contentHash, pdfHash, filename }, tenantId: context.tenantId }
    });
  });
  return { pdf, filename, hash: contentHash, pdfHash };
}
