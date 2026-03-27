# Client Integrations Platform Roadmap

Date: 2026-03-25
Owner: Product + Platform Engineering
Status: Proposed

## Goal

Turn Integrations from a static catalog into an operational product surface that clients can trust and internal teams can manage. The current client page is closer than before, but it still needs a proper provider catalog, request operations, connection health, auditability, and staff tooling before it is complete.

This roadmap defines the implementation plan in milestone form so engineering can start building immediately.

## Problem Statement

The current state has three strengths:

- Google Calendar is a real OAuth integration.
- Assisted integrations can now be requested through a real persisted request flow.
- The client page no longer lies about non-existent connections.

The remaining problems are operational:

- There is no staff/admin operations view to move requests through setup.
- OAuth integrations do not expose operational states like `Needs Re-auth` or `Failed`.
- Live integrations do not expose enough metadata such as who connected them, when they last synced, or whether they are healthy.
- Provider catalog data is still defined in code rather than managed in backend/admin configuration.
- There is no durable connection model that separates a setup request from an active integration.

## Desired Outcome

By the end of this roadmap:

- clients can request integrations and see truthful statuses
- staff/admin can process requests through a clear lifecycle
- active integrations have a real connection record and operational health
- provider catalog rollout is controlled from the backend
- the system supports both self-serve OAuth and assisted setup integrations
- the product can onboard additional integrations without frontend rewrites

## Product Principles

1. Never show `Connected` without a real persisted connection state.
2. Never show a generic pending label when there is a more accurate lifecycle state.
3. Separate provider definition, request workflow, and active connection state.
4. Clients see operational truth; staff sees operational controls.
5. Backend is the source of truth for provider availability, rollout, and connection state.

## Recommended Integration Priority

### Wave A: Highest Immediate Client Value

1. `Slack`
2. `Microsoft Teams`
3. `Google Drive`
4. `QuickBooks`
5. `Xero`
6. `Zapier`

### Wave B: Enterprise and Ops Expansion

1. `OneDrive / SharePoint`
2. `HubSpot`
3. `Salesforce`

### Wave C: Workflow and Approval Expansion

1. `Notion`
2. `Jira`
3. `Asana`
4. `ClickUp`
5. `DocuSign`
6. `PandaDoc`

## Why These Integrations Matter

### Communication

- `Slack` and `Microsoft Teams`
- Client value:
  - delivery alerts go to the client's daily workspace
  - approval reminders are less likely to be missed
  - escalations become visible sooner
  - the portal becomes part of the client operating flow rather than a separate destination

### Documents and Assets

- `Google Drive`, `OneDrive`, `SharePoint`, `Dropbox`
- Client value:
  - approved files land in the system of record they already use
  - handoff packs and deliverables are easier to distribute internally
  - fewer manual uploads and file-chasing loops

### Finance

- `QuickBooks`, `Xero`
- Client value:
  - reduce manual finance re-entry
  - approved invoices can flow into accounting systems faster
  - payment visibility can move back into the portal over time

### Workflow Bridge

- `Zapier`
- Client value:
  - allows fast extension into long-tail client tooling
  - avoids building one-off custom integrations for every account

### CRM and Account Visibility

- `HubSpot`, `Salesforce`
- Client value:
  - project health and delivery signals can be exposed to account teams and leadership
  - strengthens renewal, account management, and internal reporting workflows

### Work Management and Approvals

- `Notion`, `Jira`, `Asana`, `ClickUp`, `DocuSign`, `PandaDoc`
- Client value:
  - creates a bridge between Maphari delivery and the client's internal execution or approval systems
  - reduces duplicated updates across meetings, documents, and project tools

## Integration Types

### Type 1: Self-Serve OAuth

Use when the client should be able to connect and disconnect the integration directly from the portal.

Examples:

- Google Calendar
- Slack
- potentially Google Drive
- potentially QuickBooks

Characteristics:

- client-facing `Connect`, `Reconnect`, `Disconnect`
- token lifecycle must be implemented
- health and sync state must be monitored

### Type 2: Assisted Setup

Use when setup requires internal configuration, enterprise admin work, account mapping, or provider-side support.

Examples:

- Microsoft Teams
- Xero
- OneDrive / SharePoint
- HubSpot
- Salesforce
- Jira

Characteristics:

- client-facing `Request Setup`
- staff-facing assignment and lifecycle management
- active connection created only after staff completion

### Type 3: Coming Soon

Use when a provider should be visible in the catalog but not requestable yet.

Characteristics:

- visible if product wants signaling
- not requestable unless explicitly enabled
- copy and visibility controlled from backend/admin config

## Core Domain Model

The platform should model integrations using four distinct concepts.

### 1. Integration Provider

Defines what the platform offers.

Proposed model: `IntegrationProvider`

Fields:

- `id String @id @default(uuid())`
- `key String @unique`
- `label String`
- `description String`
- `category String`
- `kind String`
  - allowed values: `oauth`, `assisted`, `coming_soon`
- `availabilityStatus String`
  - allowed values: `active`, `beta`, `hidden`, `coming_soon`, `deprecated`
