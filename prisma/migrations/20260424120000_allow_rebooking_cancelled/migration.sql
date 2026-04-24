-- Drop unique constraint so cancelled bookings don't block re-booking the same slot.
-- We enforce "only one active booking per slot" in application logic.

DROP INDEX IF EXISTS "booking_availabilitySlotId_key";

-- Keep a lookup index for slot -> bookings.
CREATE INDEX IF NOT EXISTS "booking_availabilitySlotId_idx" ON "booking"("availabilitySlotId");

