import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import { createBookingSchema } from "@megazen/shared-validation";
import { createBookingNumber, isValidBookingNumber, isValidContainerNumber } from "../utils/numbering.js";
import { createEirNumber } from "../utils/eir-number.js";

export const bookingsRouter = Router();

const BOOKING_NUMBER_ATTEMPTS = 20;

const isBookingReferenceConflict = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) return target.some((value) => String(value).toLowerCase().includes("bookingnumber") || String(value).toLowerCase().includes("eirnumber"));
  if (typeof target === "string") return /bookingnumber|eirnumber/i.test(target);
  return false;
};

bookingsRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const bookingNumber =
      typeof req.query.bookingNumber === "string"
        ? req.query.bookingNumber.trim()
        : undefined;

    if (bookingNumber && !isValidBookingNumber(bookingNumber)) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "INVALID_BOOKING_NUMBER",
          message: "Booking number must be a valid 10-digit number with a valid check digit.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: req.tenantId,
        ...(status ? { status: status as never } : {}),
        ...(bookingNumber ? { bookingNumber } : {}),
      },
      include: { customer: true, container: true, shipment: true },
      orderBy: { bookingDate: "desc" },
    });

    ok(res, bookings);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/by-number/:bookingNumber", async (req, res, next) => {
  try {
    const bookingNumber = req.params.bookingNumber.trim();

    if (!isValidBookingNumber(bookingNumber)) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "INVALID_BOOKING_NUMBER",
          message: "Invalid 10-digit booking number.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const booking = await prisma.booking.findFirstOrThrow({
      where: { bookingNumber, tenantId: req.tenantId },
      include: {
        customer: true,
        container: true,
        shipment: {
          include: {
            voyageRef: { include: { vessel: true } },
          },
        },
        billsOfLading: true,
      },
    });

    ok(res, booking);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const input = createBookingSchema.parse(req.body);

    let lastError: unknown;

    for (let attempt = 1; attempt <= BOOKING_NUMBER_ATTEMPTS; attempt += 1) {
      const bookingNumber = createBookingNumber();

      try {
        const booking = await prisma.$transaction(async (tx) => {
          const customer = await tx.customer.findFirst({
            where: { id: input.customerId, tenantId: req.tenantId },
            select: { id: true },
          });
          if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

          if (input.containerId) {
            const container = await tx.container.findFirst({
              where: { id: input.containerId, tenantId: req.tenantId },
              select: { id: true, containerNumber: true },
            });
            if (!container) throw new Error("CONTAINER_NOT_FOUND");
            if (!isValidContainerNumber(container.containerNumber)) {
              throw new Error("CONTAINER_NUMBER_PREFIX_INVALID");
            }
          }

          const eirNumber = createEirNumber();
          const created = await tx.booking.create({
            data: {
              ...input,
              bookingNumber,
              eirNumber,
              eirExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
              tenantId: req.tenantId,
              status: "PENDING_APPROVAL",
            },
          });

          await tx.shipment.create({
            data: {
              bookingId: created.id,
              tenantId: req.tenantId,
              status: "PLANNED",
              vessel: undefined,
              voyage: undefined,
            },
          });

          return created;
        });

        ok(res, booking, 201);
        return;
      } catch (error) {
        lastError = error;

        if (!isBookingReferenceConflict(error)) {
          throw error;
        }
      }
    }

    next(
      lastError instanceof Error
        ? new Error("BOOKING_NUMBER_GENERATION_EXHAUSTED")
        : new Error("BOOKING_NUMBER_GENERATION_EXHAUSTED"),
    );
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/:id", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirstOrThrow({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        customer: true,
        container: true,
        shipment: {
          include: {
            voyageRef: { include: { vessel: true } },
          },
        },
        billsOfLading: true,
      },
    });

    ok(res, booking);
  } catch (error) {
    next(error);
  }
});
