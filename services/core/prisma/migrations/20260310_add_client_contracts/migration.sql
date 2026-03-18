-- Add client_contracts table
CREATE TABLE IF NOT EXISTS "client_contracts" (
    "id"          TEXT NOT NULL,
    "clientId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "type"        TEXT NOT NULL DEFAULT 'CONTRACT',
    "ref"         TEXT,
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "signed"      BOOLEAN NOT NULL DEFAULT false,
    "signedAt"    TIMESTAMP(3),
    "fileId"      TEXT,
    "storageKey"  TEXT,
    "mimeType"    TEXT,
    "sizeBytes"   INTEGER,
    "notes"       TEXT,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "client_contracts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "client_contracts_clientId_type_idx"
  ON "client_contracts"("clientId", "type");

CREATE INDEX IF NOT EXISTS "client_contracts_clientId_status_idx"
  ON "client_contracts"("clientId", "status");
