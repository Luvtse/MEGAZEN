import crypto from "node:crypto";

import {
  BillOfLadingStatus,
  Prisma
} from "@prisma/client";

import {
  prisma
} from "../utils/prisma.js";

import {
  generateBillOfLadingNumber
} from "../utils/bl-number.js";

import {
  createVerificationToken
} from "../utils/verification-token.js";

import {
  CreateBillOfLadingInput,
  AmendBillOfLadingInput
} from "../validators/bill-of-lading.js";

type ServiceContext = {
  tenantId: string;
  userId?: string;
};

function decimal(
  value: number | undefined
): Prisma.Decimal | undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return new Prisma.Decimal(
    value
  );
}

export async function createBillOfLading(
  context: ServiceContext,
  input: CreateBillOfLadingInput
) {
  return prisma.$transaction(
    async (transaction) => {
      const containers =
        await transaction.container.findMany(
          {
            where: {
              id: {
                in:
                  input.containerIds
              },

              tenantId:
                context.tenantId
            }
          }
        );

      if (
        containers.length !==
        input.containerIds.length
      ) {
        throw new Error(
          "One or more containers do not belong to the tenant."
        );
      }

      const blNumber =
        generateBillOfLadingNumber();

      const verificationToken =
        createVerificationToken();

      const bill =
        await transaction.billOfLading.create(
          {
            data: {
              blNumber,

              version: 1,

              status:
                BillOfLadingStatus.DRAFT,

              copyType:
                "ORIGINAL",

              bookingId:
                input.bookingId,

              shipmentId:
                input.shipmentId,

              carrierName:
                input.carrierName,

              carrierAddress:
                input.carrierAddress,

              agentName:
                input.agentName,

              agentAddress:
                input.agentAddress,

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

              placeOfReceipt:
                input.placeOfReceipt,

              portOfLoading:
                input.portOfLoading,

              portOfDischarge:
                input.portOfDischarge,

              placeOfDelivery:
                input.placeOfDelivery,

              vesselName:
                input.vesselName,

              voyageNumber:
                input.voyageNumber,

              freightTerms:
                input.freightTerms,

              placeOfIssue:
                input.placeOfIssue,

              issueDate:
                input.issueDate ??
                new Date(),

              totalPackages:
                input.totalPackages,

              totalGrossWeight:
                decimal(
                  input.totalGrossWeight
                ),

              totalMeasurement:
                decimal(
                  input.totalMeasurement
                ),

              currency:
                input.currency,

              declaredValue:
                decimal(
                  input.declaredValue
                ),

              termsText:
                input.termsText,

              verificationToken,

              tenantId:
                context.tenantId,

              createdById:
                context.userId,

              containers: {
                create:
                  containers.map(
                    (container) => ({
                      containerId:
                        container.id,

                      containerNumber:
                        container.containerNumber,

                      sealNumber:
                        null,

                      containerType:
                        container.type,

                      packageCount:
                        null,

                      grossWeight:
                        null,

                      measurement:
                        null,

                      marksAndNumbers:
                        null,

                      description:
                        null
                    })
                  )
              }
            },

            include: {
              containers: true
            }
          }
        );

      await transaction.billOfLadingVersion.create(
        {
          data: {
            billOfLadingId:
              bill.id,

            version: 1,

            status:
              "DRAFT",

            createdById:
              context.userId
          }
        }
      );

      await transaction.eventLog.create(
        {
          data: {
            entityType:
              "BILL_OF_LADING",

            entityId:
              bill.id,

            action:
              "CREATED",

            userId:
              context.userId,

            data: {
              blNumber,
              version: 1
            },

            tenantId:
              context.tenantId
          }
        }
      );

      return bill;
    }
  );
}

export async function getBillOfLading(
  context: ServiceContext,
  id: string
) {
  return prisma.billOfLading.findFirstOrThrow(
    {
      where: {
        id,
        tenantId:
          context.tenantId
      },

      include: {
        containers: {
          include: {
            container: true
          }
        },

        booking: true,

        shipment: true,

        versions: {
          orderBy: {
            version: "desc"
          }
        }
      }
    }
  );
}

