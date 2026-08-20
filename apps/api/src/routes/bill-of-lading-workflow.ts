import { Request, Response, NextFunction, Router } from "express";

/**
 * Deprecated compatibility router.
 *
 * B/L workflow transitions are implemented exclusively by
 * `bill-of-lading.ts` and mounted at `/api/bills-of-lading`.
 * This file is intentionally retained so existing imports do not break,
 * but it contains no second implementation of approval/release/surrender.
 */
export const billOfLadingWorkflowRouter = Router();

const deprecated = (_req: Request, res: Response, _next: NextFunction): void => {
  res.status(410).json({
    success: false,
    data: null,
    error: {
      code: "BL_WORKFLOW_ROUTE_DEPRECATED",
      message: "Use the canonical /api/bills-of-lading/:id workflow endpoints.",
    },
    timestamp: new Date().toISOString(),
  });
};

billOfLadingWorkflowRouter.use(deprecated);
