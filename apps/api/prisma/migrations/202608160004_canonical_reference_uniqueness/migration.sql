-- Canonical shipment reference hardening.
-- Booking numbers are globally unique; therefore their inherited ZENU B/L numbers
-- must also be globally unique.

CREATE UNIQUE INDEX IF NOT EXISTS "BillOfLading_blNumber_key"
  ON "BillOfLading" ("blNumber");

CREATE INDEX IF NOT EXISTS "Booking_tenantId_bookingNumber_idx"
  ON "Booking" ("tenantId", "bookingNumber");

CREATE INDEX IF NOT EXISTS "BillOfLading_tenantId_bookingId_idx"
  ON "BillOfLading" ("tenantId", "bookingId");
