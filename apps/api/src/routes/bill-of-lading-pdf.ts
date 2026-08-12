import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  renderBillOfLading,
  type BillOfLadingDocument
} from "@megazen/document-engine";
import {
  generateBillOfLadingPdf,
  calculatePdfHash
} from "../utils/bill-of-lading-pdf.js";

export const billOfLadingPdfRouter = Router();

billOfLadingPdfRouter.get(
  "/:id/pdf",
  async (req, res, next) => {
    try {
      const bill = await prisma.billOfLading.findFirstOrThrow({
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

      // Status validation - only allow ISSUED bills
      if (bill.status !== "ISSUED") {
        res.status(409).json({
          success: false,
          data: null,
          error: {
            code: "BL_NOT_ISSUED",
            message: "Only issued Bills of Lading can be downloaded as final documents."
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Build document data combining both schemas
      const document: BillOfLadingDocument = {
        blNumber: bill.blNumber,
        version: bill.version,
        status: bill.status,
        documentType: bill.documentType,
        issueDate: bill.issueDate,
        issuePlace: bill.issuePlace || bill.placeOfIssue,
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
        grossWeight: bill.grossWeight?.toNumber() ?? null,
        measurement: bill.measurement?.toNumber() ?? null,
        packageCount: bill.packageCount,
        currency: bill.currency,
        declaredValue: bill.declaredValue?.toNumber() ?? null,
        termsText: bill.termsText,
        verificationCode: bill.verificationCode,
        documentHash: bill.documentHash,
        containers: bill.containers.map((item) => ({
          containerNumber: item.container.containerNumber,
          sealNumber: item.sealNumber,
          packageCount: item.packageCount,
          packageType: item.packageType,
          grossWeight: item.grossWeight?.toNumber() ?? null,
          measurement: item.measurement?.toNumber() ?? null
        }))
      };

      // Generate PDF using the document engine
      const pdf = await renderBillOfLading(document);

      // Calculate hash for verification
      const hash = calculatePdfHash(pdf);

      // Verify document integrity if hash exists
      if (bill.documentHash && bill.documentHash !== hash) {
        res.status(409).json({
          success: false,
          data: null,
          error: {
            code: "BL_DOCUMENT_INTEGRITY_FAILURE",
            message: "Generated document hash does not match the issued document hash."
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Store hash if not present
      if (!bill.documentHash) {
        await prisma.billOfLading.update({
          where: { id: bill.id },
          data: { documentHash: hash }
        });
      }

      // Set response headers
      const filename = `${bill.blNumber}-v${bill.version}.pdf`;
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdf.length));
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Document-Hash", hash);

      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
);
