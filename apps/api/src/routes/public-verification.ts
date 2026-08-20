import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { isValidBillOfLadingNumber } from "../utils/numbering.js";
import {
  hashForDocument,
  type BillOfLadingDocument
} from "@megazen/document-engine";

export const publicVerificationRouter = Router();

publicVerificationRouter.get(
  "/bl/:verificationCode",
  async (req, res, next) => {
    try {
      const requestedBlNumber =
        typeof req.query.blNumber === "string"
          ? req.query.blNumber.trim().toUpperCase()
          : undefined;

      const bill =
        await prisma.billOfLading.findFirst({
          where: {
            verificationToken:
              req.params.verificationCode,
            ...(requestedBlNumber ? { blNumber: requestedBlNumber } : {}),
            status: {
              in: [
                "ISSUED",
                "RELEASED",
                "SURRENDERED"
              ]
            }
          },
          include: {
            booking: true,
            containers: {
              orderBy: {
                id: "asc"
              }
            }
          }
        });

      if (!bill) {
        res.status(404).json({
          success: false,
          data: null,
          error: {
            code:
              "DOCUMENT_NOT_FOUND",
            message:
              "Document could not be verified."
          },
          timestamp:
            new Date().toISOString()
        });
        return;
      }

      const document: BillOfLadingDocument =
        {
          blNumber: bill.blNumber,
          version: bill.version,
          status: bill.status,
          documentType: bill.copyType,
          issueDate:
            bill.issueDate ??
            bill.createdAt,
          issuePlace:
            bill.placeOfIssue,
          placeOfReceipt:
            bill.placeOfReceipt ??
            bill.booking?.origin ??
            "",
          portOfLoading:
            bill.portOfLoading,
          portOfDischarge:
            bill.portOfDischarge,
          placeOfDelivery:
            bill.placeOfDelivery,
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
          vesselName:
            bill.vesselName,
          voyageNumber:
            bill.voyageNumber,
          numberOfOriginals:
            bill.numberOfOriginals,
          freightTerms:
            bill.freightTerms,
          marksAndNumbers:
            bill.marksAndNumbers,
          description:
            bill.description ??
            bill.booking?.cargoDescription ??
            "",
          grossWeight:
            bill.totalGrossWeight?.toNumber() ??
            bill.booking?.weight.toNumber() ??
            null,
          measurement:
            bill.totalMeasurement?.toNumber() ??
            bill.booking?.volume?.toNumber() ??
            null,
          packageCount:
            bill.totalPackages,
          currency:
            bill.currency,
          declaredValue:
            bill.declaredValue?.toNumber() ??
            null,
          termsText:
            bill.termsText,
          verificationCode:
            bill.verificationToken,
          documentHash:
            bill.documentHash,
          containers:
            bill.containers.map(
              (container) => ({
                containerNumber:
                  container.containerNumber,
                sealNumber:
                  container.sealNumber,
                packageCount:
                  container.packageCount,
                packageType:
                  container.containerType,
                grossWeight:
                  container.grossWeight?.toNumber() ??
                  null,
                measurement:
                  container.measurement?.toNumber() ??
                  null
              })
            )
        };

      const calculatedHash =
        hashForDocument(document);

      const storedHash =
        bill.documentHash;

      const hashMatches =
        Boolean(storedHash) &&
        storedHash === calculatedHash;

      res.json({
        success: true,
        data: {
          verified:
            hashMatches,
          integrity: hashMatches
            ? "VALID"
            : "INVALID",
          blNumber:
            bill.blNumber,
          version:
            bill.version,
          status:
            bill.status,
          documentHash:
            storedHash,
          calculatedHash,
          issueDate:
            bill.issueDate,
          shipperName:
            bill.shipperName,
          consigneeName:
            bill.consigneeName,
          portOfLoading:
            bill.portOfLoading,
          portOfDischarge:
            bill.portOfDischarge
        },
        error: null,
        timestamp:
          new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);


publicVerificationRouter.get(
  "/bl-number/:blNumber",
  async (req, res, next) => {
    try {
      const blNumber = req.params.blNumber.trim().toUpperCase();
      if (!isValidBillOfLadingNumber(blNumber)) {
        res.status(400).json({
          success: false,
          data: null,
          error: {
            code: "INVALID_BILL_OF_LADING_NUMBER",
            message: "B/L number must use the ZENU + valid 10-digit booking-number format."
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      const bill = await prisma.billOfLading.findFirst({
        where: {
          blNumber,
          status: { in: ["ISSUED", "RELEASED", "SURRENDERED"] }
        },
        include: { booking: true, containers: { orderBy: { id: "asc" } } }
      });
      if (!bill) {
        res.status(404).json({
          success:false, data:null,
          error:{code:"DOCUMENT_NOT_FOUND",message:"Bill of Lading could not be verified."},
          timestamp:new Date().toISOString()
        });
        return;
      }
      const document: BillOfLadingDocument = {
        blNumber: bill.blNumber, version: bill.version, status: bill.status, documentType: bill.copyType,
        issueDate: bill.issueDate ?? bill.createdAt, issuePlace: bill.placeOfIssue,
        placeOfReceipt: bill.placeOfReceipt ?? bill.booking?.origin ?? "", portOfLoading: bill.portOfLoading,
        portOfDischarge: bill.portOfDischarge, placeOfDelivery: bill.placeOfDelivery,
        shipperName: bill.shipperName, shipperAddress: bill.shipperAddress,
        consigneeName: bill.consigneeName, consigneeAddress: bill.consigneeAddress,
        notifyPartyName: bill.notifyPartyName, notifyPartyAddress: bill.notifyPartyAddress,
        vesselName: bill.vesselName, voyageNumber: bill.voyageNumber, numberOfOriginals: bill.numberOfOriginals,
        freightTerms: bill.freightTerms, marksAndNumbers: bill.marksAndNumbers,
        description: bill.description || bill.booking?.cargoDescription || "",
        grossWeight: bill.totalGrossWeight?.toNumber() ?? bill.booking?.weight.toNumber() ?? null,
        measurement: bill.totalMeasurement?.toNumber() ?? bill.booking?.volume?.toNumber() ?? null,
        packageCount: bill.totalPackages, currency: bill.currency, declaredValue: bill.declaredValue?.toNumber() ?? null,
        termsText: bill.termsText, verificationCode: bill.verificationToken, documentHash: bill.documentHash,
        containers: bill.containers.map((container) => ({
          containerNumber: container.containerNumber, sealNumber: container.sealNumber, packageCount: container.packageCount,
          packageType: container.containerType, grossWeight: container.grossWeight?.toNumber() ?? null,
          measurement: container.measurement?.toNumber() ?? null
        }))
      };
      const calculatedHash = hashForDocument(document);
      const valid = Boolean(bill.documentHash) && bill.documentHash === calculatedHash;
      res.json({
        success:true,
        data:{ verified:valid, integrity:valid ? "VALID" : "INVALID", blNumber:bill.blNumber, version:bill.version,
          status:bill.status, documentHash:bill.documentHash, calculatedHash, issueDate:bill.issueDate,
          carrierName:bill.carrierName, shipperName:bill.shipperName, consigneeName:bill.consigneeName,
          portOfLoading:bill.portOfLoading, portOfDischarge:bill.portOfDischarge, vesselName:bill.vesselName, voyageNumber:bill.voyageNumber },
        error:null, timestamp:new Date().toISOString()
      });
    } catch (error) { next(error); }
  }
);
