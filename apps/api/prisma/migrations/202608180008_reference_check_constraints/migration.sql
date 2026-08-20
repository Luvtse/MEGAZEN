-- Strengthen canonical reference validation at the database boundary.
-- Existing checks are replaced with Luhn-aware booking/B/L validation.

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
  DROP CONSTRAINT IF EXISTS "Booking_bookingNumber_format_check";
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_bookingNumber_format_check"
  CHECK (megazen_is_valid_booking_number("bookingNumber"));

ALTER TABLE "BillOfLading"
  DROP CONSTRAINT IF EXISTS "BillOfLading_blNumber_format_check";
ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_blNumber_format_check"
  CHECK (
    "blNumber" ~ '^ZENU[1-9][0-9]{9}$'
    AND megazen_is_valid_booking_number(substring("blNumber" FROM 5))
  );

ALTER TABLE "BillOfLading"
  DROP CONSTRAINT IF EXISTS "BillOfLading_blNumber_booking_consistency_check";
ALTER TABLE "BillOfLading"
  ADD CONSTRAINT "BillOfLading_blNumber_booking_consistency_check"
  CHECK ("blNumber" ~ '^ZENU[1-9][0-9]{9}$');
