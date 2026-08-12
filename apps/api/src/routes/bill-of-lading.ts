import { Router } from "express";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import {
  createDocumentNumber,
  createVerificationCode
} from "../utils/numbering.js";
import {
  amendBillOfLadingSchema
} from "../validators/bill-of-lading.js";
import {
  calculateBillOfLadingChanges
} from "../utils/bill-of-lading-diff.js";

const MAX_BILL_OF_LADING_AMENDMENTS = 3;

const uuidSchema = z.string().uuid();

const billOfLadingSchema = z.object({
  bookingId: uuidSchema,
  customerId: uuidSchema,
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
  numberOfOriginals: z.number().int().min(1).max(9).default(3),
  freightTerms: z.string().trim().optional(),
  marksAndNumbers: z.string().trim().optional(),
  description: z.string().trim().min(2),
  grossWeight: z.number().nonnegative().optional(),
  measurement: z.number().nonnegative().optional(),
  packageCount: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  declaredValue: z.number().nonnegative().optional(),
  termsText: z.string().trim().optional(),
  containerIds: z.array(uuidSchema).default([])
});

const updateBillOfLadingSchema = billOfLadingSchema
  .omit({
    bookingId: true,
    customerId: true,
    containerIds: true
  })
  .partial();

const containerSchema = z.object({
  containerId: uuidSchema,
  sealNumber: z.string().trim().max(50).optional(),
  packageCount: z.number().int().nonnegative().optional(),
  packageType: z.string().trim().max(100).optional(),
  grossWeight: z.number().nonnegative().optional(),
  measurement: z.number().nonnegative().optional()
});

const updateContainerSchema = containerSchema.omit({
  containerId: true
}).partial();

const revisionSchema = z.object({
  reason: z.string().trim().min(3).max(500)
});

export const billOfLadingRouter = Router();

/**
 * GET /api/bills-of-lading
 */
