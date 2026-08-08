import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tenantId: z.string(),
});

export const CreateCustomerSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['importer', 'exporter', 'forwarder', 'broker']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().positive().default(0),
  tags: z.array(z.string()).default([]),
});

export const CreateBookingSchema = z.object({
  bookingNumber: z.string().min(1),
  customerId: z.string().cuid(),
  origin: z.string().min(3),
  destination: z.string().min(3),
  cargoDescription: z.string().min(1),
  cargoType: z.string().min(1),
  weight: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  containerCount: z.number().positive().default(1),
  expectedShippingDate: z.string().datetime().optional(),
  specialInstructions: z.string().optional(),
});

export const CreateContainerSchema = z.object({
  containerNumber: z.string().min(1),
  type: z.enum(['20ft', '40ft', '40ft HC', 'Reefer', 'Open Top', 'Flat Rack']),
  size: z.enum(['20', '40']),
  carrier: z.string().optional(),
  vessel: z.string().optional(),
  voyage: z.string().optional(),
});

export const CreateBillOfLadingSchema = z.object({
  bolNumber: z.string().min(1),
  bookingId: z.string().cuid().optional(),
  shipper: z.string().min(1),
  consignee: z.string().min(1),
  vessel: z.string().optional(),
  voyageNo: z.string().optional(),
  portOfLoading: z.string().min(3),
  portOfDischarge: z.string().min(3),
  prepaid: z.boolean(),
  collect: z.boolean(),
  items: z.array(z.object({
    containerNo: z.string(),
    sealNo: z.string().optional(),
    description: z.string(),
    weight: z.number().optional(),
    measurement: z.number().optional(),
  })),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CreateContainerInput = z.infer<typeof CreateContainerSchema>;
export type CreateBillOfLadingInput = z.infer<typeof CreateBillOfLadingSchema>;
