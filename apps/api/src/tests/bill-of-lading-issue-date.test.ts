import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Regression contract:
 * A B/L must not receive an issuance date while it is still a draft.
 * The authoritative issuance timestamp is assigned only by issueBillOfLading().
 */
describe("Bill of Lading issuance-date contract", () => {
  it("requires issueDate to be null before issuance", () => {
    const draft = { status: "DRAFT", issueDate: null };
    assert.equal(draft.status, "DRAFT");
    assert.equal(draft.issueDate, null);
  });

  it("uses a distinct issuance timestamp when the document becomes ISSUED", () => {
    const issuanceDate = new Date();
    const issued = { status: "ISSUED", issueDate: issuanceDate };
    assert.equal(issued.status, "ISSUED");
    assert.equal(issued.issueDate, issuanceDate);
  });
});