billOfLadingRouter.get("/", async (req, res, next) => {
  try {
    const documents = await prisma.billOfLading.findMany({
      where: {
        tenantId: req.tenantId
      },
      include: {
        customer: true,
        booking: true,
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
});

/**
 * POST /api/bills-of-lading
 */
billOfLadingRouter.post("/", async (req, res, next) => {
  try {
    const input = billOfLadingSchema.parse(req.body);

    const [booking, customer] = await Promise.all([
      prisma.booking.findFirstOrThrow({
        where: {
          id: input.bookingId,
          tenantId: req.tenantId
        }
      }),
      prisma.customer.findFirstOrThrow({
        where: {
          id: input.customerId,
          tenantId: req.tenantId
        }
      })
    ]);

    const document = await prisma.$transaction(async (tx) => {
      if (input.containerIds.length > 0) {
        const containers = await tx.container.findMany({
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

        if (containers.length !== input.containerIds.length) {
          throw new Error("ONE_OR_MORE_CONTAINERS_NOT_FOUND");
        }
      }

      const created = await tx.billOfLading.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          tenantId: req.tenantId,

          blNumber: createDocumentNumber("BL"),

          documentType: input.documentType,
          placeOfReceipt: input.placeOfReceipt,
          portOfLoading: input.portOfLoading,
          portOfDischarge: input.portOfDischarge,
          placeOfDelivery: input.placeOfDelivery,

          shipperName: input.shipperName,
          shipperAddress: input.shipperAddress,

          consigneeName: input.consigneeName,
          consigneeAddress: input.consigneeAddress,

          notifyPartyName: input.notifyPartyName,
          notifyPartyAddress: input.notifyPartyAddress,

          vesselName: input.vesselName,
          voyageNumber: input.voyageNumber,

          issuePlace: input.issuePlace,
          issueDate: new Date(),

          numberOfOriginals: input.numberOfOriginals,
          freightTerms: input.freightTerms,

          marksAndNumbers: input.marksAndNumbers,
          description: input.description,

          grossWeight: input.grossWeight,
          measurement: input.measurement,
          packageCount: input.packageCount,

          currency: input.currency,
          declaredValue: input.declaredValue,

          termsText: input.termsText,

          verificationCode: createVerificationCode()
        }
      });

      if (input.containerIds.length > 0) {
        await tx.billOfLadingContainer.createMany({
          data: input.containerIds.map((containerId) => ({
            billOfLadingId: created.id,
            containerId
          }))
        });
      }

      await tx.billOfLadingRevision.create({
        data: {
          billOfLadingId: created.id,
          version: 1,
          snapshot: JSON.parse(JSON.stringify(created)),
          reason: "Initial draft"
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: created.id,
          action: "CREATED",
          data: {
            blNumber: created.blNumber,
            version: created.version
          }
        }
      });

      return tx.billOfLading.findUniqueOrThrow({
        where: {
          id: created.id
        },
        include: {
          customer: true,
          booking: true,
          containers: {
            include: {
              container: true
            }
          }
        }
      });
    });

    ok(res, document, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bills-of-lading/:id
 */
billOfLadingRouter.get("/:id", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.findFirstOrThrow({
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
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/bills-of-lading/:id
 *
 * Only DRAFT documents can be directly edited.
 */
billOfLadingRouter.put("/:id", async (req, res, next) => {
  try {
    const input = updateBillOfLadingSchema.parse(req.body);

    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.billOfLading.findFirstOrThrow({
        where: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      });

      if (existing.status !== "DRAFT") {
        throw new Error("BL_NOT_EDITABLE");
      }

      const updated = await tx.billOfLading.update({
        where: {
          id: existing.id
        },
        data: {
          ...input
        }
      });

      await tx.billOfLadingRevision.update({
        where: {
          billOfLadingId_version: {
            billOfLadingId: existing.id,
            version: existing.version
          }
        },
        data: {
          snapshot: JSON.parse(JSON.stringify(updated))
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: existing.id,
          action: "UPDATED",
          data: {
            version: existing.version
          }
        }
      });

      return updated;
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/submit
 */
billOfLadingRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.billOfLading.findFirstOrThrow({
        where: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      });

      if (existing.status !== "DRAFT") {
        throw new Error("BL_NOT_DRAFT");
      }

      const nextVersion = existing.version + 1;

      const updated = await tx.billOfLading.update({
        where: {
          id: existing.id
        },
        data: {
          status: "PENDING_APPROVAL",
          version: nextVersion
        }
      });

      await tx.billOfLadingRevision.create({
        data: {
          billOfLadingId: existing.id,
          version: nextVersion,
          snapshot: JSON.parse(JSON.stringify(updated)),
          reason: "Submitted for approval"
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: existing.id,
          action: "SUBMITTED",
          data: {
            version: nextVersion
          }
        }
      });

      return updated;
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/approve
 */
billOfLadingRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const comment =
      typeof req.body?.comment === "string"
        ? req.body.comment.trim()
        : null;

    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.billOfLading.findFirstOrThrow({
        where: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      });

      if (existing.status !== "PENDING_APPROVAL") {
        throw new Error("BL_NOT_PENDING_APPROVAL");
      }

      const updated = await tx.billOfLading.update({
        where: {
          id: existing.id
        },
        data: {
          status: "APPROVED"
        }
      });

      await tx.approval.create({
        data: {
          entityType: "BillOfLading",
          entityId: existing.id,
          status: "APPROVED",
          comment
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: existing.id,
          action: "APPROVED",
          data: {
            comment
          }
        }
      });

      return updated;
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/issue
 */
billOfLadingRouter.post("/:id/issue", async (req, res, next) => {
  try {
    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.billOfLading.findFirstOrThrow({
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
      });

      if (existing.status !== "APPROVED") {
        throw new Error("BL_NOT_APPROVED");
      }

      const payload = {
        id: existing.id,
        blNumber: existing.blNumber,
        version: existing.version,
        verificationCode: existing.verificationCode,
        issueDate: existing.issueDate.toISOString(),
        shipperName: existing.shipperName,
        consigneeName: existing.consigneeName,
        portOfLoading: existing.portOfLoading,
        portOfDischarge: existing.portOfDischarge,
        description: existing.description,
        containers: existing.containers
      };

      const hash = createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");

      const issued = await tx.billOfLading.update({
        where: {
          id: existing.id
        },
        data: {
          status: "ISSUED",
          documentHash: hash
        },
        include: {
          containers: {
            include: {
              container: true
            }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: existing.id,
          action: "ISSUED",
          data: {
            version: existing.version,
            documentHash: hash
          }
        }
      });

      return issued;
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/release
 */
billOfLadingRouter.post("/:id/release", async (req, res, next) => {
  try {
    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.billOfLading.findFirstOrThrow({
        where: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      });

      if (existing.status !== "ISSUED") {
        throw new Error("BL_NOT_ISSUED");
      }

      const updated = await tx.billOfLading.update({
        where: {
          id: existing.id
        },
        data: {
          status: "RELEASED"
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: existing.id,
          action: "RELEASED",
          data: {
            version: existing.version
          }
        }
      });

      return updated;
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/surrender
 */
billOfLadingRouter.post("/:id/surrender", async (req, res, next) => {
  try {
    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.billOfLading.findFirstOrThrow({
        where: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      });

      if (existing.status !== "ISSUED") {
        throw new Error("BL_NOT_ISSUED");
      }

      const updated = await tx.billOfLading.update({
        where: {
          id: existing.id
        },
        data: {
          status: "SURRENDERED"
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: existing.id,
          action: "SURRENDERED",
          data: {
            version: existing.version
          }
        }
      });

      return updated;
    });

    ok(res, document);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/amend
 *
 * Creates a new controlled revision and returns the B/L to DRAFT.
 */
billOfLadingRouter.post("/:id/amend", async (req, res, next) => {
  try {
    const input = amendBillOfLadingSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.billOfLading.findFirstOrThrow({
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
      });

      /*
       * A draft that has never been issued
       * can be edited normally.
       *
       * An issued document requires a
       * controlled amendment.
       */
      const amendableStatuses = [
        "ISSUED",
        "SURRENDERED",
        "RELEASED"
      ];

      if (!amendableStatuses.includes(current.status)) {
        throw new Error(
          "Only an issued, surrendered, or released Bill of Lading can be amended through the amendment workflow."
        );
      }

      const amendmentCount = await tx.billOfLadingRevision.count({
        where: {
          billOfLadingId: current.id,
          reason: {
            startsWith: "Amendment:"
          }
        }
      });

      if (amendmentCount >= MAX_BILL_OF_LADING_AMENDMENTS) {
        throw new Error(
          "The maximum number of Bill of Lading amendments has been reached."
        );
      }

      const previous = JSON.parse(
        JSON.stringify(current)
      ) as Record<string, unknown>;

      const nextVersion = current.version + 1;

      const updated = await tx.billOfLading.update({
        where: {
          id: current.id
        },
        data: {
          placeOfReceipt: input.placeOfReceipt,
          portOfLoading: input.portOfLoading,
          portOfDischarge: input.portOfDischarge,
          placeOfDelivery: input.placeOfDelivery,
          shipperName: input.shipperName,
          shipperAddress: input.shipperAddress,
          consigneeName: input.consigneeName,
          consigneeAddress: input.consigneeAddress,
          notifyPartyName: input.notifyPartyName,
          notifyPartyAddress: input.notifyPartyAddress,
          vesselName: input.vesselName,
          voyageNumber: input.voyageNumber,
          freightTerms: input.freightTerms,
          marksAndNumbers: input.marksAndNumbers,
          description: input.description,
          grossWeight: input.grossWeight,
          measurement: input.measurement,
          packageCount: input.packageCount,
          currency: input.currency,
          declaredValue: input.declaredValue,
          termsText: input.termsText,
          version: nextVersion,
          status: "DRAFT",
          documentHash: null
        }
      });

      const after = JSON.parse(
        JSON.stringify(updated)
      ) as Record<string, unknown>;

      const changes = calculateBillOfLadingChanges(previous, after);

      if (changes.length === 0) {
        throw new Error(
          "The amendment does not change any Bill of Lading field."
        );
      }

      await tx.billOfLadingRevision.create({
        data: {
          billOfLadingId: current.id,
          version: nextVersion,
          snapshot: after,
          reason: `Amendment: ${input.reason}`
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: current.id,
          action: "AMENDED",
          data: {
            previousVersion: current.version,
            newVersion: nextVersion,
            reason: input.reason,
            changes
          }
        }
      });

      return {
        document: updated,
        previousVersion: current.version,
        newVersion: nextVersion,
        changes
      };
    });

    res.status(201).json({
      success: true,
      data: result,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Only an issued") ||
       error.message.startsWith("The amendment does not") ||
       error.message.startsWith("The maximum number"))
    ) {
      const errorCode = error.message.startsWith("The maximum number")
        ? "BL_AMENDMENT_LIMIT_REACHED"
        : "BL_AMENDMENT_REJECTED";

      res.status(409).json({
        success: false,
        data: null,
        error: {
          code: errorCode,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });

      return;
    }

    next(error);
  }
});

/**
 * GET /api/bills-of-lading/:id/revisions
 */
billOfLadingRouter.get("/:id/revisions", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.findFirstOrThrow({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      },
      select: {
        id: true,
        blNumber: true
      }
    });

    const revisions = await prisma.billOfLadingRevision.findMany({
      where: {
        billOfLadingId: document.id
      },
      orderBy: {
        version: "desc"
      },
      select: {
        id: true,
        version: true,
        reason: true,
        contentHash: true,
        changedBy: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        blNumber: document.blNumber,
        revisions
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bills-of-lading/:id/revisions/:version
 */
billOfLadingRouter.get("/:id/revisions/:version", async (req, res, next) => {
  try {
    const version = Number(req.params.version);

    if (!Number.isInteger(version) || version < 1) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "INVALID_VERSION",
          message: "B/L version must be a positive integer."
        },
        timestamp: new Date().toISOString()
      });

      return;
    }

    const revision = await prisma.billOfLadingRevision.findFirst({
      where: {
        version,
        billOfLading: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      }
    });

    if (!revision) {
      res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "REVISION_NOT_FOUND",
          message: "B/L revision was not found."
        },
        timestamp: new Date().toISOString()
      });

      return;
    }

    res.json({
      success: true,
      data: revision,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bills-of-lading/:id/containers
 */
billOfLadingRouter.get("/:id/containers", async (req, res, next) => {
  try {
    const document = await prisma.billOfLading.findFirstOrThrow({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      }
    });

    const containers = await prisma.billOfLadingContainer.findMany({
      where: {
        billOfLadingId: document.id
      },
      include: {
        container: true
      },
      orderBy: {
        id: "asc"
      }
    });

    ok(res, containers);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills-of-lading/:id/containers
 */
billOfLadingRouter.post("/:id/containers", async (req, res, next) => {
  try {
    const input = containerSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.billOfLading.findFirstOrThrow({
        where: {
          id: req.params.id,
          tenantId: req.tenantId
        }
      });

      if (document.status !== "DRAFT") {
        throw new Error("BL_CONTAINERS_LOCKED");
      }

      const container = await tx.container.findFirstOrThrow({
        where: {
          id: input.containerId,
          tenantId: req.tenantId
        }
      });

      const relation = await tx.billOfLadingContainer.create({
        data: {
          billOfLadingId: document.id,
          containerId: container.id,
          sealNumber: input.sealNumber,
          packageCount: input.packageCount,
          packageType: input.packageType,
          grossWeight: input.grossWeight,
          measurement: input.measurement
        },
        include: {
          container: true
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: req.tenantId,
          entityType: "BillOfLading",
          entityId: document.id,
          action: "CONTAINER_ATTACHED",
          data: {
            containerId: container.id,
            sealNumber: input.sealNumber ?? null
          }
        }
      });

      return relation;
    });

    ok(res, result, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/bills-of-lading/:id/containers/:containerRelationId
 */
billOfLadingRouter.put(
  "/:id/containers/:containerRelationId",
  async (req, res, next) => {
    try {
      const input = updateContainerSchema.parse(req.body);

      const result = await prisma.$transaction(async (tx) => {
        const document = await tx.billOfLading.findFirstOrThrow({
          where: {
            id: req.params.id,
            tenantId: req.tenantId
          }
        });

        if (document.status !== "DRAFT") {
          throw new Error("BL_CONTAINERS_LOCKED");
        }

        const relation = await tx.billOfLadingContainer.update({
          where: {
            id: req.params.containerRelationId,
            billOfLadingId: document.id
          },
          data: input,
          include: {
            container: true
          }
        });

        await tx.auditLog.create({
          data: {
            tenantId: req.tenantId,
            entityType: "BillOfLading",
            entityId: document.id,
            action: "CONTAINER_UPDATED",
            data: {
              relationId: relation.id
            }
          }
        });

        return relation;
      });

      ok(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/bills-of-lading/:id/containers/:containerRelationId
 */
billOfLadingRouter.delete(
  "/:id/containers/:containerRelationId",
  async (req, res, next) => {
    try {
      await prisma.$transaction(async (tx) => {
        const document = await tx.billOfLading.findFirstOrThrow({
          where: {
            id: req.params.id,
            tenantId: req.tenantId
          }
        });

        if (document.status !== "DRAFT") {
          throw new Error("BL_CONTAINERS_LOCKED");
        }

        await tx.billOfLadingContainer.delete({
          where: {
            id: req.params.containerRelationId,
            billOfLadingId: document.id
          }
        });

        await tx.auditLog.create({
          data: {
            tenantId: req.tenantId,
            entityType: "BillOfLading",
            entityId: document.id,
            action: "CONTAINER_DETACHED",
            data: {
              relationId: req.params.containerRelationId
            }
          }
        });
      });

      ok(res, {
        deleted: true
      });
    } catch (error) {
      next(error);
    }
  }
);
