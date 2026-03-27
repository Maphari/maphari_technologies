ALTER TABLE "client_integration_requests"
ADD COLUMN "assignedToUserId" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "completedByUserId" TEXT,
ADD COLUMN "rejectedReason" TEXT,
ADD COLUMN "priority" TEXT,
ADD COLUMN "requestedVia" TEXT,
ADD COLUMN "sourceContext" JSONB;

CREATE INDEX "client_integration_requests_status_assignedToUserId_createdAt_idx"
ON "client_integration_requests"("status", "assignedToUserId", "createdAt");

CREATE TABLE "integration_providers" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "availabilityStatus" TEXT NOT NULL DEFAULT 'active',
  "iconKey" TEXT NOT NULL,
  "isClientVisible" BOOLEAN NOT NULL DEFAULT true,
  "isRequestEnabled" BOOLEAN NOT NULL DEFAULT false,
  "supportsDisconnect" BOOLEAN NOT NULL DEFAULT false,
  "supportsReconnect" BOOLEAN NOT NULL DEFAULT false,
  "supportsHealthChecks" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "launchStage" TEXT,
  "helpUrl" TEXT,
  "setupGuideUrl" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "integration_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_providers_key_key"
ON "integration_providers"("key");

CREATE INDEX "integration_providers_isClientVisible_sortOrder_idx"
ON "integration_providers"("isClientVisible", "sortOrder");

CREATE INDEX "integration_providers_availabilityStatus_sortOrder_idx"
ON "integration_providers"("availabilityStatus", "sortOrder");

INSERT INTO "integration_providers"
  ("id", "key", "label", "description", "category", "kind", "availabilityStatus", "iconKey", "isClientVisible", "isRequestEnabled", "supportsDisconnect", "supportsReconnect", "supportsHealthChecks", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'gcal',       'Google Calendar', 'Sync scheduled meetings and milestone due dates to your Google Calendar.', 'calendar',           'oauth',       'active',      'gcal',       true, false, true,  true,  true,  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000002', 'slack',      'Slack',           'Receive project notifications, approvals, and alerts directly in your Slack workspace.', 'communication',      'oauth',       'beta',        'slack',      true, false, true,  true,  true,  2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000003', 'msteams',    'Microsoft Teams', 'Route project notifications and updates to your Teams channels.', 'communication',      'assisted',    'active',      'msteams',    true, true,  false, false, false, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000004', 'gdrive',     'Google Drive',    'Export approved deliverables and project files into your Google Drive workspace.', 'files',              'assisted',    'beta',        'gdrive',     true, true,  false, false, false, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000005', 'dropbox',    'Dropbox',         'Automatically sync project file deliverables to your Dropbox folder.', 'files',              'assisted',    'active',      'dropbox',    true, true,  false, false, false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000006', 'quickbooks', 'QuickBooks',      'Push approved invoices and finance records into QuickBooks.', 'finance',            'assisted',    'beta',        'quickbooks', true, true,  false, false, false, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000007', 'xero',       'Xero',            'Automatically push approved invoices to your Xero accounting platform.', 'finance',            'assisted',    'active',      'xero',       true, true,  false, false, false, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000008', 'zapier',     'Zapier',          'Connect your project data to thousands of tools via automated Zapier workflows.', 'automation',         'coming_soon', 'coming_soon', 'zapier',     true, false, false, false, false, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000009', 'hubspot',    'HubSpot',         'View project health and delivery metrics inside your HubSpot CRM.', 'crm',                'coming_soon', 'coming_soon', 'hubspot',    true, false, false, false, false, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000010', 'salesforce', 'Salesforce',      'Expose project health and delivery signals to your Salesforce workflows.', 'crm',                'coming_soon', 'coming_soon', 'salesforce', true, false, false, false, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000011', 'notion',     'Notion',          'Export meeting notes and decision logs directly to a Notion workspace.', 'documentation',      'coming_soon', 'coming_soon', 'notion',     true, false, false, false, false, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000012', 'jira',       'Jira',            'Bridge project tasks, milestones, and delivery updates into Jira.', 'project_management', 'coming_soon', 'coming_soon', 'jira',       true, false, false, false, false, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000013', 'asana',      'Asana',           'Synchronize planning and delivery workflows with Asana.', 'project_management', 'coming_soon', 'coming_soon', 'asana',      true, false, false, false, false, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000014', 'clickup',    'ClickUp',         'Keep work management aligned by syncing delivery updates to ClickUp.', 'project_management', 'coming_soon', 'coming_soon', 'clickup',    true, false, false, false, false, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000015', 'docusign',   'DocuSign',        'Route agreements and approvals into DocuSign signature workflows.', 'approvals',          'coming_soon', 'coming_soon', 'docusign',   true, false, false, false, false, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000016', 'pandadoc',   'PandaDoc',        'Send client approvals and commercial documents through PandaDoc.', 'approvals',          'coming_soon', 'coming_soon', 'pandadoc',   true, false, false, false, false, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1000000-0000-0000-0000-000000000017', 'sharepoint', 'SharePoint',      'Sync approved deliverables to enterprise SharePoint libraries.', 'files',              'assisted',    'beta',        'sharepoint', true, true,  false, false, false, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

CREATE TABLE "client_integration_connections" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "connectionType" TEXT NOT NULL,
  "connectedByUserId" TEXT,
  "connectedByContactEmail" TEXT,
  "assignedOwnerUserId" TEXT,
  "connectedAt" TIMESTAMP(3),
  "disconnectedAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "lastSuccessfulSyncAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "healthStatus" TEXT,
  "configurationSummary" JSONB,
  "externalAccountId" TEXT,
  "externalAccountLabel" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "client_integration_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_integration_connections_clientId_providerKey_key"
ON "client_integration_connections"("clientId", "providerKey");

CREATE INDEX "client_integration_connections_clientId_status_idx"
ON "client_integration_connections"("clientId", "status");

CREATE INDEX "client_integration_connections_providerKey_status_idx"
ON "client_integration_connections"("providerKey", "status");

CREATE INDEX "client_integration_connections_healthStatus_updatedAt_idx"
ON "client_integration_connections"("healthStatus", "updatedAt");

CREATE TABLE "integration_sync_events" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "finishedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "summary" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "integration_sync_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integration_sync_events_connectionId_createdAt_idx"
ON "integration_sync_events"("connectionId", "createdAt");

CREATE INDEX "integration_sync_events_clientId_providerKey_createdAt_idx"
ON "integration_sync_events"("clientId", "providerKey", "createdAt");

ALTER TABLE "client_integration_connections"
ADD CONSTRAINT "client_integration_connections_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_integration_connections"
ADD CONSTRAINT "client_integration_connections_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "integration_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "integration_sync_events"
ADD CONSTRAINT "integration_sync_events_connectionId_fkey"
FOREIGN KEY ("connectionId") REFERENCES "client_integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
