import {z} from "zod";
export const createCustomerSchema=z.object({name:z.string().trim().min(2).max(200),code:z.string().trim().min(2).max(50).regex(/^[A-Z0-9_-]+$/),contactPerson:z.string().trim().max(150).optional(),email:z.string().email().optional(),phone:z.string().trim().max(50).optional(),address:z.string().trim().max(500).optional()});
export const createContainerSchema=z.object({containerNumber:z.string().trim().regex(/^[A-Z]{4}\d{7}$/),type:z.string().trim().min(2).max(30),size:z.enum(["20","40","45"]),carrier:z.string().trim().max(120).optional(),vessel:z.string().trim().max(120).optional(),voyage:z.string().trim().max(80).optional(),location:z.string().trim().max(200).optional()});
export const updateContainerStatusSchema=z.object({status:z.enum(["REGISTERED","IN_YARD","GATED_OUT","LOADED","DISCHARGED","AVAILABLE","RELEASED","DELIVERED","DAMAGED"]),location:z.string().trim().max(200).optional(),eventData:z.record(z.string(),z.unknown()).optional()});

export const createBookingSchema = z.object({
  customerId: z.string().trim().min(1),
  containerId: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(2).max(200),
  destination: z.string().trim().min(2).max(200),
  cargoDescription: z.string().trim().min(2).max(10000),
  weight: z.coerce.number().nonnegative(),
  volume: z.coerce.number().nonnegative().optional(),
}).strict();
