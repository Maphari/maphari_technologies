CREATE TABLE "client_integration_requests" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "requestedByUserId" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "client_integration_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_integration_requests_clientId_createdAt_idx"
ON "client_integration_requests"("clientId", "createdAt");

CREATE INDEX "client_integration_requests_clientId_provider_status_idx"
ON "client_integration_requests"("clientId", "provider", "status");

ALTER TABLE "client_integration_requests"
ADD CONSTRAINT "client_integration_requests_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
