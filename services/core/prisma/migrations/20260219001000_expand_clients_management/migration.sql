ALTER TABLE "clients"
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'STARTER',
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "billingEmail" TEXT,
  ADD COLUMN "ownerName" TEXT,
  ADD COLUMN "contractStartAt" TIMESTAMPTZ,
  ADD COLUMN "contractRenewalAt" TIMESTAMPTZ,
  ADD COLUMN "slaTier" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "slaResponseHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "notes" TEXT;

CREATE INDEX "clients_tier_idx" ON "clients"("tier");
CREATE INDEX "clients_priority_idx" ON "clients"("priority");
CREATE INDEX "clients_contractRenewalAt_idx" ON "clients"("contractRenewalAt");

CREATE TABLE "client_contacts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "role" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "client_contacts_clientId_createdAt_idx" ON "client_contacts"("clientId", "createdAt");
CREATE INDEX "client_contacts_email_idx" ON "client_contacts"("email");

CREATE TABLE "client_activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "client_activities_clientId_createdAt_idx" ON "client_activities"("clientId", "createdAt");

CREATE TABLE "client_status_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "actorId" TEXT,
  "actorRole" TEXT,
  "changedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "client_status_history_clientId_changedAt_idx" ON "client_status_history"("clientId", "changedAt");
