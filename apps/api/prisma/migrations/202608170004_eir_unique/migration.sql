-- Equipment Interchange Receipt references are generated only by the backend.
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_eirNumber_key"
ON "Booking" ("eirNumber");
