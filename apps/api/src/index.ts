import {startServer} from "./server.js"; startServer();
import {
  billOfLadingPdfRouter
} from "./routes/bill-of-lading-pdf.js";

app.use(
  "/api/bills-of-lading",
  billOfLadingPdfRouter
);

app.use(
  "/api/bills-of-lading",
  billOfLadingVerificationRouter
);