- `iconKey String`
- `isClientVisible Boolean @default(true)`
- `isRequestEnabled Boolean @default(false)`
- `supportsDisconnect Boolean @default(false)`
- `supportsReconnect Boolean @default(false)`
- `supportsHealthChecks Boolean @default(false)`
- `sortOrder Int @default(0)`
- `launchStage String?`
- `helpUrl String?`
- `setupGuideUrl String?`
- `metadata Json?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Purpose:

- removes provider rollout decisions from frontend code
- makes labels, descriptions, categories, and visibility operationally configurable

### 2. Integration Request

Represents client demand for assisted setup or internal fulfillment work.

Existing model should be extended: `ClientIntegrationRequest`

Current fields:

- `id`
- `clientId`
- `provider`
- `status`
- `requestedByUserId`
- `completedAt`
- `createdAt`
- `updatedAt`

Additions:

- `assignedToUserId String?`
- `notes String?`
- `completedByUserId String?`
- `rejectedReason String?`
- `priority String?`
- `requestedVia String?`
- `sourceContext Json?`

Recommended statuses:

- `REQUESTED`
- `IN_PROGRESS`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

Purpose:

- tracks fulfillment workflow
- should not be treated as the active connection record

### 3. Integration Connection

Represents a real live configured integration.

New model: `ClientIntegrationConnection`

Fields:

- `id String @id @default(uuid())`
- `clientId String`
- `providerId String`
- `providerKey String`
- `status String`
  - allowed values: `CONNECTED`, `DISCONNECTED`, `NEEDS_REAUTH`, `FAILED`, `PAUSED`
- `connectionType String`
  - allowed values: `oauth`, `assisted`
- `connectedByUserId String?`
- `connectedByContactEmail String?`
- `assignedOwnerUserId String?`
- `connectedAt DateTime?`
- `disconnectedAt DateTime?`
- `lastCheckedAt DateTime?`
- `lastSyncedAt DateTime?`
- `lastSuccessfulSyncAt DateTime?`
- `lastErrorCode String?`
- `lastErrorMessage String?`
- `healthStatus String?`
  - allowed values: `HEALTHY`, `DELAYED`, `ACTION_NEEDED`, `UNKNOWN`
- `configurationSummary Json?`
- `externalAccountId String?`
- `externalAccountLabel String?`
- `metadata Json?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Purpose:

- this is the source of truth for whether something is actually connected
- allows the UI to display honest health and ownership

### 4. Integration Sync Event

Tracks execution history for ongoing integrations.

New model: `IntegrationSyncEvent`

Fields:

- `id String @id @default(uuid())`
- `connectionId String`
- `clientId String`
- `providerKey String`
- `status String`
  - allowed values: `SUCCESS`, `FAILED`, `PARTIAL`, `SKIPPED`
- `startedAt DateTime`
- `finishedAt DateTime?`
- `durationMs Int?`
- `summary String?`
- `errorCode String?`
- `errorMessage String?`
- `details Json?`
- `createdAt DateTime @default(now())`

Purpose:

- powers sync health UI
- provides internal operational visibility
- supports auditability and troubleshooting

## Status Taxonomy

The UI and API must stop overloading one status field for multiple meanings.

### Provider Availability

Owned by `IntegrationProvider.availabilityStatus`

- `active`
- `beta`
- `hidden`
- `coming_soon`
- `deprecated`

### Request Status

Owned by `ClientIntegrationRequest.status`

- `REQUESTED`
- `IN_PROGRESS`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

### Connection Status

Owned by `ClientIntegrationConnection.status`

- `CONNECTED`
- `DISCONNECTED`
- `NEEDS_REAUTH`
- `FAILED`
- `PAUSED`

### Health Status

Owned by `ClientIntegrationConnection.healthStatus`

- `HEALTHY`
- `DELAYED`
- `ACTION_NEEDED`
- `UNKNOWN`

## Milestone Plan

## Milestone 1: Backend-Driven Provider Catalog

### Objective

Move integration provider definitions out of frontend constants and into a backend-managed catalog.

### Why This Comes First

Without this, rollout, labels, visibility, and requestability remain code changes. That blocks product operations and makes later milestones harder.

### Deliverables

- add `IntegrationProvider` Prisma model in `services/core/prisma/schema.prisma`
- create migration for provider table
- seed initial provider catalog entries
- replace hardcoded catalog in `services/core/src/routes/integrations.ts`
- update the client integrations route to build responses from provider records
- add admin/staff provider management endpoints

### Initial Seed Providers

- `gcal`
- `slack`
- `msteams`
- `gdrive`
- `dropbox`
- `quickbooks`
- `xero`
- `zapier`
- `hubspot`
- `salesforce`
- `notion`
- `jira`
- `asana`
- `clickup`
- `docusign`
- `pandadoc`
- `sharepoint`

### API Changes

Client-facing:

- `GET /portal/settings/integrations`

Admin/staff:

- `GET /admin/integrations/providers`
- `PATCH /admin/integrations/providers/:providerId`
- optional later:
  - `POST /admin/integrations/providers`
  - `POST /admin/integrations/providers/:providerId/archive`

### Response Shape for Client Catalog

Each card payload should include:

- provider identity
- label
- description
- category
- kind
- availability status
- requestability
- live connection state if one exists
- latest request state if one exists
- surfaced metadata for display

### Acceptance Criteria

- client integrations page renders purely from backend provider records
- frontend contains no hardcoded provider catalog list
- admin/staff can hide or disable a provider without frontend changes
- unavailable providers cannot be requested if `isRequestEnabled = false`

### Risks

- provider seeds may drift between environments if handled manually
- older provider keys must remain stable once used in request/connection tables

## Milestone 2: Staff/Admin Operations View for Integration Requests

### Objective

Give internal teams a dedicated operations surface to manage assisted integration requests.

### Why This Matters

The client can now request setup, but there is no first-class internal workflow. Without this milestone, requests will exist but fulfillment will remain manual and invisible.

### Deliverables

- create an admin or staff page for integration requests
- extend `ClientIntegrationRequest` with assignment and notes
- add list, filter, and update APIs
- support lifecycle transitions:
  - `REQUESTED` -> `IN_PROGRESS`
  - `IN_PROGRESS` -> `COMPLETED`
  - `REQUESTED` -> `REJECTED`
  - `IN_PROGRESS` -> `REJECTED`
- when a request becomes `COMPLETED`, create or update a `ClientIntegrationConnection`

### UI Surface

Recommended route:

- `apps/web/src/components/admin/dashboard/pages/integration-requests-page.tsx`

Alternative:

- `apps/web/src/components/staff/staff-dashboard/pages/integration-requests-page.tsx`

Recommended layout:

- glass shell header with summary counts
- queue segmented by `Requested`, `In Setup`, `Completed`, `Rejected`
- dense but readable operations cards or table rows
- right-side detail panel or modal for request notes and assignment

### Fields to Show Per Request

- provider
- client name
- requested by
- requester email if available
- requested at
- current status
- assigned owner
- notes summary
- completed at
- rejected reason if present

### Backend Endpoints

- `GET /admin/integration-requests`
- `PATCH /admin/integration-requests/:requestId`

Filter support:

- by status
- by provider
- by client
- by assignee
- by date range

### Acceptance Criteria

