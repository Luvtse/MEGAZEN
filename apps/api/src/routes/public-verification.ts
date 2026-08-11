import { Router } from "express";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import {
  createVerificationCode,
  createDocumentNumber
} from "../utils/numbering.js";
import {
  hashForDocument,
  type BillOfLadingDocument
} from "@megazen/document-engine";
import { z } from "zod";

const billOfLadingSchema = z.object({
  bookingId: z.string().uuid(),
  customerId: z.string().uuid(),
  documentType: z.string().trim().min(2).max(50).default("ORIGINAL"),

  placeOfReceipt: z.string().trim().min(2),
  portOfLoading: z.string().trim().min(2),
  portOfDischarge: z.string().trim().min(2),
  placeOfDelivery: z.string().trim().optional(),

  shipperName: z.string().trim().min(2),
  shipperAddress: z.string().trim().min(2),

  consigneeName: z.string().trim().min(2),
  consigneeAddress: z.string().trim().min(2),

  notifyPartyName: z.string().trim().optional(),
  notifyPartyAddress: z.string().trim().optional(),

  vesselName: z.string().trim().optional(),
  voyageNumber: z.string().trim().optional(),

  issuePlace: z.string().trim().min(2),

  numberOfOriginals: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(3),

  freightTerms: z.string().trim().optional(),
  marksAndNumbers: z.string().trim().optional(),

  description: z.string().trim().min(2),

  grossWeight: z.number().nonnegative().optional(),
  measurement: z.number().nonnegative().optional(),
  packageCount: z.number().int().nonnegative().optional(),

  currency: z.string().length(3).optional(),
  declaredValue: z.number().nonnegative().optional(),

  termsText: z.string().trim().optional(),

  containerIds: z.array(z.string().uuid()).default([])
});

export const billOfLadingRouter = Router();

const createSnapshot = (
  document: Awaited<
    ReturnType<typeof prisma.billOfLading.findFirstOrThrow>
  >
): Record<string, unknown> => {
  return JSON.parse(
    JSON.stringify(document)
  ) as Record<string, unknown>;
};

const toBillOfLadingDocument = (
  bill: Awaited<
    ReturnType<
      typeof prisma.billOfLading.findFirstOrThrow
    >
  > & {
    containers: Array<{
      sealNumber: string | null;
      packageCount: number | null;
      packageType: string | null;
      grossWeight: {
        toNumber(): number;
      } | null;
      measurement: {
        toNumber(): number;
      } | null;
      container: {
        containerNumber: string;
      };
    }>;
  }
): BillOfLadingDocument => ({
  blNumber: bill.blNumber,
  version: bill.version,
  status: bill.status,
  documentType: bill.documentType,

  issueDate: bill.issueDate,
  issuePlace: bill.issuePlace,

  placeOfReceipt: bill.placeOfReceipt,
  portOfLoading: bill.portOfLoading,
  portOfDischarge: bill.portOfDischarge,
  placeOfDelivery: bill.placeOfDelivery,

  shipperName: bill.shipperName,
  shipperAddress: bill.shipperAddress,

  consigneeName: bill.consigneeName,
  consigneeAddress: bill.consigneeAddress,

  notifyPartyName: bill.notifyPartyName,
  notifyPartyAddress: bill.notifyPartyAddress,

  vesselName: bill.vesselName,
  voyageNumber: bill.voyageNumber,

  numberOfOriginals: bill.numberOfOriginals,
  freightTerms: bill.freightTerms,

  marksAndNumbers: bill.marksAndNumbers,
  description: bill.description,

  grossWeight:
    bill.grossWeight?.toNumber() ?? null,

  measurement:
    bill.measurement?.toNumber() ?? null,

  packageCount: bill.packageCount,

  currency: bill.currency,

  declaredValue:
    bill.declaredValue?.toNumber() ?? null,

  termsText: bill.termsText,

  verificationCode:
    bill.verificationCode,

  documentHash:
    bill.documentHash,

  containers:
    bill.containers.map((item) => ({
      containerNumber:
        item.container.containerNumber,

      sealNumber:
        item.sealNumber,

      packageCount:
        item.packageCount,

      packageType:
        item.packageType,

      grossWeight:
        item.grossWeight?.toNumber() ?? null,

      measurement:
        item.measurement?.toNumber() ?? null
    }))
});

billOfLadingRouter.get(
  "/",
  async (req, res, next) => {
    try {
      const documents =
        await prisma.billOfLading.findMany({
          where: {
            tenantId: req.tenantId
          },
          include: {
            customer: true,
            containers: {
              include: {
                container: true
              }
            }
          },
          orderBy: {
            updatedAt: "desc"
          }
        });

      ok(res, documents);
    } catch (error) {
      next(error);
    }
  }
);

