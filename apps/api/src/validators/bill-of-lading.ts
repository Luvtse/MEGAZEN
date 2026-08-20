import { z } from "zod";
import { isValidBookingNumber } from "../utils/numbering.js";

const id = z.string().trim().min(1);
export const createBillOfLadingSchema = z.object({
  bookingNumber: z.string().trim().refine(isValidBookingNumber, "Booking number must be a valid 10-digit shipment reference with a valid check digit."),
  carrierName: z.string().trim().min(2).max(200),
  carrierAddress: z.string().trim().max(1000).optional(),
  agentName: z.string().trim().max(200).optional(),
  agentAddress: z.string().trim().max(1000).optional(),
  shipperName: z.string().trim().min(2).max(200),
  shipperAddress: z.string().trim().min(2).max(1000),
  consigneeName: z.string().trim().min(2).max(200),
  consigneeAddress: z.string().trim().min(2).max(1000),
  notifyPartyName: z.string().trim().max(200).optional(),
  notifyPartyAddress: z.string().trim().max(1000).optional(),
  placeOfReceipt: z.string().trim().max(200).optional(),
  portOfLoading: z.string().trim().min(2).max(200),
  portOfDischarge: z.string().trim().min(2).max(200),
  placeOfDelivery: z.string().trim().max(200).optional(),
  vesselName: z.string().trim().max(200).optional(),
  voyageNumber: z.string().trim().max(100).optional(),
  freightTerms: z.string().trim().max(100).optional(),
  placeOfIssue: z.string().trim().min(2).max(200),
  numberOfOriginals: z.number().int().min(1).max(9).default(3),
  description: z.string().trim().min(2).max(10000),
  marksAndNumbers: z.string().trim().max(5000).optional(),
  totalPackages: z.number().int().nonnegative().optional(),
  totalGrossWeight: z.number().nonnegative().optional(),
  totalMeasurement: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  declaredValue: z.number().nonnegative().optional(),
  termsText: z.string().trim().max(10000).optional(),
  containerIds: z.array(id).default([])
}).strict();

export const updateBillOfLadingSchema = createBillOfLadingSchema
  .omit({ bookingNumber: true, containerIds: true })
  .partial()
  .strict();

export const amendBillOfLadingSchema = updateBillOfLadingSchema.extend({
  reason: z.string().trim().min(5).max(1000),
  containerIds: z.array(id).optional()
}).strict();

export const billOfLadingContainerSchema = z.object({
  containerId: id,
  sealNumber: z.string().trim().max(50).optional(),
  packageCount: z.number().int().nonnegative().optional(),
  packageType: z.string().trim().max(100).optional(),
  grossWeight: z.number().nonnegative().optional(),
  measurement: z.number().nonnegative().optional(),
  marksAndNumbers: z.string().trim().max(5000).optional(),
  description: z.string().trim().max(10000).optional()
});

export type CreateBillOfLadingInput = z.infer<typeof createBillOfLadingSchema>;
export type AmendBillOfLadingInput = z.infer<typeof amendBillOfLadingSchema>;
