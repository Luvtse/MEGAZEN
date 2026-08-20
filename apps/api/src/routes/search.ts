import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import { isValidBookingNumber, isValidBillOfLadingNumber, formatBillOfLadingNumber } from "../utils/numbering.js";

export const searchRouter = Router();

const MAX_RESULTS = 10;

const normalize = (value: string): string => value.trim().toUpperCase();

searchRouter.get("/", async (req, res, next) => {
  try {
    const raw = typeof req.query.q === "string" ? req.query.q : "";
    const q = normalize(raw);

    if (q.length < 2 || q.length > 64) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "INVALID_SEARCH_QUERY",
          message: "Search query must contain between 2 and 64 characters.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const bookingNumber = isValidBookingNumber(q) ? q : undefined;
    const blNumber = isValidBillOfLadingNumber(q) ? q : undefined;

    const [bookings, containers, customers, billsOfLading, shipments] = await Promise.all([
      prisma.booking.findMany({
        where: {
          tenantId: req.tenantId,
          OR: [
            ...(bookingNumber ? [{ bookingNumber }] : []),
            { origin: { contains: q, mode: "insensitive" } },
            { destination: { contains: q, mode: "insensitive" } },
            { cargoDescription: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          origin: true,
          destination: true,
          bookingDate: true,
          customer: { select: { id: true, name: true, code: true } },
        },
        take: MAX_RESULTS,
        orderBy: { bookingDate: "desc" },
      }),
      prisma.container.findMany({
        where: {
          tenantId: req.tenantId,
          OR: [
            { containerNumber: q },
            { carrier: { contains: q, mode: "insensitive" } },
            { vessel: { contains: q, mode: "insensitive" } },
            { voyage: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          containerNumber: true,
          status: true,
          location: true,
          carrier: true,
          vessel: true,
          voyage: true,
          booking: { select: { id: true, bookingNumber: true } },
        },
        take: MAX_RESULTS,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.customer.findMany({
        where: {
          tenantId: req.tenantId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          email: true,
          phone: true,
        },
        take: MAX_RESULTS,
        orderBy: { name: "asc" },
      }),
      prisma.billOfLading.findMany({
        where: {
          tenantId: req.tenantId,
          OR: [
            ...(blNumber ? [{ blNumber }] : []),
            { shipperName: { contains: q, mode: "insensitive" } },
            { consigneeName: { contains: q, mode: "insensitive" } },
            { portOfLoading: { contains: q, mode: "insensitive" } },
            { portOfDischarge: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          blNumber: true,
          version: true,
          status: true,
          bookingId: true,
          shipmentId: true,
          shipperName: true,
          consigneeName: true,
          booking: { select: { bookingNumber: true } },
        },
        take: MAX_RESULTS,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.shipment.findMany({
        where: {
          tenantId: req.tenantId,
          OR: [
            ...(blNumber ? [{ blNumber }] : []),
            { vessel: { contains: q, mode: "insensitive" } },
            { voyage: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          bookingId: true,
          blNumber: true,
          status: true,
          vessel: true,
          voyage: true,
          booking: { select: { bookingNumber: true } },
        },
        take: MAX_RESULTS,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const bookingResults = bookings.map((booking) => ({
      type: "booking" as const,
      id: booking.id,
      reference: booking.bookingNumber,
      title: booking.bookingNumber,
      subtitle: `${booking.origin} → ${booking.destination}`,
      status: booking.status,
      bookingNumber: booking.bookingNumber,
      billOfLadingNumber: formatBillOfLadingNumber(booking.bookingNumber),
      customer: booking.customer,
    }));

    const containerResults = containers.map((container) => ({
      type: "container" as const,
      id: container.id,
      reference: container.containerNumber,
      title: container.containerNumber,
      subtitle: container.location ?? container.carrier ?? "Container",
      status: container.status,
      bookingNumber: container.booking?.bookingNumber ?? null,
    }));

    const customerResults = customers.map((customer) => ({
      type: "customer" as const,
      id: customer.id,
      reference: customer.code,
      title: customer.name,
      subtitle: customer.email ?? customer.phone ?? customer.code,
      status: null,
    }));

    const billOfLadingResults = billsOfLading.map((bill) => ({
      type: "bill_of_lading" as const,
      id: bill.id,
      reference: bill.blNumber,
      title: bill.blNumber,
      subtitle: `${bill.shipperName} → ${bill.consigneeName}`,
      status: bill.status,
      bookingNumber: bill.booking?.bookingNumber ?? null,
      version: bill.version,
    }));

    const shipmentResults = shipments.map((shipment) => ({
      type: "shipment" as const,
      id: shipment.id,
      reference: shipment.booking.bookingNumber,
      title: shipment.blNumber ?? shipment.booking.bookingNumber,
      subtitle: [shipment.vessel, shipment.voyage].filter(Boolean).join(" / ") || "Shipment",
      status: shipment.status,
      bookingNumber: shipment.booking.bookingNumber,
    }));

    ok(res, {
      query: raw,
      counts: {
        bookings: bookingResults.length,
        containers: containerResults.length,
        customers: customerResults.length,
        billsOfLading: billOfLadingResults.length,
        shipments: shipmentResults.length,
      },
      results: [
        ...bookingResults,
        ...billOfLadingResults,
        ...shipmentResults,
        ...containerResults,
        ...customerResults,
      ],
    });
  } catch (error) {
    next(error);
  }
});
