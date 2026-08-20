import { Router } from "express";
import { z } from "zod";
import { isValidContainerNumber } from "../utils/numbering.js";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

export const containersRouter = Router();

const createSchema = z.object({
  containerNumber: z.string().trim().refine(isValidContainerNumber, "Container number must start with ZENU and contain 7 serial digits."),
  type: z.string().trim().min(2),
  size: z.string().trim().min(2),
  status: z.enum(["REGISTERED","IN_YARD","GATED_OUT","LOADED","DISCHARGED","AVAILABLE","RELEASED","DELIVERED","DAMAGED"]).optional(),
  location: z.string().trim().optional(),
  yardPosition: z.string().trim().optional(),
  carrier: z.string().trim().optional(),
  vessel: z.string().trim().optional(),
  voyage: z.string().trim().optional(),
  eta: z.coerce.date().optional(),
  etd: z.coerce.date().optional()
});

containersRouter.get("/", async (req,res,next)=>{
  try {
    const status = typeof req.query.status==="string" ? req.query.status as "REGISTERED"|"IN_YARD"|"GATED_OUT"|"LOADED"|"DISCHARGED"|"AVAILABLE"|"RELEASED"|"DELIVERED"|"DAMAGED" : undefined;
    const type = typeof req.query.type==="string" ? req.query.type : undefined;
    const carrier = typeof req.query.carrier==="string" ? req.query.carrier : undefined;
    const containers = await prisma.container.findMany({
      where:{tenantId:req.tenantId,...(status?{status}:{}),...(type?{type}:{}),...(carrier?{carrier}: {})},
      orderBy:{updatedAt:"desc"}
    });
    ok(res,containers);
  } catch(e){next(e);}
});

containersRouter.get("/stats", async (req,res,next)=>{
  try {
    const [total, grouped] = await Promise.all([
      prisma.container.count({where:{tenantId:req.tenantId}}),
      prisma.container.groupBy({by:["status"],where:{tenantId:req.tenantId},_count:{_all:true}})
    ]);
    ok(res,{total,byStatus:Object.fromEntries(grouped.map(g=>[g.status,g._count._all]))});
  } catch(e){next(e);}
});

containersRouter.get("/by-number/:containerNumber", async (req,res,next)=>{
  try {
    const containerNumber = req.params.containerNumber.trim().toUpperCase();
    if (!isValidContainerNumber(containerNumber)) {
      res.status(400).json({ success:false, data:null, error:{ code:"INVALID_CONTAINER_NUMBER", message:"Container number must start with ZENU and contain 7 serial digits." }, timestamp:new Date().toISOString() });
      return;
    }
    const container = await prisma.container.findFirstOrThrow({
      where:{ containerNumber, tenantId:req.tenantId },
      include:{ bookings:{ include:{ customer:true, shipment:true } }, events:{ orderBy:{ timestamp:"desc" }, take:100 }, yardSlots:true, billOfLadingContainers:{ include:{ billOfLading:true } } }
    });
    ok(res,container);
  } catch(e){next(e);}
});

containersRouter.get("/:id", async (req,res,next)=>{
  try {
    const container=await prisma.container.findFirstOrThrow({
      where:{id:req.params.id,tenantId:req.tenantId},
      include:{events:{orderBy:{timestamp:"desc"},take:100},yardSlots:true}
    });
    ok(res,container);
  } catch(e){next(e);}
});

containersRouter.post("/", async(req,res,next)=>{
  try {
    const input=createSchema.parse(req.body);
    const container=await prisma.container.create({data:{...input,tenantId:req.tenantId}});
    ok(res,container,201);
  } catch(e){next(e);}
});

containersRouter.post("/bulk", async(req,res,next)=>{
  try {
    const items=z.array(createSchema).min(1).max(1000).parse(req.body);
    const result=await prisma.$transaction(async tx=>{
      const created=[];
      for(const item of items){
        created.push(await tx.container.create({data:{...item,tenantId:req.tenantId}}));
      }
      return created;
    });
    ok(res,result,201);
  } catch(e){next(e);}
});

containersRouter.put("/:id/status", async(req,res,next)=>{
  try {
    const input=z.object({status:z.enum(["REGISTERED","IN_YARD","GATED_OUT","LOADED","DISCHARGED","AVAILABLE","RELEASED","DELIVERED","DAMAGED"]),location:z.string().optional(),eventData:z.record(z.unknown()).optional()}).parse(req.body);
    const md5Hash=createHash("md5").update(JSON.stringify({containerId:req.params.id,status:input.status,location:input.location,eventData:input.eventData??{}})).digest("hex");
    const result=await prisma.$transaction(async tx=>{
      const container=await tx.container.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId}});
      const duplicate=await tx.containerEvent.findFirst({where:{containerId:container.id,tenantId:req.tenantId,md5Hash}});
      if(!duplicate){
        await tx.containerEvent.create({data:{containerId:container.id,status:input.status,location:input.location,timestamp:new Date(),eventData:input.eventData??{},md5Hash,tenantId:req.tenantId}});
      }
      return tx.container.update({where:{id:container.id},data:{status:input.status,location:input.location}});
    });
    ok(res,result);
  } catch(e){next(e);}
});

containersRouter.get("/:id/tracking", async(req,res,next)=>{
  try {
    const container=await prisma.container.findFirstOrThrow({where:{id:req.params.id,tenantId:req.tenantId},include:{events:{orderBy:{timestamp:"desc"},take:100}}});
    ok(res,{container,events:container.events});
  } catch(e){next(e);}
});