billOfLadingRouter.post(
  "/",
  async (req, res, next) => {
    try {
      const input =
        billOfLadingSchema.parse(req.body);

      const booking =
        await prisma.booking.findFirstOrThrow({
          where: {
            id: input.bookingId,
            tenantId: req.tenantId
          }
        });

      const customer =
        await prisma.customer.findFirstOrThrow({
          where: {
            id: input.customerId,
            tenantId: req.tenantId
          }
        });

      const document =
        await prisma.$transaction(
          async (tx) => {
            const created =
              await tx.billOfLading.create({
                data: {
                  bookingId: booking.id,
                  customerId: customer.id,
                  tenantId: req.tenantId,

                  blNumber:
                    createDocumentNumber("BL"),

                  documentType:
                    input.documentType,

                  placeOfReceipt:
                    input.placeOfReceipt,

                  portOfLoading:
                    input.portOfLoading,

                  portOfDischarge:
                    input.portOfDischarge,

                  placeOfDelivery:
                    input.placeOfDelivery,

                  shipperName:
                    input.shipperName,

                  shipperAddress:
                    input.shipperAddress,

                  consigneeName:
                    input.consigneeName,

                  consigneeAddress:
                    input.consigneeAddress,

                  notifyPartyName:
                    input.notifyPartyName,

                  notifyPartyAddress:
                    input.notifyPartyAddress,

                  vesselName:
                    input.vesselName,

                  voyageNumber:
                    input.voyageNumber,

                  issuePlace:
                    input.issuePlace,

                  issueDate: new Date(),

                  numberOfOriginals:
                    input.numberOfOriginals,

                  freightTerms:
                    input.freightTerms,

                  marksAndNumbers:
                    input.marksAndNumbers,

                  description:
                    input.description,

                  grossWeight:
                    input.grossWeight,

                  measurement:
                    input.measurement,

                  packageCount:
                    input.packageCount,

                  currency:
                    input.currency,

                  declaredValue:
                    input.declaredValue,

                  termsText:
                    input.termsText,

                  verificationCode:
                    createVerificationCode()
                }
              });

            if (
              input.containerIds.length > 0
            ) {
              const containers =
                await tx.container.findMany({
                  where: {
                    id: {
                      in: input.containerIds
                    },
                    tenantId: req.tenantId
                  },
                  select: {
                    id: true
                  }
                });

              if (
                containers.length !==
                input.containerIds.length
              ) {
                throw new Error(
                  "One or more containers do not belong to this tenant."
                );
              }

              await tx.billOfLadingContainer.createMany(
                {
                  data:
                    input.containerIds.map(
                      (containerId) => ({
                        billOfLadingId:
                          created.id,
                        containerId
                      })
                    )
                }
              );
            }

            await tx.billOfLadingRevision.create(
              {
                data: {
                  billOfLadingId:
                    created.id,

                  version: 1,

                  snapshot:
                    createSnapshot(created),

                  reason:
                    "Initial draft"
                }
              }
            );

            await tx.auditLog.create({
              data: {
                tenantId:
                  req.tenantId,

                entityType:
                  "BillOfLading",

                entityId:
                  created.id,

                action:
                  "CREATED",

                data: {
                  blNumber:
                    created.blNumber,

                  version:
                    created.version
                }
              }
            });

            return created;
          }
        );

      ok(
        res,
        document,
        201
      );
    } catch (error) {
      next(error);
    }
  }
);

billOfLadingRouter.get(
  "/:id",
  async (req, res, next) => {
    try {
      const document =
        await prisma.billOfLading.findFirstOrThrow(
          {
            where: {
              id: req.params.id,
              tenantId: req.tenantId
            },

            include: {
              customer: true,
              booking: true,

              containers: {
                include: {
                  container: true
                }
              },

              revisions: {
                orderBy: {
                  version: "desc"
                }
              },

              approvals: {
                orderBy: {
                  createdAt: "desc"
                }
              }
            }
          }
        );

      ok(
        res,
        document
      );
    } catch (error) {
      next(error);
    }
  }
);

