-- Ensure stale expired/cancelled/refunded bookings do not block a slot forever.
-- The app enforces active-booking overlap checks in code, but database uniqueness
-- should only apply to currently active slots.

ALTER TABLE "booking"
DROP CONSTRAINT IF EXISTS "booking_booking_date_start_time_key";

DROP INDEX IF EXISTS "booking_booking_date_start_time_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ux_booking_active_slot"
ON "booking" ("booking_date", "start_time")
WHERE "status" IN ('pending', 'confirmed', 'completed', 'rescheduled');
