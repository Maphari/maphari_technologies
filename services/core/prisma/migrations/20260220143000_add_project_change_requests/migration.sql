CREATE TABLE "project_change_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "reason" TEXT,
  "impactSummary" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "requestedByRole" TEXT,
  "requestedByName" TEXT,
  "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "estimatedHours" DOUBLE PRECISION,
  "estimatedCostCents" BIGINT,
  "staffAssessment" TEXT,
  "estimatedAt" TIMESTAMPTZ,
  "estimatedByRole" TEXT,
  "estimatedByName" TEXT,
  "adminDecisionNote" TEXT,
  "adminDecidedAt" TIMESTAMPTZ,
  "adminDecidedByRole" TEXT,
  "adminDecidedByName" TEXT,
  "clientDecisionNote" TEXT,
  "clientDecidedAt" TIMESTAMPTZ,
  "clientDecidedByRole" TEXT,
  "clientDecidedByName" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "project_change_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_change_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "project_change_requests_clientId_createdAt_idx" ON "project_change_requests"("clientId", "createdAt");
CREATE INDEX "project_change_requests_projectId_createdAt_idx" ON "project_change_requests"("projectId", "createdAt");
CREATE INDEX "project_change_requests_status_createdAt_idx" ON "project_change_requests"("status", "createdAt");
