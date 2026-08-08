import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import { createBookingSchema } from "@megazen/shared-validation";
import { createDocumentNumber } from "../utils/numbering.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const bookings = await prisma.booking.findMany({
      where: { tenantId: req.tenantId, ...(status ? { status: status as never } : {}) },
      include: { customer: true, container: true, shipment: true },
      orderBy: { bookingDate: "desc" }
    });
    ok(res, bookings);
  } catch (error) { next(error); }
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const input = createBookingSchema.parse(req.body);
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          ...input,
          bookingNumber: createDocumentNumber("BK"),
          tenantId: req.tenantId,
          status: "PENDING_APPROVAL"
        }
      });
      await tx.shipment.create({
        data: {
          bookingId: created.id,
          tenantId: req.tenantId,
          status: "PLANNED",
          vessel: undefined,
          voyage: undefined
        }
      });
      return created;
    });
    ok(res, booking, 201);
  } catch (error) { next(error); }
});

bookingsRouter.get("/:id", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirstOrThrow({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { customer: true, container: true, shipment: { include: { voyageRef: { include: { vessel: true } } } }, billsOfLading: true }
    });
    ok(res, booking);
  } catch (error) { next(error); }
});
