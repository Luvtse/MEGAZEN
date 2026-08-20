-- Preserve the actual issuance timestamp for each immutable B/L version.
-- The parent BillOfLading.issueDate remains the current version's issuance date.
ALTER TABLE "BillOfLadingVersion"
  ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3);
