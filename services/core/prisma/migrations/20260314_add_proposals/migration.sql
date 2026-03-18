-- Add proposals and proposal_items tables
-- Proposals are client-facing quotes created by admin/staff.
-- Clients can accept or decline them from the portal.

CREATE TABLE IF NOT EXISTS "proposals" (
    "id"                  TEXT NOT NULL,
    "clientId"            TEXT NOT NULL,
    "title"               TEXT NOT NULL,
    "summary"             TEXT,
    "status"              TEXT NOT NULL DEFAULT 'PENDING',
    "amountCents"         INTEGER NOT NULL DEFAULT 0,
    "currency"            TEXT NOT NULL DEFAULT 'ZAR',
    "preparedBy"          TEXT,
    "preparedByInitials"  TEXT,
    "validUntil"          TIMESTAMP(3),
    "declinedAt"          TIMESTAMP(3),
    "declineReason"       TEXT,
    "acceptedAt"          TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "proposals_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "proposals_clientId_status_idx"  ON "proposals"("clientId", "status");
CREATE INDEX IF NOT EXISTS "proposals_clientId_createdAt_idx" ON "proposals"("clientId", "createdAt");

CREATE TABLE IF NOT EXISTS "proposal_items" (
    "id"          TEXT NOT NULL,
    "proposalId"  TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon"        TEXT NOT NULL DEFAULT 'star',
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "proposal_items_proposalId_fkey"
        FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "proposal_items_proposalId_idx" ON "proposal_items"("proposalId");
