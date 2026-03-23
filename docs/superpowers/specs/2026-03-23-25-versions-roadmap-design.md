# Maphari Technologies — 25-Version Release Roadmap Design Spec

**Date:** 2026-03-23
**Status:** Approved
**Scope:** v1.0 (current baseline) through v1.24 — 25 sequential software releases structured in 5 progressive complexity waves.

---

## Overview

The platform ships as 25 milestone releases. Each release is a large, deployable feature cluster containing 8–12 improvements spanning UI, functional, and backend concerns. Version numbering starts at v1.0 (the current platform as shipped) and progresses to v1.24.

### Structure

- **Wave 1 (v1.1–v1.4):** Foundation & Stabilization — fix stubs, wire dormant systems, activate existing infrastructure
- **Wave 2 (v1.5–v1.9):** Core Feature Expansion — new DB models, routes, and portal pages that make the platform indispensable
- **Wave 3 (v1.10–v1.14):** Intelligence & Automation — AI insights, analytics depth, automation engine, notification intelligence, document AI
- **Wave 4 (v1.15–v1.19):** Collaboration & Growth — community forum, public API, integrations, client self-service, white-label
- **Wave 5 (v1.20–v1.24):** Scale & Polish — landing page overhaul, design system, mobile/PWA, performance, developer experience

---

## v1.0 — Current Platform (Baseline)

Already shipped:
- 53 client portal pages (all production-wired)
- 43 staff dashboard pages
- Admin dashboard (4 stub pages pending fix)
- Community forum + feature request Prisma models added
- Analytics dashboard, NPS survey, file approval workflow, onboarding wizard, platform status page
- 165+ real API functions across gateway
- EventBus wired across 5 microservices
- RBAC via `x-user-role` + `scope.ts`

---

## Wave 1: Foundation & Stabilization

---

### v1.1 — Admin Backend Hardening

**Theme:** Make the admin portal fully functional. No stubs, no static data, no hardcoded arrays.

#### Database — New Models

```prisma
model Crisis {
  id          String    @id @default(cuid())
  title       String
  severity    String    // LOW | MEDIUM | HIGH | CRITICAL
  status      String    // ACTIVE | MONITORING | RESOLVED
  description String?
  ownerId     String?
  clientId    String?
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ComplianceRecord {
  id        String   @id @default(cuid())
  area      String   // GDPR | POPIA | SARS | ISO27001
  status    String   // COMPLIANT | AT_RISK | NON_COMPLIANT
  riskLevel String   // LOW | MEDIUM | HIGH
  lastAudit DateTime
  nextAudit DateTime
  notes     String?
  createdAt DateTime @default(now())
}

model DataRetentionPolicy {
  id          String    @id @default(cuid())
  dataType    String
  retainYears Int
  lastPurge   DateTime?
  nextPurge   DateTime
  status      String    // CURRENT | DUE | OVERDUE
  createdAt   DateTime  @default(now())
}

model FyChecklistItem {
  id         String    @id @default(cuid())
  fiscalYear String    // "2025-2026"
  label      String
  category   String    // REVENUE | TAX | PAYROLL | ARCHIVE
  done       Boolean   @default(false)
  doneAt     DateTime?
  doneBy     String?
  createdAt  DateTime  @default(now())
}
```

#### Backend — New Routes (core service)

- `GET|POST|PATCH /crises` — crisis CRUD
- `GET|PATCH /compliance` — compliance records + status updates
- `GET /data-retention` — retention policy list
- `GET|PATCH /fy-checklist` — checklist items per fiscal year

#### Backend — New Gateway Controllers

- `crises.controller.ts` — proxies all crisis routes, admin-only guard
- `compliance.controller.ts` — proxies compliance + data-retention routes
- `fy-checklist.controller.ts` — proxies checklist routes

#### Frontend — UI Changes

- `crisis-command-page.tsx` — replace static `[]` with `useEffect` + real API; "Log Crisis" button + severity badges; loading/error states
- `quality-assurance-page.tsx` — wire to existing deliverables endpoint with admin scope; approve/reject buttons functional
- `legal-page.tsx` — compliance tab and data-retention tab wired to DB; editable status dropdowns
- `financial-year-closeout-page.tsx` — 15 checklist items persisted per fiscal year; checkbox saves to DB with timestamp + who checked it

#### Functional

- Seed script populates initial compliance records (6 areas) and FY checklist (15 items) on first run
- All 4 pages show skeleton loaders while fetching and proper empty states

---

### v1.2 — Real-Time Layer Activation

**Theme:** The realtime infrastructure (Ably, `realtime.controller.ts`, `stream-token.controller.ts`) exists but is dormant. Make it the default for all three portals.

#### Database

No new models — uses existing event system.

#### Backend — Changes

- `realtime.controller.ts` — add broadcast helpers for `project.updated`, `lead.created`, `invoice.paid`, `milestone.completed` events
- `services/core` — publish to Ably channel on every relevant mutation
- New EventBus topics: `realtime.projectUpdated`, `realtime.invoicePaid`, `realtime.milestoneCompleted`

#### Frontend — UI Changes

- Admin topbar — subtle pulsing "● Live" indicator when Ably connected
- Admin executive dashboard — auto-refreshes project status on `project.updated` event
- Admin leads page — badge increments instantly on `lead.created`
- Admin revenue section — chart updates on `invoice.paid`
- Client dashboard — subscribes to `client:{clientId}` channel on mount
- Client home — toast banner on `milestone.completed`
- Client notification badge — increments instantly on `invoice.created`
- Staff — presence dot on team structure page

#### Functional

- Ably token fetched on portal mount via existing `GET /realtime/token`
- Graceful fallback to polling if Ably unavailable
- Channels scoped by role: `admin:global`, `staff:{staffId}`, `client:{clientId}`

---

### v1.3 — Communication Foundations

**Theme:** Break down silos. Staff and clients can communicate directly. Everyone shares one calendar. Search actually works everywhere.

#### Database — New Models

```prisma
model CalendarEvent {
  id          String   @id @default(cuid())
  title       String
  startAt     DateTime
  endAt       DateTime
  type        String   // APPOINTMENT | MILESTONE | INVOICE_DUE | LEAVE | SPRINT
  sourceId    String
  sourceType  String
  roles       String[]
  clientId    String?
  staffId     String?
  createdAt   DateTime @default(now())
}
```

#### Backend — New Routes

- `GET /calendar/events?from=&to=&role=` — unified event aggregation
- `GET /calendar/export.ics` — iCal format export
- `POST /conversations` — extend to allow STAFF role as creator
- `GET /search?role=&q=` — add role-based scope filtering

#### Backend — Gateway Changes

- `calendar.controller.ts` — new, all roles with scoped access
- `conversations.controller.ts` — add `createdByRole` field, allow STAFF origin

#### Frontend — UI Changes

