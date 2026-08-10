import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { createHash } from "node:crypto";

const amendmentSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  changes: z.record(z.string(), z.unknown())
});
const approvalSchema = z.object({ comment: z.string().trim().max(500).optional() });
const verificationSchema = z.object({
  blNumber: z.string().trim().min(3),
  verificationCode: z.string().trim().min(5)
});

const response = (success: boolean, data: unknown, error: unknown = null) => ({
  success, data, error, timestamp: new Date().toISOString()
});

export const billOfLadingWorkflowRouter = Router();

billOfLadingWorkflowRouter.post("/:id/lock", async (req, res, next) => {
  try {
    const result = await prisma.billOfLading.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId, status: "DRAFT" },
      data: { status: "PENDING_APPROVAL" }
    });
    res.status(result.count === 1 ? 200 : 409).json(response(
      result.count === 1, result.count === 1 ? { locked: true } : null,
      result.count === 1 ? null : { code: "BL_NOT_EDITABLE", message: "Only a draft can be submitted." }
    ));
  } catch (error) { next(error); }
});

billOfLadingWorkflowRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const input = approvalSchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.billOfLading.findFirstOrThrow({
        where: { id: req.params.id, tenantId: req.tenantId }
      });
      if (bill.status !== "PENDING_APPROVAL") throw new Error("BL_NOT_PENDING_APPROVAL");
      const updated = await tx.billOfLading.update({
        where: { id: bill.id }, data: { status: "APPROVED" }
      });
      await tx.approval.create({
        data: { entityType: "BillOfLading", entityId: bill.id, status: "APPROVED", comment: input.comment ?? null }
      });
      await tx.auditLog.create({
        data: { tenantId: req.tenantId, entityType: "BillOfLading", entityId: bill.id, action: "APPROVED", data: { comment: input.comment ?? null } }
      });
      return updated;
    });
    res.json(response(true, result));
  } catch (error) { next(error); }
});

billOfLadingWorkflowRouter.post("/:id/issue", async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.billOfLading.findFirstOrThrow({
        where: { id: req.params.id, tenantId: req.tenantId },
        include: { containers: true }
      });
      if (bill.status !== "APPROVED") throw new Error("BL_NOT_APPROVED");
      const payload = {
        id: bill.id, blNumber: bill.blNumber, version: bill.version,
        verificationCode: bill.verificationCode, issueDate: bill.issueDate.toISOString(),
        shipperName: bill.shipperName, consigneeName: bill.consigneeName,
        description: bill.description, containers: bill.containers
      };
      const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      const updated = await tx.billOfLading.update({
        where: { id: bill.id }, data: { status: "ISSUED", documentHash: hash }
      });
      await tx.auditLog.create({
        data: { tenantId: req.tenantId, entityType: "BillOfLading", entityId: bill.id, action: "ISSUED", data: { hash, version: bill.version } }
      });
      return updated;
    });
    res.json(response(true, result));
  } catch (error) { next(error); }
});

billOfLadingWorkflowRouter.post("/:id/release", async (req, res, next) => {
  try {
    const result = await prisma.billOfLading.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId, status: { in: ["ISSUED", "APPROVED"] } },
      data: { status: "RELEASED" }
    });
    res.status(result.count === 1 ? 200 : 409).json(response(
      result.count === 1, result.count === 1 ? { released: true } : null,
      result.count === 1 ? null : { code: "BL_NOT_RELEASEABLE", message: "Document must be issued or approved." }
    ));
  } catch (error) { next(error); }
});

billOfLadingWorkflowRouter.post("/:id/surrender", async (req, res, next) => {
  try {
    const result = await prisma.billOfLading.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId, status: "ISSUED" },
      data: { status: "SURRENDERED" }
    });
    res.status(result.count === 1 ? 200 : 409).json(response(
      result.count === 1, result.count === 1 ? { surrendered: true } : null,
      result.count === 1 ? null : { code: "BL_NOT_ISSUED", message: "Only issued documents can be surrendered." }
    ));
  } catch (error) { next(error); }
});

billOfLadingWorkflowRouter.post("/:id/amend", async (req, res, next) => {
  try {
    const input = amendmentSchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.billOfLading.findFirstOrThrow({
        where: { id: req.params.id, tenantId: req.tenantId },
        include: { containers: true }
      });
      if (["ISSUED", "SURRENDERED", "RELEASED"].includes(current.status)) {
        throw new Error("ISSUED_DOCUMENT_CANNOT_BE_AMENDED");
      }
      const snapshot = JSON.parse(JSON.stringify(current)) as Record<string, unknown>;
      const version = current.version + 1;
      const updated = await tx.billOfLading.update({
        where: { id: current.id }, data: { status: "DRAFT", version, documentHash: null }
      });
      await tx.billOfLadingRevision.create({
        data: { billOfLadingId: current.id, version, snapshot: { before: snapshot, changes: input.changes }, reason: input.reason }
      });
      await tx.auditLog.create({
        data: { tenantId: req.tenantId, entityType: "BillOfLading", entityId: current.id, action: "AMENDED", data: { version, reason: input.reason } }
      });
      return updated;
    });
    res.json(response(true, result));
  } catch (error) { next(error); }
});

billOfLadingWorkflowRouter.post("/verify", async (req, res, next) => {
  try {
    const input = verificationSchema.parse(req.body);
    const document = await prisma.billOfLading.findFirst({
      where: { blNumber: input.blNumber, verificationCode: input.verificationCode, status: { in: ["ISSUED", "RELEASED", "SURRENDERED"] } },
      select: { blNumber: true, status: true, version: true, documentType: true, issueDate: true, issuePlace: true,
        shipperName: true, consigneeName: true, portOfLoading: true, portOfDischarge: true,
        verificationCode: true, documentHash: true }
    });
    res.json(response(document !== null, document, document ? null : { code: "DOCUMENT_NOT_FOUND", message: "Document could not be verified." }));
  } catch (error) { next(error); }
});
