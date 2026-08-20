import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const requested = req.header("x-tenant-id");
  if (!requested) {
    res.status(400).json({success:false,data:null,error:{code:"TENANT_REQUIRED",message:"x-tenant-id header is required"},timestamp:new Date().toISOString()});
    return;
  }
  try {
    const tenant = await prisma.tenant.findFirst({where:{OR:[{id:requested},{code:requested}]}});
    if (!tenant) {
      res.status(404).json({success:false,data:null,error:{code:"TENANT_NOT_FOUND",message:"Tenant was not found"},timestamp:new Date().toISOString()});
      return;
    }
    req.tenantId=tenant.id;
    next();
  } catch(error) {
    next(error);
  }
};
