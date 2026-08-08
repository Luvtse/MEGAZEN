import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { renderBillOfLading, type BillOfLadingDocument } from "@megazen/document-engine";

export const billOfLadingPdfRouter = Router();

billOfLadingPdfRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const bill = await prisma.billOfLading.findFirstOrThrow({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { containers: { include: { container: true } } }
    });

    const document: BillOfLadingDocument = {
      ...bill,
      grossWeight: bill.grossWeight?.toNumber() ?? null,
      measurement: bill.measurement?.toNumber() ?? null,
      declaredValue: bill.declaredValue?.toNumber() ?? null,
      containers: bill.containers.map((item) => ({
        containerNumber: item.container.containerNumber,
        sealNumber: item.sealNumber,
        packageCount: item.packageCount,
        packageType: item.packageType,
        grossWeight: item.grossWeight?.toNumber() ?? null,
        measurement: item.measurement?.toNumber() ?? null
      }))
    };

    const pdf = await renderBillOfLading(document);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${bill.blNumber}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});
