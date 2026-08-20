CREATE INDEX IF NOT EXISTS "Booking_tenantId_bookingDate_idx"
ON "Booking" ("tenantId", "bookingDate");

CREATE INDEX IF NOT EXISTS "Shipment_tenantId_blNumber_idx"
ON "Shipment" ("tenantId", "blNumber");

CREATE INDEX IF NOT EXISTS "Customer_tenantId_name_idx"
ON "Customer" ("tenantId", "name");

CREATE INDEX IF NOT EXISTS "Container_tenantId_updatedAt_idx"
ON "Container" ("tenantId", "updatedAt");