- Admin: `booking-appointments-page.tsx` — month calendar view with week/month toggle
- Staff: new `calendar-page.tsx` — assigned milestones + leave + sprint deadlines
- Client: `book-call-page.tsx` — full calendar view of upcoming events
- Staff: `client-threads-page.tsx` — "New Message" button targeting a specific client
- Client: `messages-page.tsx` — surfaces staff-initiated threads
- Admin command palette — wired to `/search?role=ADMIN&q=`
- Staff command palette — wired to `/search?role=STAFF&q=`
- All portals: iCal download button on calendar views

#### Functional

- Calendar events computed server-side from existing tables
- Staff message to client triggers notification to client portal

---

### v1.4 — Staff Empowerment Suite

**Theme:** Give staff the tools to manage their own performance, goals, and time.

#### Database — New Models

```prisma
model StaffGoal {
  id          String   @id @default(cuid())
  staffUserId String
  title       String
  description String?
  targetDate  DateTime
  progress    Int      @default(0) // 0-100
  status      String   @default("ACTIVE") // ACTIVE | ACHIEVED | CANCELLED
  quarter     String   // "Q1-2026"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model PeerReview {
  id          String    @id @default(cuid())
  reviewerId  String
  revieweeId  String
  quarter     String
  status      String    // DRAFT | SUBMITTED
  submittedAt DateTime?
  createdAt   DateTime  @default(now())
}

model PeerReviewAnswer {
  id           String  @id @default(cuid())
  peerReviewId String
  question     String  // COMMUNICATION | DELIVERY | TEAMWORK | INITIATIVE | OVERALL
  score        Int     // 1-5
  comment      String?
}
```

#### Existing Model Changes

- `TimeEntry` — add `status String @default("DRAFT")`, `submittedAt DateTime?`, `approvedAt DateTime?`, `approvedBy String?`

#### Backend — New Routes

- `GET|POST|PATCH /staff-goals` — own goals CRUD
- `GET|POST /peer-reviews` — submit review, view received after cycle close
- `PATCH /time-entries/:id/submit` — staff submits a week
- `PATCH /time-entries/:id/approve` — admin approves
- `PATCH /time-entries/:id/reject` — admin rejects with reason

#### Frontend — UI Changes

- Staff: new `my-goals-page.tsx` — OKR layout, quarterly filter tabs, circular progress rings, add/edit modal, "Mark Achieved" button
- Staff: new `peer-review-page.tsx` — nominate peers, 5-question scored form, submission confirmation
- Staff: `time-log-page.tsx` — "Submit Week" button, status badge per entry
- Admin: HR/payroll page — pending timesheets queue with approve/reject + rejection reason modal
- Staff: `mycapacity-page.tsx` — weekly bar chart (hours allocated vs. available), colour-coded by project, "Flag Overload" button
- Staff nav — add "My Goals" and "Peer Reviews" entries

#### Functional

- Peer review cycle: quarterly auto-open/close via cron
- Submitted timesheets locked for editing until rejected
- Approved timesheet triggers payroll calculation event

---

## Wave 2: Core Feature Expansion

---

### v1.5 — Client Portal Enrichment

**Theme:** The client portal goes from informational to interactive.

#### Database — New Models

```prisma
model DeliverableAnnotation {
  id            String    @id @default(cuid())
  deliverableId String
  clientId      String
  comment       String
  pageNumber    Int?
  resolvedAt    DateTime?
  createdAt     DateTime  @default(now())
}
```

#### Backend — New Routes

- `GET|POST /annotations?deliverableId=` — fetch/create annotations
- `PATCH /annotations/:id/resolve` — mark resolved
- `GET /projects/portfolio?clientId=` — aggregated portfolio KPIs

#### Backend — Gateway Changes

- `annotations.controller.ts` — new, client-scoped guard
- `projects.controller.ts` — add `/portfolio` endpoint

#### Frontend — UI Changes

- Client: `deliverables-page.tsx` — slide-out annotation panel; comment thread per deliverable; "Resolve" toggle; unresolved count badge
- Client: `messages-page.tsx` topbar — "Start Video Call" button; opens `video-room-modal.tsx`
- Client: new `video-room-modal.tsx` — room link, passcode, copy-to-clipboard, waiting countdown
- Client: `my-projects-page.tsx` — portfolio summary strip: aggregate health score ring, total budget bar, combined RED alert strip
- Client dashboard — `milestone.completed` Ably event shows toast banner

#### Functional

- Portfolio KPIs computed server-side from existing projects + invoices
- Video room auto-creates a `CalendarEvent` for the session
- Staff notified when client starts an instant video room
- Annotations visible to assigned staff in deliverable detail view

---

### v1.6 — Admin Finance Intelligence

**Theme:** Turn raw invoice data into actionable finance insight.

#### Database — New Models

```prisma
model InvoiceChaseLog {
  id        String   @id @default(cuid())
  invoiceId String
  level     String   // GENTLE | FIRM | ESCALATED
  sentAt    DateTime @default(now())
  sentBy    String?
  note      String?
}

model ContractRenewal {
  id             String    @id @default(cuid())
  contractId     String
  expiresAt      DateTime
  status         String    // GREEN | AMBER | RED | EXPIRED
  renewalSent    Boolean   @default(false)
  renewalSentAt  DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

#### Backend — New Routes

- `GET /analytics/clv` — CLV + churn risk per client derived from invoices + projects
- `POST /invoices/bulk-chase` — loops chase over all overdue invoices; logs each
- `GET /invoice-chase-logs?invoiceId=` — chase history per invoice
- `GET /contracts/renewals` — all contracts with computed `daysUntilExpiry` and `status`
- `POST /contracts/:id/send-renewal` — triggers proposal creation pre-filled with contract data

#### Frontend — UI Changes

- Admin: new `clv-analytics-page.tsx` — ranked client table by CLV; churn risk bar per client; projected annual revenue; segment filter
- Admin: `invoices-page.tsx` — "Days Overdue" badge; escalation level chip; "Chase All Overdue" bulk button; chase history drawer
- Admin: new `contract-renewal-page.tsx` — timeline list sorted by expiry; traffic-light indicators; "Send Renewal Proposal" button
- Admin: executive dashboard — "Contracts Expiring This Month" widget
- Admin nav — add "CLV Analytics" and "Contract Renewals"

#### Functional

- CLV computed on-the-fly: `avg_monthly_value × avg_engagement_months`
- Churn risk: `(missed_invoices / total) × 0.4 + (days_since_activity / 90) × 0.6`
- Chase escalation auto-calculated: 7d → GENTLE, 14d → FIRM, 30d → ESCALATED
- Renewal status: >60d → GREEN, 30–60d → AMBER, <30d → RED

---

### v1.7 — Bulk Operations & Admin Efficiency

**Theme:** Power-user admin workflows. No more clicking one item at a time.

#### Database

No new models.

#### Backend — New Routes

- `POST /projects/bulk-status` — `{ ids: string[], status: string }`
- `POST /invoices/bulk-action` — `{ ids: string[], action: "SEND" | "MARK_PAID" | "VOID" }`
- `POST /leads/bulk-assign` — `{ ids: string[], staffId: string }`
- `GET /audit-events?role=&projectId=` — extend with role-based scope filtering

#### Frontend — UI Changes

- Admin: `project-operations-page.tsx` — multi-select checkboxes; sticky "Move Selected To →" dropdown; selection count badge
- Admin: `invoices-page.tsx` — multi-select + floating bulk action bar (Send / Mark Paid / Void)
- Admin: `leads-page.tsx` — multi-select + "Assign To" dropdown
- All data tables — keyboard: `Space` select, `Shift+Click` range, `Escape` clear
- Staff: new `audit-log-page.tsx` — events scoped to assigned projects
- Client: `activity-feed-page.tsx` — extended to cover all relevant event types
- All portals: floating bulk action bar slides up from bottom when items selected

#### Functional

- Bulk operations transactional — all succeed or all fail with partial failure reporting
- Every bulk operation logs one audit event per affected record
- STAFF audit: project-level events only; CLIENT audit: own project/invoice events only

---

### v1.8 — Automated Project Health Alerts

**Theme:** The platform proactively tells you when something is going wrong.

#### Database — New Models

```prisma
model HealthAlert {
  id         String    @id @default(cuid())
  projectId  String
  type       String    // RISK_HIGH | INVOICE_OVERDUE | SPRINT_BEHIND | MILESTONE_MISSED
  severity   String    // WARNING | CRITICAL
  message    String
  resolvedAt DateTime?
  createdAt  DateTime  @default(now())
}

