-- MEGAZEN booking-number protocol
-- 10 digits: nine cryptographically/randomly selected digits + one Luhn check digit.
-- PostgreSQL random() is used only for migration/backfill. Runtime generation uses node:crypto randomInt.
-- Existing booking identifiers are replaced once so every booking conforms to the new protocol.

DROP INDEX IF EXISTS "Booking_tenantId_bookingNumber_key";

CREATE TEMP TABLE "_BookingNumberBackfill" (
  booking_id text PRIMARY KEY,
  booking_number text NOT NULL UNIQUE
);

DO $$
DECLARE
  booking_row RECORD;
  payload text;
  candidate text;
  digit integer;
  doubled integer;
  checksum integer;
  check_digit integer;
BEGIN
  FOR booking_row IN SELECT id FROM "Booking" ORDER BY "createdAt", id LOOP
    LOOP
      payload := lpad((floor(random() * 900000000) + 100000000)::bigint::text, 9, '0');
      checksum := 0;

      FOR digit IN 1..9 LOOP
        -- Luhn: double digits from the right, starting with the rightmost payload digit.
        IF ((9 - digit) % 2) = 0 THEN
          doubled := substring(payload FROM digit FOR 1)::integer * 2;
          IF doubled > 9 THEN doubled := doubled - 9; END IF;
          checksum := checksum + doubled;
        ELSE
          checksum := checksum + substring(payload FROM digit FOR 1)::integer;
        END IF;
      END LOOP;

      check_digit := (10 - (checksum % 10)) % 10;
      candidate := payload || check_digit::text;

      BEGIN
        INSERT INTO "_BookingNumberBackfill"(booking_id, booking_number)
        VALUES (booking_row.id::text, candidate);
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- Extremely unlikely; generate another candidate.
      END;
    END LOOP;
  END LOOP;
END $$;

UPDATE "Booking" b
SET "bookingNumber" = m.booking_number
FROM "_BookingNumberBackfill" m
WHERE b.id::text = m.booking_id;

-- B/L numbers are inherited from their booking. Keep existing document versions
-- on the same shipment aligned with the new immutable shipment identifier.
UPDATE "BillOfLading" bl
SET "blNumber" = b."bookingNumber"
FROM "Booking" b
WHERE bl."bookingId" = b.id;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_bookingNumber_key" UNIQUE ("bookingNumber");

CREATE INDEX "Booking_bookingNumber_idx"
  ON "Booking" ("bookingNumber");

ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_tenantId_bookingId_key" UNIQUE ("tenantId", "bookingId");

CREATE INDEX "BillOfLading_blNumber_idx"
  ON "BillOfLading" ("blNumber");

CREATE OR REPLACE FUNCTION megazen_is_valid_booking_number(value text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  i integer;
  digit integer;
  transformed integer;
  checksum integer := 0;
BEGIN
  IF value IS NULL OR value !~ '^[1-9][0-9]{9}$' THEN
    RETURN false;
  END IF;

  FOR i IN 1..9 LOOP
    digit := substring(value FROM i FOR 1)::integer;
    IF ((9 - i) % 2) = 0 THEN
      transformed := digit * 2;
      IF transformed > 9 THEN transformed := transformed - 9; END IF;
      checksum := checksum + transformed;
    ELSE
      checksum := checksum + digit;
    END IF;
  END LOOP;

  RETURN ((10 - (checksum % 10)) % 10) = substring(value FROM 10 FOR 1)::integer;
END;
$fn$;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_bookingNumber_format_check"
  CHECK (megazen_is_valid_booking_number("bookingNumber"));

ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_blNumber_format_check"
  CHECK ("blNumber" ~ '^ZENU[1-9][0-9]{9}$' AND megazen_is_valid_booking_number(substring("blNumber" FROM 5)));

DROP TABLE "_BookingNumberBackfill";