- staff/admin can view all requests in one page
- staff/admin can assign requests and add notes
- staff/admin can move requests into `In Setup`
- staff/admin can complete requests and create a real connection record
- clients see `Requested`, `In Setup`, or `Connected` correctly after staff changes

### Risks

- connection creation on completion must be idempotent
- request completion must not create duplicate live connections

## Milestone 3: Active Connection Model

### Objective

Introduce a first-class persisted connection model for both OAuth and assisted integrations.

### Why This Matters

A request is not a connection. Without a connection table, the system cannot honestly distinguish setup demand from actual configured state.

### Deliverables

- add `ClientIntegrationConnection` Prisma model
- create connection records for real live integrations
- wire Google Calendar to populate this model
- wire assisted request completion to populate this model
- teach `/portal/settings/integrations` to compute card state from provider + request + connection

### Connection Ownership Rules

- self-serve OAuth:
  - `connectedByUserId` should be the authenticated client user who connected it
- assisted:
  - `connectedByUserId` should be the internal staff/admin who completed setup
  - if connected by external side effects, store `connectedByContactEmail` or system actor metadata

### Acceptance Criteria

- active connections exist independently of request rows
- client UI never infers connection from request completion alone without a connection record
- disconnecting an integration changes connection state rather than mutating request history

## Milestone 4: OAuth Honesty and Re-Auth States

### Objective

Add truthful operational states for OAuth integrations, starting with Google Calendar.

### Deliverables

- introduce `NEEDS_REAUTH` and `FAILED` connection states
- implement Google Calendar health check logic
- map revoked token or refresh failure to `NEEDS_REAUTH`
- map repeated execution failure to `FAILED`
- add reconnect action to client UI
- expose last checked and last sync metadata

### Decision Rules for Google Calendar

Set `CONNECTED` when:

- access token exists or can be refreshed
- provider health check passes

Set `NEEDS_REAUTH` when:

- refresh token missing
- refresh token invalid
- provider revokes consent
- callback exchange cannot refresh a previously valid connection

Set `FAILED` when:

- auth exists but operational sync repeatedly fails
- internal sync job errors exceed threshold

### Threshold Recommendation

Start simple:

- `FAILED` after 3 consecutive sync failures
- `DELAYED` health if no successful sync or check in the expected time window

### Client UI Changes

For OAuth providers, card actions become:

- `Connect`
- `Reconnect`
- `Disconnect`

Status display becomes:

- `Connected`
- `Needs Re-auth`
- `Failed`

### Acceptance Criteria

- client never sees `Connected` when OAuth is actually broken
- reconnect path is available for `Needs Re-auth`
- internal team can distinguish provider auth issues from sync failures

## Milestone 5: Connected By, Last Sync, and Health Metadata

### Objective

Expose enough information on integration cards to make them operationally useful.

### Deliverables

- add `connected by`
- add `connected at`
- add `last sync`
- add `health`
- add `last error` internally in admin/staff surfaces

### Client Card Metadata

Minimum visible metadata for live integrations:

- `Connected by John Doe`
- `Live since Mar 25, 2026`
- `Last synced 14 min ago`
- `Health: Healthy`

For assisted connections, if exact user is not appropriate to expose, use:

- `Configured by Maphari`

### Health Labels

- `Healthy`
- `Delayed`
- `Action Needed`
- `Unknown`

### Acceptance Criteria

- every live connection displays ownership and recency context
- health metadata is derived from persisted connection or sync-event data
- the admin/staff side exposes last error detail for troubleshooting

## Milestone 6: Sync Event and Health Infrastructure

### Objective

Create the system that powers real operational health, not just cosmetic labels.

### Deliverables

- add `IntegrationSyncEvent` model
- emit sync events from Google Calendar sync operations
- create a health computation utility in core service
- compute `healthStatus`, `lastSyncedAt`, `lastSuccessfulSyncAt`
- expose sync history for admin/staff

### Health Computation Rules

Suggested initial rules:

- `HEALTHY`
  - last successful sync within expected window
- `DELAYED`
  - no recent success but no hard auth failure
- `ACTION_NEEDED`
  - auth problem or repeated failed sync attempts
- `UNKNOWN`
  - not enough data yet

### Acceptance Criteria

- health labels are based on actual events
- admin/staff can inspect recent sync history
- client page reads from derived health, not guessed state

## Milestone 7: First New Client-Facing Integrations

### Objective

Ship the next set of integrations with the strongest practical client value.

### Build Order

1. `Slack`
2. `Google Drive`
3. `QuickBooks` or `Xero`
4. `Microsoft Teams`
5. `Zapier`

### Slack

Recommended first version:

- type: self-serve or semi-assisted
- features:
  - milestone alerts
  - approval reminders
  - escalation notifications
  - meeting reminders

### Google Drive

Recommended first version:

- type: assisted first
- features:
  - export approved deliverables
  - handoff folder sync
  - optional folder mapping per project

### QuickBooks / Xero

Recommended first version:

- type: assisted first
- features:
  - create invoice records downstream
  - later sync payment status back

### Microsoft Teams

Recommended first version:

- type: assisted
- features similar to Slack

### Zapier

Recommended first version:

- type: assisted
- outbound events only:
  - project created
  - milestone updated
  - invoice approved
  - support ticket escalated

### Acceptance Criteria

- at least two new providers move beyond catalog placeholders into real supported connections
- the same provider/request/connection model supports them without page rewrites

## Milestone 8: Admin Provider Management

### Objective

Allow product or operations to control provider rollout from the admin side.

### Deliverables

- provider management page
- edit provider label/description/category
- change rollout state
- toggle visibility
- toggle request enablement
- set sort order

### UI Recommendations

Route:

- `apps/web/src/components/admin/dashboard/pages/integration-providers-page.tsx`

Sections:

- visible providers
- beta providers
- hidden providers
- coming soon providers

### Acceptance Criteria

- no provider rollout requires a frontend release
- product/admin can reorder and update catalog metadata from the platform

## Engineering Breakdown by Layer

## Prisma and Database

Files expected:

- `services/core/prisma/schema.prisma`
- `services/core/prisma/migrations/...`

Likely tasks:

