CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "conversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "subject" TEXT NOT NULL,
  "projectId" UUID,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "conversations_clientId_createdAt_idx" ON "conversations"("clientId", "createdAt");
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

CREATE TABLE "messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "conversationId" UUID NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "messages_clientId_createdAt_idx" ON "messages"("clientId", "createdAt");
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
