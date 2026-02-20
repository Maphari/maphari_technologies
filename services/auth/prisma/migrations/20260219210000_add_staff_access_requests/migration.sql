CREATE TABLE "StaffAccessRequest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "pin" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_ADMIN',
  "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "approvedAt" TIMESTAMPTZ,
  "approvedByUserId" UUID,
  "verifiedAt" TIMESTAMPTZ,
  "revokedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "userId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "StaffAccessRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "StaffAccessRequest_status_requestedAt_idx" ON "StaffAccessRequest"("status", "requestedAt");
CREATE INDEX "StaffAccessRequest_expiresAt_idx" ON "StaffAccessRequest"("expiresAt");