- add `IntegrationProvider`
- extend `ClientIntegrationRequest`
- add `ClientIntegrationConnection`
- add `IntegrationSyncEvent`
- regenerate Prisma client
- backfill initial provider data
- backfill Google Calendar connections where feasible

## Core Service

Files likely touched:

- `services/core/src/routes/integrations.ts`
- `services/core/src/routes/admin-integrations.ts` or similar
- `services/core/src/lib/...` for health computation and sync utilities

Likely tasks:

- replace hardcoded catalog with DB lookup
- add admin list/update endpoints
- unify portal response builder
- create request completion -> connection creation logic
- add health derivation
- record sync events for supported integrations

## Gateway

Files likely touched:

- `apps/gateway/src/routes/profile.controller.ts`
- new admin/staff controller for integration operations

Likely tasks:

- proxy provider admin endpoints
- proxy request operations endpoints
- proxy connection and sync event endpoints

## Web Client Portal

Files likely touched:

- `apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx`
- `apps/web/src/lib/api/portal/integrations.ts`

Likely tasks:

- consume backend-driven provider data only
- render richer operational states
- add reconnect flow
- show connected-by and sync-health metadata

## Web Admin or Staff Portal

Files likely created:

- integration requests page
- integration providers page
- related API clients under `apps/web/src/lib/api/admin/`

Likely tasks:

- request queue UI
- provider management UI
- connection health table or cards
- sync history panel if included in first pass

## Rollout Strategy

### Step 1

Ship provider catalog and request operations first. This gives operational control immediately.

### Step 2

Ship connection model and Google Calendar honesty states next. This makes the existing live integration trustworthy.

### Step 3

Ship one communication integration and one document or finance integration. This proves the model works beyond Google Calendar.

### Step 4

Open provider management and staged rollout controls for internal operations.

## Migration and Backfill Strategy

### Provider Backfill

- seed all current provider keys before switching client page to DB-driven mode
- keep key names stable permanently

### Request Backfill

- existing `ClientIntegrationRequest` rows remain valid
- map old provider strings to provider keys if needed

### Connection Backfill

For Google Calendar:

- where valid stored token preferences exist, create a `ClientIntegrationConnection`
- if user-level mapping is ambiguous, set metadata conservatively and mark health as `UNKNOWN` until checked

## Security and Permissions

### Client Permissions

- clients can only view their own catalog and request setup
- clients can only connect self-serve integrations they are allowed to manage

### Staff/Admin Permissions

- only staff/admin can assign, update, complete, or reject assisted requests
- only staff/admin can manage provider rollout config
- connection health details and error traces should be staff/admin scoped where sensitive

## Telemetry and Audit Requirements

At minimum, log and make inspectable:

- request created
- request assigned
- request moved to in-progress
- request completed
- request rejected
- connection created
- connection disconnected
- reconnect attempted
- sync run succeeded
- sync run failed

Audit metadata should include:

- actor user id
- actor role
- client id
- provider key
- request id or connection id
- timestamp

## Risks and Failure Modes

### Duplicate Connection Creation

Mitigation:

- upsert active connection by `(clientId, providerKey)` or enforce unique active constraint

### Catalog Drift

Mitigation:

- use seeded provider records and stable keys
- do not let frontend invent provider definitions

### OAuth State Ambiguity

Mitigation:

- connection status must be derived from explicit health checks and provider behavior
- do not infer healthy state just because a token row exists

### Operational Blind Spots

Mitigation:

- sync event history
- surfaced last error on internal views
- visible assignment ownership on request queues

## Milestone Sequence Summary

1. Backend-driven provider catalog
2. Staff/admin integration request operations view
3. Active connection model
4. OAuth honesty with `Needs Re-auth` and `Failed`
5. Connected-by, last sync, and health metadata
6. Sync event and health infrastructure
7. First new client-facing integrations
8. Admin provider management

## Definition of Done

This roadmap is considered complete when:

- provider catalog is backend-administered
- request lifecycle is operationally managed by staff/admin
- all live integrations use a real connection model
- Google Calendar exposes truthful auth and health states
- client cards display meaningful operational metadata
- at least two new integrations ship on the new model
- provider rollout no longer requires frontend catalog edits

## Immediate Implementation Start Order

Engineering should start in this order:

1. `services/core/prisma/schema.prisma`
  - add `IntegrationProvider`
  - extend `ClientIntegrationRequest`
  - add `ClientIntegrationConnection`
  - add `IntegrationSyncEvent`
2. `services/core/src/routes/integrations.ts`
  - switch to DB-backed provider catalog and connection-aware response assembly
3. admin/staff endpoints for request queue and provider management
4. admin/staff web pages for request operations
5. Google Calendar connection backfill and health logic
6. client integrations page metadata and reconnect UX
7. first new provider implementation

## Recommended First Build Slice

If the team wants the best first slice with immediate product value, do this subset first:

- Milestone 1
- Milestone 2
- Google Calendar parts of Milestone 4
- client metadata parts of Milestone 5

That combination gives:

- truthful catalog control
- staff operational control
- honest Google Calendar state
- better client trust without waiting for every later integration

## Final Build Pack

This section converts the roadmap into an implementation pack with concrete contracts, schema direction, state rules, UI structure, testing, and rollout guidance.

## Build Pack Boundaries

### In Scope

- client integrations page
- admin or staff integration operations page
- provider catalog management
- integration request lifecycle
- live connection model
- OAuth health and reconnect states
- sync health metadata
- backend-driven provider rollout

### Explicitly Out of Scope for Initial Delivery

- fully generalized secrets vaulting for every provider
- bidirectional sync for every future integration
- webhook ingestion for every provider
- billing reconciliation engine
- enterprise SCIM or SSO provider provisioning

Those can be added later, but they should not block the first operational release.

## Canonical Architecture

The integrations subsystem should be built around this flow:

1. `IntegrationProvider` defines what can be shown and requested.
2. `ClientIntegrationRequest` captures client demand and internal fulfillment.
3. `ClientIntegrationConnection` represents the real live configured state.
4. `IntegrationSyncEvent` records operational sync history and health signals.

The client catalog response should be a composed read model built from all four sources rather than a direct mirror of any single table.

## Proposed Prisma Schema Direction

