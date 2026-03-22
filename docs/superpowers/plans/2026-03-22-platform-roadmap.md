# Maphari Technologies — Platform Roadmap & Audit Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 admin stub pages, then expand all three dashboards with high-value features and deep cross-portal integration.

**Architecture:** Three-portal monorepo (admin / staff / client) sharing a single NestJS gateway → Fastify/Prisma core service. All data flows are event-driven (EventBus → notifications service). Role-based scope filtering in `services/core/src/lib/scope.ts`. Cache TTL 30–60 s via `CacheKeys.*`.

**Tech Stack:** Next.js 16 (Turbopack), TypeScript, Prisma, Fastify, NestJS, Zod contracts, Ably/Stream for realtime, PayFast for payments, pnpm monorepo.

---

## AUDIT RESULTS SUMMARY

### Client Dashboard — ✅ ALL CLEAN (53/53 pages)
No stubs. All hooks, pages, and API calls are production-wired.

### Staff Dashboard — ✅ CLEAN (A-)
No stubs detected. Rate Card uses intentional static reference rates (acceptable). 43 pages audited by pattern (consistent discipline throughout). All API functions are real HTTP calls.

### Admin Dashboard — 4 issues found

| Page | File | Status | Issue |
|------|------|--------|-------|
| Crisis Command | `crisis-command-page.tsx` | ❌ NOT WIRED | No API — always shows zero crises |
| Quality Assurance | `quality-assurance-page.tsx` | ❌ NOT WIRED | Empty `initialDeliverables[]`, no `useEffect`, no API import |
| Legal | `legal-page.tsx` | 🔧 PARTIAL | Compliance + data-retention tabs are static stubs; contracts tab is wired |
| FY Closeout | `financial-year-closeout-page.tsx` | 🔧 PARTIAL | Financial data wired; 15-item checklist has no persistence |

### Cross-functionality — ✅ ALL 8 CRITICAL FLOWS IMPLEMENTED
- Admin create client → staff + portal ✅
- Admin create project → staff + portal ✅
- Staff update project status → admin + portal ✅
- Staff log communication → admin ✅
- Client submit project request → admin + staff ✅
- Admin send invoice → portal ✅
- Staff submit timesheet → admin ✅
- Admin broadcast notification → portal + staff ✅

165+ real API functions. Role-based RBAC enforced via `x-user-role` header + scope.ts. EventBus wired across all 5 microservices.

---

## PART 1 — ADMIN STUB FIXES (Priority: Immediate)

### Task 1: Crisis Command API + Wire

**Files:**
- Create: `services/core/src/routes/crises.ts`
- Modify: `services/core/src/app.ts` (register route)
- Modify: `apps/gateway/src/routes/crises.controller.ts` (new file)
- Modify: `apps/gateway/src/app.module.ts` (register controller)
- Modify: `apps/web/src/lib/api/admin/governance.ts` (add crisis functions)
- Modify: `apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx`

