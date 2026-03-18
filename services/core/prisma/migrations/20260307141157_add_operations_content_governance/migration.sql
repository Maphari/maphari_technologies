-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "target" TEXT NOT NULL DEFAULT 'ALL',
    "reach" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_submissions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SOCIAL_POST',
    "submittedById" TEXT,
    "submittedByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AWAITING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_reviews" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "reviewerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_records" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 60,
    "attendeeCount" INTEGER NOT NULL DEFAULT 0,
    "hasRecording" BOOLEAN NOT NULL DEFAULT false,
    "recordingFileId" TEXT,
    "actionItemStatus" TEXT NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "tags" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "outcome" TEXT,
    "decidedByName" TEXT,
    "decidedAt" TIMESTAMP(3),
    "tags" TEXT,
    "projectId" TEXT,
    "clientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_records" (
    "id" TEXT NOT NULL,
    "fromStaffName" TEXT,
    "toStaffName" TEXT,
    "projectId" TEXT,
    "clientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "transferDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handover_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_intel_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TREND',
    "title" TEXT NOT NULL,
    "source" TEXT,
    "summary" TEXT,
    "relevance" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT,
    "enteredByName" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_intel_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_target_status_idx" ON "announcements"("target", "status");

-- CreateIndex
CREATE INDEX "content_submissions_clientId_status_idx" ON "content_submissions"("clientId", "status");

-- CreateIndex
CREATE INDEX "content_submissions_status_idx" ON "content_submissions"("status");

-- CreateIndex
CREATE INDEX "design_reviews_projectId_submittedAt_idx" ON "design_reviews"("projectId", "submittedAt");

-- CreateIndex
CREATE INDEX "design_reviews_clientId_status_idx" ON "design_reviews"("clientId", "status");

-- CreateIndex
CREATE INDEX "meeting_records_clientId_meetingAt_idx" ON "meeting_records"("clientId", "meetingAt");

-- CreateIndex
CREATE INDEX "knowledge_articles_status_idx" ON "knowledge_articles"("status");

-- CreateIndex
CREATE INDEX "knowledge_articles_category_status_idx" ON "knowledge_articles"("category", "status");

-- CreateIndex
CREATE INDEX "decision_records_status_idx" ON "decision_records"("status");

-- CreateIndex
CREATE INDEX "decision_records_projectId_idx" ON "decision_records"("projectId");

-- CreateIndex
CREATE INDEX "decision_records_clientId_idx" ON "decision_records"("clientId");

-- CreateIndex
CREATE INDEX "handover_records_projectId_idx" ON "handover_records"("projectId");

-- CreateIndex
CREATE INDEX "handover_records_clientId_idx" ON "handover_records"("clientId");

-- CreateIndex
CREATE INDEX "handover_records_status_idx" ON "handover_records"("status");

-- CreateIndex
CREATE INDEX "audit_events_actorId_createdAt_idx" ON "audit_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_resourceType_resourceId_idx" ON "audit_events"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "market_intel_entries_type_relevance_idx" ON "market_intel_entries"("type", "relevance");

-- CreateIndex
CREATE INDEX "market_intel_entries_enteredAt_idx" ON "market_intel_entries"("enteredAt");

-- AddForeignKey
ALTER TABLE "design_reviews" ADD CONSTRAINT "design_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
