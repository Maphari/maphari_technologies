ALTER TABLE "leads"
  ADD COLUMN "ownerName" TEXT,
  ADD COLUMN "nextFollowUpAt" TIMESTAMPTZ,
  ADD COLUMN "lostReason" TEXT;

CREATE INDEX "leads_nextFollowUpAt_idx" ON "leads"("nextFollowUpAt");

CREATE TABLE "lead_activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "leadId" UUID NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");
CREATE INDEX "lead_activities_clientId_createdAt_idx" ON "lead_activities"("clientId", "createdAt");
