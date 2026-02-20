CREATE TABLE "notification_jobs" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "tab" TEXT NOT NULL DEFAULT 'dashboard',
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "failureReason" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "readAt" TIMESTAMP(3),
  "readByUserId" TEXT,
  "readByRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" TIMESTAMP(3),
  "deadLetteredAt" TIMESTAMP(3),
  "idempotencyKey" TEXT,
  CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_dead_letters" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_dead_letters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_jobs_idempotencyKey_key" ON "notification_jobs"("idempotencyKey");
CREATE INDEX "notification_jobs_clientId_createdAt_idx" ON "notification_jobs"("clientId", "createdAt");
CREATE INDEX "notification_jobs_status_nextAttemptAt_idx" ON "notification_jobs"("status", "nextAttemptAt");
CREATE INDEX "notification_jobs_tab_readAt_idx" ON "notification_jobs"("tab", "readAt");

CREATE UNIQUE INDEX "notification_dead_letters_jobId_key" ON "notification_dead_letters"("jobId");
CREATE INDEX "notification_dead_letters_createdAt_idx" ON "notification_dead_letters"("createdAt");

ALTER TABLE "notification_dead_letters"
  ADD CONSTRAINT "notification_dead_letters_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "notification_jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
