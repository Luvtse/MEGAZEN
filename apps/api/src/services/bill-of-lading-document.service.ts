import {
  BillOfLadingStatus
} from "@prisma/client";

import {
  prisma
} from "../utils/prisma.js";

import {
  renderBillOfLading
} from "../utils/bill-of-lading-renderer.js";

import {
  generateBillOfLadingQr
} from "../utils/bill-of-lading-qr.js";

import {
  calculateDocumentHash
} from "./bill-of-lading.service.js";

type Context = {
  tenantId: string;
  userId?: string;
};

export async function issueBillOfLading(
  context: Context,
  id: string
): Promise<{
  pdf: Buffer;
  filename: string;
  hash: string;
}> {
  const bill =
    await prisma.billOfLading.findFirstOrThrow(
      {
        where: {
          id,
          tenantId:
            context.tenantId
        },

        include: {
          containers: true
        }
      }
    );

  if (
    bill.status !==
    BillOfLadingStatus.APPROVED
  ) {
    throw new Error(
      "Bill of Lading must be approved before issuance."
    );
  }

  const verificationUrl =
    `${process.env.PUBLIC_API_URL ?? "http://localhost:4000"}/api/bill-of-lading/verify/${bill.verificationToken}`;

  const renderData = {
    blNumber:
      bill.blNumber,

    version:
      bill.version,

    issueDate:
      bill.issueDate ??
      new Date(),

    placeOfIssue:
      bill.placeOfIssue,

    copyType:
      bill.copyType,

    carrierName:
      bill.carrierName,

    carrierAddress:
      bill.carrierAddress,

    agentName:
      bill.agentName,

    agentAddress:
      bill.agentAddress,

    shipperName:
      bill.shipperName,

    shipperAddress:
      bill.shipperAddress,

    consigneeName:
      bill.consigneeName,

    consigneeAddress:
      bill.consigneeAddress,

    notifyPartyName:
      bill.notifyPartyName,

    notifyPartyAddress:
      bill.notifyPartyAddress,

    placeOfReceipt:
      bill.placeOfReceipt,

    portOfLoading:
      bill.portOfLoading,

    portOfDischarge:
      bill.portOfDischarge,

    placeOfDelivery:
      bill.placeOfDelivery,

    vesselName:
      bill.vesselName,

    voyageNumber:
      bill.voyageNumber,

    freightTerms:
      bill.freightTerms,

    containers:
      bill.containers.map(
        (container) => ({
          containerNumber:
            container.containerNumber,

          sealNumber:
            container.sealNumber,

          containerType:
            container.containerType,

          packageCount:
            container.packageCount,

          grossWeight:
            container.grossWeight
              ? Number(
                  container.grossWeight
                )
              : null,

          measurement:
            container.measurement
              ? Number(
                  container.measurement
                )
              : null,

          marksAndNumbers:
            container.marksAndNumbers,

          description:
            container.description
        })
      ),

    totalPackages:
      bill.totalPackages,

    totalGrossWeight:
      bill.totalGrossWeight
        ? Number(
            bill.totalGrossWeight
          )
        : null,

    totalMeasurement:
      bill.totalMeasurement
        ? Number(
            bill.totalMeasurement
          )
        : null,

    currency:
      bill.currency,

    declaredValue:
      bill.declaredValue
        ? Number(
            bill.declaredValue
          )
        : null,

    termsText:
      bill.termsText,

    verificationUrl
  };

  /*
   * First create a provisional QR.
   * The PDF itself is then hashed.
   *
   * The hash is subsequently stored against
   * the immutable version record.
   */
  const provisionalQr =
    await generateBillOfLadingQr(
      {
        blNumber:
          bill.blNumber,

        version:
          bill.version,

        documentHash:
          "PENDING",

        verificationUrl
      }
    );

  const pdf =
    await renderBillOfLading(
      renderData,
      provisionalQr
    );

  const hash =
    await calculateDocumentHash(
      pdf
    );

  /*
   * Re-render with the actual document
   * hash embedded in the QR.
   */
  const finalQr =
    await generateBillOfLadingQr(
      {
        blNumber:
          bill.blNumber,

        version:
          bill.version,

        documentHash:
          hash,

        verificationUrl
      }
    );

  const finalPdf =
    await renderBillOfLading(
      renderData,
      finalQr
    );

  const finalHash =
    await calculateDocumentHash(
      finalPdf
    );

  const filename =
    `MEGAZEN_BL_${bill.blNumber}_V${bill.version}.pdf`;

  await prisma.$transaction(
    async (transaction) => {
      await transaction.billOfLading.update(
        {
          where: {
            id:
              bill.id
          },

          data: {
            status:
              BillOfLadingStatus.ISSUED,

            documentHash:
              finalHash,

            pdfStorageKey:
              filename
          }
        }
      );

      await transaction.billOfLadingVersion.update(
        {
          where: {
            billOfLadingId_version: {
              billOfLadingId:
                bill.id,

              version:
                bill.version
            }
          },

          data: {
            status:
              "ISSUED",

            documentHash:
              finalHash,

            pdfStorageKey:
              filename
          }
        }
      );

      await transaction.eventLog.create(
        {
          data: {
            entityType:
              "BILL_OF_LADING",

            entityId:
              bill.id,

            action:
              "ISSUED",

            userId:
              context.userId,

            data: {
              version:
                bill.version,

              documentHash:
                finalHash,

              filename
            },

            tenantId:
              context.tenantId
          }
        }
      );
    }
  );

  return {
    pdf: finalPdf,
    filename,
    hash: finalHash
  };
}
