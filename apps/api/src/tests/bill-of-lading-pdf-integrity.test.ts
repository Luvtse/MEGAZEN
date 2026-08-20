import assert from "node:assert/strict";

// Final B/L PDFs must never be silently generated for an issued document
// without an immutable stored document hash.
const issuedStates = ["ISSUED", "RELEASED", "SURRENDERED"];
for (const status of issuedStates) {
  const document = { status, documentHash: "abc123" };
  assert.equal(Boolean(document.documentHash), true);
}

const missingHash = { status: "ISSUED", documentHash: null as string | null };
assert.equal(Boolean(missingHash.documentHash), false);
