-- CreateTable
CREATE TABLE "recurring_tasks" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'Weekly',
    "dayOfWeek" TEXT,
    "estimateHours" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "category" TEXT NOT NULL DEFAULT 'Admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastDoneAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "totalDone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_tasks_staffId_isActive_idx" ON "recurring_tasks"("staffId", "isActive");

-- CreateIndex
CREATE INDEX "recurring_tasks_nextDueAt_idx" ON "recurring_tasks"("nextDueAt");

-- AddForeignKey
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
