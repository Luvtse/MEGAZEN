import assert from "node:assert/strict";
import {
  createBookingNumber,
  formatBillOfLadingNumber,
  isValidBillOfLadingNumber,
  isValidBookingNumber,
  isValidContainerNumber,
} from "../utils/numbering.js";

const bookingNumber = createBookingNumber();

assert.equal(bookingNumber.length, 10);
assert.equal(isValidBookingNumber(bookingNumber), true);

const blNumber = formatBillOfLadingNumber(bookingNumber);
assert.equal(blNumber, `ZENU${bookingNumber}`);
assert.equal(isValidBillOfLadingNumber(blNumber), true);

assert.equal(isValidBillOfLadingNumber(`ZENU${bookingNumber.slice(0, 9)}${bookingNumber[9] === "0" ? "1" : "0"}`), false);
assert.equal(isValidContainerNumber("ZENU1234567"), true);
assert.equal(isValidContainerNumber("MSCU1234567"), false);

console.log("Reference invariants passed.");
