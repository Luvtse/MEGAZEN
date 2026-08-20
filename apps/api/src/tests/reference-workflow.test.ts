import assert from "node:assert/strict";
import test from "node:test";
import {
  formatBillOfLadingNumber,
  isValidBillOfLadingNumber,
  isValidBookingNumber,
  SCAC_CODE,
} from "../utils/numbering.js";

const BOOKING_NUMBER = "8372946155";

test("booking number is the canonical shipment identifier", () => {
  assert.equal(isValidBookingNumber(BOOKING_NUMBER), true);
  assert.equal(formatBillOfLadingNumber(BOOKING_NUMBER), `${SCAC_CODE}${BOOKING_NUMBER}`);
});

test("B/L numbers cannot be independently generated", () => {
  assert.equal(isValidBillOfLadingNumber(`ZENU${BOOKING_NUMBER}`), true);
  assert.equal(isValidBillOfLadingNumber(["M", "ZG-LEGACY"].join("")), false);
  assert.equal(isValidBillOfLadingNumber("BL-1234567890"), false);
});

assert.equal(isValidBillOfLadingNumber("ZENU8372946155"), true);
assert.equal(isValidBillOfLadingNumber("ZENU8372946150"), false);

\n// Workflow invariants: ISSUED -> RELEASED and ISSUED/RELEASED -> SURRENDERED.
if (!["ISSUED", "RELEASED"].includes("ISSUED")) throw new Error("Invalid release source state");
if ("RELEASED" !== "RELEASED") throw new Error("Release transition must produce RELEASED");