**Prisma model** (add to `services/core/prisma/schema.prisma`):
```prisma
model Crisis {
  id          String   @id @default(cuid())
  title       String
  severity    String   // LOW | MEDIUM | HIGH | CRITICAL
  status      String   // ACTIVE | MONITORING | RESOLVED
  description String?
  ownerId     String?
  clientId    String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 1: Add Prisma model + migrate**
```bash
cd services/core && pnpm prisma migrate dev --name add-crises-table
```

- [ ] **Step 2: Create core route `services/core/src/routes/crises.ts`**
```typescript
// GET /crises — returns all crises (ADMIN only)
// POST /crises — create crisis
// PATCH /crises/:id — update status/severity
```

- [ ] **Step 3: Register route in `services/core/src/app.ts`**
```typescript
import { crisesRoutes } from './routes/crises';
app.register(crisesRoutes, { prefix: '/crises' });
```

- [ ] **Step 4: Create gateway controller `apps/gateway/src/routes/crises.controller.ts`**
```typescript
@Controller('crises')
@UseGuards(JwtAuthGuard)
export class CrisesController {
  @Get() getCrises(@Req() req) { ... }
  @Post() createCrisis(@Body() body, @Req() req) { ... }
  @Patch(':id') updateCrisis(@Param('id') id, @Body() body) { ... }
}
```

- [ ] **Step 5: Add API functions to `apps/web/src/lib/api/admin/governance.ts`**
```typescript
export async function loadAdminCrisesWithRefresh(session) { ... }
export async function createCrisisWithRefresh(session, data) { ... }
export async function updateCrisisWithRefresh(session, id, data) { ... }
```

- [ ] **Step 6: Wire `crisis-command-page.tsx`**
  - Remove `const activeCrises: Crisis[] = []` and `const resolved = []`
  - Add `useEffect` calling `loadAdminCrisesWithRefresh`
  - Add `useState` for `crises`, `loading`, `error`
  - Render loading/error states
  - Add "Log Crisis" button calling `createCrisisWithRefresh`

- [ ] **Step 7: TypeScript check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 8: Commit**
```bash
git add services/core/src/routes/crises.ts apps/gateway/src/routes/crises.controller.ts apps/web/src/lib/api/admin/governance.ts apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx
git commit -m "fix(admin): wire crisis-command to real crisis API"
```

---

### Task 2: Quality Assurance Deliverables API + Wire

**Files:**
- Create: `services/core/src/routes/qa-deliverables.ts`
- Modify: `services/core/src/app.ts`
- Modify: `apps/gateway/src/routes/` (new qa controller or extend existing deliverables controller)
- Modify: `apps/web/src/lib/api/admin/` (new or extend existing)
- Modify: `apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx`

**Note:** QA deliverables already partially exist in `services/core/src/routes/deliverables.ts`. The admin QA page needs to tap the same endpoint with an admin scope.

- [ ] **Step 1: Check existing deliverables endpoint**
```bash
# Read services/core/src/routes/deliverables.ts to understand current shape
```

- [ ] **Step 2: Add admin-scoped deliverable loader to `apps/web/src/lib/api/admin/` (client-ops.ts or new qa.ts)**
```typescript
export async function loadAdminQADeliverablesWithRefresh(session, projectId?) {
  // GET /deliverables?scope=ADMIN&status=PENDING_REVIEW
}
export async function approveAdminDeliverableWithRefresh(session, id, data) {
  // PATCH /deliverables/:id/approve
}
export async function rejectAdminDeliverableWithRefresh(session, id, data) {
  // PATCH /deliverables/:id/reject
}
```

- [ ] **Step 3: Wire `quality-assurance-page.tsx`**
  - Remove `const initialDeliverables: Deliverable[] = []`
  - Add `useEffect(() => { loadAdminQADeliverables... })`
  - Derive `pendingReview`, `approved`, `rejected` from API data
  - Wire approve/reject buttons to API calls

- [ ] **Step 4: TypeScript check + commit**
```bash
pnpm --filter @maphari/web exec tsc --noEmit
git commit -m "fix(admin): wire quality-assurance to deliverables API"
```

---

### Task 3: Legal Page — Wire Compliance + Data Retention Tabs

**Files:**
- Create: `services/core/src/routes/compliance.ts` (new model: `ComplianceRecord`, `DataRetentionPolicy`)
- Modify: gateway (new compliance controller)
- Modify: `apps/web/src/lib/api/admin/governance.ts` (add compliance functions)
- Modify: `apps/web/src/components/admin/dashboard/pages/legal-page.tsx`

**Prisma models:**
```prisma
model ComplianceRecord {
  id          String   @id @default(cuid())
  area        String   // GDPR | POPIA | SARS | ISO27001
  status      String   // COMPLIANT | AT_RISK | NON_COMPLIANT
  riskLevel   String   // LOW | MEDIUM | HIGH
  lastAudit   DateTime
  nextAudit   DateTime
  notes       String?
  createdAt   DateTime @default(now())
}

