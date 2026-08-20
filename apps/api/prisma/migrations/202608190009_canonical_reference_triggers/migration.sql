-- Enforce the canonical Booking -> Shipment -> Bill of Lading reference chain
-- at the PostgreSQL boundary. Application validation remains the first line of
-- defence; these triggers protect the invariant when data is written directly
-- through SQL, scripts, or future services.

CREATE OR REPLACE FUNCTION megazen_enforce_bill_of_lading_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  booking_number text;
  booking_customer_id text;
  booking_tenant_id text;
  shipment_booking_id text;
  shipment_tenant_id text;
BEGIN
  IF NEW.booking_id IS NULL THEN
    RAISE EXCEPTION 'Bill of Lading must reference a booking';
  END IF;

  SELECT b."bookingNumber", b."customerId", b."tenantId"
    INTO booking_number, booking_customer_id, booking_tenant_id
    FROM "Booking" b
   WHERE b.id = NEW.booking_id;

  IF booking_number IS NULL THEN
    RAISE EXCEPTION 'Bill of Lading booking does not exist';
  END IF;

  IF booking_tenant_id <> NEW."tenantId" THEN
    RAISE EXCEPTION 'Bill of Lading booking tenant does not match document tenant';
  END IF;

  IF NEW."blNumber" <> 'ZENU' || booking_number THEN
    RAISE EXCEPTION 'Bill of Lading number must inherit from the booking number';
  END IF;

  IF NEW."customerId" IS NOT NULL AND NEW."customerId" <> booking_customer_id THEN
    RAISE EXCEPTION 'Bill of Lading customer must match its booking customer';
  END IF;

  IF NEW."shipmentId" IS NOT NULL THEN
    SELECT s."bookingId", s."tenantId"
      INTO shipment_booking_id, shipment_tenant_id
      FROM "Shipment" s
     WHERE s.id = NEW."shipmentId";

    IF shipment_booking_id IS NULL THEN
      RAISE EXCEPTION 'Bill of Lading shipment does not exist';
    END IF;

    IF shipment_tenant_id <> NEW."tenantId" OR shipment_booking_id <> NEW.booking_id THEN
      RAISE EXCEPTION 'Bill of Lading shipment must belong to its booking and tenant';
    END IF;

    IF EXISTS (
      SELECT 1
        FROM "Shipment" s
       WHERE s.id = NEW."shipmentId"
         AND s."blNumber" IS NOT NULL
         AND s."blNumber" <> NEW."blNumber"
    ) THEN
      RAISE EXCEPTION 'Shipment B/L number conflicts with booking-derived B/L number';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS "BillOfLading_canonical_reference_trigger" ON "BillOfLading";
CREATE TRIGGER "BillOfLading_canonical_reference_trigger"
BEFORE INSERT OR UPDATE OF "bookingId", "customerId", "shipmentId", "blNumber", "tenantId"
ON "BillOfLading"
FOR EACH ROW
EXECUTE FUNCTION megazen_enforce_bill_of_lading_reference();

CREATE OR REPLACE FUNCTION megazen_enforce_shipment_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  booking_number text;
  booking_tenant_id text;
BEGIN
  IF NEW.booking_id IS NULL THEN
    RAISE EXCEPTION 'Shipment must reference a booking';
  END IF;

  IF NEW."blNumber" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT b."bookingNumber", b."tenantId"
    INTO booking_number, booking_tenant_id
    FROM "Booking" b
   WHERE b.id = NEW."bookingId";

  IF booking_number IS NULL THEN
    RAISE EXCEPTION 'Shipment booking does not exist';
  END IF;

  IF booking_tenant_id <> NEW."tenantId" THEN
    RAISE EXCEPTION 'Shipment booking tenant does not match shipment tenant';
  END IF;

  IF NEW."blNumber" <> 'ZENU' || booking_number THEN
    RAISE EXCEPTION 'Shipment B/L number must inherit from its booking number';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS "Shipment_canonical_reference_trigger" ON "Shipment";
CREATE TRIGGER "Shipment_canonical_reference_trigger"
BEFORE INSERT OR UPDATE OF "bookingId", "blNumber", "tenantId"
ON "Shipment"
FOR EACH ROW
EXECUTE FUNCTION megazen_enforce_shipment_reference();
