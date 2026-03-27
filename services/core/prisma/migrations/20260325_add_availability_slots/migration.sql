CREATE TABLE "availability_slots" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "booked" BOOLEAN NOT NULL DEFAULT false,
  "appointmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "availability_slots_appointmentId_key" ON "availability_slots"("appointmentId");
CREATE INDEX "availability_slots_startsAt_booked_idx" ON "availability_slots"("startsAt", "booked");
CREATE INDEX "availability_slots_adminId_startsAt_idx" ON "availability_slots"("adminId", "startsAt");

ALTER TABLE "availability_slots"
ADD CONSTRAINT "availability_slots_appointmentId_fkey"
FOREIGN KEY ("appointmentId")
REFERENCES "appointments"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
