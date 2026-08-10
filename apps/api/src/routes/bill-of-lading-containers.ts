import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const schema = z.object({
  containerId: z.string().uuid(),
  sealNumber: z.string().trim().max(100).optional().nullable(),
  packageCount: z.number().int().nonnegative().optional().nullable(),
  packageType: z.string().trim().max(100).optional().nullable(),
  grossWeight: z.number().nonnegative().optional().nullable(),
  measurement: z.number().nonnegative().optional().nullable()
});
export const billOfLadingContainersRouter = Router();

billOfLadingContainersRouter.get("/:id/containers", async (req, res, next) => {
  try {
    const rows = await prisma.billOfLadingContainer.findMany({
      where: { billOfLadingId: req.params.id, billOfLading: { tenantId: req.tenantId } },
      include: { container: true }
    });
    res.json({ success: true, data: rows, error: null, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

billOfLadingContainersRouter.post("/:id/containers", async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const bill = await prisma.billOfLading.findFirstOrThrow({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (bill.status !== "DRAFT") throw new Error("BL_NOT_EDITABLE");
    const container = await prisma.container.findFirstOrThrow({ where: { id: input.containerId, tenantId: req.tenantId } });
    const row = await prisma.billOfLadingContainer.create({
      data: {
        billOfLadingId: bill.id, containerId: container.id,
        sealNumber: input.sealNumber ?? null, packageCount: input.packageCount ?? null,
        packageType: input.packageType ?? null,
        grossWeight: input.grossWeight ?? null, measurement: input.measurement ?? null
      },
      include: { container: true }
    });
    res.status(201).json({ success: true, data: row, error: null, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

billOfLadingContainersRouter.delete("/:id/containers/:containerId", async (req, res, next) => {
  try {
    const bill = await prisma.billOfLading.findFirstOrThrow({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (bill.status !== "DRAFT") throw new Error("BL_NOT_EDITABLE");
    await prisma.billOfLadingContainer.delete({
      where: { billOfLadingId_containerId: { billOfLadingId: bill.id, containerId: req.params.containerId } }
    });
    res.json({ success: true, data: { deleted: true }, error: null, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});
