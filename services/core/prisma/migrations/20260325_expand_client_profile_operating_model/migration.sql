ALTER TABLE "client_profiles"
ADD COLUMN "legalCompanyName" TEXT,
ADD COLUMN "tradingName" TEXT,
ADD COLUMN "officialBlurb" TEXT,
ADD COLUMN "partnerBlurb" TEXT,
ADD COLUMN "approvedBrandColors" JSONB,
ADD COLUMN "approvalPreferences" JSONB,
ADD COLUMN "identityAssets" JSONB;

CREATE TABLE "client_profile_stakeholders" (
  "id" TEXT NOT NULL,
  "clientProfileId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "jobTitle" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "preferredChannel" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "client_profile_stakeholders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_profile_audit_events" (
  "id" TEXT NOT NULL,
  "clientProfileId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorRole" TEXT,
  "actorName" TEXT,
  "section" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "client_profile_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_profile_stakeholders_clientProfileId_role_idx" ON "client_profile_stakeholders"("clientProfileId", "role");
CREATE INDEX "client_profile_audit_events_clientProfileId_createdAt_idx" ON "client_profile_audit_events"("clientProfileId", "createdAt");

ALTER TABLE "client_profile_stakeholders"
ADD CONSTRAINT "client_profile_stakeholders_clientProfileId_fkey"
FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_profile_audit_events"
ADD CONSTRAINT "client_profile_audit_events_clientProfileId_fkey"
FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
