import { Router } from "express";
import { customersRouter } from "./customers.js";
import { containersRouter } from "./containers.js";
import { bookingsRouter } from "./bookings.js";
import { billOfLadingRouter } from "./bill-of-lading.js";
import { billOfLadingPdfRouter } from "./bill-of-lading-pdf.js";
import { referencesRouter } from "./references.js";
import { searchRouter } from "./search.js";

export const apiRouter = Router();

apiRouter.use("/customers", customersRouter);
apiRouter.use("/containers", containersRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/bills-of-lading", billOfLadingRouter);
apiRouter.use("/bills-of-lading", billOfLadingPdfRouter);
apiRouter.use("/references", referencesRouter);
apiRouter.use("/search", searchRouter);
