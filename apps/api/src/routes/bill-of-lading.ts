import { Router } from "express";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import { createVerificationCode, createDocumentNumber } from "../utils/numbering.js";
import { z } from "zod";

const billOfLadingSchema = z.object({
  bookingId: z.string().uuid(),
  customerId: z.string().uuid(),
  documentType: z.string().trim().min(2).max(50).default("ORIGINAL"),
  placeOfReceipt: z.string().trim().min(2),
  portOfLoading: z.string().trim().min(2),
  portOfDischarge: z.string().trim().min(2),
  placeOfDelivery: z.string().trim().optional(),
  shipperName: z.string().trim().min(2),
  shipperAddress: z.string().trim().min(2),
  consigneeName: z.string().trim().min(2),
  consigneeAddress: z.string().trim().min(2),
  notifyPartyName: z.string().trim().optional(),
  notifyPartyAddress: z.string().trim().optional(),
  vesselName: z.string().trim().optional(),
  voyageNumber: z.string().trim().optional(),
  issuePlace: z.string().trim().min(2),
  numberOfOriginals: z.number().int().min(1).max(9).default(3),
  freightTerms: z.string().trim().optional(),
  marksAndNumbers: z.string().trim().optional(),
  description: z.string().trim().min(2),
  grossWeight: z.number().nonnegative().optional(),
  measurement: z.number().nonnegative().optional(),
  packageCount: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  declaredValue: z.number().nonnegative().optional(),
  termsText: z.string().trim().optional(),
  containerIds: z.array(z.string().uuid()).default([])
});

export const billOfLadingRouter = Router();

billOfLadingRouter.get("/", async (req, res, next) => {
  try {
    const documents = await prisma.billOfLading.findMany({
      where: { tenantId: req.tenantId },
      include: { customer: true, containers: { include: { container: true } } },
      orderBy: { updatedAt: "desc" }
    });
    ok(res, documents);
  } catch (error) { next(error); }
});

billOfLadingRouter.post("/", async (req, res, next) => {
  try {
    const input = billOfLadingSchema.parse(req.body);
    const booking = await prisma.booking.findFirstOrThrow({
      where: { id: input.bookingId, tenantId: req.tenantId }
    });

    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.billOfLading.create({
        data: {
          bookingId: booking.id,
          customerId: input.customerId,
          tenantId: req.tenantId,
          blNumber: createDocumentNumber("BL"),
          documentType: input.documentType,
          placeOfReceipt: input.placeOfReceipt,
          portOfLoading: input.portOfLoading,
          portOfDischarge: input.portOfDischarge,
          placeOfDelivery: input.placeOfDelivery,
          shipperName: input.shipperName,
          shipperAddress: input.shipperAddress,
          consigneeName: input.consigneeName,
          consigneeAddress: input.consigneeAddress,
          notifyPartyName: input.notifyPartyName,
          notifyPartyAddress: input.notifyPartyAddress,
          vesselName: input.vesselName,
          voyageNumber: input.voyageNumber,
          issuePlace: input.issuePlace,
          issueDate: new Date(),
          numberOfOriginals: input.numberOfOriginals,
          freightTerms: input.freightTerms,
          marksAndNumbers: input.marksAndNumbers,
          description: input.description,
          grossWeight: input.grossWeight,
          measurement: input.measurement,
          packageCount: input.packageCount,
          currency: input.currency,
          declaredValue: input.declaredValue,
          termsText: input.termsText,
          verificationCode: createVerificationCode()
        }
      });

      if (input.containerIds.length > 0) {
        await tx.billOfLadingContainer.createMany({
          data: input.containerIds.map((containerId) => ({
            billOfLadingId: created.id,
            containerId
          }))
        });
      }

      await tx.billOfLadingRevision.create({
        data: {
          billOfLadingId: created.id,
          version: 1,
          snapshot: JSON.parse(JSON.stringify(created)),
          reason: "Initial draft"
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: created.id,
          action: "CREATED",
          data: { blNumber: created.blNumber }
        }
      });

      return created;
    });

    ok(res, document, 201);
  } catch (error) { next(error); }
});

billOfLadingRouter.get("/:id", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.findFirstOrThrow({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        customer: true,
        booking: true,
        containers: { include: { container: true } },
        revisions: { orderBy: { version: "desc" } },
        approvals: { orderBy: { createdAt: "desc" } }
      }
    });
    ok(res, document);
  } catch (error) { next(error); }
});

billOfLadingRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId, status: "DRAFT" },
      data: { status: "PENDING_APPROVAL", version: { increment: 1 } }
    });
    ok(res, { submitted: document.count === 1 });
  } catch (error) { next(error); }
});

billOfLadingRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const document = await prisma.$transaction(async (tx) => {
      const updated = await tx.billOfLading.updateMany({
        where: { id: req.params.id, tenantId: req.tenantId, status: "PENDING_APPROVAL" },
        data: { status: "APPROVED" }
      });
      if (updated.count !== 1) return null;
      await tx.approval.create({
        data: {
          entityType: "BillOfLading",
          entityId: req.params.id,
          status: "APPROVED",
          comment: typeof req.body?.comment === "string" ? req.body.comment : null
        }
      });
      return tx.billOfLading.findUnique({ where: { id: req.params.id } });
    });
    ok(res, document);
  } catch (error) { next(error); }
});

billOfLadingRouter.post("/:id/issue", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.findFirstOrThrow({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    if (document.status !== "APPROVED") {
      res.status(409).json({
        success: false, data: null,
        error: { code: "BL_NOT_APPROVED", message: "Bill of Lading must be approved before issue." },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const payload = {
      id: document.id,
      blNumber: document.blNumber,
      version: document.version,
      verificationCode: document.verificationCode,
      issueDate: document.issueDate.toISOString()
    };
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const issued = await prisma.billOfLading.update({
      where: { id: document.id },
      data: { status: "ISSUED", documentHash: hash }
    });
    ok(res, issued);
  } catch (error) { next(error); }
});
