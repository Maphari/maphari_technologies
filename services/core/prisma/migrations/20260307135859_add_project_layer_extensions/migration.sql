/*
  Warnings:

  - The primary key for the `client_activities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `client_contacts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `client_status_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `conversation_escalations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `conversation_notes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `lead_activities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `leads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `milestone_approvals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_activities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_blockers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_change_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_collaboration_notes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_dependencies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_milestones` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_task_collaborators` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_time_entries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_work_sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_preferences` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "client_activities" DROP CONSTRAINT "client_activities_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_contacts" DROP CONSTRAINT "client_contacts_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_status_history" DROP CONSTRAINT "client_status_history_clientId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_clientId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_leadId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_clientId_fkey";

-- DropForeignKey
ALTER TABLE "milestone_approvals" DROP CONSTRAINT "milestone_approvals_clientId_fkey";

-- DropForeignKey
ALTER TABLE "milestone_approvals" DROP CONSTRAINT "milestone_approvals_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "milestone_approvals" DROP CONSTRAINT "milestone_approvals_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_activities" DROP CONSTRAINT "project_activities_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_activities" DROP CONSTRAINT "project_activities_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_blockers" DROP CONSTRAINT "project_blockers_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_blockers" DROP CONSTRAINT "project_blockers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_change_requests" DROP CONSTRAINT "project_change_requests_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_change_requests" DROP CONSTRAINT "project_change_requests_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_collaboration_notes" DROP CONSTRAINT "project_collaboration_notes_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_collaboration_notes" DROP CONSTRAINT "project_collaboration_notes_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_dependencies" DROP CONSTRAINT "project_dependencies_blockedByProjectId_fkey";

-- DropForeignKey
ALTER TABLE "project_dependencies" DROP CONSTRAINT "project_dependencies_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_milestones" DROP CONSTRAINT "project_milestones_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_task_collaborators" DROP CONSTRAINT "project_task_collaborators_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_task_collaborators" DROP CONSTRAINT "project_task_collaborators_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_task_collaborators" DROP CONSTRAINT "project_task_collaborators_taskId_fkey";

-- DropForeignKey
ALTER TABLE "project_tasks" DROP CONSTRAINT "project_tasks_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_time_entries" DROP CONSTRAINT "project_time_entries_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_time_entries" DROP CONSTRAINT "project_time_entries_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_work_sessions" DROP CONSTRAINT "project_work_sessions_clientId_fkey";

-- DropForeignKey
ALTER TABLE "project_work_sessions" DROP CONSTRAINT "project_work_sessions_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_work_sessions" DROP CONSTRAINT "project_work_sessions_taskId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_clientId_fkey";

-- AlterTable
ALTER TABLE "client_activities" DROP CONSTRAINT "client_activities_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "client_activities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "client_contacts" DROP CONSTRAINT "client_contacts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "client_status_history" DROP CONSTRAINT "client_status_history_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "changedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "client_status_history_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "clients" DROP CONSTRAINT "clients_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "contractStartAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "contractRenewalAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "conversation_escalations" DROP CONSTRAINT "conversation_escalations_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "resolvedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "conversation_escalations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "conversation_notes" DROP CONSTRAINT "conversation_notes_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "conversation_notes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "leadId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "leads" DROP CONSTRAINT "leads_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "nextFollowUpAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "milestone_approvals" DROP CONSTRAINT "milestone_approvals_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "decidedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "milestone_approvals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_activities" DROP CONSTRAINT "project_activities_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_blockers" DROP CONSTRAINT "project_blockers_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "etaAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "resolvedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_blockers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_change_requests" DROP CONSTRAINT "project_change_requests_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "requestedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "estimatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "adminDecidedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "clientDecidedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_change_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_collaboration_notes" DROP CONSTRAINT "project_collaboration_notes_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_collaboration_notes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_dependencies" DROP CONSTRAINT "project_dependencies_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "blockedByProjectId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_dependencies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_milestones" DROP CONSTRAINT "project_milestones_pkey",
ADD COLUMN     "progressPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "dueAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_task_collaborators" DROP CONSTRAINT "project_task_collaborators_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "taskId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_task_collaborators_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_tasks" DROP CONSTRAINT "project_tasks_pkey",
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "estimateMinutes" INTEGER,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "progressPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sprintId" TEXT,
ADD COLUMN     "storyPoints" INTEGER,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "dueAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_time_entries" DROP CONSTRAINT "project_time_entries_pkey",
ADD COLUMN     "phaseId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "startedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_time_entries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_work_sessions" DROP CONSTRAINT "project_work_sessions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "taskId" SET DATA TYPE TEXT,
ALTER COLUMN "startedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "project_work_sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "startAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "dueAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "completedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "slaDueAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "project_deliverables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "dueAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_risks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "likelihood" TEXT NOT NULL DEFAULT 'MEDIUM',
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "mitigation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_decisions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "decidedByName" TEXT,
    "decidedByRole" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_sprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "overdueTasks" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_sign_offs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_READY',
    "signedAt" TIMESTAMP(3),
    "signedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_sign_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loggedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_briefs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "inScope" TEXT NOT NULL,
    "outOfScope" TEXT NOT NULL,
    "contacts" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_deliverables_projectId_createdAt_idx" ON "project_deliverables"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_deliverables_status_idx" ON "project_deliverables"("status");

-- CreateIndex
CREATE INDEX "project_risks_projectId_createdAt_idx" ON "project_risks"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_risks_status_idx" ON "project_risks"("status");

-- CreateIndex
CREATE INDEX "project_decisions_projectId_createdAt_idx" ON "project_decisions"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_sprints_projectId_createdAt_idx" ON "project_sprints"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_sprints_status_idx" ON "project_sprints"("status");

-- CreateIndex
CREATE INDEX "project_sign_offs_projectId_createdAt_idx" ON "project_sign_offs"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_sign_offs_status_idx" ON "project_sign_offs"("status");

-- CreateIndex
CREATE INDEX "project_phases_projectId_sortOrder_idx" ON "project_phases"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "project_briefs_projectId_key" ON "project_briefs"("projectId");

-- CreateIndex
CREATE INDEX "project_briefs_clientId_idx" ON "project_briefs"("clientId");

-- CreateIndex
CREATE INDEX "project_tasks_sprintId_idx" ON "project_tasks"("sprintId");

-- CreateIndex
CREATE INDEX "project_time_entries_phaseId_idx" ON "project_time_entries"("phaseId");

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_status_history" ADD CONSTRAINT "client_status_history_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "project_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_collaborators" ADD CONSTRAINT "project_task_collaborators_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_collaborators" ADD CONSTRAINT "project_task_collaborators_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_collaborators" ADD CONSTRAINT "project_task_collaborators_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaboration_notes" ADD CONSTRAINT "project_collaboration_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaboration_notes" ADD CONSTRAINT "project_collaboration_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_work_sessions" ADD CONSTRAINT "project_work_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_work_sessions" ADD CONSTRAINT "project_work_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_work_sessions" ADD CONSTRAINT "project_work_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_dependencies" ADD CONSTRAINT "project_dependencies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_dependencies" ADD CONSTRAINT "project_dependencies_blockedByProjectId_fkey" FOREIGN KEY ("blockedByProjectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_blockers" ADD CONSTRAINT "project_blockers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_blockers" ADD CONSTRAINT "project_blockers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_change_requests" ADD CONSTRAINT "project_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_change_requests" ADD CONSTRAINT "project_change_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deliverables" ADD CONSTRAINT "project_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deliverables" ADD CONSTRAINT "project_deliverables_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_decisions" ADD CONSTRAINT "project_decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_sprints" ADD CONSTRAINT "project_sprints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_sign_offs" ADD CONSTRAINT "project_sign_offs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
