CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "files" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "fileName" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "files_clientId_createdAt_idx" ON "files"("clientId", "createdAt");
