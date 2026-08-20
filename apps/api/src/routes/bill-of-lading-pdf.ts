import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { renderBillOfLading, hashForDocument } from "@megazen/document-engine";
import type { BillOfLadingDocument } from "@megazen/document-engine";

export const billOfLadingPdfRouter = Router();

billOfLadingPdfRouter.get("/:id/pdf", async (req,res,next)=>{
  try {
    const bill=await prisma.billOfLading.findFirstOrThrow({
      where:{id:req.params.id,tenantId:req.tenantId},
      include:{containers:{include:{container:true}},booking:true}
    });
    if(!["ISSUED","RELEASED","SURRENDERED"].includes(bill.status)) {
      res.status(409).json({success:false,data:null,error:{code:"BL_NOT_ISSUED",message:"Only issued, released, or surrendered Bills of Lading can be downloaded as final documents."},timestamp:new Date().toISOString()});
      return;
    }
    const document:BillOfLadingDocument={
      blNumber:bill.blNumber,version:bill.version,status:bill.status,documentType:bill.copyType,
      issueDate:bill.issueDate??bill.createdAt,issuePlace:bill.placeOfIssue,
      placeOfReceipt:bill.placeOfReceipt??bill.booking?.origin??"",portOfLoading:bill.portOfLoading,portOfDischarge:bill.portOfDischarge,placeOfDelivery:bill.placeOfDelivery,
      shipperName:bill.shipperName,shipperAddress:bill.shipperAddress,consigneeName:bill.consigneeName,consigneeAddress:bill.consigneeAddress,
      notifyPartyName:bill.notifyPartyName,notifyPartyAddress:bill.notifyPartyAddress,vesselName:bill.vesselName,voyageNumber:bill.voyageNumber,
      numberOfOriginals:bill.numberOfOriginals,freightTerms:bill.freightTerms,marksAndNumbers:bill.marksAndNumbers,
      description:bill.description||bill.booking?.cargoDescription||"",grossWeight:bill.totalGrossWeight?.toNumber()??bill.booking?.weight.toNumber()??null,
      measurement:bill.totalMeasurement?.toNumber()??bill.booking?.volume?.toNumber()??null,packageCount:bill.totalPackages,currency:bill.currency,declaredValue:bill.declaredValue?.toNumber()??null,
      termsText:bill.termsText,verificationCode:bill.verificationToken,documentHash:bill.documentHash,
      containers:bill.containers.map(item=>({containerNumber:item.containerNumber,sealNumber:item.sealNumber,packageCount:item.packageCount,packageType:item.containerType,grossWeight:item.grossWeight?.toNumber()??null,measurement:item.measurement?.toNumber()??null}))
    };
    const calculatedHash = hashForDocument({ ...document, documentHash: null });
    if (bill.documentHash && bill.documentHash !== calculatedHash) {
      res.status(409).json({
        success:false,
        data:null,
        error:{code:"DOCUMENT_INTEGRITY_FAILURE",message:"Stored document integrity hash does not match the current Bill of Lading data."},
        timestamp:new Date().toISOString()
      });
      return;
    }
    if (!bill.documentHash) {
      res.status(409).json({
        success:false,
        data:null,
        error:{code:"DOCUMENT_INTEGRITY_FAILURE",message:"Issued Bill of Lading is missing its immutable document integrity hash."},
        timestamp:new Date().toISOString()
      });
      return;
    }
    const contentHash = bill.documentHash;
    const pdf=await renderBillOfLading({...document,documentHash:contentHash});
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition",`inline; filename="${bill.blNumber}-v${bill.version}.pdf"`);
    res.setHeader("Content-Length",String(pdf.length));
    res.setHeader("Cache-Control","private, no-store");
    res.setHeader("X-Document-Hash",contentHash);
    res.send(pdf);
  } catch(e){next(e);}
});
