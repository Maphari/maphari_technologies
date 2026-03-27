ALTER TABLE "integration_sync_events"
ADD COLUMN "taskId" TEXT;

CREATE INDEX "integration_sync_events_taskId_createdAt_idx"
ON "integration_sync_events" ("taskId", "createdAt");
