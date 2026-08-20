import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { isValidContainerNumber } from "../utils/numbering.js";

const schema = z.object({
  containerId: z.string().trim().min(1),
  sealNumber: z.string().trim().max(100).optional().nullable(),
  packageCount: z.number().int().nonnegative().optional().nullable(),
  packageType: z.string().trim().max(100).optional().nullable(),
  grossWeight: z.number().nonnegative().optional().nullable(),
  measurement: z.number().nonnegative().optional().nullable(),
  marksAndNumbers: z.string().trim().max(5000).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
});

export const billOfLadingContainersRouter = Router();

billOfLadingContainersRouter.get("/:id/containers", async (req, res, next) => {
  try {
    const bill = await prisma.billOfLading.findFirstOrThrow({
      where: { id: req.params.id, tenantId: req.tenantId },
      select: { id: true },
    });

    const rows = await prisma.billOfLadingContainer.findMany({
      where: { billOfLadingId: bill.id },
      include: { container: true },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      success: true,
      data: rows,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

billOfLadingContainersRouter.post("/:id/containers", async (req, res, next) => {
  try {
    const input = schema.parse(req.body);

    const row = await prisma.$transaction(async (tx) => {
      const bill = await tx.billOfLading.findFirstOrThrow({
        where: { id: req.params.id, tenantId: req.tenantId },
        select: { id: true, status: true, bookingId: true },
      });

      if (bill.status !== "DRAFT") {
        throw new Error("BL_NOT_EDITABLE");
      }
      if (!bill.bookingId) {
        throw new Error("BOOKING_NOT_LINKED_TO_BILL_OF_LADING");
      }

      const booking = await tx.booking.findFirstOrThrow({
        where: { id: bill.bookingId, tenantId: req.tenantId },
        select: { containerId: true },
      });

      if (booking.containerId !== input.containerId) {
        throw new Error("CONTAINER_NOT_ASSIGNED_TO_BOOKING");
      }

      const container = await tx.container.findFirstOrThrow({
        where: { id: input.containerId, tenantId: req.tenantId },
        select: { id: true, containerNumber: true, type: true },
      });

      if (!isValidContainerNumber(container.containerNumber)) {
        throw new Error("CONTAINER_NUMBER_PREFIX_INVALID");
      }

      const existing = await tx.billOfLadingContainer.findUnique({
        where: {
          billOfLadingId_containerId: {
            billOfLadingId: bill.id,
            containerId: container.id,
          },
        },
      });

      if (existing) {
        throw new Error("CONTAINER_ALREADY_ATTACHED");
      }

      return tx.billOfLadingContainer.create({
        data: {
          billOfLadingId: bill.id,
          containerId: container.id,
          containerNumber: container.containerNumber,
          containerType: input.packageType ?? container.type,
          sealNumber: input.sealNumber ?? null,
          packageCount: input.packageCount ?? null,
          grossWeight: input.grossWeight ?? null,
          measurement: input.measurement ?? null,
          marksAndNumbers: input.marksAndNumbers ?? null,
          description: input.description ?? null,
        },
        include: { container: true },
      });
    });

    res.status(201).json({
      success: true,
      data: row,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

billOfLadingContainersRouter.delete("/:id/containers/:containerId", async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const bill = await tx.billOfLading.findFirstOrThrow({
        where: { id: req.params.id, tenantId: req.tenantId },
        select: { id: true, status: true },
      });

      if (bill.status !== "DRAFT") {
        throw new Error("BL_NOT_EDITABLE");
      }

      await tx.billOfLadingContainer.delete({
        where: {
          billOfLadingId_containerId: {
            billOfLadingId: bill.id,
            containerId: req.params.containerId,
          },
        },
      });
    });

    res.json({
      success: true,
      data: { deleted: true },
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
