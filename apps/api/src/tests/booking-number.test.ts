import assert from "node:assert/strict";
import {
  calculateBookingCheckDigit,
  createBookingNumber,
  formatBillOfLadingNumber,
  isValidBillOfLadingNumber,
  isValidBookingNumber,
  isValidContainerNumber,
} from "../utils/numbering.js";
import { createEirNumber } from "../utils/eir-number.js";

const generated = new Set<string>();

for (let i = 0; i < 10000; i += 1) {
  const bookingNumber = createBookingNumber();

  assert.match(bookingNumber, /^[1-9][0-9]{9}$/);
  assert.equal(bookingNumber.length, 10);
  assert.equal(isValidBookingNumber(bookingNumber), true);
  assert.equal(
    calculateBookingCheckDigit(bookingNumber.slice(0, 9)),
    bookingNumber[9],
  );

  generated.add(bookingNumber);
}

assert.equal(generated.size, 10000);
assert.equal(formatBillOfLadingNumber("8372946155"), "ZENU8372946155");
assert.equal(isValidBillOfLadingNumber("ZENU8372946155"), true);
assert.equal(isValidBillOfLadingNumber("OLD-123"), false);
assert.equal(isValidContainerNumber("ZENU1234567"), true);
assert.equal(isValidContainerNumber("MSCU1234567"), false);
assert.throws(
  () => formatBillOfLadingNumber("8372946150"),
  /INVALID_BOOKING_NUMBER/,
);

console.log("Booking-number generation and validation tests passed.");

const eir = createEirNumber();
assert.match(eir, /^EIR-ZENU-\d{8}-\d{6}$/);