The exact schema may need to adapt to existing repo conventions, but the functional shape should match this.

### IntegrationProvider

```prisma
model IntegrationProvider {
  id                   String   @id @default(uuid())
  key                  String   @unique
  label                String
  description          String
  category             String
  kind                 String
  availabilityStatus   String   @default("active")
  iconKey              String
  isClientVisible      Boolean  @default(true)
  isRequestEnabled     Boolean  @default(false)
  supportsDisconnect   Boolean  @default(false)
  supportsReconnect    Boolean  @default(false)
  supportsHealthChecks Boolean  @default(false)
  sortOrder            Int      @default(0)
  launchStage          String?
  helpUrl              String?
  setupGuideUrl        String?
  metadata             Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  connections          ClientIntegrationConnection[]

  @@index([isClientVisible, sortOrder])
  @@index([availabilityStatus, sortOrder])
  @@map("integration_providers")
}
```

### ClientIntegrationRequest

```prisma
model ClientIntegrationRequest {
  id                String   @id @default(uuid())
  clientId          String
  provider          String
  status            String   @default("REQUESTED")
  requestedByUserId String?
  assignedToUserId  String?
  notes             String?
  completedByUserId String?
  rejectedReason    String?
  priority          String?
  requestedVia      String?
  sourceContext     Json?
  completedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  client            Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId, createdAt])
  @@index([clientId, provider, status])
  @@index([status, assignedToUserId, createdAt])
  @@map("client_integration_requests")
}
```

### ClientIntegrationConnection

```prisma
model ClientIntegrationConnection {
  id                    String   @id @default(uuid())
  clientId              String
  providerId            String
  providerKey           String
  status                String
  connectionType        String
  connectedByUserId     String?
  connectedByContactEmail String?
  assignedOwnerUserId   String?
  connectedAt           DateTime?
  disconnectedAt        DateTime?
  lastCheckedAt         DateTime?
  lastSyncedAt          DateTime?
  lastSuccessfulSyncAt  DateTime?
  lastErrorCode         String?
  lastErrorMessage      String?
  healthStatus          String?
  configurationSummary  Json?
  externalAccountId     String?
  externalAccountLabel  String?
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  client                Client              @relation(fields: [clientId], references: [id], onDelete: Cascade)
  provider              IntegrationProvider @relation(fields: [providerId], references: [id], onDelete: Restrict)
  syncEvents            IntegrationSyncEvent[]

  @@unique([clientId, providerKey])
  @@index([clientId, status])
  @@index([providerKey, status])
  @@index([healthStatus, updatedAt])
  @@map("client_integration_connections")
}
```

### IntegrationSyncEvent

```prisma
model IntegrationSyncEvent {
  id           String   @id @default(uuid())
  connectionId String
  clientId     String
  providerKey  String
  status       String
  startedAt    DateTime
  finishedAt   DateTime?
  durationMs   Int?
  summary      String?
  errorCode    String?
  errorMessage String?
  details      Json?
  createdAt    DateTime @default(now())

  connection   ClientIntegrationConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([connectionId, createdAt])
  @@index([clientId, providerKey, createdAt])
  @@map("integration_sync_events")
}
```

## Schema Migration Rules

1. Do not drop the current `ClientIntegrationRequest` table.
2. Additive migrations only for the first release.
3. Keep current provider string values stable.
4. Add new provider table and backfill records before switching reads to it.
5. Create connection records for Google Calendar where recoverable from current stored preferences.

## Canonical Provider Seed Set

The first seed should include these records.

| Key | Label | Category | Kind | Availability | Request Enabled | Disconnect | Reconnect | Health Checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `gcal` | Google Calendar | calendar | oauth | active | false | true | true | true |
| `slack` | Slack | communication | oauth | beta | false | true | true | true |
| `msteams` | Microsoft Teams | communication | assisted | active | true | false | false | false |
| `gdrive` | Google Drive | files | assisted | beta | true | false | false | false |
| `dropbox` | Dropbox | files | assisted | active | true | false | false | false |
| `quickbooks` | QuickBooks | finance | assisted | beta | true | false | false | false |
| `xero` | Xero | finance | assisted | active | true | false | false | false |
| `zapier` | Zapier | automation | coming_soon | coming_soon | false | false | false | false |
| `hubspot` | HubSpot | crm | coming_soon | coming_soon | false | false | false | false |
| `salesforce` | Salesforce | crm | coming_soon | coming_soon | false | false | false | false |
| `notion` | Notion | documentation | coming_soon | coming_soon | false | false | false | false |
| `jira` | Jira | project_management | coming_soon | coming_soon | false | false | false | false |
| `asana` | Asana | project_management | coming_soon | coming_soon | false | false | false | false |
| `clickup` | ClickUp | project_management | coming_soon | coming_soon | false | false | false | false |
| `docusign` | DocuSign | approvals | coming_soon | coming_soon | false | false | false | false |
| `pandadoc` | PandaDoc | approvals | coming_soon | coming_soon | false | false | false | false |
| `sharepoint` | SharePoint | files | assisted | beta | true | false | false | false |

## API Contract Pack

All API responses should continue to use the shared `ApiResponse<T>` envelope.

## Client-Facing Contracts

### GET `/portal/settings/integrations`

Purpose:

- return the rendered client integrations catalog with provider info, request info, and connection info already merged

Response item shape:

```ts
type PortalIntegrationCard = {
  providerId: string;
  providerKey: string;
  label: string;
  description: string;
  category: string;
  iconKey: string;
  kind: "oauth" | "assisted" | "coming_soon";
  availabilityStatus: "active" | "beta" | "hidden" | "coming_soon" | "deprecated";
  requestEnabled: boolean;
  supportsDisconnect: boolean;
  supportsReconnect: boolean;
  supportsHealthChecks: boolean;
  request: {
    id: string | null;
    status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED" | null;
    requestedAt: string | null;
    completedAt: string | null;
  };
  connection: {
    id: string | null;
    status: "CONNECTED" | "DISCONNECTED" | "NEEDS_REAUTH" | "FAILED" | "PAUSED" | null;
    healthStatus: "HEALTHY" | "DELAYED" | "ACTION_NEEDED" | "UNKNOWN" | null;
    connectedAt: string | null;
    disconnectedAt: string | null;
    lastCheckedAt: string | null;
    lastSyncedAt: string | null;
    lastSuccessfulSyncAt: string | null;
    connectedByName: string | null;
    connectedByType: "client" | "staff" | "system" | null;
    externalAccountLabel: string | null;
  };
  displayState: {
    tone: "neutral" | "blue" | "green" | "amber" | "red";
    badge: string;
    action: "connect" | "reconnect" | "disconnect" | "request_setup" | "none";
    helperText: string | null;
  };
};
```

