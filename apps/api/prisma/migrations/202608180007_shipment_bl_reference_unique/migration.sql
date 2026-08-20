-- Enforce one canonical B/L reference per tenant on Shipment while allowing NULL for shipments not yet issued.
CREATE UNIQUE INDEX "Shipment_tenantId_blNumber_key"
ON "Shipment"("tenantId", "blNumber");
