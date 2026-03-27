ALTER TABLE "integration_sync_events"
ADD COLUMN "idempotencyKey" TEXT;

CREATE INDEX "integration_sync_events_taskId_providerKey_idempotencyKey_idx"
ON "integration_sync_events" ("taskId", "providerKey", "idempotencyKey");
