import {
  Router
} from "express";

import {
  prisma
} from "../utils/prisma.js";

export const billOfLadingVerificationRouter =
  Router();

billOfLadingVerificationRouter.get(
  "/verify/:blNumber",
  async (
    req,
    res,
    next
  ) => {
    try {
      const document =
        await prisma.billOfLading.findFirst(
          {
            where: {
              blNumber:
                req.params.blNumber
            },

            select: {
              id: true,
              blNumber: true,
              status: true,
              version: true,
              issueDate: true,
              carrierName: true,
              shipperName: true,
              consigneeName: true,
              portOfLoading: true,
              portOfDischarge: true,
              vesselName: true,
              voyageNumber: true,
              documentHash: true
            }
          }
        );

      if (!document) {
        res.status(404).json({
          success: false,
          data: null,
          error: {
            code:
              "DOCUMENT_NOT_FOUND",
            message:
              "Bill of Lading not found."
          },
          timestamp:
            new Date().toISOString()
        });

        return;
      }

      res.json({
        success: true,

        data: {
          valid:
            document.status ===
              "ISSUED" &&
            Boolean(
              document.documentHash
            ),

          document
        },

        error: null,

        timestamp:
          new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);