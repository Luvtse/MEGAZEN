import assert from "node:assert/strict";

const issued = { status: "ISSUED", issueDate: new Date("2026-08-19T10:00:00.000Z"), documentHash: "abc" };
const amendedForReview = { ...issued, status: "REVIEW", issueDate: null, documentHash: null };

assert.equal(amendedForReview.status, "REVIEW");
assert.equal(amendedForReview.issueDate, null);
assert.equal(amendedForReview.documentHash, null);
