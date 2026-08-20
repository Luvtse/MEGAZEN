import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import { isValidBookingNumber, isValidBillOfLadingNumber, formatBillOfLadingNumber } from "../utils/numbering.js";

export const referencesRouter = Router();

referencesRouter.get("/:reference", async (req, res, next) => {
  try {
    const reference = req.params.reference.trim().toUpperCase();

    if (!isValidBookingNumber(reference) && !isValidBillOfLadingNumber(reference)) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "INVALID_REFERENCE",
          message: "Reference must be a valid 10-digit booking number or ZENU B/L number.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const bookingNumber = isValidBookingNumber(reference)
      ? reference
      : reference.slice(4);

    const booking = await prisma.booking.findFirst({
      where: {
        tenantId: req.tenantId,
        bookingNumber,
      },
      include: {
        customer: true,
        container: true,
        shipment: {
          include: {
            voyageRef: { include: { vessel: true } },
          },
        },
        billsOfLading: {
          include: {
            containers: { include: { container: true } },
            versions: { orderBy: { version: "desc" } },
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "REFERENCE_NOT_FOUND",
          message: "No shipment was found for this business reference.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const billOfLadingNumber = formatBillOfLadingNumber(booking.bookingNumber);

    ok(res, {
      reference: booking.bookingNumber,
      bookingNumber: booking.bookingNumber,
      billOfLadingNumber,
      booking,
      shipment: booking.shipment,
      billOfLadings: booking.billsOfLading,
      container: booking.container,
      customer: booking.customer,
    });
  } catch (error) {
    next(error);
  }
});
