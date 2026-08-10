import { Router } from "express";
import {
  renderBillOfLading,
  type BillOfLadingDocument
} from "@megazen/document-engine";
import { prisma } from "../lib/prisma.js";

export const billOfLadingPdfRouter = Router();

billOfLadingPdfRouter.get(
  "/:id/pdf",
  async (req, res, next) => {
    try {
      const bill =
        await prisma.billOfLading.findFirstOrThrow({
          where: {
            id: req.params.id,
            tenantId: req.tenantId
          },
          include: {
            containers: {
              include: {
                container: true
              }
            }
          }
        });

      const document: BillOfLadingDocument = {
        blNumber: bill.blNumber,
        version: bill.version,
        status: bill.status,
        documentType: bill.documentType,

        issueDate: bill.issueDate,
        issuePlace: bill.issuePlace,

        placeOfReceipt: bill.placeOfReceipt,
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
        description: bill.description,

        grossWeight:
          bill.grossWeight?.toNumber() ?? null,

        measurement:
          bill.measurement?.toNumber() ?? null,

        packageCount: bill.packageCount,

        currency: bill.currency,

        declaredValue:
          bill.declaredValue?.toNumber() ?? null,

        termsText: bill.termsText,

        verificationCode:
          bill.verificationCode,

        documentHash:
          bill.documentHash,

        containers:
          bill.containers.map((item) => ({
            containerNumber:
              item.container.containerNumber,

            sealNumber:
              item.sealNumber,

            packageCount:
              item.packageCount,

            packageType:
              item.packageType,

            grossWeight:
              item.grossWeight?.toNumber() ?? null,

            measurement:
              item.measurement?.toNumber() ?? null
          }))
      };

      const pdf =
        await renderBillOfLading(document);

      const filename =
        `${bill.blNumber}-v${bill.version}.pdf`;

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        String(pdf.length)
      );

      res.setHeader(
        "Cache-Control",
        "private, no-store"
      );

      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
);