Display state should be derived on the backend so the client page remains thin and consistent.

### POST `/portal/settings/integrations/requests`

Purpose:

- create a new assisted integration request

Request body:

```json
{
  "providerKey": "xero"
}
```

Validation rules:

- provider must exist
- provider must be client visible
- provider must be request enabled
- provider kind must be `assisted`
- duplicate open requests for same client and provider should return existing request or a validation error

Response:

- created or existing `ClientIntegrationRequest`

### POST `/portal/settings/integrations/:providerKey/reconnect`

Purpose:

- restart self-serve auth for OAuth providers in `NEEDS_REAUTH` or `FAILED`

Initial release note:

- implement for Google Calendar only

### DELETE `/portal/settings/integrations/:providerKey/disconnect`

Purpose:

- disconnect a self-serve integration

Rules:

- only if provider supports disconnect
- should update connection status rather than deleting history

## Staff/Admin Contracts

### GET `/admin/integrations/providers`

Purpose:

- return provider catalog entries for internal management

Filters:

- `availabilityStatus`
- `kind`
- `isClientVisible`
- `isRequestEnabled`

### PATCH `/admin/integrations/providers/:providerId`

Purpose:

- update rollout configuration

Allowed fields:

- `label`
- `description`
- `category`
- `availabilityStatus`
- `isClientVisible`
- `isRequestEnabled`
- `supportsDisconnect`
- `supportsReconnect`
- `supportsHealthChecks`
- `sortOrder`
- `helpUrl`
- `setupGuideUrl`
- `launchStage`
- `iconKey`
- `metadata`

### GET `/admin/integration-requests`

Purpose:

- list requests for operations management

Query params:

- `status`
- `providerKey`
- `clientId`
- `assignedToUserId`
- `dateFrom`
- `dateTo`
- `search`

Response item shape:

```ts
type AdminIntegrationRequestItem = {
  id: string;
  clientId: string;
  clientName: string;
  providerKey: string;
  providerLabel: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
  requestedByUserId: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  notes: string | null;
  rejectedReason: string | null;
  requestedAt: string;
  completedAt: string | null;
  completedByUserId: string | null;
};
```

### PATCH `/admin/integration-requests/:requestId`

Purpose:

- update assignment, notes, and lifecycle state

Request body:

```json
{
  "status": "IN_PROGRESS",
  "assignedToUserId": "user_123",
  "notes": "Waiting on tenant admin consent."
}
```

Allowed transitions:

- `REQUESTED` -> `IN_PROGRESS`
- `REQUESTED` -> `REJECTED`
- `IN_PROGRESS` -> `COMPLETED`
- `IN_PROGRESS` -> `REJECTED`
- `REQUESTED` -> `CANCELLED`

Restricted transitions:

- cannot move `COMPLETED` back to `REQUESTED`
- cannot move `REJECTED` to `COMPLETED` without creating a new request or explicit reopen logic

### GET `/admin/integration-connections`

Purpose:

- view active and broken connections

Filters:

- `status`
- `healthStatus`
- `providerKey`
- `clientId`

### GET `/admin/integration-connections/:connectionId/sync-events`

Purpose:

- inspect sync history for troubleshooting

## State Machine Pack

## Provider State Rules

The provider record determines what can be shown or requested.

- `hidden`
  - not visible to clients
- `coming_soon`
  - visible if `isClientVisible = true`
  - not requestable unless explicitly enabled, though default should be false
- `active`
  - can appear live and be requestable depending on type and flags
- `deprecated`
  - visible only if product wants to communicate sunsetting

## Request Lifecycle Rules

### REQUESTED

Meaning:

- client requested assisted setup
- no operational work has started

Allowed actions:

- assign owner
- add notes
- move to `IN_PROGRESS`
- reject
- cancel

### IN_PROGRESS

Meaning:

- internal team is actively setting up the integration

Allowed actions:

- update notes
- change assignee
- complete
- reject

### COMPLETED

Meaning:

- the request has been fulfilled
- a connection record must exist or be created in the same transaction boundary where practical

Rules:

- completion should upsert `ClientIntegrationConnection`
- `completedAt` and `completedByUserId` must be set

### REJECTED

Meaning:

- request cannot be fulfilled

Rules:

- `rejectedReason` required

### CANCELLED

Meaning:

- request withdrawn or invalidated before fulfillment

## Connection State Rules

### CONNECTED

Meaning:

- provider setup completed and operationally valid

### DISCONNECTED

Meaning:

- previously connected but intentionally disabled

### NEEDS_REAUTH

Meaning:

- provider auth has broken and user action is required

### FAILED

Meaning:

- integration is configured but operationally failing beyond acceptable threshold

### PAUSED

Meaning:

- integration is intentionally paused by internal operations

## Display State Resolution Rules

The backend should resolve raw state into one client-ready display state.

### OAuth Provider Resolution

1. if connection status is `NEEDS_REAUTH`, show:
  - badge: `Needs Re-auth`
  - tone: `amber`
  - action: `reconnect`
2. if connection status is `FAILED`, show:
  - badge: `Failed`
  - tone: `red`
  - action: `reconnect`
3. if connection status is `CONNECTED`, show:
  - badge: `Connected`
  - tone: `green`
  - action: `disconnect`
4. otherwise if active and not connected:
  - badge: `Available`
  - tone: `neutral`
  - action: `connect`

### Assisted Provider Resolution

1. if request status is `IN_PROGRESS`, show:
  - badge: `In Setup`
  - tone: `blue`
  - action: `none`
2. if connection status is `CONNECTED`, show:
  - badge: `Connected`
  - tone: `green`
  - action: `none`
