import { z } from "zod";

export const createBillOfLadingSchema = z
  .object({
    bookingId: z.string().cuid().optional(),
    shipmentId: z.string().cuid().optional(),

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
    issueDate: z.coerce.date().optional(),

    totalPackages: z.number().int().nonnegative().optional(),
    totalGrossWeight: z.number().nonnegative().optional(),
    totalMeasurement: z.number().nonnegative().optional(),

    currency: z.string().trim().length(3).optional(),
    declaredValue: z.number().nonnegative().optional(),

    termsText: z.string().trim().max(10000).optional(),

    containerIds: z.array(z.string().cuid()).min(1),
  })
  .refine((value) => Boolean(value.bookingId || value.shipmentId), {
    message: "bookingId or shipmentId is required",
    path: ["bookingId"],
  });

export const amendBillOfLadingSchema = z.object({
  reason: z.string().trim().min(5).max(1000),

  // Core Bill of Lading fields that can be amended
  carrierName: z.string().trim().min(2).max(200).optional(),
  carrierAddress: z.string().trim().max(1000).optional(),

  agentName: z.string().trim().max(200).optional(),
  agentAddress: z.string().trim().max(1000).optional(),

  shipperName: z.string().trim().min(2).max(200).optional(),
  shipperAddress: z.string().trim().min(2).max(1000).optional(),

  consigneeName: z.string().trim().min(2).max(200).optional(),
  consigneeAddress: z.string().trim().min(2).max(1000).optional(),

  notifyPartyName: z.string().trim().max(200).optional(),
  notifyPartyAddress: z.string().trim().max(1000).optional(),

  placeOfReceipt: z.string().trim().min(2).max(200).optional(),
  portOfLoading: z.string().trim().min(2).max(200).optional(),
  portOfDischarge: z.string().trim().min(2).max(200).optional(),
  placeOfDelivery: z.string().trim().min(2).max(200).optional(),

  vesselName: z.string().trim().max(200).optional(),
  voyageNumber: z.string().trim().max(100).optional(),

  freightTerms: z.string().trim().max(100).optional(),

  // Cargo details
  marksAndNumbers: z.string().trim().optional(),
  description: z.string().trim().min(2).optional(),

  totalPackages: z.number().int().nonnegative().optional(),
  totalGrossWeight: z.number().nonnegative().optional(),
  totalMeasurement: z.number().nonnegative().optional(),

  // Financial fields
  currency: z.string().trim().length(3).optional(),
  declaredValue: z.number().nonnegative().optional(),

  termsText: z.string().trim().max(10000).optional(),

  // Container management
  containerIds: z.array(z.string().cuid()).min(1).optional(),
});

export type CreateBillOfLadingInput = z.infer<typeof createBillOfLadingSchema>;
export type AmendBillOfLadingInput = z.infer<typeof amendBillOfLadingSchema>;
