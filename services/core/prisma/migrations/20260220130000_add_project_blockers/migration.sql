CREATE TABLE "project_blockers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "ownerRole" TEXT,
  "ownerName" TEXT,
  "etaAt" TIMESTAMPTZ,
  "resolvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "project_blockers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_blockers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_blockers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "project_blockers_clientId_createdAt_idx" ON "project_blockers"("clientId", "createdAt");
CREATE INDEX "project_blockers_projectId_createdAt_idx" ON "project_blockers"("projectId", "createdAt");
CREATE INDEX "project_blockers_status_severity_idx" ON "project_blockers"("status", "severity");