3. if request status is `REQUESTED`, show:
  - badge: `Requested`
  - tone: `blue`
  - action: `none`
4. if provider is request-enabled and no open request or connection exists:
  - badge: `Available`
  - tone: `neutral`
  - action: `request_setup`
5. if provider is coming soon:
  - badge: `Coming Soon`
  - tone: `amber`
  - action: `none`

## UI Build Pack

## Client Page Specification

Primary file:

- `apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx`

Supporting file:

- `apps/web/src/lib/api/portal/integrations.ts`

### Page Goals

- help the client understand what is available
- show truthful current integration state
- make request/connect actions obvious
- expose enough metadata to build trust

### Page Structure

1. Header shell
- title: `Integrations`
- subtitle explaining tool connectivity
- summary cards:
  - total visible providers
  - live connections
  - in setup
  - action needed
  - coming soon

2. Informational banner
- explain self-serve vs assisted integrations
- optionally include a support or help-link CTA

3. Primary card grid
- each card shows:
  - icon
  - label
  - category
  - description
  - status badge
  - helper copy
  - metadata line
  - action area

### Client Card Metadata Rules

For assisted connected:

- `Configured by Maphari`
- `Live since Mar 25, 2026`
- `Health: Healthy`

For OAuth connected:

- `Connected by jane@client.com`
- `Last checked 8 min ago`
- `Last synced 12 min ago`

For needs re-auth:

- `Connection needs to be renewed to continue syncing.`

For failed:

- `Sync is failing. Reconnect or contact support.`

### Empty States

If all providers are hidden or unavailable:

- headline: `No integrations available yet`
- subcopy: `Your portal does not have any visible integrations enabled right now.`

If no live connections:

- keep cards visible
- do not hide catalog

### Visual Rules

- preserve glass UI language
- no flat placeholder surfaces
- status treatment should mirror other dashboard badge patterns
- use consistent spacing between description, metadata, and action area

## Admin/Staff Request Operations Page Specification

Primary file candidates:

- `apps/web/src/components/admin/dashboard/pages/integration-requests-page.tsx`
- or `apps/web/src/components/staff/staff-dashboard/pages/integration-requests-page.tsx`

Supporting files:

- `apps/web/src/lib/api/admin/integrations.ts`
- CSS module additions in dashboard styles

### Page Goals

- provide a fast operational queue
- show ownership and status at a glance
- make transition actions low-friction

### Page Structure

1. Header shell
- title: `Integration Requests`
- summary metrics:
  - requested
  - in setup
  - completed this week
  - rejected

2. Filter bar
- status
- provider
- assignee
- client search

3. Queue list or kanban columns
- default recommendation: table on desktop, cards on mobile

4. Request detail panel
- full note history
- assignment
- transition controls
- connection creation summary

### Operations Actions

- `Assign to me`
- `Move to In Setup`
- `Complete Setup`
- `Reject Request`
- `Save Notes`

### Completion UX

Completing a request should prompt for:

- external account label
- connected by
- optional configuration summary
- optional internal notes

This supports creating the live connection record correctly.

## Admin Provider Management Page Specification

Primary file candidate:

- `apps/web/src/components/admin/dashboard/pages/integration-providers-page.tsx`

### Page Goals

- allow internal control of what clients see
- avoid frontend deploys for provider rollout

### Page Sections

- active providers
- beta providers
- coming soon
- hidden
- deprecated

### Editable Fields

- label
- description
- category
- sort order
- visibility
- request enabled
- disconnect support
- reconnect support
- health check support
- help URL
- setup guide URL

## Google Calendar Operational Design

Google Calendar is the first provider that must fully use the new connection model.

## Current Reality

- auth tokens live in user preferences
- client page can connect and disconnect
- sync capability exists
- health and connection truth are not yet fully modeled

## Target Design

On successful OAuth callback:

1. store or update token preferences
2. upsert `ClientIntegrationConnection` for provider `gcal`
3. set:
  - `status = CONNECTED`
  - `connectionType = oauth`
  - `connectedByUserId = current user`
  - `connectedAt = now()` if first connect
  - `lastCheckedAt = now()`
  - `healthStatus = HEALTHY` or `UNKNOWN` depending on first check

On disconnect:

1. remove or invalidate token preferences
2. update connection:
  - `status = DISCONNECTED`
  - `disconnectedAt = now()`

On refresh failure or revoked consent:

1. update connection:
  - `status = NEEDS_REAUTH`
  - `healthStatus = ACTION_NEEDED`
  - `lastErrorCode`
  - `lastErrorMessage`

On repeated sync failures:

1. write sync events
2. if threshold exceeded:
  - `status = FAILED`
  - `healthStatus = ACTION_NEEDED`

## Health Check and Sync Rules

### Health Check

Can be performed:

- lazily during status fetch
- explicitly during sync
- later via scheduled background job

Initial implementation recommendation:

- update `lastCheckedAt` whenever Google status is fetched or token refresh occurs
- if refresh succeeds, keep or return to `CONNECTED`
- if refresh fails, set `NEEDS_REAUTH`

### Sync Event Thresholds

Start with:

- `FAILED` after 3 consecutive failed sync events
- `DELAYED` if no successful sync within expected service window

## Background Jobs Pack

Full job infrastructure is not required in the first slice, but the design should assume it.

### Job Types

- provider health check job
- sync execution job
- reconnect reminder job

### Initial Implementation Recommendation

For first release:

- compute health opportunistically in request handlers and sync handlers

For second release:

- add scheduled jobs in automation or core service

## Audit and Telemetry Contract

Every mutable integration action should create structured logs.

### Events to Log

- provider created or updated
- client request created
- request assigned
- request moved to in progress
- request completed
- request rejected
- connection created
- connection updated
- connection disconnected
- reconnect started
- reconnect completed
- health check failed
- sync event succeeded
- sync event failed

### Required Log Fields

- `requestId`
- `traceId`
- `actorUserId`
- `actorRole`
- `clientId`
- `providerKey`
- `integrationRequestId` if applicable
- `integrationConnectionId` if applicable
- `eventName`
- `timestamp`

## Testing Build Pack

Testing must be split by layer.

## Unit Tests