export async function listBillOfLadings(
  context: ServiceContext
) {
  return prisma.billOfLading.findMany(
    {
      where: {
        tenantId:
          context.tenantId
      },

      include: {
        booking: true,

        shipment: true,

        containers: true
      },

      orderBy: {
        createdAt: "desc"
      }
    }
  );
}

export async function amendBillOfLading(
  context: ServiceContext,
  id: string,
  input: AmendBillOfLadingInput
) {
  return prisma.$transaction(
    async (transaction) => {
      const existing =
        await transaction.billOfLading.findFirstOrThrow(
          {
            where: {
              id,
              tenantId:
                context.tenantId
            },

            include: {
              containers: true
            }
          }
        );

      if (
        existing.status !==
          BillOfLadingStatus.ISSUED &&
        existing.status !==
          BillOfLadingStatus.AMENDED
      ) {
        throw new Error(
          "Only an issued Bill of Lading can be amended."
        );
      }

      const nextVersion =
        existing.version + 1;

      const nextData: Prisma.BillOfLadingUpdateInput =
        {
          version:
            nextVersion,

          status:
            BillOfLadingStatus.AMENDED,

          carrierName:
            input.carrierName ??
            existing.carrierName,

          shipperName:
            input.shipperName ??
            existing.shipperName,

          shipperAddress:
            input.shipperAddress ??
            existing.shipperAddress,

          consigneeName:
            input.consigneeName ??
            existing.consigneeName,

          consigneeAddress:
            input.consigneeAddress ??
            existing.consigneeAddress,

          notifyPartyName:
            input.notifyPartyName ??
            existing.notifyPartyName,

          notifyPartyAddress:
            input.notifyPartyAddress ??
            existing.notifyPartyAddress,

          portOfLoading:
            input.portOfLoading ??
            existing.portOfLoading,

          portOfDischarge:
            input.portOfDischarge ??
            existing.portOfDischarge,

          vesselName:
            input.vesselName ??
            existing.vesselName,

          voyageNumber:
            input.voyageNumber ??
            existing.voyageNumber,

          freightTerms:
            input.freightTerms ??
            existing.freightTerms,

          totalPackages:
            input.totalPackages ??
            existing.totalPackages,

          totalGrossWeight:
            input.totalGrossWeight !==
            undefined
              ? decimal(
                  input.totalGrossWeight
                )
              : existing.totalGrossWeight,

          totalMeasurement:
            input.totalMeasurement !==
            undefined
              ? decimal(
                  input.totalMeasurement
                )
              : existing.totalMeasurement,

          currency:
            input.currency ??
            existing.currency,

          declaredValue:
            input.declaredValue !==
            undefined
              ? decimal(
                  input.declaredValue
                )
              : existing.declaredValue,

          termsText:
            input.termsText ??
            existing.termsText,

          verificationToken:
            createVerificationToken(),

          documentHash:
            null,

          pdfStorageKey:
            null,

          containers: input.containerIds
            ? {
                deleteMany: {},

                create:
                  (
                    await transaction.container.findMany(
                      {
                        where: {
                          id: {
                            in:
                              input.containerIds
                          },

                          tenantId:
                            context.tenantId
                        }
                      }
                    )
                  ).map(
                    (container) => ({
                      containerId:
                        container.id,

                      containerNumber:
                        container.containerNumber,

                      containerType:
                        container.type
                    })
                  )
              }
            : undefined
        };

      const updated =
        await transaction.billOfLading.update(
          {
            where: {
              id:
                existing.id
            },

            data:
              nextData,

            include: {
              containers: true
            }
          }
        );

      await transaction.billOfLadingVersion.create(
        {
          data: {
            billOfLadingId:
              existing.id,

            version:
              nextVersion,

            status:
              "AMENDED",

            reason:
              input.reason,

            createdById:
              context.userId
          }
        }
      );

      await transaction.eventLog.create(
        {
          data: {
            entityType:
              "BILL_OF_LADING",

            entityId:
              existing.id,

            action:
              "AMENDED",

            userId:
              context.userId,

            data: {
              previousVersion:
                existing.version,

              newVersion:
                nextVersion,

              reason:
                input.reason
            },

            tenantId:
              context.tenantId
          }
        }
      );

      return updated;
    }
  );
}

export async function calculateDocumentHash(
  pdf: Buffer
): Promise<string> {
  return crypto
    .createHash("sha256")
    .update(pdf)
    .digest("hex");
}
