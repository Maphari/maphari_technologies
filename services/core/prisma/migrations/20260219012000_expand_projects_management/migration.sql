ALTER TABLE "projects"
  ADD COLUMN "ownerName" TEXT,
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
  ADD COLUMN "startAt" TIMESTAMPTZ,
  ADD COLUMN "dueAt" TIMESTAMPTZ,
  ADD COLUMN "completedAt" TIMESTAMPTZ,
  ADD COLUMN "budgetCents" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "progressPercent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "slaDueAt" TIMESTAMPTZ;

CREATE INDEX "projects_priority_idx" ON "projects"("priority");
CREATE INDEX "projects_riskLevel_idx" ON "projects"("riskLevel");
CREATE INDEX "projects_dueAt_idx" ON "projects"("dueAt");

CREATE TABLE "project_milestones" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "dueAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "project_milestones_projectId_createdAt_idx" ON "project_milestones"("projectId", "createdAt");
CREATE INDEX "project_milestones_status_idx" ON "project_milestones"("status");

CREATE TABLE "project_tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "assigneeName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'TODO',
  "dueAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "project_tasks_projectId_createdAt_idx" ON "project_tasks"("projectId", "createdAt");
CREATE INDEX "project_tasks_status_idx" ON "project_tasks"("status");

CREATE TABLE "project_dependencies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "blockedByProjectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL DEFAULT 'BLOCKS',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "project_dependencies_projectId_createdAt_idx" ON "project_dependencies"("projectId", "createdAt");
CREATE INDEX "project_dependencies_blockedByProjectId_idx" ON "project_dependencies"("blockedByProjectId");

CREATE TABLE "project_activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "project_activities_projectId_createdAt_idx" ON "project_activities"("projectId", "createdAt");
CREATE INDEX "project_activities_clientId_createdAt_idx" ON "project_activities"("clientId", "createdAt");
