import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues.map((issue) => issue.message).join("; ")
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  const known: Record<string, { status: number; code: string }> = {
    BL_NOT_DRAFT: { status: 409, code: "BL_NOT_DRAFT" },
    BL_NOT_PENDING_APPROVAL: { status: 409, code: "BL_NOT_PENDING_APPROVAL" },
    BL_NOT_APPROVED: { status: 409, code: "BL_NOT_APPROVED" },
    BL_NOT_ISSUED: { status: 409, code: "BL_NOT_ISSUED" },
    BL_NOT_SURRENDERABLE: { status: 409, code: "BL_NOT_SURRENDERABLE" },
    BL_NOT_EDITABLE: { status: 409, code: "BL_NOT_EDITABLE" },
    BL_ISSUANCE_CONFLICT: { status: 409, code: "BL_ISSUANCE_CONFLICT" },
    ONE_OR_MORE_CONTAINERS_NOT_FOUND: { status: 400, code: "CONTAINER_NOT_FOUND" },
    CONTAINER_NOT_FOUND: { status: 400, code: "CONTAINER_NOT_FOUND" },
    CONTAINER_NUMBER_PREFIX_INVALID: { status: 400, code: "CONTAINER_NUMBER_PREFIX_INVALID" },
    CONTAINER_NOT_ASSIGNED_TO_BOOKING: { status: 409, code: "CONTAINER_NOT_ASSIGNED_TO_BOOKING" },
    CONTAINER_ALREADY_ATTACHED: { status: 409, code: "CONTAINER_ALREADY_ATTACHED" },
    BOOKING_NOT_LINKED_TO_BILL_OF_LADING: { status: 409, code: "BOOKING_NOT_LINKED_TO_BILL_OF_LADING" },
    CUSTOMER_NOT_FOUND: { status: 400, code: "CUSTOMER_NOT_FOUND" },
    MAX_BILL_OF_LADING_AMENDMENTS: { status: 409, code: "MAX_AMENDMENTS_REACHED" },
    BOOKING_NUMBER_GENERATION_EXHAUSTED: { status: 503, code: "BOOKING_NUMBER_GENERATION_EXHAUSTED" },
    BOOKING_NUMBER_INVALID_FOR_BILL_OF_LADING: { status: 409, code: "BOOKING_NUMBER_INVALID_FOR_BILL_OF_LADING" },
    BILL_OF_LADING_ALREADY_EXISTS_FOR_BOOKING: { status: 409, code: "BILL_OF_LADING_ALREADY_EXISTS_FOR_BOOKING" },
    EIR_NUMBER_GENERATION_EXHAUSTED: { status: 503, code: "EIR_NUMBER_GENERATION_EXHAUSTED" },
    MAX_AMENDMENTS_REACHED: { status: 409, code: "MAX_AMENDMENTS_REACHED" },
    DOCUMENT_INTEGRITY_FAILURE: { status: 409, code: "DOCUMENT_INTEGRITY_FAILURE" },
    BILL_OF_LADING_NUMBER_INVALID: { status: 409, code: "BILL_OF_LADING_NUMBER_INVALID" },
    SHIPMENT_BILL_OF_LADING_REFERENCE_CONFLICT: { status: 409, code: "SHIPMENT_BILL_OF_LADING_REFERENCE_CONFLICT" },
    BL_WORKFLOW_CONFLICT: { status: 409, code: "BL_WORKFLOW_CONFLICT" }
  };

  const mapped = known[message];
  if (mapped) {
    res.status(mapped.status).json({
      success: false,
      data: null,
      error: { code: mapped.code, message },
      timestamp: new Date().toISOString()
    });
    return;
  }

  logger.error({ err: error }, "Unhandled API error");
  res.status(500).json({
    success: false,
    data: null,
    error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    timestamp: new Date().toISOString()
  });
};
