ALTER TABLE "notification_jobs"
ADD COLUMN IF NOT EXISTS "snoozedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "archivedByUserId" TEXT,
ADD COLUMN IF NOT EXISTS "archivedByRole" TEXT;

CREATE INDEX IF NOT EXISTS "notification_jobs_clientId_archivedAt_snoozedUntil_idx"
ON "notification_jobs"("clientId", "archivedAt", "snoozedUntil");
