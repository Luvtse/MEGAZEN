-- Enforce the canonical 10-digit booking-number shape at the database boundary.
-- The application additionally validates the Luhn check digit.
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_bookingNumber_format_check"
  CHECK ("bookingNumber" ~ '^[1-9][0-9]{9}$');
