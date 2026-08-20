-- Enforce the canonical MEGAZEN shipment/B/L/container reference protocol at the database boundary.

ALTER TABLE "BillOfLading"
  ADD COLUMN IF NOT EXISTS "scac" TEXT NOT NULL DEFAULT 'ZENU';

ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_scac_check" CHECK ("scac" = 'ZENU');

ALTER TABLE "Container"
  ADD CONSTRAINT "Container_containerNumber_format_check"
  CHECK ("containerNumber" ~ '^ZENU[0-9]{7}$');

ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_blNumber_booking_consistency_check"
  CHECK ("blNumber" ~ '^ZENU[1-9][0-9]{9}$');