model AlertRule {
  id        String   @id @default(cuid())
  name      String
  type      String
  threshold Json     // { days: 14 } or { percentage: 50 }
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Backend — New Routes + Jobs

- `services/core/src/jobs/health-alert.job.ts` — runs every 6 hours; evaluates all active projects
- Trigger conditions: risk HIGH/CRITICAL; invoice overdue >14d; sprint <50% with <7d left; milestone missed
- `eventBus.publish(EventTopics.healthAlert, { projectId, type, severity, message })`
- Notifications service consumes `healthAlert` → notifications for CLIENT + STAFF + ADMIN
- `GET /health-alerts` — list active alerts scoped by role
- `PATCH /health-alerts/:id/resolve` — mark resolved
- `GET|POST|PATCH /alert-rules` — admin CRUD for alert configuration

#### Frontend — UI Changes

- Admin: `crisis-command-page.tsx` — auto-populated with `HealthAlert` records; "Resolve" button
- Admin: new `alert-rules-page.tsx` — rule list with enable/disable toggle; threshold editor per type
- Staff: `incident-alerts-page.tsx` — health alerts for assigned projects
- Client: home page — sticky dismissible alert banner when active health alert exists
- All portals: notification centre — health alert links directly to relevant page

#### Functional

- Alert job idempotent — no duplicate alerts if condition already has unresolved alert
- Auto-resolve: condition clears → alert resolves on next job run
- Alert rules seeded with sensible defaults on first deploy

---

### v1.9 — Service Catalog & Pricing Engine

**Theme:** The service catalog becomes the single source of truth. Landing page pricing pulls from the DB.

#### Database — Existing Model Changes

- `ServicePackage` — add `features String[]`, `highlighted Boolean @default(false)`, `displayOrder Int`
- `RetainerPlan` — add `billingCycle String`, `trialDays Int @default(0)`

#### Database — New Models

```prisma
model ServiceUpgradeRequest {
  id                 String    @id @default(cuid())
  clientId           String
  currentPackageId   String?
  requestedPackageId String
  notes              String?
  status             String    @default("PENDING") // PENDING | APPROVED | DECLINED
  reviewedBy         String?
  reviewedAt         DateTime?
  createdAt          DateTime  @default(now())
}
```

#### Backend — New Routes

- `GET /service-catalog/public` — public endpoint (no auth) for landing page
- `POST /service-upgrade-requests` — client submits upgrade request
- `GET|PATCH /service-upgrade-requests` — admin reviews requests

#### Frontend — UI Changes

- Landing: `pricing-section.tsx` — fetches from `/service-catalog/public`; `highlighted` renders "Most Popular" badge; loading skeleton
- Landing: interactive pricing calculator — monthly/annual toggle; savings badge on annual
- Admin: `service-catalog-page.tsx` — full CRUD; drag-to-reorder display order; "Set as Highlighted" toggle
- Admin: new `upgrade-requests-page.tsx` — pending requests list; approve/decline with note
- Client: `services-page.tsx` — "Request Upgrade" button; pending request status badge
- Proposal builder — "Import from Service Catalog" pre-fills line items

#### Functional

- Public pricing endpoint cached (60s TTL)
- Approved upgrade triggers notification + prorated invoice
- `displayOrder` controls sort on both admin UI and landing page

---

## Wave 3: Intelligence & Automation

---

### v1.10 — AI Insights Expansion

**Theme:** Every portal gets AI contextually aware of its user's role and data.

#### Database — New Models

```prisma
model AiInsight {
  id         String    @id @default(cuid())
  targetType String    // PROJECT | CLIENT | STAFF | INVOICE
  targetId   String
  type       String    // RISK_PREDICTION | TASK_SUGGESTION | STATUS_SUMMARY | ANOMALY
  content    String
  confidence Float?
  role       String    // ADMIN | STAFF | CLIENT
  seenAt     DateTime?
  createdAt  DateTime  @default(now())
}
```

#### Backend — New Routes

- `POST /ai/risk-predict` — project risk score + contributing factors
- `POST /ai/task-suggest` — prioritised task list for a staff member
- `POST /ai/summarize` — plain-English project status summary per role
- `GET /ai/insights?role=&targetId=` — fetch stored insights

#### Backend — Services/ai Changes

- Enrich weekly digest: sprint velocity, invoice aging, NPS scores, milestone completion rate
- All new routes run through `services/ai` → Anthropic API → store in `AiInsight`

#### Frontend — UI Changes

- Admin: executive dashboard — "AI Risk Radar" widget; top 5 at-risk projects ranked by score; confidence chip
- Admin: project detail — "Predict Risk" button; drawer with factors + suggested actions
- Staff: task list — "AI Prioritise" button reorders list; "AI suggested" chip on reordered items
- Staff: project detail — "Summarise for Client" generates plain-English client update
- Client: home page — "Project Snapshot" card with weekly AI-generated summary
- All portals: AI insights badge on nav when new unread insight exists

#### Functional

- Risk prediction re-runs nightly; stored in `AiInsight` so pages load instantly
- Task suggestions on-demand, not stored
- Summaries cached 24h per project+role combination
- Fallback: return last stored insight with "last updated X ago" if API unavailable

---

### v1.11 — Analytics Deep Dive

**Theme:** Revenue trends, cohort retention, staff performance — visible and exportable.

#### Database — New Models

```prisma
model AnalyticsSnapshot {
  id        String   @id @default(cuid())
  type      String   // MRR | ARR | CHURN | COHORT | STAFF_PERF | DELIVERY_ACCURACY
  period    String   // "2026-03"
  data      Json
  createdAt DateTime @default(now())
}

model CohortSnapshot {
  id          String   @id @default(cuid())
  cohortMonth String   // "2025-11"
  month       Int      // months since cohort start
  retained    Int
  churned     Int
  revenue     Float
  createdAt   DateTime @default(now())
}
```

#### Backend — New Routes

- `GET /analytics/mrr-arr?period=` — MRR + ARR from invoice data
- `GET /analytics/churn?period=` — client churn rate
- `GET /analytics/cohorts` — retention cohort table
- `GET /analytics/staff-performance?staffId=&period=` — tasks, deliverables, timesheet accuracy
- `GET /analytics/delivery-accuracy` — planned vs. actual milestone dates
- `POST /analytics/export` — `{ type, period, format: "CSV" | "PDF" }` → download URL

#### Backend — Jobs

- `analytics-snapshot.job.ts` — runs end of each month; computes + stores snapshots

#### Frontend — UI Changes

- Admin: `analytics-page.tsx` — new tabs: Revenue, Retention, Staff, Delivery
- Revenue tab — MRR/ARR line chart; churn rate gauge; revenue by service package
- Retention tab — cohort grid table with heat colouring
- Staff tab — ranked by tasks completed, approval rate, timesheet submission rate
- Delivery tab — scatter plot of planned vs. actual; accuracy score per PM
- All tabs — "Export CSV" and "Export PDF" buttons; date range picker
- Admin: executive dashboard — MRR delta chip (↑/↓ vs. last month)

#### Functional

- Snapshots pre-computed monthly; on-demand fallback if snapshot missing
- Export server-side: signed download URL valid 10 min
- Staff performance metrics: admin sees all; staff see only own

---

### v1.12 — Automation Engine

**Theme:** A visual rule builder that any admin can configure without code.

#### Database — New Models

```prisma
model AutomationRule {
  id          String    @id @default(cuid())
  name        String
  description String?
  trigger     Json      // { event: "invoice.overdue", conditions: { days: 14 } }
  action      Json      // { type: "SEND_NOTIFICATION", template: "invoice-chase" }
  enabled     Boolean   @default(true)
  runCount    Int       @default(0)
  lastRunAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model AutomationLog {
  id               String   @id @default(cuid())
  automationRuleId String
  triggeredBy      String
  targetId         String?
  status           String   // SUCCESS | FAILED | SKIPPED
  error            String?
  executedAt       DateTime @default(now())
}
```

#### Backend — New Routes + Services

- `GET|POST|PATCH|DELETE /automation-rules` — CRUD (admin only)
- `GET /automation-logs?ruleId=&status=` — log history
- `services/core/src/lib/automation-evaluator.ts` — evaluates rules on EventBus events
- Action types: `SEND_NOTIFICATION`, `CREATE_TASK`, `CHASE_INVOICE`, `ESCALATE_TO_ADMIN`, `SEND_WEBHOOK`
- Automation evaluator subscribes to all EventBus topics

#### Frontend — UI Changes

- Admin: new `automation-rules-page.tsx` — rule list with toggle, run count, last triggered; "New Rule" button
- Admin: rule builder modal — 4 steps: trigger event → conditions → action type → name + save
- Admin: rule detail drawer — full automation log timeline; status chips
- Admin: template gallery — pre-built rules: invoice chase, project risk alert, milestone → client notify, lead auto-assign
- Staff: `incident-alerts-page.tsx` — automation-triggered alerts for assigned projects
- Client: notification centre — automation-sourced notifications show "Automated" chip

#### Functional

- Rules evaluated asynchronously in background worker
- Failed automations retry once after 5 min; second failure → FAILED status
- Automation logs retained 90 days then purged

---

### v1.13 — Notification Intelligence

**Theme:** Notifications go from noise to signal.

#### Database — New Models

```prisma
model NotificationPreference {
  id         String    @id @default(cuid())
  userId     String    @unique
  channels   Json      // { email: true, inApp: true, push: false, sms: false }
  digestMode Boolean   @default(false)
  digestTime String    @default("08:00")
  mutedUntil DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

model NotificationDigest {
  id       String    @id @default(cuid())
  userId   String
  items    Json
  sentAt   DateTime  @default(now())
  openedAt DateTime?
}
```

#### Backend — New Routes + Jobs

- `GET|PATCH /notification-preferences` — user fetches/updates own preferences
- `POST /notifications/subscribe-push` — save Web Push subscription
- `GET /notification-analytics` — open rates, action rates, channel distribution (admin)
- `notifications-digest.job.ts` — daily at each user's `digestTime`; collects + sends digest

#### Frontend — UI Changes

- All portals: notification centre redesign — grouped by date; category filter tabs; mark-all-read; empty state
- All portals: new notification preferences (modal or page) — channel toggles; digest toggle + time picker; mute options
- All portals: browser push permission prompt after 30s on first login
- Admin: new `notification-analytics-page.tsx` — open rate by channel; top actioned types; push adoption %
- Client: notification badge — batched count updates every 30s when not in realtime mode

#### Functional

- Digest mode: non-critical notifications queued until digest time; CRITICAL always bypass
- Push uses VAPID standard — no third-party dependency
- Notification analytics from existing records — no extra tracking tables

---

### v1.14 — Document Intelligence

**Theme:** Files become smart assets — automatically tagged, versioned, comparable, AI-assisted.

#### Database — New Models

```prisma
model FileMetadata {
  id         String   @id @default(cuid())
  fileId     String   @unique
  tags       String[]
  summary    String?
  pageCount  Int?
  wordCount  Int?
  language   String?
  analyzedAt DateTime @default(now())
}

model DeliverableVersionDiff {
  id            String   @id @default(cuid())
  deliverableId String
  fromVersionId String
  toVersionId   String
  diffSummary   String
  createdAt     DateTime @default(now())
}
```

#### Backend — New Routes

- `POST /files/analyze` — triggers AI analysis; extracts tags, summary, page count, language
- `GET /files/compare?from=&to=` — returns `DeliverableVersionDiff`; generates via AI if not cached
- `GET /files/:id/metadata` — fetch stored metadata

#### Backend — Files Service Changes

- On file upload completion → publish `file.uploaded` → auto-trigger `/files/analyze`

#### Frontend — UI Changes

- Admin + Staff: file upload areas — analysing spinner → AI-generated tag chips appear; tags editable
- Staff: deliverable detail — "Compare Versions" button; side-by-side preview + AI diff summary; changed sections highlighted
- Staff: `deliverables-page.tsx` — document history timeline per deliverable
- Client: `deliverables-page.tsx` — annotation panel enhanced with page-number selector for PDFs
- Admin: file browser — filter by AI tags; search by summary content; language filter
- All portals: file cards — summary tooltip on hover (first 100 chars)

#### Functional

- Analysis runs asynchronously — file usable immediately; tags appear within 10–30s
- Version comparison cached — second request for same pair is instant
- If analysis fails, file still usable — "Analysis pending" with retry button

---

## Wave 4: Collaboration & Growth

---

### v1.15 — Community Forum & Feature Requests

**Theme:** Clients and staff get a space to share knowledge, discuss ideas, and vote on what gets built next.

#### Database — Existing Models (no migration needed)

`ForumThread`, `ForumPost`, `FeatureRequest`, `FeatureVote` — already added in commit `35fc642`.

#### Database — New Models

```prisma
model ForumBadge {
  id        String   @id @default(cuid())
  userId    String
  type      String   // FIRST_POST | HELPFUL | PROLIFIC | FEATURE_CHAMPION
  awardedAt DateTime @default(now())
}

model ForumReaction {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  emoji     String   // "👍" | "🎉" | "💡" | "❤️"
  createdAt DateTime @default(now())

  @@unique([postId, userId, emoji])
}
```

#### Backend — New Routes

- `GET|POST /forum/threads` — list (paginated, filterable) + create
- `GET /forum/threads/:id` — thread detail with posts
- `POST /forum/threads/:id/posts` — reply
- `POST /forum/posts/:id/reactions` — add/remove reaction
- `GET|POST /feature-requests` — list sorted by votes + create
- `POST /feature-requests/:id/vote` — toggle vote
- `PATCH /feature-requests/:id/status` — admin updates status
- `GET /forum/badges?userId=` — fetch user badges

#### Backend — Badge Award Logic

- `FIRST_POST` — first forum post
- `HELPFUL` — post gets 5+ 👍 reactions
- `PROLIFIC` — 10 posts submitted
- `FEATURE_CHAMPION` — submitted feature request marked SHIPPED

#### Frontend — UI Changes

- Client: new `community-page.tsx` — tabs: Forum | Feature Requests
- Client: Forum tab — thread list with category filter chips, search, "New Thread"; cards show title, author, reply count, last active
- Client: Thread view — nested replies, reaction picker, markdown rendering, "Quote Reply"
- Client: Feature Requests tab — kanban-style board by status; vote button with count; "Submit Idea" button
- Client: profile section — badge shelf with tooltip descriptions
- Admin: new `community-management-page.tsx` — thread moderation (pin/lock/delete); feature request status editor; badge award history
- Staff: community read + reply access; "Team" chip on staff posts
- Client nav — add "Community" with unread badge

#### Functional

- Forum threads support markdown (rendered client-side)
- Feature request votes anonymous to other clients; admin sees full voter list
- Pinned threads float to top regardless of activity
- SHIPPED feature requests auto-notify all voters

---

### v1.16 — Public API Platform

**Theme:** Open the platform to partners. First-class developer experience.

#### Database — New Models

```prisma
model ApiKey {
  id         String    @id @default(cuid())
  name       String
  keyHash    String    @unique
  prefix     String
  clientId   String?
  scopes     String[]  // ["projects:read", "invoices:read"]
  lastUsedAt DateTime?
  expiresAt  DateTime?
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
}

model Webhook {
  id          String    @id @default(cuid())
  url         String
  events      String[]
  secret      String
  enabled     Boolean   @default(true)
  failCount   Int       @default(0)
  lastSuccess DateTime?
  createdAt   DateTime  @default(now())
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  event       String
  payload     Json
  statusCode  Int?
  response    String?
  attempt     Int      @default(1)
  deliveredAt DateTime @default(now())
}
```

#### Backend — New Routes

- `GET|POST /api-keys` — list and create keys; `DELETE /api-keys/:id` — revoke
- `GET|POST /webhooks`, `PATCH|DELETE /webhooks/:id`, `POST /webhooks/:id/test`
- `GET /webhook-deliveries?webhookId=` — delivery history
- `GET /api-docs` — OpenAPI spec JSON
- `ApiKeyAuthGuard` — validates `Authorization: Bearer mk_live_...` header; enforces scopes

#### Frontend — UI Changes

- Admin: new `developer-portal-page.tsx` — tabs: API Keys | Webhooks | Documentation | Usage
- API Keys tab — key list with prefix, scopes, last used; "Create Key" modal; key shown once with warning
- Webhooks tab — list with toggle, fail count; "Add Webhook" form; "Send Test"; delivery log drawer
- Documentation tab — embedded Swagger UI
- Usage tab — requests per day chart; top endpoints; error rate per key

#### Functional

- API key stored as bcrypt hash; shown plaintext exactly once
- Webhook payloads HMAC-SHA256 signed
- Webhook failure: retry 3× (5m, 30m, 2h); auto-disabled after 3 failures
- Rate limit headers on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

### v1.17 — Third-Party Integrations

**Theme:** The platform plugs into tools the team already uses.

#### Database — New Models

```prisma
model Integration {
  id         String    @id @default(cuid())
  type       String    // SLACK | GOOGLE_CALENDAR | QUICKBOOKS | GITHUB | LINEAR | ZAPIER
  name       String
  config     Json      // AES-256 encrypted credentials
  enabled    Boolean   @default(true)
  lastSyncAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

model IntegrationEvent {
  id            String   @id @default(cuid())
  integrationId String
  direction     String   // INBOUND | OUTBOUND
  event         String
  payload       Json
  status        String   // SUCCESS | FAILED
  error         String?
  createdAt     DateTime @default(now())
}
```

#### Backend — New Routes + Adapters

- `GET|POST|PATCH|DELETE /integrations` — CRUD (admin)
- `GET /integrations/:id/events` — event log
- `POST /integrations/slack/test`, `POST /integrations/google-calendar/sync`, `GET /integrations/zapier/triggers`, `POST /integrations/quickbooks/export`
- Adapters: `slack.adapter.ts`, `google-calendar.adapter.ts`, `quickbooks.adapter.ts`, `github.adapter.ts`, `linear.adapter.ts`

#### Frontend — UI Changes

- Admin: new `integrations-page.tsx` — integration card grid with logo, status, last sync; "Connect/Disconnect"
- Slack config modal — channel input; notification type checkboxes; test button
- Google Calendar config — OAuth connect; sync direction toggle; calendar selection
- QuickBooks config — credentials; "Export Invoices" with date range picker
- GitHub/Linear config — repo/workspace input; project mapping table
- Integration event log drawer — last 50 events with direction, payload preview, status chip
- Integration health summary at top of page

#### Functional

- Integration configs AES-256 encrypted
- Slack via EventBus adapter
- Google Calendar sync every 15 min + on-demand
- Zapier uses existing webhook infrastructure from v1.16

---

### v1.18 — Client Self-Service Expansion

**Theme:** Clients stop waiting for admin to do things for them.

#### Database — New Models

```prisma
model ScopeChangeRequest {
  id             String    @id @default(cuid())
  projectId      String
  clientId       String
  description    String
  impactedAreas  String[]  // ["TIMELINE", "BUDGET", "DELIVERABLES"]
  status         String    @default("PENDING") // PENDING | APPROVED | DECLINED | NEGOTIATING
  adminNote      String?
  reviewedBy     String?
  reviewedAt     DateTime?
  createdAt      DateTime  @default(now())
}

model ContractAmendment {
  id          String    @id @default(cuid())
  contractId  String
  clientId    String
  description String
  status      String    @default("PENDING")
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())
}

model ClientReportConfig {
  id        String   @id @default(cuid())
  clientId  String
  name      String
  metrics   String[] // ["BUDGET", "MILESTONES", "INVOICES", "ACTIVITY", "HEALTH"]
  dateRange String   // "LAST_30" | "LAST_90" | "CUSTOM"
  format    String   // "PDF" | "CSV"
  createdAt DateTime @default(now())
}
```

#### Backend — New Routes

- `GET|POST /scope-change-requests`, `PATCH /scope-change-requests/:id`
- `GET|POST /contract-amendments`
- `GET|POST|DELETE /client-report-configs`
- `POST /client-reports/generate` — returns signed download URL
- `GET /projects/:id/gantt` — milestone + sprint data in Gantt format

#### Frontend — UI Changes

- Client: `my-projects-page.tsx` — "Request Scope Change" per project; impact area checkboxes; pending badge
- Client: `contracts-page.tsx` — "Request Amendment" button; status timeline
- Client: new `my-reports-page.tsx` — saved report configs; metric checkboxes; date range; format toggle; "Generate" + download
- Client: project detail — new "Timeline" tab with Gantt chart; milestones as bars; sprint blocks colour-coded; today marker
- Client: `account-page.tsx` — team member management: list users, invite contact, set access level
- Admin: new `client-requests-page.tsx` — unified queue of scope changes + amendments; approve/decline with note

#### Functional

- Scope change approval triggers EventBus → staff notified to update project plan
- Report generation server-side: PDF or CSV; signed URL valid 30 min
- Gantt derived from existing `ProjectMilestone` + `Sprint` records
- Invited team members get limited portal access scoped to that client

---

### v1.19 — Multi-Tenancy & White-Label

**Theme:** Each client gets a portal that feels built for them.

#### Database — New Models

```prisma
model TenantBranding {
  id              String   @id @default(cuid())
  clientId        String   @unique
  primaryColor    String   @default("#c8f135")
  backgroundColor String   @default("#0a0a0a")
  logoUrl         String?
  faviconUrl      String?
  portalName      String?
  customDomain    String?
  emailFromName   String?
  emailFromAddr   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Backend — New Routes

- `GET /branding?clientId=` — public, fetched on portal load
- `GET|PATCH /admin/branding/:clientId` — admin CRUD
- `GET /branding/check-domain?domain=` — validates DNS config

#### Backend — Proxy Changes (`apps/web/src/proxy.ts`)

- Custom domain detection: `host` header matches `TenantBranding.customDomain` → set `x-client-id`
- Branding CSS variables injected via `<style>` in client portal layout

#### Frontend — UI Changes

- Client portal layout — reads `TenantBranding` on mount; applies `--accent`, `--bg`, logo, portal name
- Admin: new `white-label-page.tsx` — colour pickers; logo upload; portal name; custom domain + DNS verification status; email sender config
- Admin: live preview panel — mini client portal mock with applied branding in real time
- Landing: new "White-Label" section — branded portal screenshots; "Request White-Label Setup" CTA
- Client portal: `<title>` uses `TenantBranding.portalName` if set

#### Functional

- Branding fetched SSR — no flash of unbranded content
- Custom domain requires CNAME to Maphari gateway; `check-domain` validates DNS propagation
- Falls back to default Maphari branding if no record exists
- Email from-address requires SPF/DKIM verification before activation

---

## Wave 5: Scale & Polish

---

### v1.20 — Landing Page & Marketing Overhaul

**Theme:** The landing page becomes a conversion machine — dynamic, personalised, real content.

#### Database — New Models

```prisma
model CaseStudy {
  id          String    @id @default(cuid())
  clientName  String
  industry    String
  challenge   String
  solution    String
  result      String
  metrics     Json      // [{ label: "Revenue Growth", value: "+40%" }]
  logoUrl     String?
  featured    Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
}

model BlogPost {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  excerpt     String
  content     String    // MDX stored as string
  coverUrl    String?
  tags        String[]
  publishedAt DateTime?
  authorName  String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model AbTest {
  id       String   @id @default(cuid())
  name     String
  variant  String   // "A" | "B"
  page     String
  metric   String
  views    Int      @default(0)
  converts Int      @default(0)
  active   Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

#### Backend — New Routes

- `GET /case-studies`, `GET|POST|PATCH|DELETE /admin/case-studies`
- `GET /blog`, `GET /blog/:slug`, `GET|POST|PATCH|DELETE /admin/blog`
- `POST /ab-tests/track`, `GET /admin/ab-tests`

#### Frontend — UI Changes

- Landing: new `case-studies-section.tsx` — card carousel; logo, industry, headline metric, "Read More" modal
- Landing: new `blog-section.tsx` — 3-column grid; cover image, tags, title, excerpt
- Landing: `pricing-section.tsx` — billing cycle toggle; annual savings badge
- Landing: `nav-bar.tsx` — add "Blog" and "Case Studies" links; sticky with blur backdrop
- Landing: `hero-section.tsx` — A/B test hook (variant A = current, variant B = metrics-led)
- Landing: `contact-section.tsx` — add budget range + company size for lead qualification
- Admin: new `marketing-page.tsx` — tabs: Case Studies CRUD, Blog CRUD, A/B Tests results
- SEO: dynamic `<meta>`, Open Graph, Twitter Card, JSON-LD per page
- Performance: all images via `next/image` with AVIF/WebP

#### Functional

- Blog MDX rendered client-side with `next-mdx-remote`
- A/B variant assigned per visitor via stable cookie
- `featured` flag controls carousel (max 3 featured)
- Structured data: `Organization`, `WebSite`, `BlogPosting` schemas

---

### v1.21 — UI Design System Unification

**Theme:** Every pixel follows the same rules. One component library. Dark mode everywhere.

#### Database

No new models.

#### Backend

No new routes.

#### Frontend — Design Token Expansion (`apps/web/src/app/style/tokens.css`)

- Colour scales: `--gray-{50..950}`, `--lime-{50..950}`, `--purple-{50..950}`
- Semantic tokens: `--text-primary`, `--text-secondary`, `--text-disabled`, `--surface-{1..4}`, `--border-{subtle,default,strong}`
- Motion: `--duration-fast: 120ms`, `--duration-base: 200ms`, `--duration-slow: 400ms`, `--ease-default: cubic-bezier(0.4, 0, 0.2, 1)`
- Dark mode: all semantic tokens redefined under `[data-theme="dark"]`

#### Frontend — Shared Component Library (`apps/web/src/components/shared/ui/`)

- Audit all existing shared components — align to token system, remove hardcoded hex values
- New extracted components: `data-table.tsx`, `command-palette.tsx`, `drawer.tsx`, `skeleton.tsx`, `toast.tsx`

#### Frontend — Dark Mode

- User settings: `theme` preference stored in `UserPreference`
- `apps/web/src/proxy.ts` — reads theme cookie, sets `data-theme` on `<html>` SSR (no flash)
- All portals — fix any hardcoded colours that break in dark mode

#### Frontend — Animation System

- Page transitions: `framer-motion` `AnimatePresence`
- Enter: `--duration-base` fade + 8px translate-Y
- Modal/drawer: `--duration-fast` scale 95% + fade
- Skeleton → content: crossfade `--duration-slow`
- All animations respect `prefers-reduced-motion`

#### Frontend — Accessibility

- Visible focus rings: `--border-strong` + 2px offset on all interactive elements
- ARIA labels audited across all portal pages
- All modals trap focus; `Escape` closes; `Tab` cycles correctly
- All text/background combinations ≥ 4.5:1 (WCAG AA)
- Skip-to-content link on every portal layout

#### Functional

- Dark mode preference persists via cookie + DB
- `prefers-color-scheme` sets default before preference saved
- Design system documented in `docs/design-system.md`

---

### v1.22 — Mobile-Responsive Polish

**Theme:** Every portal works beautifully on a phone. Client portal becomes a PWA.

#### Database — New Models

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())
}
```

#### Backend — New Routes

- `POST|DELETE /push-subscriptions` — save/remove Web Push subscription
- `GET /manifest.json` — PWA manifest per portal

#### Frontend — Mobile Audit (all portals)

- All data tables → card view on mobile (each row becomes labelled card)
- All modals → slide up from bottom as sheet on mobile (full-width, 90vh max)
- All drawers → full-screen on mobile
- Topbar → icons only on mobile; hamburger opens sidebar sheet

#### Frontend — Client Portal (primary PWA target)

- `apps/web/public/manifest.json` — standalone display, `/client` start URL, Maphari icons
- Client portal layout — `<link rel="manifest">`, `<meta name="theme-color">`
- Bottom navigation bar on mobile (≤640px) — Home, Projects, Messages, Notifications, More
- Swipe right to go back on detail pages; pull-to-refresh
- Service worker: caches dashboard shell + last-known project data + notification list; "Offline" banner when disconnected
- Install prompt: "Add to Home Screen" after 3 visits; respects `beforeinstallprompt`

#### Frontend — Staff Portal (mobile)

- Large tap targets on time entry form; numeric keyboard for hours
- Task cards: swipe right to complete, swipe left to reassign
- Calendar: week view default on mobile

#### Frontend — Admin Portal (mobile)

- Data tables → card view with top 3 columns; "View More" expands
- Charts → single-metric view on small screens
- Bulk selection → long-press to enter selection mode

#### Functional

- Service worker: Stale-While-Revalidate; TTL matches server TTL
- Install prompt shown max once per 30 days if dismissed
- Offline mutations queued and replayed on reconnect (time entries, annotations, messages)

---

### v1.23 — Performance & Reliability

**Theme:** The platform handles load gracefully, fails visibly, and recovers automatically.

#### Database — New Models

```prisma
model ServiceHealthCheck {
  id        String   @id @default(cuid())
  service   String   // GATEWAY | CORE | AUTH | BILLING | FILES | NOTIFICATIONS | AI
  status    String   // HEALTHY | DEGRADED | DOWN
  latencyMs Int?
  checkedAt DateTime @default(now())
}

model PerformanceBudget {
  id         String   @id @default(cuid())
  route      String
  p50Ms      Int
  p95Ms      Int
  p99Ms      Int
  recordedAt DateTime @default(now())
}
```

#### Backend — New Routes + Jobs

- `GET /health/detailed` — per-service health with latency
- `GET /admin/performance` — p50/p95/p99 per route
- `health-check.job.ts` — every 60s; pings each service; stores in `ServiceHealthCheck`; notifies admin on status change
- `performance-budget.job.ts` — hourly; samples response times; alerts if p95 exceeds threshold

#### Backend — Optimisations

- N+1 audit across all core routes — add `include` clauses for relation fetches
- Database indices: add on all `clientId`, `projectId`, `staffId`, `status`, `createdAt` filtered columns
- Redis cache: extend TTL on stable data (service catalog: 5min, user profile: 2min); reduce on volatile (notifications: 10s)
- Bundle analysis: identify and split large chunks

#### Frontend — Performance

- Route-level code splitting audit — all admin pages lazy-loaded
- All `<img>` replaced with `next/image`; explicit dimensions to eliminate CLS
- Font loading: `display: swap`; preload critical font files
- Large list virtualisation: `@tanstack/react-virtual` for lists >50 items

#### Frontend — Error Monitoring

- `apps/web/src/lib/monitoring.ts` — Sentry initialisation; catches uncaught errors + unhandled rejections
- All error boundaries — report to monitoring with component stack
- API errors logged with request context; no PII in payloads
- Admin: new `platform-health-page.tsx` — 7-service status grid; latency sparklines; uptime % for 30 days; incident history

#### Functional

- SLO targets: p95 < 500ms for all gateway routes; p99 < 1s
- Health check failure → admin notification within 60s
- Performance budget alert if p95 exceeds 500ms for 3 consecutive checks
- Error monitoring: 100% errors, 10% transactions (cost-optimised)

---

### v1.24 — Developer Experience & Platform Maturity

**Theme:** Production-grade, well-documented, easy to contribute to. Foundation for v2.0.

#### Database

No new models.

#### Backend — New Routes

- `GET /openapi.json` — auto-generated OpenAPI spec from gateway controller decorators
- `GET /api/v1/changelog` — version history parsed from `CHANGELOG.md`

#### Testing — New

- `apps/web/e2e/` — Playwright suite:
  - `auth.spec.ts` — login, logout, forgot password, token refresh across all portals
  - `client-portal.spec.ts` — navigate major pages; submit project request; view invoice; annotate deliverable
  - `staff-portal.spec.ts` — log time entry; submit timesheet; update task; view calendar
  - `admin-portal.spec.ts` — create client; create project; approve timesheet; send invoice; manage automation rules
- `packages/contracts/src/__tests__/` — Zod schema contract tests; every request/response validated against fixtures
- `playwright.config.ts` — base URL per portal; parallel workers; retry on flaky; screenshot on failure

#### Documentation

- `docs/design-system.md` — token reference table; component catalogue; do/don't patterns
- `docs/contributing.md` — local bootstrap; branch naming; commit format; PR checklist; code review SLA
- New ADRs: `ADR-016-design-system-tokens.md`, `ADR-017-pwa-offline-strategy.md`, `ADR-018-automation-engine-architecture.md`
- `CHANGELOG.md` — root-level; every version v1.0→v1.24 with date, scope, highlights
- `docs/runbooks/` — deployment, database migration, rollback, incident triage, cache flush

#### Frontend — Developer Experience

- Storybook stories for all 15+ shared components — variants, states, token usage
- `.storybook/` config themed with Maphari design tokens; deployed as `storybook.maphari.internal`
- All shared component props interfaces: JSDoc comments
- `apps/web/src/lib/` — barrel exports (`index.ts`) for all API modules

#### CI/CD — Improvements

- GitHub Actions: Playwright E2E job on every PR (against preview deployment)
- GitHub Actions: contract test job (Zod validation)
- GitHub Actions: bundle size check (fail if main bundle grows >10KB gzipped)
- `scripts/verify-staging-parity.ts` — validates env vars, service endpoints, DB migrations on staging
- `scripts/v2-planning.md` — v2.0 scoping: multi-workspace support, native mobile app, integration marketplace

#### Functional

- E2E tests run against seeded test DB; never touch production
- Storybook auto-deployed on every merge to main
- `CHANGELOG.md` updates enforced via PR lint check
- v2.0 planning document seeds the next brainstorm cycle

---

## Summary Table

| Version | Name | Wave | Key Additions |
|---------|------|------|---------------|
| v1.0 | Current Baseline | — | Existing platform as shipped |
| v1.1 | Admin Backend Hardening | 1 | 4 Prisma models, 3 controllers, 4 stub pages fixed |
| v1.2 | Real-Time Layer Activation | 1 | Ably default, live indicators, 3-portal event subscriptions |
| v1.3 | Communication Foundations | 1 | CalendarEvent model, calendar routes, staff→client messaging, scoped search |
| v1.4 | Staff Empowerment Suite | 1 | StaffGoal, PeerReview models, timesheet approval workflow, OKR page |
| v1.5 | Client Portal Enrichment | 2 | DeliverableAnnotation model, portfolio KPIs, video room modal |
| v1.6 | Admin Finance Intelligence | 2 | InvoiceChaseLog, ContractRenewal models, CLV analytics, chase escalation |
| v1.7 | Bulk Operations & Efficiency | 2 | Bulk routes for projects/invoices/leads, scoped audit trail |
| v1.8 | Automated Health Alerts | 2 | HealthAlert, AlertRule models, health-alert job, cross-portal alert UI |
| v1.9 | Service Catalog & Pricing Engine | 2 | ServiceUpgradeRequest model, public pricing endpoint, dynamic landing pricing |
| v1.10 | AI Insights Expansion | 3 | AiInsight model, risk-predict/task-suggest/summarize routes, AI widgets |
| v1.11 | Analytics Deep Dive | 3 | AnalyticsSnapshot, CohortSnapshot models, MRR/ARR/cohort/delivery analytics |
| v1.12 | Automation Engine | 3 | AutomationRule, AutomationLog models, visual rule builder, template gallery |
| v1.13 | Notification Intelligence | 3 | NotificationPreference, NotificationDigest models, digest job, web push |
| v1.14 | Document Intelligence | 3 | FileMetadata, DeliverableVersionDiff models, AI file analysis, version comparison |
| v1.15 | Community Forum & Feature Requests | 4 | ForumBadge, ForumReaction models, full forum UI, feature voting board |
| v1.16 | Public API Platform | 4 | ApiKey, Webhook, WebhookDelivery models, developer portal, Swagger UI |
| v1.17 | Third-Party Integrations | 4 | Integration, IntegrationEvent models, Slack/GCal/QuickBooks/GitHub/Linear adapters |
| v1.18 | Client Self-Service Expansion | 4 | ScopeChangeRequest, ContractAmendment, ClientReportConfig models, Gantt view |
| v1.19 | Multi-Tenancy & White-Label | 4 | TenantBranding model, custom domain routing, white-label admin UI |
| v1.20 | Landing Page & Marketing Overhaul | 5 | CaseStudy, BlogPost, AbTest models, case studies, blog, A/B testing |
| v1.21 | UI Design System Unification | 5 | tokens.css, dark mode, animation system, accessibility, 5 new shared components |
| v1.22 | Mobile-Responsive Polish | 5 | PushSubscription model, PWA manifest, service worker, bottom nav, offline support |
| v1.23 | Performance & Reliability | 5 | ServiceHealthCheck, PerformanceBudget models, N+1 fixes, Sentry, health dashboard |
| v1.24 | Developer Experience & Platform Maturity | 5 | Playwright E2E suite, contract tests, Storybook, CHANGELOG, 3 new ADRs, runbooks |

---

## New Database Models Count

| Wave | New Prisma Models |
|------|------------------|
| Wave 1 | Crisis, ComplianceRecord, DataRetentionPolicy, FyChecklistItem, CalendarEvent, StaffGoal, PeerReview, PeerReviewAnswer |
| Wave 2 | DeliverableAnnotation, InvoiceChaseLog, ContractRenewal, HealthAlert, AlertRule, ServiceUpgradeRequest |
| Wave 3 | AiInsight, AnalyticsSnapshot, CohortSnapshot, AutomationRule, AutomationLog, NotificationPreference, NotificationDigest, FileMetadata, DeliverableVersionDiff |
| Wave 4 | ForumBadge, ForumReaction, ApiKey, Webhook, WebhookDelivery, Integration, IntegrationEvent, ScopeChangeRequest, ContractAmendment, ClientReportConfig, TenantBranding |
| Wave 5 | PushSubscription, CaseStudy, BlogPost, AbTest, ServiceHealthCheck, PerformanceBudget |

**Total new models: 35** (plus ForumThread, ForumPost, FeatureRequest, FeatureVote already added)

---

## New Gateway Controllers Count

| Wave | New Controllers / Route Groups |
|------|-------------------------------|
| Wave 1 | crises, compliance, fy-checklist, calendar, conversations (extend) |
| Wave 2 | annotations, portfolio (extend projects), clv-analytics, invoice-chase-logs, contract-renewals, bulk-ops (3 routes), audit-events (extend), health-alerts, alert-rules, service-upgrade-requests, service-catalog/public |
| Wave 3 | ai (risk-predict, task-suggest, summarize, insights), analytics (5 routes + export), automation-rules, automation-logs, notification-preferences, push-subscriptions, notification-analytics, file-metadata, file-compare |
| Wave 4 | forum (threads, posts, reactions, badges), feature-requests, api-keys, webhooks, webhook-deliveries, api-docs, integrations, scope-change-requests, contract-amendments, client-report-configs, client-reports, gantt (extend projects), branding |
| Wave 5 | case-studies, blog, ab-tests, openapi, changelog, health/detailed, performance, push-subscriptions (extend), manifest |
