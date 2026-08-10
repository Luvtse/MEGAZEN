import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const publicVerificationRouter = Router();

publicVerificationRouter.get("/bills-of-lading/:blNumber/:verificationCode", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.findFirst({
      where: {
        blNumber: req.params.blNumber,
        verificationCode: req.params.verificationCode,
        status: { in: ["ISSUED", "RELEASED", "SURRENDERED"] }
      },
      select: {
        blNumber: true, status: true, documentType: true, version: true,
        issueDate: true, issuePlace: true, portOfLoading: true, portOfDischarge: true,
        placeOfDelivery: true, vesselName: true, voyageNumber: true,
        shipperName: true, consigneeName: true, verificationCode: true, documentHash: true
      }
    });
    res.status(document ? 200 : 404).json({
      success: document !== null,
      data: document,
      error: document ? null : { code: "DOCUMENT_NOT_FOUND", message: "Document could not be verified." },
      timestamp: new Date().toISOString()
    });
  } catch (error) { next(error); }
});
