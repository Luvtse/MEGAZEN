import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { config } from "./config.js";
import { logger } from "./lib/logger.js";

import { tenantMiddleware } from "./middleware/tenant.js";
import { errorHandler } from "./middleware/error-handler.js";

import { healthRouter } from "./routes/health.js";
import { apiRouter } from "./routes/index.js";
import {
  publicVerificationRouter
} from "./routes/public-verification.js";

export const createApp = () => {
  const app =
    express();

  app.disable(
    "x-powered-by"
  );

  app.use(
    helmet()
  );

  app.use(
    cors({
      origin:
        config.WEB_URL,
      credentials:
        true
    })
  );

  app.use(
    express.json({
      limit: "2mb"
    })
  );

  app.use(
    pinoHttp({
      logger
    })
  );

  app.use(
    "/health",
    healthRouter
  );

  /*
   * Public document verification.
   *
   * This intentionally sits outside
   * tenantMiddleware because an external
   * recipient must be able to verify a
   * document using the QR code.
   */
  app.use(
    "/public/verify",
    publicVerificationRouter
  );

  /*
   * All operational MEGAZEN APIs remain
   * tenant scoped.
   */
  app.use(
    "/api",
    tenantMiddleware,
    apiRouter
  );

  app.use(
    (_req, res) =>
      res.status(404).json({
        success: false,
        data: null,
        error: {
          code:
            "NOT_FOUND",
          message:
            "Route not found"
        },
        timestamp:
          new Date().toISOString()
      })
  );

  app.use(
    errorHandler
  );

  return app;
};
