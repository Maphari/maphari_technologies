-- CreateTable
CREATE TABLE "core_schema"."forum_threads" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "authorId" TEXT NOT NULL,
    "anonAlias" VARCHAR(60) NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_schema"."forum_posts" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "anonAlias" VARCHAR(60) NOT NULL,
    "body" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_schema"."feature_requests" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "anonAlias" VARCHAR(60) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'under_review',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_schema"."feature_votes" (
    "id" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forum_threads_category_isApproved_idx" ON "core_schema"."forum_threads"("category", "isApproved");

-- CreateIndex
CREATE INDEX "forum_threads_isApproved_createdAt_idx" ON "core_schema"."forum_threads"("isApproved", "createdAt");

-- CreateIndex
CREATE INDEX "forum_posts_threadId_isApproved_idx" ON "core_schema"."forum_posts"("threadId", "isApproved");

-- CreateIndex
CREATE INDEX "feature_requests_category_status_isApproved_idx" ON "core_schema"."feature_requests"("category", "status", "isApproved");

-- CreateIndex
CREATE INDEX "feature_requests_isApproved_voteCount_idx" ON "core_schema"."feature_requests"("isApproved", "voteCount");

-- CreateIndex
CREATE UNIQUE INDEX "feature_votes_featureRequestId_voterId_key" ON "core_schema"."feature_votes"("featureRequestId", "voterId");

-- AddForeignKey
ALTER TABLE "core_schema"."forum_posts" ADD CONSTRAINT "forum_posts_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "core_schema"."forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_schema"."feature_votes" ADD CONSTRAINT "feature_votes_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "core_schema"."feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
