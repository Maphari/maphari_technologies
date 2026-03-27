-- CreateTable
CREATE TABLE "invoice_reminder_preferences" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "intervalDays" INTEGER NOT NULL DEFAULT 3,
    "channels" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_reminder_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_reminder_dispatches" (
    "id" TEXT NOT NULL,
    "dispatchKey" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggeredForAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_reminder_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_reminder_preferences_clientId_key" ON "invoice_reminder_preferences"("clientId");

-- CreateIndex
CREATE INDEX "invoice_reminder_preferences_enabled_updatedAt_idx" ON "invoice_reminder_preferences"("enabled", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_reminder_dispatches_dispatchKey_key" ON "invoice_reminder_dispatches"("dispatchKey");

-- CreateIndex
CREATE INDEX "invoice_reminder_dispatches_clientId_createdAt_idx" ON "invoice_reminder_dispatches"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "invoice_reminder_dispatches_invoiceId_channel_idx" ON "invoice_reminder_dispatches"("invoiceId", "channel");
