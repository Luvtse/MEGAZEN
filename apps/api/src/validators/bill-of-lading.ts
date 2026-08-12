import { z } from "zod";

export const amendBillOfLadingSchema =
  z.object({
    reason: z
      .string()
      .trim()
      .min(5)
      .max(1000),

    placeOfReceipt:
      z.string().trim().min(2).optional(),

    portOfLoading:
      z.string().trim().min(2).optional(),

    portOfDischarge:
      z.string().trim().min(2).optional(),

    placeOfDelivery:
      z.string().trim().min(2).optional(),

    shipperName:
      z.string().trim().min(2).optional(),

    shipperAddress:
      z.string().trim().min(2).optional(),

    consigneeName:
      z.string().trim().min(2).optional(),

    consigneeAddress:
      z.string().trim().min(2).optional(),

    notifyPartyName:
      z.string().trim().optional(),

    notifyPartyAddress:
      z.string().trim().optional(),

    vesselName:
      z.string().trim().optional(),

    voyageNumber:
      z.string().trim().optional(),

    freightTerms:
      z.string().trim().optional(),

    marksAndNumbers:
      z.string().trim().optional(),

    description:
      z.string().trim().min(2).optional(),

    grossWeight:
      z.number().nonnegative().optional(),

    measurement:
      z.number().nonnegative().optional(),

    packageCount:
      z.number().int().nonnegative().optional(),

    currency:
      z.string().length(3).optional(),

    declaredValue:
      z.number().nonnegative().optional(),

    termsText:
      z.string().trim().optional()
  });

export type AmendBillOfLadingInput =
  z.infer<
    typeof amendBillOfLadingSchema
  >;