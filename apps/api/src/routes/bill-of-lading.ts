import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import {
  createBillOfLading,
  getBillOfLading,
  listBillOfLadings,
  amendBillOfLading,
  issueBillOfLading
} from "../services/bill-of-lading.service.js";
import {
  isValidBillOfLadingNumber,
  isValidContainerNumber
} from "../utils/numbering.js";
import {
  createBillOfLadingSchema,
  updateBillOfLadingSchema,
  amendBillOfLadingSchema,
  billOfLadingContainerSchema
} from "../validators/bill-of-lading.js";

export const billOfLadingRouter = Router();

billOfLadingRouter.get("/", async (req,res,next)=>{
  try { ok(res, await listBillOfLadings({tenantId:req.tenantId,userId:undefined})); } catch(e){next(e);}
});

billOfLadingRouter.post("/", async(req,res,next)=>{
  try { ok(res, await createBillOfLading({tenantId:req.tenantId,userId:undefined},createBillOfLadingSchema.parse(req.body)),201); } catch(e){next(e);}
});

billOfLadingRouter.get("/by-number/:blNumber", async (req, res, next) => {
  try {
    const blNumber = req.params.blNumber.trim().toUpperCase();
    if (!isValidBillOfLadingNumber(blNumber)) {
      res.status(400).json({
        success: false,
        data: null,
        error: { code: "INVALID_BILL_OF_LADING_NUMBER", message: "B/L number must use the ZENU + 10-digit booking-number format." },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const bill = await prisma.billOfLading.findFirstOrThrow({
      where: { blNumber, tenantId: req.tenantId },
      include: {
        booking: true,
        shipment: true,
        customer: true,
        containers: { include: { container: true } },
        versions: { orderBy: { version: "desc" } },
      },
    });

    ok(res, bill);
  } catch (e) {
    next(e);
  }
});

billOfLadingRouter.get("/:id", async(req,res,next)=>{
  try { ok(res, await getBillOfLading({tenantId:req.tenantId,userId:undefined},req.params.id)); } catch(e){next(e);}
});

billOfLadingRouter.put("/:id", async(req,res,next)=>{
  try {
    const input=updateBillOfLadingSchema.parse(req.body);
    const document=await prisma.$transaction(async tx=>{
      const existing=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(existing.status!=="DRAFT") throw new Error("BL_NOT_EDITABLE");
      const updated=await tx.billOfLading.update({where:{id:existing.id},data:input});
      await tx.billOfLadingVersion.update({where:{billOfLadingId_version:{billOfLadingId:existing.id,version:existing.version}},data:{status:"DRAFT"}});
      await tx.eventLog.create({data:{entityType:"BILL_OF_LADING",entityId:existing.id,action:"UPDATED",userId:undefined,data:{version:existing.version},tenantId:req.tenantId}});
      return updated;
    });
    ok(res,document);
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/submit",async(req,res,next)=>{
  try {
    const document=await prisma.$transaction(async tx=>{
      const existing=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(existing.status!=="DRAFT") throw new Error("BL_NOT_DRAFT");
      const updatedResult=await tx.billOfLading.updateMany({where:{id:existing.id,tenantId:req.tenantId,status:"DRAFT",version:existing.version},data:{status:"REVIEW"}});
      if (updatedResult.count !== 1) throw new Error("BL_WORKFLOW_CONFLICT");
      const updated=await tx.billOfLading.findFirstOrThrow({where:{id:existing.id,tenantId:req.tenantId}});
      await tx.eventLog.create({data:{entityType:"BILL_OF_LADING",entityId:existing.id,action:"SUBMITTED",userId:undefined,data:{version:existing.version},tenantId:req.tenantId}});
      return updated;
    });
    ok(res,document);
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/approve",async(req,res,next)=>{
  try {
    const comment=typeof req.body?.comment==="string"?req.body.comment.trim():undefined;
    const document=await prisma.$transaction(async tx=>{
      const existing=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(existing.status!=="REVIEW") throw new Error("BL_NOT_PENDING_APPROVAL");
      const updatedResult=await tx.billOfLading.updateMany({where:{id:existing.id,tenantId:req.tenantId,status:"REVIEW",version:existing.version},data:{status:"APPROVED"}});
      if (updatedResult.count !== 1) throw new Error("BL_WORKFLOW_CONFLICT");
      const updated=await tx.billOfLading.findFirstOrThrow({where:{id:existing.id,tenantId:req.tenantId}});
      await tx.approval.create({data:{entityType:"BillOfLading",entityId:existing.id,status:"APPROVED",actorId:undefined,comment}});
      await tx.eventLog.create({data:{entityType:"BILL_OF_LADING",entityId:existing.id,action:"APPROVED",userId:undefined,data:{comment},tenantId:req.tenantId}});
      return updated;
    });
    ok(res,document);
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/issue",async(req,res,next)=>{
  try {
    const result=await issueBillOfLading({tenantId:req.tenantId,userId:undefined},req.params.id);
    ok(res,{id:req.params.id,filename:result.filename,documentHash:result.hash,pdfHash:result.pdfHash});
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/release",async(req,res,next)=>{
  try {
    const document=await prisma.$transaction(async tx=>{
      const existing=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(existing.status!=="ISSUED") throw new Error("BL_NOT_ISSUED");
      const updatedResult=await tx.billOfLading.updateMany({where:{id:existing.id,tenantId:req.tenantId,status:"ISSUED",version:existing.version},data:{status:"RELEASED"}});
      if (updatedResult.count !== 1) throw new Error("BL_WORKFLOW_CONFLICT");
      const updated=await tx.billOfLading.findFirstOrThrow({where:{id:existing.id,tenantId:req.tenantId}});
      await tx.eventLog.create({data:{entityType:"BILL_OF_LADING",entityId:existing.id,action:"RELEASED",userId:undefined,data:{version:existing.version},tenantId:req.tenantId}});
      return updated;
    });
    ok(res,document);
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/surrender",async(req,res,next)=>{
  try {
    const document=await prisma.$transaction(async tx=>{
      const existing=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(existing.status!=="ISSUED" && existing.status!=="RELEASED") throw new Error("BL_NOT_SURRENDERABLE");
      const updatedResult=await tx.billOfLading.updateMany({
        where:{
          id:existing.id,
          tenantId:req.tenantId,
          status:{in:["ISSUED","RELEASED"]},
          version:existing.version
        },
        data:{status:"SURRENDERED"}
      });
      if (updatedResult.count !== 1) throw new Error("BL_WORKFLOW_CONFLICT");
      const updated=await tx.billOfLading.findFirstOrThrow({where:{id:existing.id,tenantId:req.tenantId}});
      await tx.eventLog.create({data:{entityType:"BILL_OF_LADING",entityId:existing.id,action:"SURRENDERED",userId:undefined,data:{version:existing.version},tenantId:req.tenantId}});
      return updated;
    });
    ok(res,document);
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/amend",async(req,res,next)=>{
  try { ok(res,await amendBillOfLading({tenantId:req.tenantId,userId:undefined},req.params.id,amendBillOfLadingSchema.parse(req.body)),201); } catch(e){next(e);}
});

billOfLadingRouter.get("/:id/revisions",async(req,res,next)=>{
  try {
    const document=await prisma.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId},select:{id:true,blNumber:true}});
    const revisions=await prisma.billOfLadingVersion.findMany({where:{billOfLadingId:document.id},orderBy:{version:"desc"}});
    ok(res,{blNumber:document.blNumber,revisions});
  } catch(e){next(e);}
});

billOfLadingRouter.get("/:id/revisions/:version",async(req,res,next)=>{
  try {
    const version=Number(req.params.version);
    if(!Number.isInteger(version)||version<1) return res.status(400).json({success:false,data:null,error:{code:"INVALID_VERSION",message:"Version must be positive"},timestamp:new Date().toISOString()});
    const revision=await prisma.billOfLadingVersion.findFirst({where:{billOfLadingId:req.params.id,version,billOfLading:{tenantId:req.tenantId}}});
    if(!revision) return res.status(404).json({success:false,data:null,error:{code:"REVISION_NOT_FOUND",message:"Revision not found"},timestamp:new Date().toISOString()});
    ok(res,revision);
  } catch(e){next(e);}
});

billOfLadingRouter.get("/:id/containers",async(req,res,next)=>{
  try {
    const document=await prisma.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
    ok(res,await prisma.billOfLadingContainer.findMany({where:{billOfLadingId:document.id},include:{container:true}}));
  } catch(e){next(e);}
});

billOfLadingRouter.post("/:id/containers",async(req,res,next)=>{
  try {
    const input=billOfLadingContainerSchema.parse(req.body);
    const item=await prisma.$transaction(async tx=>{
      const document=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(document.status!=="DRAFT") throw new Error("BL_NOT_EDITABLE");
      const container=await tx.container.findFirstOrThrow({where:{id:input.containerId,tenantId:req.tenantId}});
      if (!isValidContainerNumber(container.containerNumber)) {
        throw new Error("CONTAINER_NUMBER_PREFIX_INVALID");
      }
      if (document.bookingId) {
        const booking = await tx.booking.findFirstOrThrow({
          where: { id: document.bookingId, tenantId: req.tenantId },
          select: { containerId: true },
        });
        if (booking.containerId !== container.id) {
          throw new Error("CONTAINER_NOT_ASSIGNED_TO_BOOKING");
        }
      } else {
        throw new Error("BOOKING_NOT_LINKED_TO_BILL_OF_LADING");
      }
      if (!isValidBillOfLadingNumber(document.blNumber)) {
        throw new Error("BILL_OF_LADING_NUMBER_INVALID");
      }
      const existing=await tx.billOfLadingContainer.findUnique({where:{billOfLadingId_containerId:{billOfLadingId:document.id,containerId:container.id}}});
      if(existing) throw new Error("CONTAINER_ALREADY_ATTACHED");
      return tx.billOfLadingContainer.create({data:{billOfLadingId:document.id,containerId:container.id,containerNumber:container.containerNumber,containerType:input.packageType??container.type,sealNumber:input.sealNumber,packageCount:input.packageCount,grossWeight:input.grossWeight,measurement:input.measurement,marksAndNumbers:input.marksAndNumbers,description:input.description}});
    });
    ok(res,item,201);
  } catch(e){next(e);}
});

billOfLadingRouter.delete("/:id/containers/:containerId",async(req,res,next)=>{
  try {
    const result=await prisma.$transaction(async tx=>{
      const document=await tx.billOfLading.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      if(document.status!=="DRAFT") throw new Error("BL_NOT_EDITABLE");
      return tx.billOfLadingContainer.delete({where:{billOfLadingId_containerId:{billOfLadingId:document.id,containerId:req.params.containerId}}});
    });
    ok(res,result);
  } catch(e){next(e);}
});

