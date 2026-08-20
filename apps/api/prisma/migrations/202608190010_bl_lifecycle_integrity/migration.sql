-- Enforce issuance metadata at the database boundary.
-- Draft/review/approved documents must not have an issuance date.
-- Issued/released/surrendered/amended documents must have an issuance date.

ALTER TABLE "BillOfLading"
  DROP CONSTRAINT IF EXISTS "BillOfLading_issueDate_status_check";

ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_issueDate_status_check"
  CHECK (
    ("status" IN ('DRAFT', 'REVIEW', 'APPROVED') AND "issueDate" IS NULL)
    OR
    ("status" IN ('ISSUED', 'RELEASED', 'SURRENDERED', 'AMENDED') AND "issueDate" IS NOT NULL)
    OR
    "status" = 'CANCELLED'
  );

ALTER TABLE "BillOfLading"
  DROP CONSTRAINT IF EXISTS "BillOfLading_documentHash_status_check";

ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_documentHash_status_check"
  CHECK (
    ("status" IN ('DRAFT', 'REVIEW', 'APPROVED') AND "documentHash" IS NULL)
    OR
    ("status" IN ('ISSUED', 'RELEASED', 'SURRENDERED', 'AMENDED') AND "documentHash" IS NOT NULL)
    OR
    "status" = 'CANCELLED'
  );
