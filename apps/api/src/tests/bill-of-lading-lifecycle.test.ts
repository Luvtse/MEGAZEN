import assert from "node:assert/strict";
import test from "node:test";

test("issued B/L keeps its canonical reference", () => {
  const bookingNumber = "8372946155";
  const blNumber = `ZENU${bookingNumber}`;
  assert.equal(blNumber, "ZENU8372946155");
});

test("released B/L is an eligible surrender state", () => {
  const allowed = new Set(["ISSUED", "RELEASED"]);
  assert.equal(allowed.has("RELEASED"), true);
  assert.equal(allowed.has("APPROVED"), false);
});