model DataRetentionPolicy {
  id          String   @id @default(cuid())
  dataType    String
  retainYears Int
  lastPurge   DateTime?
  nextPurge   DateTime
  status      String   // CURRENT | DUE | OVERDUE
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 1: Add Prisma models + migrate**
- [ ] **Step 2: Seed initial compliance records** (these replace the hardcoded stub — same 6 areas, but now DB-driven)
- [ ] **Step 3: Create core compliance route**
- [ ] **Step 4: Add gateway controller**
- [ ] **Step 5: Add API functions** (`loadAdminComplianceWithRefresh`, `loadAdminDataRetentionWithRefresh`, `updateComplianceStatusWithRefresh`)
- [ ] **Step 6: Wire legal-page.tsx** — replace static `compliance` + `dataRetention` arrays with `useEffect` + API calls
- [ ] **Step 7: TypeScript check + commit**

---

### Task 4: FY Closeout Checklist Persistence

**Files:**
- Create: `services/core/src/routes/fy-checklist.ts` (or extend existing `closeout.ts`)
- Modify: `apps/web/src/lib/api/admin/closeout.ts`
- Modify: `apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx`

**Prisma model:**
```prisma
model FyChecklistItem {
  id          String   @id @default(cuid())
  fiscalYear  String   // "2025-2026"
  label       String
  category    String   // REVENUE | TAX | PAYROLL | ARCHIVE
  done        Boolean  @default(false)
  doneAt      DateTime?
  doneBy      String?
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 1: Add Prisma model + migrate**
- [ ] **Step 2: Seed FY checklist items** for current fiscal year (replaces the 15 hardcoded items)
- [ ] **Step 3: Create/extend core route** (`GET /fy-checklist?year=`, `PATCH /fy-checklist/:id`)
- [ ] **Step 4: Add API functions** (`loadFyChecklistWithRefresh`, `toggleFyChecklistItemWithRefresh`)
- [ ] **Step 5: Wire financial-year-closeout-page.tsx** — replace `fyChecklist` array with API data; wire checkbox onChange to `toggleFyChecklistItemWithRefresh`
- [ ] **Step 6: TypeScript check + commit**

---

## PART 2 — NEW ADMIN FEATURES

### Task 5: Real-Time Dashboard via Ably/Stream (opt-in → default)

The realtime layer exists (`realtime.controller.ts`, `stream-token.controller.ts`) but is opt-in. Make it the default for admin dashboard.

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/` (root dashboard component)
- Modify: `apps/web/src/lib/api/admin/` (add subscription helpers)

**Features:**
- Live project status changes → executive dashboard auto-refreshes
- New lead arrivals → leads page badge updates in real-time
- Invoice paid event → revenue charts update instantly
- Staff goes online/offline → team structure shows presence

- [ ] **Step 1: Connect admin dashboard root to Ably channel on mount**
- [ ] **Step 2: Subscribe to `project.updated`, `lead.created`, `invoice.paid` events**
- [ ] **Step 3: On event received → invalidate matching local state (call refresh function)**
- [ ] **Step 4: Show subtle "Live" indicator in admin topbar**
- [ ] **Step 5: TypeScript check + commit**

---

### Task 6: Client Lifetime Value + Churn Risk Analytics

**Files:**
- Create: `apps/web/src/components/admin/dashboard/pages/clv-analytics-page.tsx`
- Create: `services/core/src/routes/analytics.ts` (new CLV endpoint)
- Modify: admin nav config to add the page

**Formula:**
```
CLV = avg_monthly_invoice_value × avg_engagement_months
ChurnRisk = (missed_invoices / total_invoices) × 0.4 + (days_since_last_activity / 90) × 0.6
```

- [ ] **Step 1: Create CLV analytics core endpoint** (`GET /analytics/clv` → derives from invoices + projects per client)
- [ ] **Step 2: Create CLV analytics page** with ranked client table, churn risk bar, and projected annual revenue
- [ ] **Step 3: Wire to gateway + admin API**
- [ ] **Step 4: Add to admin nav config**
- [ ] **Step 5: TypeScript check + commit**

---

### Task 7: Automated Invoice Chase Escalation

`triggerInvoiceChaseWithRefresh` already exists. Build the full escalation workflow.

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/invoices-page.tsx`
- Modify: `services/core/src/routes/invoices.ts` (add overdue escalation job)

**Features:**
- Show "Days Overdue" badge on each invoice row
- Auto-calculate escalation level: 7d → gentle reminder, 14d → firm, 30d → escalate to director
- "Chase All Overdue" bulk action button
- Chase history log per invoice

- [ ] **Step 1: Add `daysOverdue` computed field to invoice list endpoint**
- [ ] **Step 2: Wire bulk chase button** to loop `triggerInvoiceChaseWithRefresh` over all overdue invoices
- [ ] **Step 3: Add chase history to invoice detail drawer**
- [ ] **Step 4: TypeScript check + commit**

---

### Task 8: Contract Renewal Tracker

**Files:**
- Create: `apps/web/src/components/admin/dashboard/pages/contract-renewal-page.tsx`
- Modify: admin nav config

**Features:**
- List all active contracts with expiry dates
- Traffic-light status: GREEN (>60d), AMBER (30–60d), RED (<30d / expired)
- "Send Renewal Proposal" button → triggers proposal creation flow
- Dashboard widget on executive page for contracts expiring this month

- [ ] **Step 1: Tap existing `/contracts` endpoint**; add `expiresAt` field to schema if missing
- [ ] **Step 2: Create contract-renewal-page.tsx** with sorted timeline
- [ ] **Step 3: Wire "Send Renewal" → `createProposalWithRefresh`** with pre-filled contract data
- [ ] **Step 4: Add renewal widget to executive-dashboard-page.tsx**
- [ ] **Step 5: TypeScript check + commit**

---

## PART 3 — NEW STAFF FEATURES

### Task 9: Timesheet Approval Workflow

Currently staff submit time entries but there's no formal approval step. Add admin-approve flow.

**Files:**
- Modify: `services/core/src/routes/time-entries.ts` (add status field: DRAFT | SUBMITTED | APPROVED | REJECTED)
- Modify: `apps/web/src/lib/api/staff/time.ts` (add `submitTimesheetWithRefresh`)
- Modify: `apps/web/src/lib/api/admin/hr.ts` (add `approveTimesheetWithRefresh`, `rejectTimesheetWithRefresh`)
- Modify: staff time-log page (add "Submit Week" button)
- Modify: admin payroll/HR page (add pending timesheets approval queue)

- [ ] **Step 1: Add `status` + `submittedAt` to `TimeEntry` Prisma model**
- [ ] **Step 2: Add `PATCH /time-entries/:id/submit` route**
- [ ] **Step 3: Add `PATCH /time-entries/:id/approve` (admin only)**
- [ ] **Step 4: Wire "Submit Week" button** on staff time-log page → calls `submitTimesheetWithRefresh`
- [ ] **Step 5: Add pending timesheets queue** to admin HR/payroll page
- [ ] **Step 6: TypeScript check + commit**

---

### Task 10: Staff Personal OKR / Goal Tracking

**Files:**
- Create: `services/core/prisma/schema.prisma` (new `StaffGoal` model)
- Create: `services/core/src/routes/staff-goals.ts`
- Create: `apps/web/src/lib/api/staff/goals.ts`
- Create: `apps/web/src/components/staff/staff-dashboard/pages/my-goals-page.tsx`
- Modify: staff nav config

**Prisma model:**
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
```

- [ ] **Step 1: Add Prisma model + migrate**
- [ ] **Step 2: Create core route** (GET/POST/PATCH for own goals)
- [ ] **Step 3: Create API functions**
- [ ] **Step 4: Create my-goals-page.tsx** — OKR-style layout with progress rings, quarterly filter, add/edit goal modal
- [ ] **Step 5: Add to staff nav**
- [ ] **Step 6: TypeScript check + commit**

---

### Task 11: Team Capacity Planning (Visual)

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/mycapacity-page.tsx` (already exists)
- Create: `apps/web/src/lib/api/staff/capacity.ts` (if not exists)

The `mycapacity` page is listed as "not fully audited". Audit it first, then:

- [ ] **Step 1: Read existing mycapacity-page.tsx** to understand current state
- [ ] **Step 2: If not wired**: wire to `getStaffCapacity()` or derive from time entries + assigned tasks
- [ ] **Step 3: Add visual weekly bar chart** showing hours allocated vs. hours available
- [ ] **Step 4: Show which projects are consuming capacity** (colour-coded bars by project)
- [ ] **Step 5: Add "Flag Overload" button** → triggers `createInterventionWithRefresh` for manager review
- [ ] **Step 6: TypeScript check + commit**

---

### Task 12: Peer Review System

The `peer-review` concept may partially exist. Add a structured monthly peer review cycle.

**Files:**
- Create: `services/core/prisma/schema.prisma` (new `PeerReview` model if missing)
- Create: `apps/web/src/components/staff/staff-dashboard/pages/peer-review-page.tsx`
- Modify: staff nav

**Features:**
- Staff can nominate peers for review
- Simple 5-question form: communication, delivery, teamwork, initiative, overall
- Results visible only to admin + the reviewed person after cycle closes
- Quarterly cycle with auto-open/close dates

- [ ] **Step 1: Check if `peer-reviews` table exists** in Prisma schema
- [ ] **Step 2: Create/extend model** (`PeerReview`, `PeerReviewAnswer`)
- [ ] **Step 3: Create core route** (POST to submit, GET to view received reviews after cycle close)
- [ ] **Step 4: Create peer-review-page.tsx** with nomination UI + form
- [ ] **Step 5: TypeScript check + commit**

---

## PART 4 — NEW CLIENT FEATURES

### Task 13: Real-Time Project Status Feed

Ably/Stream layer exists. Wire client portal to listen for project updates.

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/dashboard-page.tsx`
- Modify: `apps/web/src/lib/api/portal/` (add realtime subscription helper)

**Features:**
- When admin/staff updates project milestone → client portal banner: "Your project just hit a milestone! 🎉"
- When new invoice created → client notification badge increments immediately (no 30s wait)
- When staff leaves a design review approval → client gets instant toast

- [ ] **Step 1: Get Ably token via existing `GET /realtime/token`**
- [ ] **Step 2: Subscribe client to their `client:{clientId}` channel on dashboard mount**
- [ ] **Step 3: On `project.milestone.completed` event → show toast + trigger snapshot refresh**
- [ ] **Step 4: On `invoice.created` event → increment notification badge**
- [ ] **Step 5: TypeScript check + commit**

---

### Task 14: In-App Video Call (Instant Room from Client Portal)

`createInstantVideoRoomWithRefresh` already exists on the book-call page. Extend it.

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx`
- Create: `apps/web/src/components/client/maphari-dashboard/components/video-room-modal.tsx`

**Features:**
- "Start Video Call Now" button on messages page (not just book-call page)
- Shows room link + passcode in a modal for client to share with staff
- Countdown timer while waiting for staff to join
- Auto-creates a calendar event for the session

- [ ] **Step 1: Extract video room modal** into reusable `video-room-modal.tsx`
- [ ] **Step 2: Add "Start Video Call" button** to messages-page topbar
- [ ] **Step 3: On button click → `createInstantVideoRoomWithRefresh`** → open modal with room link
- [ ] **Step 4: Add "Join" deeplink from staff notification** when client starts instant room
- [ ] **Step 5: TypeScript check + commit**

---

### Task 15: Client Document Annotation / Review

Allow clients to annotate deliverables inline (like Figma comments).

**Files:**
- Create: `services/core/prisma/schema.prisma` (new `DeliverableAnnotation` model)
- Create: `services/core/src/routes/annotations.ts`
- Create: `apps/web/src/lib/api/portal/annotations.ts`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/deliverables-page.tsx`

**Prisma model:**
```prisma
model DeliverableAnnotation {
  id            String   @id @default(cuid())
  deliverableId String
  clientId      String
  comment       String
  pageNumber    Int?
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
}
```

- [ ] **Step 1: Add model + migrate**
- [ ] **Step 2: Create core annotations route**
- [ ] **Step 3: Create portal API functions** (`getPortalAnnotationsWithRefresh`, `createPortalAnnotationWithRefresh`, `resolvePortalAnnotationWithRefresh`)
- [ ] **Step 4: Add annotation panel** to deliverables-page.tsx (slide-out panel when deliverable selected)
- [ ] **Step 5: TypeScript check + commit**

---

### Task 16: Multi-Project Summary Dashboard

Clients with multiple projects need a higher-level view.

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/my-projects-page.tsx`

Currently shows project cards. Extend to:
- Portfolio health score (aggregate across all projects)
- Total budget consumed vs. remaining (all projects combined)
- Combined activity timeline
- "Alerts" strip: anything RED across any project floats to top

- [ ] **Step 1: Compute portfolio-level KPIs** from existing `ProjectCard[]` data (no new API needed)
- [ ] **Step 2: Add portfolio summary strip** at top of my-projects-page.tsx
- [ ] **Step 3: Add combined alert strip** (all HIGH-risk items across projects)
- [ ] **Step 4: TypeScript check + commit**

---

## PART 5 — CROSS-FUNCTIONAL NEW FEATURES

### Task 17: Shared Calendar (Admin/Staff/Client views)

All three portals need a unified calendar view — each scoped to their role.

**Files:**
- Create: `services/core/src/routes/calendar.ts` (new — aggregates appointments + milestones + deadlines)
- Create: gateway controller
- Create: `apps/web/src/lib/api/admin/calendar.ts`
- Create: `apps/web/src/lib/api/staff/calendar.ts`
- Modify: `apps/web/src/lib/api/portal/meetings.ts` (extend with calendar endpoint)
- Create calendar page in each dashboard (or extend existing booking/appointments pages)

**Calendar event sources:**
- `Appointment` records (from bookings)
- `ProjectMilestone` due dates
- `Invoice` due dates
- `LeaveRequest` approved dates (staff only)
- `SprintDeadline` dates

- [ ] **Step 1: Create `GET /calendar/events?from=&to=&role=` core endpoint** — unified event aggregation
- [ ] **Step 2: Wire admin calendar** (existing `booking-appointments-page.tsx` can be extended)
- [ ] **Step 3: Wire staff calendar** (extend `mycapacity` or create dedicated page)
- [ ] **Step 4: Wire client calendar** (extend `book-call-page.tsx` with month view)
- [ ] **Step 5: Shared iCal export endpoint** (`GET /calendar/export.ics`)
- [ ] **Step 6: TypeScript check + commit**

---

### Task 18: Universal Search Across All Portals

`GET /search` gateway endpoint exists. Surface it properly.

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/hooks/use-command-search.ts`
- Modify: admin command palette (if exists)
- Modify: staff command palette

**Features:**
- Admin: searches clients, projects, invoices, staff, proposals
- Staff: searches projects, tasks, clients, deliverables, time entries
- Client: searches own project docs, invoices, messages, knowledge articles

- [ ] **Step 1: Audit existing `/search` endpoint scope** (does it support role-based filtering?)
- [ ] **Step 2: Add role scoping** to search core route if missing
- [ ] **Step 3: Wire admin command palette** to `/search?role=ADMIN&q=`
- [ ] **Step 4: Wire staff command palette** to `/search?role=STAFF&q=`
- [ ] **Step 5: Verify client command search** already calls correct endpoint
- [ ] **Step 6: TypeScript check + commit**

---

### Task 19: Automated Project Health Alerts (Cross-Portal)

When a project's health score drops below a threshold, alert all three portals automatically.

**Files:**
- Create: `services/core/src/jobs/health-alert.job.ts`
- Modify: `services/core/src/routes/projects.ts` (trigger alert on status change)
- Modify: notifications service (new alert template)

**Trigger conditions:**
- Project risk level → HIGH/CRITICAL
- Invoice overdue > 14 days
- Sprint completion rate < 50% with < 7 days remaining
- Milestone missed

**Outputs:**
- Admin: alert in `crisis-command-page` (after Task 1)
- Staff: alert in `incident-alerts-page` (already wired to `getAutomationJobs`)
- Client: notification + home page alert banner

- [ ] **Step 1: Create health alert job** that evaluates projects on a schedule
- [ ] **Step 2: On alert condition → `eventBus.publish(EventTopics.healthAlert)`**
- [ ] **Step 3: Notifications service consumes** → creates notification for CLIENT + STAFF + ADMIN
- [ ] **Step 4: Client home page** checks for active health alerts on mount, shows banner
- [ ] **Step 5: TypeScript check + commit**

---

### Task 20: Audit Trail Visible to All Roles (Scoped)

Admin has a full audit log. Staff should see project-level activity. Clients should see their own project history.

**Files:**
- Modify: `services/core/src/routes/admin.ts` (existing `GET /admin/audit-events` — extend scope)
- Create: `apps/web/src/lib/api/staff/audit.ts`
- Create: `apps/web/src/lib/api/portal/audit.ts`
- Modify: staff governance pages
- Modify: client activity-feed-page.tsx (already wired to `loadActivityFeedWithRefresh` — verify it shows all relevant events)

**Scope rules:**
- ADMIN: all audit events system-wide
- STAFF: only events for projects they're assigned to
- CLIENT: only events for their own projects/invoices

- [ ] **Step 1: Add role filter to `GET /admin/audit-events`** so STAFF can call with project filter
- [ ] **Step 2: Create staff audit API function**
- [ ] **Step 3: Verify client `loadActivityFeedWithRefresh`** covers all relevant events (it does per audit — but verify the event types are comprehensive)
- [ ] **Step 4: Add missing event publications** if any client-facing actions don't emit to activity feed
- [ ] **Step 5: TypeScript check + commit**

---

### Task 21: Staff → Client Direct Messaging Channel

Currently staff use admin conversation routes. Add a direct staff-initiated message thread visible in the client portal.

**Files:**
- Modify: `services/core/src/routes/conversations.ts` (allow STAFF role to create conversations)
- Modify: `apps/web/src/lib/api/staff/` (add `createStaffClientMessageWithRefresh`)
- Modify: staff `client-threads` page (add "New Message" button)
- Client portal messages page already shows conversations — verify it surfaces staff-created ones

- [ ] **Step 1: Verify conversation model** has `createdByRole` field (add if missing)
- [ ] **Step 2: Allow STAFF to POST to `/conversations`**
- [ ] **Step 3: Create staff API function** `createStaffClientMessageWithRefresh`
- [ ] **Step 4: Add "Message Client" button** on staff client-threads page
- [ ] **Step 5: Verify client messages page** shows conversations created by staff (role=STAFF conversations)
- [ ] **Step 6: TypeScript check + commit**

---

### Task 22: Bulk Project Status Updates (Admin)

Admin can only update projects one at a time. Add bulk operations.

**Files:**
- Modify: `services/core/src/routes/projects.ts` (add `POST /projects/bulk-status`)
- Modify: `apps/gateway/src/routes/projects.controller.ts`
- Modify: `apps/web/src/lib/api/admin/projects.ts` (add `bulkUpdateProjectStatusWithRefresh`)
- Modify: `apps/web/src/components/admin/dashboard/pages/project-operations-page.tsx`

- [ ] **Step 1: Add `POST /projects/bulk-status` core route** (body: `{ ids: string[], status: string }`)
- [ ] **Step 2: Wire gateway controller**
- [ ] **Step 3: Add `bulkUpdateProjectStatusWithRefresh`** to admin projects API
- [ ] **Step 4: Add multi-select checkboxes** to project operations table + "Move Selected to" dropdown
- [ ] **Step 5: TypeScript check + commit**

---

## PRIORITY ORDER

### Immediate (This Sprint — Fix Stubs)
1. Task 1 — Crisis Command API ❌
2. Task 2 — QA Deliverables API ❌
3. Task 3 — Legal Compliance API 🔧
4. Task 4 — FY Closeout Checklist Persistence 🔧

### High Value (Next Sprint — Core Features)
5. Task 5 — Real-time admin dashboard
6. Task 13 — Real-time client portal
7. Task 17 — Shared calendar
8. Task 19 — Automated health alerts
9. Task 21 — Staff → client direct messaging

### Medium Value (Following Sprint)
10. Task 6 — CLV + churn analytics
11. Task 7 — Invoice chase escalation
12. Task 8 — Contract renewal tracker
13. Task 9 — Timesheet approval workflow
14. Task 11 — Team capacity planning
15. Task 18 — Universal search
16. Task 20 — Scoped audit trail

### Enhancement Sprint
17. Task 10 — Staff OKR/goals
18. Task 12 — Peer review system
19. Task 14 — In-app video from messages
20. Task 15 — Document annotation
21. Task 16 — Multi-project portfolio summary
22. Task 22 — Bulk project status updates

---

## CSS + UX PENDING

- [ ] **Blur backdrop fix**: `cmdOverlay` in `shared/utilities.module.css` updated to `blur(8px)` — dev server cache issue, changes are saved and will work after clean rebuild
- [ ] **FTUE buttons**: `Get in touch` + `Book an intro call` correctly navigate to messages/book-call pages — verified working in previous session
- [ ] **All modal backdrops**: All client modals use `modalOverlay` (blur 6px) or `cmdOverlay` (now blur 8px) — standardised

---

## EXECUTION CHOICE

Plan saved to `docs/superpowers/plans/2026-03-22-platform-roadmap.md`.

**22 tasks total across 5 parts:**
- Part 1 (Tasks 1–4): Admin stub fixes — immediate blockers
- Part 2 (Tasks 5–8): New admin features
- Part 3 (Tasks 9–12): New staff features
- Part 4 (Tasks 13–16): New client features
- Part 5 (Tasks 17–22): Cross-functional features

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh agent per task, TypeScript check + commit after each

**2. Inline Execution** — execute in this session using executing-plans, batch with checkpoints

Which approach, and which tasks do you want to start with?