billOfLadingRouter.post(
  "/:id/submit",
  async (req, res, next) => {
    try {
      const result =
        await prisma.$transaction(
          async (tx) => {
            const current =
              await tx.billOfLading.findFirstOrThrow(
                {
                  where: {
                    id: req.params.id,
                    tenantId: req.tenantId
                  },

                  include: {
                    containers: {
                      include: {
                        container: true
                      }
                    }
                  }
                }
              );

            if (
              current.status !==
              "DRAFT"
            ) {
              return {
                submitted: false,
                version:
                  current.version
              };
            }

            const nextVersion =
              current.version + 1;

            const updated =
              await tx.billOfLading.update({
                where: {
                  id: current.id
                },

                data: {
                  status:
                    "PENDING_APPROVAL",

                  version:
                    nextVersion
                }
              });

            const snapshot =
              JSON.parse(
                JSON.stringify({
                  ...updated,
                  containers:
                    current.containers
                })
              ) as Record<
                string,
                unknown
              >;

            await tx.billOfLadingRevision.create(
              {
                data: {
                  billOfLadingId:
                    current.id,

                  version:
                    nextVersion,

                  snapshot,

                  reason:
                    "Submitted for approval"
                }
              }
            );

            await tx.auditLog.create({
              data: {
                tenantId:
                  req.tenantId,

                entityType:
                  "BillOfLading",

                entityId:
                  current.id,

                action:
                  "SUBMITTED",

                data: {
                  version:
                    nextVersion
                }
              }
            });

            return {
              submitted: true,
              version:
                nextVersion
            };
          }
        );

      ok(
        res,
        result
      );
    } catch (error) {
      next(error);
    }
  }
);

billOfLadingRouter.post(
  "/:id/approve",
  async (req, res, next) => {
    try {
      const document =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.billOfLading.updateMany(
                {
                  where: {
                    id: req.params.id,
                    tenantId: req.tenantId,
                    status:
                      "PENDING_APPROVAL"
                  },

                  data: {
                    status:
                      "APPROVED"
                  }
                }
              );

            if (
              updated.count !== 1
            ) {
              return null;
            }

            await tx.approval.create(
              {
                data: {
                  entityType:
                    "BillOfLading",

                  entityId:
                    req.params.id,

                  status:
                    "APPROVED",

                  comment:
                    typeof req.body?.comment ===
                    "string"
                      ? req.body.comment
                      : null
                }
              }
            );

            await tx.auditLog.create({
              data: {
                tenantId:
                  req.tenantId,

                entityType:
                  "BillOfLading",

                entityId:
                  req.params.id,

                action:
                  "APPROVED",

                data: {
                  comment:
                    typeof req.body?.comment ===
                    "string"
                      ? req.body.comment
                      : null
                }
              }
            });

            return tx.billOfLading.findUnique(
              {
                where: {
                  id:
                    req.params.id
                }
              }
            );
          }
        );

      ok(
        res,
        document
      );
    } catch (error) {
      next(error);
    }
  }
);

billOfLadingRouter.post(
  "/:id/issue",
  async (req, res, next) => {
    try {
      const issued =
        await prisma.$transaction(
          async (tx) => {
            const document =
              await tx.billOfLading.findFirstOrThrow(
                {
                  where: {
                    id: req.params.id,
                    tenantId:
                      req.tenantId
                  },

                  include: {
                    containers: {
                      include: {
                        container: true
                      }
                    }
                  }
                }
              );

            if (
              document.status !==
              "APPROVED"
            ) {
              throw new Error(
                "Bill of Lading must be approved before issue."
              );
            }

            const documentInput =
              toBillOfLadingDocument(
                document
              );

            const hash =
              hashForDocument(
                documentInput
              );

            const updated =
              await tx.billOfLading.update({
                where: {
                  id: document.id
                },

                data: {
                  status:
                    "ISSUED",

                  documentHash:
                    hash
                }
              });

            const snapshot =
              JSON.parse(
                JSON.stringify({
                  ...document,
                  status:
                    "ISSUED",
                  documentHash:
                    hash
                })
              ) as Record<
                string,
                unknown
              >;

            await tx.billOfLadingRevision.create(
              {
                data: {
                  billOfLadingId:
                    document.id,

                  version:
                    document.version,

                  snapshot,

                  reason:
                    "Document issued"
                }
              }
            );

            await tx.auditLog.create({
              data: {
                tenantId:
                  req.tenantId,

                entityType:
                  "BillOfLading",

                entityId:
                  document.id,

                action:
                  "ISSUED",

                data: {
                  blNumber:
                    document.blNumber,

                  version:
                    document.version,

                  documentHash:
                    hash
                }
              }
            });

            return updated;
          }
        );

      ok(
        res,
        issued
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Bill of Lading must be approved before issue."
      ) {
        res.status(409).json({
          success: false,
          data: null,
          error: {
            code:
              "BL_NOT_APPROVED",
            message:
              error.message
          },
          timestamp:
            new Date().toISOString()
        });

        return;
      }

      next(error);
    }
  }
);