Target:

- status resolution functions
- health derivation functions
- request transition validators
- provider visibility and requestability rules

Cases:

- OAuth provider with valid connection resolves to `Connected`
- OAuth provider with revoked auth resolves to `Needs Re-auth`
- assisted provider with `REQUESTED` resolves to `Requested`
- assisted provider with `IN_PROGRESS` resolves to `In Setup`
- assisted provider with connection resolves to `Connected`
- invalid request transitions are rejected

## Core Integration Tests

Target:

- provider catalog read path
- request creation path
- request update path
- connection creation on completion
- Google reconnect/disconnect state transitions

Cases:

- client cannot request a hidden provider
- client cannot request a non-request-enabled provider
- duplicate open request behavior is stable
- completing a request upserts connection once
- disconnect marks connection disconnected rather than removing history

## Gateway Tests

Target:

- proxy behavior
- role enforcement
- tenant scope propagation

Cases:

- client can read portal integrations
- client cannot access admin request queue
- staff can patch request state
- provider admin endpoints are staff/admin only

## Web UI Tests

Target:

- client integrations page state rendering
- request action behavior
- admin operations page filtering and transitions

Cases:

- `Requested` card renders blue badge and disabled action state
- `In Setup` card renders correct helper text
- `Needs Re-auth` card renders reconnect action
- completion in admin page updates queue and card state

## Manual QA Checklist

### Client

- can view provider catalog
- can request an assisted integration
- cannot request the same open integration repeatedly
- can reconnect Google Calendar after auth failure
- sees `Connected`, `Requested`, `In Setup`, `Needs Re-auth`, and `Failed` correctly

### Staff/Admin

- can view request queue
- can assign requests
- can transition requests legally
- completing a request creates a live connection
- can view connection health and sync metadata
- can update provider visibility and request enablement

## Environment Rollout Checklist

## Local

- apply migration
- seed providers
- regenerate Prisma client
- verify portal integrations page
- verify admin operations page

## Staging

- run migration
- run provider seed
- backfill Google Calendar connections
- verify current existing requests still render
- verify one request lifecycle from request to complete
- verify one broken OAuth path to `Needs Re-auth`

## Production

- deploy additive migration first
- deploy code that writes new tables but can still tolerate missing backfilled data
- run seed and backfill
- smoke test portal integrations and admin request queue
- enable provider management page only for internal roles

## Backfill Execution Detail

### Provider Backfill Script

Create a seed or idempotent upsert script that:

- inserts missing providers
- updates non-sensitive metadata for existing keys
- never renames keys

### Google Calendar Connection Backfill Script

Steps:

1. find users with `gcal_access_token` or `gcal_refresh_token`
2. resolve client and user ownership
3. upsert `ClientIntegrationConnection` with:
  - provider key `gcal`
  - connection type `oauth`
  - status `CONNECTED` if token looks valid enough to start, otherwise `UNKNOWN` via health fields
4. set `connectedAt` conservatively from preference timestamps if nothing better exists

If ownership cannot be resolved confidently:

- skip and log
- do not create guessed records

## File-by-File Execution Plan

## Phase A: Data Model

Files:

- `services/core/prisma/schema.prisma`
- `services/core/prisma/migrations/<timestamp>_integration_platform_build_pack/migration.sql`
- optional seed script location already used in repo

Tasks:

- add `IntegrationProvider`
- extend `ClientIntegrationRequest`
- add `ClientIntegrationConnection`
- add `IntegrationSyncEvent`
- add relations on `Client`

## Phase B: Core Read Model and Request Flow

Files:

- `services/core/src/routes/integrations.ts`
- possible helper file for status resolution

Tasks:

- read providers from DB
- merge requests and connections into client card response
- move display-state calculation into backend helper
- preserve Google Calendar logic while redirecting state into connection model

## Phase C: Admin Operations APIs

Files:

- `services/core/src/routes/...` new admin integrations route
- `apps/gateway/src/routes/...` new controller or extend existing controller

Tasks:

- provider management endpoints
- request queue endpoints
- connection list and sync history endpoints

## Phase D: Web Portal Client

Files:

- `apps/web/src/lib/api/portal/integrations.ts`
- `apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx`

Tasks:

- adopt new card response shape
- remove any remaining frontend state inference
- render `Needs Re-auth`, `Failed`, `In Setup`, `Connected`
- surface metadata lines

## Phase E: Admin or Staff UI

Files:

- `apps/web/src/lib/api/admin/integrations.ts`
- new admin/staff dashboard page components
- dashboard routing and navigation files

Tasks:

- request queue page
- provider management page
- optional connection health page if capacity allows in first pass

## Ticket Breakdown

This can be created as engineering tickets directly.

### Ticket 1

Add provider catalog model and migration.

### Ticket 2

Backfill provider seed records and switch client catalog route to DB-backed providers.

### Ticket 3

Add connection model and Google Calendar connection upsert logic.

### Ticket 4

Add request queue API and request lifecycle transitions.

### Ticket 5

Add admin or staff integration request operations page.

### Ticket 6

Add provider management API and page.

### Ticket 7

Add Google Calendar `Needs Re-auth` and `Failed` states with reconnect UX.

### Ticket 8

Add sync events and health derivation.

### Ticket 9

Add client card metadata: connected by, last checked, last synced, health.

### Ticket 10

Ship first new integration on the new model, preferably Slack or Google Drive.

## Non-Negotiable Acceptance Gates

The build pack is not done unless all of the following are true:

- no frontend hardcoded provider catalog remains for the client page
- no card shows `Connected` without a `ClientIntegrationConnection`
- no assisted request completion exists without creating or reconciling a connection
- Google Calendar can enter `Needs Re-auth`
- client can see a reconnect path for broken OAuth
- staff/admin can process requests operationally
- provider rollout can be changed without a frontend deployment

## Recommended First Sprint Scope

If the team needs a practical first sprint, use this:

1. provider model and seed
2. request table extension
3. connection model
4. DB-backed client catalog route
5. request queue API
6. admin/staff request queue page
7. Google Calendar `Needs Re-auth`

That is the smallest slice that materially upgrades the product from “catalog with some real hooks” to “operational integrations platform.”
