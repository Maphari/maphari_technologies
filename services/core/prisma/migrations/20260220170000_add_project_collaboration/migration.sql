CREATE TABLE "project_task_collaborators" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "staffUserId" UUID,
  "staffName" TEXT NOT NULL,
  "role" TEXT DEFAULT 'CONTRIBUTOR',
  "allocationPercent" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "project_task_collaborators_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_task_collaborators_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_task_collaborators_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_task_collaborators_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "project_task_collaborators_projectId_createdAt_idx" ON "project_task_collaborators"("projectId", "createdAt");
CREATE INDEX "project_task_collaborators_taskId_createdAt_idx" ON "project_task_collaborators"("taskId", "createdAt");
CREATE INDEX "project_task_collaborators_clientId_createdAt_idx" ON "project_task_collaborators"("clientId", "createdAt");

CREATE TABLE "project_collaboration_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "authorId" UUID,
  "authorRole" TEXT,
  "authorName" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
  "workstream" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "project_collaboration_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_collaboration_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_collaboration_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "project_collaboration_notes_projectId_createdAt_idx" ON "project_collaboration_notes"("projectId", "createdAt");
CREATE INDEX "project_collaboration_notes_clientId_createdAt_idx" ON "project_collaboration_notes"("clientId", "createdAt");
CREATE INDEX "project_collaboration_notes_visibility_createdAt_idx" ON "project_collaboration_notes"("visibility", "createdAt");

CREATE TABLE "project_work_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "taskId" UUID,
  "memberId" UUID,
  "memberName" TEXT NOT NULL,
  "memberRole" TEXT NOT NULL DEFAULT 'STAFF',
  "workstream" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "project_work_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_work_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_work_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_work_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "project_work_sessions_projectId_createdAt_idx" ON "project_work_sessions"("projectId", "createdAt");
CREATE INDEX "project_work_sessions_clientId_createdAt_idx" ON "project_work_sessions"("clientId", "createdAt");
CREATE INDEX "project_work_sessions_status_startedAt_idx" ON "project_work_sessions"("status", "startedAt");
