# Wave 2 Platform Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the platform from MVP to production-ready by fixing deployment blockers, adding multi-admin accountability, staff collaboration, client portal enhancements, and AI-powered features.

**Architecture:** Five phases executed in priority order — blockers first (video, audit, notifications, billing), then admin accountability (approval workflows + activity feed), staff collaboration (standup bot, @mentions, kanban, handovers), client portal (deliverable approvals, booking, reports, contracts), and AI/creative features (transcription, churn prediction, white-labelling). Each phase is independently deployable. Services involved: `services/core` (Fastify, Prisma), `services/ai` (Claude), `services/notifications`, `apps/gateway` (NestJS), `apps/web` (Next.js 16).

**Tech Stack:** Daily.co REST + browser SDK (`@daily-co/daily-js`), AssemblyAI (transcription webhook), Anthropic Claude API (AI service already wired), Prisma + PostgreSQL, node-cron, NestJS, Next.js 16, CSS Modules.

---

## PHASE 1 — DEPLOYMENT BLOCKERS

---

### Task 1: Enable Daily.co Cloud Recording on Room Creation

**Context:** `services/core/src/lib/daily.ts` creates rooms via Daily.co REST. Recording is not enabled. We need `enable_recording: "cloud"` so that all video sessions are automatically recorded and accessible afterwards.

**Files:**
- Modify: `services/core/src/lib/daily.ts`

- [ ] **Step 1: Update `createDailyRoom` to enable cloud recording**

Open `services/core/src/lib/daily.ts`. Change the `properties` block in the POST body:

```typescript
properties: {
  exp:               Math.floor(expiry.getTime() / 1000),
  max_participants:   10,
  enable_chat:        true,
  enable_screenshare: true,
  start_video_off:    false,
  start_audio_off:    false,
  enable_recording:   "cloud",    // ← ADD THIS
},
```

- [ ] **Step 2: Add `getRecordingsByRoom` helper below `deleteDailyRoom`**

```typescript
// ── getRecordingsByRoom ───────────────────────────────────────────────────────
// Returns cloud recordings for a given room name.
// Daily stores recordings as { id, room_name, status, download_link, duration }
export interface DailyRecording {
  id:            string;
  room_name:     string;
  status:        "finished" | "in-progress";
  download_link?: string;
  duration?:     number; // seconds
  start_ts?:     number; // unix
}

export async function getRecordingsByRoom(roomName: string): Promise<DailyRecording[]> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `${DAILY_API_BASE}/recordings?room_name=${encodeURIComponent(roomName)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: DailyRecording[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Add recording download endpoint to video-rooms.ts**

Open `services/core/src/routes/video-rooms.ts`. Add `import { createDailyRoom, getRecordingsByRoom } from "../lib/daily.js";` at the top (static import — update existing import line). Then add after the existing routes:

```typescript
// GET /video-rooms/:roomName/recordings — list recordings for a room
app.get("/video-rooms/:roomName/recordings", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role === "CLIENT") {
    return reply.code(403).send({
      success: false,
      error: { code: "FORBIDDEN", message: "Access denied." }
    } as ApiResponse);
  }

  const { roomName } = request.params as { roomName: string };
  const recordings = await getRecordingsByRoom(roomName);

  return reply.code(200).send({
    success: true,
    data: recordings,
    meta: { requestId: scope.requestId, count: recordings.length }
  } as ApiResponse<typeof recordings>);
});
```

Add `import { createDailyRoom, getRecordingsByRoom } from "../lib/daily.js";` at the top (update existing import).

- [ ] **Step 4: Expose endpoint in gateway**

Create `apps/gateway/src/routes/video-rooms.controller.ts` using the canonical `proxyRequest` pattern (same as `forum.controller.ts`):

```typescript
import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class VideoRoomsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    };
  }

  @Roles("ADMIN", "STAFF")
  @Post("video-rooms")
  async createRoom(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/video-rooms`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT", "ADMIN", "STAFF")
  @Post("portal/video-rooms/instant")
  async createInstant(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/video-rooms/instant`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN", "STAFF")
  @Get("video-rooms/:roomName/recordings")
  async getRecordings(
    @Param("roomName") roomName: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/video-rooms/${roomName}/recordings`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }
}
```

Register `VideoRoomsController` in `apps/gateway/src/modules/app.module.ts` controllers array.

- [ ] **Step 5: Verify manually**

```bash
# Set DAILY_API_KEY in services/core/.env
# Start: pnpm dev:all
# Create a room:
curl -X POST http://localhost:4000/video-rooms \
  -H "Content-Type: application/json" \
  -H "x-user-role: ADMIN" \
  -H "x-user-id: test-admin-1"
# Expected: { success: true, data: { roomUrl, roomName, ... } }
# Check Daily.co dashboard → room should have recording enabled
```

- [ ] **Step 6: Commit**

```bash
git add services/core/src/lib/daily.ts \
        services/core/src/routes/video-rooms.ts \
        apps/gateway/src/routes/video-rooms.controller.ts \
        apps/gateway/src/modules/app.module.ts
git commit -m "feat: enable Daily.co cloud recording and add recordings endpoint (Wave 2 T1)"
```

---

### Task 2: Meeting Transcription via Daily.co + AI Summary

**Context:** Daily.co supports live transcription (`enable_transcription: true`). After the session, a `.vtt` transcript is available via the Daily.co recordings API. We POST the transcript text to the AI service to produce a summary + action items, then store both on the `MeetingRecord`.

**Files:**
- Modify: `services/core/src/lib/daily.ts`
- Modify: `services/core/src/routes/meetings.ts`
- Modify: `services/core/prisma/schema.prisma`
- Create: migration SQL

- [ ] **Step 1: Enable transcription in `createDailyRoom`**

In `services/core/src/lib/daily.ts`, add to properties:

```typescript
enable_transcription: true,   // ← ADD — generates .vtt after call ends
```

- [ ] **Step 2: Add transcription download helper**

In `services/core/src/lib/daily.ts`, add:

```typescript
// ── getTranscriptText ────────────────────────────────────────────────────────
// Fetches the VTT transcript for a recording and returns it as plain text.
export async function getTranscriptText(recordingId: string): Promise<string | null> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return null;

  try {
    // Fetch recording metadata to get transcript_download_link
    const res = await fetch(`${DAILY_API_BASE}/recordings/${recordingId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { transcript_download_link?: string };
    if (!data.transcript_download_link) return null;

    // Download the VTT file
    const vtt = await fetch(data.transcript_download_link);
    if (!vtt.ok) return null;
    const raw = await vtt.text();

    // Strip VTT timestamps → plain text
    return raw
      .split("\n")
      .filter(line => line && !line.startsWith("WEBVTT") && !/^\d\d:\d\d/.test(line) && !/-->/.test(line))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Add `transcriptText` and `aiSummary` fields to `MeetingRecord` schema**

Open `services/core/prisma/schema.prisma`. Find `model MeetingRecord` and add two optional fields:

```prisma
model MeetingRecord {
  // ... existing fields ...
  transcriptText  String?   // raw transcript text from Daily.co VTT
  aiSummary       String?   // AI-generated summary + action items
  recordingId     String?   // Daily.co recording ID for re-fetching
}
```

- [ ] **Step 4: Create and apply migration**

```bash
cd services/core
npx prisma migrate dev --name add_meeting_transcript_summary
```

Expected: migration file created in `prisma/migrations/`, schema regenerated.

- [ ] **Step 5: Add `POST /meetings/:id/transcribe` endpoint in meetings.ts**

In `services/core/src/routes/meetings.ts`, add after existing routes:

```typescript
// POST /meetings/:id/transcribe — fetch transcript from Daily, summarise via AI
app.post("/meetings/:id/transcribe", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin or Staff only" } } as ApiResponse);
  }

  const { id } = request.params as { id: string };
  const body = request.body as { recordingId?: string };

  const meeting = await prisma.meetingRecord.findUnique({ where: { id } });
  if (!meeting) {
    return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Meeting not found." } } as ApiResponse);
  }

  const recordingId = body.recordingId ?? meeting.recordingId ?? null;
  if (!recordingId) {
    return reply.code(400).send({ success: false, error: { code: "NO_RECORDING", message: "No recording ID. Pass recordingId in body." } } as ApiResponse);
  }

  // getTranscriptText must be a static import at the top of meetings.ts:
  // import { getTranscriptText } from "../lib/daily.js";
  const transcriptText = await getTranscriptText(recordingId);
  if (!transcriptText) {
    return reply.code(503).send({ success: false, error: { code: "TRANSCRIPT_UNAVAILABLE", message: "Transcript not yet available or transcription disabled." } } as ApiResponse);
  }

  // Call AI service for summary
  let aiSummary: string | null = null;
  try {
    const aiRes = await fetch(
      `${process.env.AI_SERVICE_URL ?? "http://localhost:4007"}/ai/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          type: "meeting_summary",
          content: transcriptText.slice(0, 8000), // trim to safe token limit
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (aiRes.ok) {
      const aiData = (await aiRes.json()) as { success?: boolean; data?: { text?: string } };
      aiSummary = aiData?.data?.text ?? null;
    }
  } catch {
    // Non-fatal — save transcript even if AI summary fails
  }

  const updated = await prisma.meetingRecord.update({
    where: { id },
    data: { transcriptText, aiSummary, recordingId },
  });

  await cache.delete(CacheKeys.meetings("admin"));

  return reply.code(200).send({ success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>);
});
```

Import `cache` and `CacheKeys` if not already imported at the top of `meetings.ts`.

- [ ] **Step 6: Add AI `meeting_summary` handler in AI service**

Open `services/ai/src/routes/ai.ts`. Find where `type` is handled in the generate route. Add a case for `meeting_summary`:

```typescript
if (body.type === "meeting_summary") {
  const prompt = `You are a meeting assistant. Summarise the following meeting transcript in 3-5 bullet points, then list action items with owner names where mentioned. Be concise.\n\nTranscript:\n${body.content}`;
  // Use existing Claude client pattern in this file
  const text = await generateText(prompt); // use whatever helper already exists
  return { success: true, data: { text } };
}
```

Check how other types (estimate, generate) call Claude and follow the same pattern.

- [ ] **Step 7: Expose in gateway**

Add to `apps/gateway/src/routes/video-rooms.controller.ts` (or create `meetings.controller.ts` following the `forum.controller.ts` pattern):

```typescript
@Roles("ADMIN", "STAFF")
@Post("meetings/:id/transcribe")
async transcribeMeeting(
  @Param("id") id: string,
  @Body() body: unknown,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-client-id") clientId?: string,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string,
): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/meetings/${id}/transcribe`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
}
```

- [ ] **Step 8: Commit**

```bash
git add services/core/src/lib/daily.ts \
        services/core/src/routes/meetings.ts \
        services/core/prisma/schema.prisma \
        services/core/prisma/migrations/ \
        services/ai/src/routes/ai.ts \
        apps/gateway/src/routes/
git commit -m "feat: meeting transcription + AI summary via Daily.co + Claude (Wave 2 T2)"
```

---

### Task 3: Audit Event Writes — Wire to All Key Admin Actions

**Context:** `AuditEvent` model and read routes exist. The problem: nobody is actually calling `prisma.auditEvent.create()` when admins take actions. This task adds a helper and wires it into the five highest-risk routes: project create/update, milestone approve/reject, deliverable approve, change-request approve/reject, and contract sign.

**Files:**
- Create: `services/core/src/lib/audit.ts`
- Modify: `services/core/src/routes/projects.ts`
- Modify: `services/core/src/routes/milestone-approvals.ts`
- Modify: `services/core/src/routes/deliverables.ts`
- Modify: `services/core/src/routes/change-requests.ts`
- Modify: `services/core/src/routes/contracts.ts`

- [ ] **Step 1: Create audit helper**

Create `services/core/src/lib/audit.ts`:

```typescript
// ── audit.ts — fire-and-forget audit event writer ────────────────────────────
// Never throws. Failures are logged but do not break the calling request.

import { prisma } from "./prisma.js";

interface AuditPayload {
  actorId?:      string | null;
  actorRole?:    string | null;
  actorName?:    string | null;
  action:        string;
  resourceType:  string;
  resourceId?:   string | null;
  details?:      string | null;
  ipAddress?:    string | null;
  userAgent?:    string | null;
}

export function writeAuditEvent(payload: AuditPayload): void {
  prisma.auditEvent.create({ data: payload }).catch((err) => {
    console.error("[audit] Failed to write audit event:", err);
  });
}
```

- [ ] **Step 2: Wire into project create/update in projects.ts**

Open `services/core/src/routes/projects.ts`. Find the `POST /projects` handler. After the `prisma.project.create()` call, add:

```typescript
import { writeAuditEvent } from "../lib/audit.js";

// ... inside POST /projects, after successful create:
writeAuditEvent({
  actorId:      scope.userId,
  actorRole:    scope.role,
  actorName:    null,
  action:       "PROJECT_CREATED",
  resourceType: "Project",
  resourceId:   project.id,
  details:      `Created project: ${project.name}`,
});
```

Find the `PATCH /projects/:id` handler. After successful update:

```typescript
writeAuditEvent({
  actorId:      scope.userId,
  actorRole:    scope.role,
  action:       "PROJECT_UPDATED",
  resourceType: "Project",
  resourceId:   id,
  details:      JSON.stringify(body),
});
```

- [ ] **Step 3: Wire into milestone-approvals.ts**

Open `services/core/src/routes/milestone-approvals.ts`. Add import. Find approve and reject handlers:

```typescript
// After milestone approve:
writeAuditEvent({
  actorId:      scope.userId,
  actorRole:    scope.role,
  action:       "MILESTONE_APPROVED",
  resourceType: "Milestone",
  resourceId:   milestoneId,
  details:      `Approved by ${scope.userId}`,
});

// After milestone reject:
writeAuditEvent({
  actorId:      scope.userId,
  actorRole:    scope.role,
  action:       "MILESTONE_REJECTED",
  resourceType: "Milestone",
  resourceId:   milestoneId,
  details:      body.reason ?? null,
});
```

- [ ] **Step 4: Wire into deliverables.ts approve**

Find the `PATCH /projects/:projectId/deliverables/:id` handler. When `status` changes to `"APPROVED"`:

```typescript
if (body.status === "APPROVED") {
  writeAuditEvent({
    actorId:      scope.userId,
    actorRole:    scope.role,
    action:       "DELIVERABLE_APPROVED",
    resourceType: "Deliverable",
    resourceId:   deliverableId,
  });
}
```

- [ ] **Step 5: Wire into change-requests.ts**

In `services/core/src/routes/change-requests.ts`, find approve/reject handlers:

```typescript
writeAuditEvent({
  actorId:      scope.userId,
  actorRole:    scope.role,
  action:       approved ? "CHANGE_REQUEST_APPROVED" : "CHANGE_REQUEST_REJECTED",
  resourceType: "ChangeRequest",
  resourceId:   id,
  details:      body.reason ?? null,
});
```

- [ ] **Step 6: Wire into contracts.ts sign**

In `services/core/src/routes/contracts.ts`, find the `PATCH /contracts/:id` handler where `signedAt` is set:

```typescript
if (body.signedAt || body.signedByName) {
  writeAuditEvent({
    actorId:      scope.userId,
    actorRole:    scope.role,
    action:       "CONTRACT_SIGNED",
    resourceType: "Contract",
    resourceId:   id,
    details:      `Signed by ${body.signedByName ?? scope.userId}`,
  });
}
```

- [ ] **Step 7: Verify audit events appear**

```bash
# Start services, perform a project create action, then query:
curl "http://localhost:4000/audit-events?resourceType=Project&limit=5" \
  -H "x-user-role: ADMIN" \
  -H "x-user-id: test-admin-1"
# Expected: { success: true, data: [{ action: "PROJECT_CREATED", ... }] }
```

- [ ] **Step 8: Commit**

```bash
git add services/core/src/lib/audit.ts \
        services/core/src/routes/projects.ts \
        services/core/src/routes/milestone-approvals.ts \
        services/core/src/routes/deliverables.ts \
        services/core/src/routes/change-requests.ts \
        services/core/src/routes/contracts.ts
git commit -m "feat: wire audit event writes to key admin action routes (Wave 2 T3)"
```

---

### Task 4: Notification Email End-to-End Verification + Fix

**Context:** Notifications service runs on port 4009 with NATS event bus + queue polling. This task verifies the full pipeline works (event → queue → email send) and fixes any broken steps.

**Files:**
- Read: `services/notifications/src/lib/queue.ts`
- Read: `services/notifications/src/lib/subscriptions.ts`
- Possibly modify queue.ts or email sender

- [ ] **Step 1: Read the notification queue implementation**

```bash
cat services/notifications/src/lib/queue.ts
cat services/notifications/src/lib/subscriptions.ts
```

Understand: how is email sent? Is `SMTP_HOST` / `RESEND_API_KEY` used? What does `processNextJob` do?

- [ ] **Step 2: Check environment variables are documented**

Open `services/notifications/.env.example`. Ensure it contains:

```env
RESEND_API_KEY=re_...          # or SMTP_HOST + SMTP_USER + SMTP_PASS
NOTIFICATION_FROM_EMAIL=noreply@maphari.com
NATS_URL=nats://localhost:4222
DATABASE_URL=postgresql://...
```

If `.env.example` doesn't exist, create it.

- [ ] **Step 3: Write a manual test script**

Create `services/notifications/scripts/test-email.ts`:

```typescript
// Run: npx tsx scripts/test-email.ts
import { processNextJob } from "../src/lib/queue.js";
import { prisma } from "../src/lib/prisma.js";

// Insert a test notification job directly
const job = await prisma.notificationJob.create({
  data: {
    type: "EMAIL",
    recipientEmail: process.env.TEST_EMAIL ?? "dev@maphari.com",
    subject: "Maphari Notifications — Test",
    body: "<p>If you see this, email notifications are working.</p>",
    status: "QUEUED",
  }
});

console.log("Created test job:", job.id);
const result = await processNextJob();
console.log("Process result:", result?.status);
await prisma.$disconnect();
```

- [ ] **Step 4: Run test script**

```bash
cd services/notifications
TEST_EMAIL=your@email.com npx tsx scripts/test-email.ts
```

Expected: `Process result: SENT`. If it fails, read the error and fix the email sender (check API key config, SMTP credentials, `from` address).

- [ ] **Step 5: Fix any failures found**

Common issues:
- Missing `RESEND_API_KEY` → add to `.env`
- Wrong `from` address (Resend requires verified domain) → change to `noreply@maphari.co.za` or configure domain
- `notificationJob` model doesn't exist → check actual model name via `cat services/notifications/prisma/schema.prisma | grep "^model"`

- [ ] **Step 6: Commit fix + test script**

```bash
git add services/notifications/scripts/test-email.ts \
        services/notifications/.env.example
git commit -m "test: add notification email test script + fix email delivery (Wave 2 T4)"
```

---

### Task 5: Stripe Billing End-to-End Verification

**Context:** Billing service exists on port 4006. This task verifies that Stripe webhooks are wired, invoices can be paid, and the invoice status updates correctly.

**Files:**
- Read: `services/billing/src/routes/*.ts`
- Read: `services/billing/src/lib/stripe.ts`

- [ ] **Step 1: Audit billing routes**

```bash
ls services/billing/src/routes/
cat services/billing/src/lib/stripe.ts 2>/dev/null | head -60
```

Note the webhook endpoint path and Stripe secret.

- [ ] **Step 2: Verify Stripe env vars are documented**

Open or create `services/billing/.env.example`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
```

- [ ] **Step 3: Test Stripe webhook locally with stripe CLI**

```bash
# Install stripe CLI if not present: brew install stripe/stripe-cli/stripe
stripe listen --forward-to http://localhost:4006/billing/webhooks
# In another terminal, trigger a test event:
stripe trigger invoice.paid
```

Expected: billing service logs show event received + invoice status updated to `PAID`.

- [ ] **Step 4: Fix any wiring issues**

If webhook secret mismatch: update `STRIPE_WEBHOOK_SECRET` in `.env`.
If route not found: check route path matches `stripe listen --forward-to` URL.

- [ ] **Step 5: Commit**

```bash
git add services/billing/.env.example
git commit -m "docs: document Stripe billing env vars and verify webhook wiring (Wave 2 T5)"
```

---

## PHASE 2 — MULTI-ADMIN ACCOUNTABILITY

---

### Task 6: Admin Proposed-Action Approval Workflow (Schema + API)

**Context:** When Admin A takes a high-stakes action (delete a project, void an invoice, reject a contract), it should require Admin B to approve before execution. This adds an `AdminProposedAction` model and endpoints. The UI layer (Task 7) consumes these endpoints.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Create: `services/core/src/routes/admin-proposed-actions.ts`
- Modify: `services/core/src/app.ts`
- Create: migration

- [ ] **Step 1: Add `AdminProposedAction` model to schema**

In `services/core/prisma/schema.prisma`, append:

```prisma
model AdminProposedAction {
  id            String    @id @default(cuid())
  proposedBy    String    // admin userId
  proposedByName String?
  action        String    // e.g. "DELETE_PROJECT", "VOID_INVOICE"
  resourceType  String    // "Project", "Invoice", etc.
  resourceId    String?
  payload       String?   // JSON of what will be changed
  reason        String?
  status        String    @default("PENDING") // PENDING | APPROVED | REJECTED | EXECUTED
  reviewedBy    String?   // admin userId who approved/rejected
  reviewedByName String?
  reviewedAt    DateTime?
  reviewNote    String?
  executedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
cd services/core
npx prisma migrate dev --name add_admin_proposed_action
```

- [ ] **Step 3: Create route file**

Create `services/core/src/routes/admin-proposed-actions.ts`:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// admin-proposed-actions.ts — Two-admin approval workflow
// POST   /admin/proposed-actions          → propose a high-stakes action
// GET    /admin/proposed-actions          → list pending proposals
// PATCH  /admin/proposed-actions/:id/approve → Admin B approves
// PATCH  /admin/proposed-actions/:id/reject  → Admin B rejects
// ════════════════════════════════════════════════════════════════════════════
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { writeAuditEvent } from "../lib/audit.js";

export async function registerAdminProposedActionRoutes(app: FastifyInstance): Promise<void> {

  // GET /admin/proposed-actions
  app.get("/admin/proposed-actions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    }
    const query = request.query as { status?: string };
    const data = await prisma.adminProposedAction.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // POST /admin/proposed-actions
  app.post("/admin/proposed-actions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    }
    const body = request.body as {
      action:       string;
      resourceType: string;
      resourceId?:  string;
      payload?:     Record<string, unknown>;
      reason?:      string;
      proposedByName?: string;
    };
    if (!body.action || !body.resourceType) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "action and resourceType are required" } } as ApiResponse);
    }
    const record = await prisma.adminProposedAction.create({
      data: {
        proposedBy:     scope.userId ?? "unknown",
        proposedByName: body.proposedByName ?? null,
        action:         body.action,
        resourceType:   body.resourceType,
        resourceId:     body.resourceId ?? null,
        payload:        body.payload ? JSON.stringify(body.payload) : null,
        reason:         body.reason ?? null,
        status:         "PENDING",
      },
    });
    writeAuditEvent({
      actorId:      scope.userId,
      actorRole:    "ADMIN",
      action:       "ADMIN_ACTION_PROPOSED",
      resourceType: body.resourceType,
      resourceId:   body.resourceId ?? null,
      details:      `Proposed: ${body.action}`,
    });
    return reply.code(201).send({ success: true, data: record, meta: { requestId: scope.requestId } } as ApiResponse<typeof record>);
  });

  // PATCH /admin/proposed-actions/:id/approve
  app.patch("/admin/proposed-actions/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { reviewNote?: string; reviewedByName?: string };

    const existing = await prisma.adminProposedAction.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Proposed action not found" } } as ApiResponse);
    if (existing.status !== "PENDING") return reply.code(409).send({ success: false, error: { code: "ALREADY_REVIEWED", message: "Action already reviewed" } } as ApiResponse);
    if (existing.proposedBy === scope.userId) {
      return reply.code(403).send({ success: false, error: { code: "SELF_APPROVE", message: "Cannot approve your own proposed action" } } as ApiResponse);
    }

    const updated = await prisma.adminProposedAction.update({
      where: { id },
      data: {
        status:         "APPROVED",
        reviewedBy:     scope.userId ?? null,
        reviewedByName: body.reviewedByName ?? null,
        reviewedAt:     new Date(),
        reviewNote:     body.reviewNote ?? null,
      },
    });
    writeAuditEvent({
      actorId:      scope.userId,
      actorRole:    "ADMIN",
      action:       "ADMIN_ACTION_APPROVED",
      resourceType: existing.resourceType,
      resourceId:   existing.resourceId,
      details:      `Approved proposed action: ${existing.action}`,
    });
    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });

  // PATCH /admin/proposed-actions/:id/reject
  app.patch("/admin/proposed-actions/:id/reject", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { reviewNote?: string; reviewedByName?: string };

    const existing = await prisma.adminProposedAction.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Proposed action not found" } } as ApiResponse);
    if (existing.status !== "PENDING") return reply.code(409).send({ success: false, error: { code: "ALREADY_REVIEWED", message: "Action already reviewed" } } as ApiResponse);

    const updated = await prisma.adminProposedAction.update({
      where: { id },
      data: {
        status:         "REJECTED",
        reviewedBy:     scope.userId ?? null,
        reviewedByName: body.reviewedByName ?? null,
        reviewedAt:     new Date(),
        reviewNote:     body.reviewNote ?? null,
      },
    });
    writeAuditEvent({
      actorId:      scope.userId,
      actorRole:    "ADMIN",
      action:       "ADMIN_ACTION_REJECTED",
      resourceType: existing.resourceType,
      resourceId:   existing.resourceId,
    });
    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
```

- [ ] **Step 4: Register routes in core app**

Open `services/core/src/app.ts`. Add the import with the other route imports at the top:

```typescript
import { registerAdminProposedActionRoutes } from "./routes/admin-proposed-actions.js";
```

Then call it alongside the other `await register...` calls in the app setup function:

```typescript
await registerAdminProposedActionRoutes(app);
```

- [ ] **Step 5: Add gateway controller**

Create `apps/gateway/src/routes/admin-proposed-actions.controller.ts` using the canonical `proxyRequest` + `@Headers()` pattern:

```typescript
import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class AdminProposedActionsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    };
  }

  @Roles("ADMIN")
  @Get("admin/proposed-actions")
  async list(
    @Query("status") status?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const qs = status ? `?status=${status}` : "";
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions${qs}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/proposed-actions")
  async propose(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/proposed-actions/:id/approve")
  async approve(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions/${id}/approve`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/proposed-actions/:id/reject")
  async reject(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions/${id}/reject`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }
}
```

Register `AdminProposedActionsController` in `apps/gateway/src/modules/app.module.ts` controllers array.

- [ ] **Step 6: Verify**

```bash
# Propose an action:
curl -X POST http://localhost:4000/admin/proposed-actions \
  -H "Content-Type: application/json" \
  -H "x-user-role: ADMIN" -H "x-user-id: admin-1" \
  -d '{"action":"DELETE_PROJECT","resourceType":"Project","resourceId":"proj-1","reason":"Test"}'
# Expected: 201 with PENDING status

# Approve with different admin (should fail with admin-1):
curl -X PATCH http://localhost:4000/admin/proposed-actions/{id}/approve \
  -H "x-user-role: ADMIN" -H "x-user-id: admin-1"
# Expected: 403 SELF_APPROVE

# Approve with admin-2:
curl -X PATCH http://localhost:4000/admin/proposed-actions/{id}/approve \
  -H "x-user-role: ADMIN" -H "x-user-id: admin-2"
# Expected: 200 APPROVED
```

- [ ] **Step 7: Commit**

```bash
git add services/core/prisma/schema.prisma \
        services/core/prisma/migrations/ \
        services/core/src/routes/admin-proposed-actions.ts \
        services/core/src/app.ts \
        apps/gateway/src/routes/admin-proposed-actions.controller.ts \
        apps/gateway/src/modules/app.module.ts
git commit -m "feat: admin two-person approval workflow for high-stakes actions (Wave 2 T6)"
```

---

### Task 7: Admin Approval Workflow UI

**Context:** Wire the API from Task 6 into the Admin dashboard. High-stakes action buttons show a "Propose for approval" modal instead of executing directly. A new "Pending Approvals" panel shows items waiting for another admin's sign-off.

**Files:**
- Create: `apps/web/src/lib/api/admin/proposed-actions.ts`
- Create: `apps/web/src/components/admin/dashboard/pages/proposed-actions-page.tsx`
- Modify: `apps/web/src/app/style/admin/pages-misc.module.css`

- [ ] **Step 1: Create API client**

Create `apps/web/src/lib/api/admin/proposed-actions.ts`:

```typescript
import type { Session } from "next-auth";

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:4000";

export interface ProposedAction {
  id:              string;
  proposedBy:      string;
  proposedByName:  string | null;
  action:          string;
  resourceType:    string;
  resourceId:      string | null;
  payload:         string | null;
  reason:          string | null;
  status:          "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";
  reviewedBy:      string | null;
  reviewedByName:  string | null;
  reviewedAt:      string | null;
  reviewNote:      string | null;
  createdAt:       string;
}

async function apiFetch(session: Session, method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function listProposedActions(session: Session, status?: string) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch(session, "GET", `admin/proposed-actions${qs}`) as Promise<{ success: boolean; data: ProposedAction[] }>;
}

export async function proposeAction(session: Session, payload: {
  action: string; resourceType: string; resourceId?: string; payload?: Record<string, unknown>; reason?: string;
}) {
  return apiFetch(session, "POST", "admin/proposed-actions", payload);
}

export async function approveProposedAction(session: Session, id: string, reviewNote?: string) {
  return apiFetch(session, "PATCH", `admin/proposed-actions/${id}/approve`, { reviewNote });
}

export async function rejectProposedAction(session: Session, id: string, reviewNote?: string) {
  return apiFetch(session, "PATCH", `admin/proposed-actions/${id}/reject`, { reviewNote });
}
```

- [ ] **Step 2: Create pending approvals page component**

Create `apps/web/src/components/admin/dashboard/pages/proposed-actions-page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { styles } from "../style";
import {
  listProposedActions,
  approveProposedAction,
  rejectProposedAction,
  type ProposedAction,
} from "@/lib/api/admin/proposed-actions";

export function ProposedActionsPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ProposedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    if (!session) return;
    setLoading(true);
    const res = await listProposedActions(session, "PENDING");
    if (res.success) setItems(res.data);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [session]);

  async function handleApprove(id: string) {
    if (!session) return;
    setWorking(id);
    await approveProposedAction(session, id);
    await load();
    setWorking(null);
  }

  async function handleReject(id: string) {
    if (!session) return;
    setWorking(id);
    await rejectProposedAction(session, id, "Rejected via dashboard");
    await load();
    setWorking(null);
  }

  if (loading) return <div className={styles.pageLoading}>Loading…</div>;

  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pending Approvals</h1>
        <p className={styles.pageSubtitle}>High-stakes actions proposed by admins that require a second sign-off.</p>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>No pending approvals.</div>
      ) : (
        <div className={styles.paList}>
          {items.map((item) => (
            <div key={item.id} className={styles.paCard}>
              <div className={styles.paCardHeader}>
                <span className={styles.paBadge}>{item.action.replace(/_/g, " ")}</span>
                <span className={styles.paResource}>{item.resourceType} · {item.resourceId ?? "—"}</span>
              </div>
              <div className={styles.paCardBody}>
                <p className={styles.paProposer}>Proposed by <strong>{item.proposedByName ?? item.proposedBy}</strong></p>
                {item.reason && <p className={styles.paReason}>{item.reason}</p>}
              </div>
              <div className={styles.paCardActions}>
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={working === item.id}
                  onClick={() => handleApprove(item.id)}
                >
                  {working === item.id ? "Working…" : "Approve"}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={working === item.id}
                  onClick={() => handleReject(item.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add CSS for proposed actions page**

Open `apps/web/src/app/style/admin/pages-misc.module.css`. Append:

```css
/* ── Proposed Actions ───────────────────────────────────────────────────── */
.paList { display: flex; flex-direction: column; gap: 12px; }

.paCard {
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: var(--r-md);
  padding: 16px 20px;
}

.paCardHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.paBadge {
  background: rgba(139,111,255,0.12);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--r-xs);
}

.paResource { font-size: 12px; color: var(--text-3); }
.paProposer { font-size: 13px; color: var(--text-2); margin: 0 0 4px; }
.paReason { font-size: 12px; color: var(--text-3); margin: 0; font-style: italic; }

.paCardBody { margin-bottom: 12px; }

.paCardActions { display: flex; gap: 8px; }
```

- [ ] **Step 4: Wire page into admin dashboard navigation**

Find where admin pages are registered in `apps/web/src/components/admin/maphari-admin-dashboard.tsx` (or equivalent). Add `proposed-approvals` as a navigation entry with the `ProposedActionsPage` component.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api/admin/proposed-actions.ts \
        apps/web/src/components/admin/dashboard/pages/proposed-actions-page.tsx \
        apps/web/src/app/style/admin/pages-misc.module.css \
        apps/web/src/components/admin/
git commit -m "feat: pending approvals page for multi-admin accountability (Wave 2 T7)"
```

---

## PHASE 3 — STAFF COLLABORATIVE FEATURES

---

### Task 8: Daily Standup Reminder Cron + Team Digest

**Context:** `StandupEntry` model + routes already exist. Staff must manually visit the standup page. This adds a daily 9 AM cron that logs a reminder (future: sends notification), and a separate cron at 10 AM that generates a digest of who submitted and who hasn't.

**Files:**
- Create: `services/core/src/cron/standup-reminder.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Create standup reminder cron file**

Create `services/core/src/cron/standup-reminder.ts`:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// standup-reminder.ts — Daily standup reminder + digest crons
// Reminder : 09:00 Mon–Fri
// Digest   : 10:00 Mon–Fri (who submitted, who hasn't)
// ════════════════════════════════════════════════════════════════════════════
import cron from "node-cron";
import { prisma } from "../lib/prisma.js";  // singleton — never import PrismaClient directly

export function scheduleStandupReminder(): void {
  // 09:00 Mon–Fri: log reminder (future: push to notification queue)
  cron.schedule("0 9 * * 1-5", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const activeStaff = await prisma.staffProfile.findMany({
      where: { isActive: true },   // isActive Boolean — not status String
      select: { id: true, name: true, userId: true },
    });
    console.log(
      `[standup-cron] 09:00 reminder — ${activeStaff.length} active staff members. ` +
      `Date: ${today}. Reminder logged (wire to notification queue for push delivery).`
    );
    // TODO Wave 3: emit to notification queue per staff member
  });
}

export function scheduleStandupDigest(): void {
  // 10:00 Mon–Fri: generate digest of who submitted, who missed
  cron.schedule("0 10 * * 1-5", async () => {
    try {
      const today = new Date().toISOString().split("T")[0]!;
      // StandupEntry.date is DateTime — use a day range
      const startOfDay = new Date(today + "T00:00:00.000Z");
      const endOfDay   = new Date(today + "T23:59:59.999Z");

      const [submitted, activeStaff] = await Promise.all([
        prisma.standupEntry.findMany({
          where: { date: { gte: startOfDay, lte: endOfDay } },
          select: { staffId: true },
        }),
        prisma.staffProfile.findMany({
          where: { isActive: true },  // isActive Boolean
          select: { id: true, name: true },
        }),
      ]);

      const submittedIds = new Set(submitted.map((s) => s.staffId));
      const missing = activeStaff.filter((s) => !submittedIds.has(s.id));

      console.log(
        `[standup-cron] 10:00 digest for ${today}: ` +
        `${submitted.length} submitted, ${missing.length} missing. ` +
        `Missing: ${missing.map((s) => s.name).join(", ") || "none"}`
      );
    } catch (err) {
      console.error("[standup-cron] Digest generation failed:", err);
    }
  });
}
```

- [ ] **Step 2: Register crons in core app**

Open `services/core/src/app.ts`. Add the import alongside the peer-review cron imports:

```typescript
import { scheduleStandupReminder, scheduleStandupDigest } from "./cron/standup-reminder.js";
```

Then call alongside the other cron registrations:

```typescript
scheduleStandupReminder();
scheduleStandupDigest();
console.log("[core] Standup crons registered");
```

- [ ] **Step 3: Add GET /standup/missing-today endpoint**

In `services/core/src/routes/standup.ts`, add:

```typescript
// GET /standup/missing-today — returns staff who haven't submitted today
app.get("/standup/missing-today", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role === "CLIENT") {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
  }

  const today = new Date().toISOString().split("T")[0]!;
  // StandupEntry.date is DateTime — use a day range
  const startOfDay = new Date(today + "T00:00:00.000Z");
  const endOfDay   = new Date(today + "T23:59:59.999Z");

  const [submitted, activeStaff] = await Promise.all([
    prisma.standupEntry.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      select: { staffId: true }
    }),
    prisma.staffProfile.findMany({
      where: { isActive: true },  // isActive Boolean — not status String
      select: { id: true, name: true, avatarInitials: true, avatarColor: true }
    }),
  ]);

  const submittedIds = new Set(submitted.map((s) => s.staffId));
  const missing = activeStaff.filter((s) => !submittedIds.has(s.id));

  const result = { today, submittedCount: submitted.length, missingCount: missing.length, missing };
  return { success: true, data: result, meta: { requestId: scope.requestId } } as ApiResponse<typeof result>;
});
```

Fix: replace `ApiResponse<typeof data>` with `ApiResponse<{ today: string; submittedCount: number; missingCount: number; missing: typeof activeStaff }>`.

- [ ] **Step 4: Commit**

```bash
git add services/core/src/cron/standup-reminder.ts \
        services/core/src/app.ts \
        services/core/src/routes/standup.ts
git commit -m "feat: daily standup reminder + digest crons + missing-today endpoint (Wave 2 T8)"
```

---

### Task 9: @Mention Notification in Comments and Messages

**Context:** `EntityComment` model already exists. When a comment body contains `@name`, we should create a notification for that staff member. This adds a mention parser that runs on comment create and triggers an in-app notification.

**Files:**
- Create: `services/core/src/lib/mentions.ts`
- Modify: `services/core/src/routes/comments.ts`

- [ ] **Step 1: Create mention parser**

Create `services/core/src/lib/mentions.ts`:

```typescript
// ── mentions.ts — @mention parser ────────────────────────────────────────────
// Extracts @name tokens from text and looks up matching StaffProfile records.

import { prisma } from "./prisma.js";

const MENTION_RE = /@([\w.-]+)/g;

/** Parse @mentions from text and return matching staff user IDs */
export async function resolveMentions(text: string): Promise<Array<{ staffId: string; userId: string | null; name: string }>> {
  const handles = [...text.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase());
  if (handles.length === 0) return [];

  // Match by name (case-insensitive prefix) — take first match per handle
  const staff = await prisma.staffProfile.findMany({
    where: { isActive: true },   // isActive Boolean — not status String
    select: { id: true, userId: true, name: true },
  });

  const results: Array<{ staffId: string; userId: string | null; name: string }> = [];
  for (const handle of handles) {
    const match = staff.find((s) => s.name.toLowerCase().replace(/\s+/g, ".").startsWith(handle));
    if (match && !results.find((r) => r.staffId === match.id)) {
      results.push({ staffId: match.id, userId: match.userId, name: match.name });
    }
  }
  return results;
}

/** Log mention notifications (fire-and-forget) */
export function notifyMentions(
  mentions: Array<{ staffId: string; userId: string | null; name: string }>,
  context: { commentId: string; entityType: string; entityId: string; authorName: string | null; excerpt: string }
): void {
  for (const m of mentions) {
    prisma.clientActivity.create({
      data: {
        // Reuse ClientActivity as a generic activity record
        // In production: emit to notification queue per userId
        clientId: context.entityId, // best-effort — entityId
        type:     "MENTION",
        description: `${context.authorName ?? "Someone"} mentioned @${m.name} in a comment`,
        metadata: JSON.stringify({ commentId: context.commentId, entityType: context.entityType }),
      }
    }).catch(() => {});
    console.log(`[mentions] @${m.name} mentioned in ${context.entityType}:${context.entityId}`);
  }
}
```

- [ ] **Step 2: Wire into comments.ts POST handler**

Open `services/core/src/routes/comments.ts`. At the top, add:

```typescript
import { resolveMentions, notifyMentions } from "../lib/mentions.js";
```

In the `POST /comments` (or `POST /:entityType/:entityId/comments`) handler, after the comment is created:

```typescript
const mentions = await resolveMentions(body.content ?? "");
if (mentions.length > 0) {
  notifyMentions(mentions, {
    commentId:  comment.id,
    entityType: body.entityType ?? "unknown",
    entityId:   body.entityId ?? "unknown",
    authorName: scope.userId ?? null,
    excerpt:    (body.content ?? "").slice(0, 100),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add services/core/src/lib/mentions.ts \
        services/core/src/routes/comments.ts
git commit -m "feat: @mention parser + notification trigger in comments (Wave 2 T9)"
```

---

### Task 10: AI-Powered Handover Summary

**Context:** `HandoverRecord` model and routes exist. Staff create handover notes manually with free-text `notes`. This adds a `POST /handovers/:id/summarise` endpoint that sends the notes to the AI service and stores a structured summary back on the record.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Modify: `services/core/src/routes/handovers.ts`

- [ ] **Step 1: Add `aiSummary` field to `HandoverRecord`**

In `services/core/prisma/schema.prisma`, find `model HandoverRecord` and add:

```prisma
aiSummary  String?   // AI-generated structured summary
```

- [ ] **Step 2: Run migration**

```bash
cd services/core
npx prisma migrate dev --name add_handover_ai_summary
```

- [ ] **Step 3: Add summarise endpoint in handovers.ts**

In `services/core/src/routes/handovers.ts`, add after existing routes:

```typescript
// POST /handovers/:id/summarise
app.post("/handovers/:id/summarise", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role === "CLIENT") {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse);
  }

  const { id } = request.params as { id: string };
  const record = await prisma.handoverRecord.findUnique({ where: { id } });
  if (!record) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Handover not found" } } as ApiResponse);
  if (!record.notes) return reply.code(400).send({ success: false, error: { code: "NO_NOTES", message: "Handover has no notes to summarise" } } as ApiResponse);

  let aiSummary: string | null = null;
  try {
    const aiRes = await fetch(
      `${process.env.AI_SERVICE_URL ?? "http://localhost:4007"}/ai/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          type: "handover_summary",
          content: record.notes.slice(0, 4000),
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );
    if (aiRes.ok) {
      const d = (await aiRes.json()) as { success?: boolean; data?: { text?: string } };
      aiSummary = d?.data?.text ?? null;
    }
  } catch {
    return reply.code(503).send({ success: false, error: { code: "AI_UNAVAILABLE", message: "AI service unavailable" } } as ApiResponse);
  }

  const updated = await prisma.handoverRecord.update({ where: { id }, data: { aiSummary } });
  await cache.delete(CacheKeys.handovers("admin"));

  return { success: true, data: toDto(updated), meta: { requestId: scope.requestId } } as ApiResponse<HandoverDto>;
});
```

- [ ] **Step 4: Add `handover_summary` AI handler**

In `services/ai/src/routes/ai.ts`, add in the generate handler:

```typescript
if (body.type === "handover_summary") {
  const prompt = `Summarise this shift handover in 3 bullet points (what was done, what's in progress, what to watch). Then list any open action items.\n\nHandover notes:\n${body.content}`;
  const text = await generateText(prompt);
  return { success: true, data: { text } };
}
```

- [ ] **Step 5: Commit**

```bash
git add services/core/prisma/schema.prisma \
        services/core/prisma/migrations/ \
        services/core/src/routes/handovers.ts \
        services/ai/src/routes/ai.ts
git commit -m "feat: AI handover summary endpoint via Claude (Wave 2 T10)"
```

---

### Task 11: Staff Skill Matrix (Skills on StaffProfile + Admin Assignment)

**Context:** Staff profiles have a `role` field but no skills array. This adds a `skills` JSON field to `StaffProfile` (array of skill tags) and exposes PATCH + GET endpoints for admin to manage and staff to view.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Modify: `services/core/src/routes/staff-profiles.ts`

- [ ] **Step 1: Add `skills` field to StaffProfile**

In `services/core/prisma/schema.prisma`, find `model StaffProfile`. Add:

```prisma
skills         String?   // JSON array of skill tags: ["React","TypeScript","SEO"]
```

- [ ] **Step 2: Run migration**

```bash
cd services/core
npx prisma migrate dev --name add_staff_skills
```

- [ ] **Step 3: Add PATCH /staff-profiles/:id/skills endpoint**

In `services/core/src/routes/staff-profiles.ts`, add:

```typescript
// PATCH /staff-profiles/:id/skills — ADMIN only, set skill tags
app.patch("/staff-profiles/:id/skills", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role !== "ADMIN") {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
  }

  const { id } = request.params as { id: string };
  const body = request.body as { skills: string[] };

  if (!Array.isArray(body.skills)) {
    return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "skills must be an array" } } as ApiResponse);
  }

  const updated = await prisma.staffProfile.update({
    where: { id },
    data: { skills: JSON.stringify(body.skills) },
  });

  return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
});
```

Also add a `GET /staff-profiles/skills/matrix` endpoint for admin:

```typescript
// GET /staff-profiles/skills/matrix — ADMIN/STAFF
app.get("/staff-profiles/skills/matrix", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role === "CLIENT") {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
  }

  const staff = await prisma.staffProfile.findMany({
    where: { isActive: true },  // isActive Boolean — not status String
    select: { id: true, name: true, role: true, skills: true, avatarInitials: true, avatarColor: true },
  });

  const matrix = staff.map((s) => ({
    ...s,
    skills: s.skills ? (JSON.parse(s.skills) as string[]) : [],
  }));

  return { success: true, data: matrix, meta: { requestId: scope.requestId } } as ApiResponse<typeof matrix>;
});
```

- [ ] **Step 4: Commit**

```bash
git add services/core/prisma/schema.prisma \
        services/core/prisma/migrations/ \
        services/core/src/routes/staff-profiles.ts
git commit -m "feat: staff skill matrix — skills field + matrix endpoint (Wave 2 T11)"
```

---

## PHASE 4 — CLIENT PORTAL ENHANCEMENTS

---

### Task 12: Client Deliverable Approval Flow

**Context:** `ProjectDeliverable` model exists with `status` field. Currently only ADMIN/STAFF can change status. This task adds a `PATCH /portal/deliverables/:id/review` endpoint for clients to `APPROVE` or request `CHANGES_REQUESTED`. It also adds `clientFeedback` field to the model.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Modify: `services/core/src/routes/deliverables.ts`
- Create: migration

- [ ] **Step 1: Add clientFeedback field to ProjectDeliverable**

In `services/core/prisma/schema.prisma`, find `model ProjectDeliverable`. Add:

```prisma
clientFeedback  String?   // CLIENT's feedback on CHANGES_REQUESTED
reviewedAt      DateTime?
reviewedByName  String?
```

- [ ] **Step 2: Run migration**

```bash
cd services/core
npx prisma migrate dev --name add_deliverable_client_review
```

- [ ] **Step 3: Add review endpoint**

In `services/core/src/routes/deliverables.ts`, add:

```typescript
// PATCH /portal/deliverables/:id/review — CLIENT approves or requests changes
app.patch("/portal/deliverables/:id/review", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role !== "CLIENT") {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Client only" } } as ApiResponse);
  }

  const { id } = request.params as { id: string };
  const body = request.body as { decision: "APPROVED" | "CHANGES_REQUESTED"; feedback?: string };

  if (!["APPROVED", "CHANGES_REQUESTED"].includes(body.decision)) {
    return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "decision must be APPROVED or CHANGES_REQUESTED" } } as ApiResponse);
  }

  // Tenant safety: verify deliverable belongs to client's project
  const deliverable = await prisma.projectDeliverable.findUnique({
    where: { id },
    include: { project: { select: { clientId: true } } }
  });
  if (!deliverable) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Deliverable not found" } } as ApiResponse);
  if (scope.clientId && deliverable.project?.clientId !== scope.clientId) {
    return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse);
  }

  const updated = await prisma.projectDeliverable.update({
    where: { id },
    data: {
      status:         body.decision,
      clientFeedback: body.feedback ?? null,
      reviewedAt:     new Date(),
    },
  });

  await cache.delete(CacheKeys.deliverables(deliverable.projectId));

  // writeAuditEvent must be a static import at the top of deliverables.ts:
  // import { writeAuditEvent } from "../lib/audit.js";
  writeAuditEvent({
    actorId:      scope.userId,
    actorRole:    "CLIENT",
    action:       body.decision === "APPROVED" ? "DELIVERABLE_APPROVED" : "DELIVERABLE_CHANGES_REQUESTED",
    resourceType: "Deliverable",
    resourceId:   id,
    details:      body.feedback ?? null,
  });

  return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
});
```

- [ ] **Step 4: Expose in gateway**

Find the existing deliverables controller in `apps/gateway/src/routes/` (or create one). Add using the canonical pattern:

```typescript
@Roles("CLIENT")
@Patch("portal/deliverables/:id/review")
async reviewDeliverable(
  @Param("id") id: string,
  @Body() body: unknown,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-client-id") clientId?: string,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string,
): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/portal/deliverables/${id}/review`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
}
```

Use `import { proxyRequest } from "../utils/proxy-request.js"` and `import type { ApiResponse, Role } from "@maphari/contracts"` at the top of the controller.

- [ ] **Step 5: Add client UI for approve/request changes**

In the client deliverables page (`apps/web/src/components/client/maphari-dashboard/pages/`), find the deliverable list component. For each deliverable with status `"PENDING_REVIEW"`, show:

```tsx
{deliverable.status === "PENDING_REVIEW" && (
  <div className={cx("deliverableActions")}>
    <button type="button" className={cx("btnApprove")} onClick={() => handleApprove(deliverable.id)}>
      Approve
    </button>
    <button type="button" className={cx("btnRequestChanges")} onClick={() => handleRequestChanges(deliverable.id)}>
      Request Changes
    </button>
  </div>
)}
```

Add `handleApprove` and `handleRequestChanges` functions calling `PATCH /portal/deliverables/:id/review`.

- [ ] **Step 6: Commit**

```bash
git add services/core/prisma/schema.prisma \
        services/core/prisma/migrations/ \
        services/core/src/routes/deliverables.ts \
        apps/gateway/src/routes/ \
        apps/web/src/components/client/
git commit -m "feat: client deliverable approval flow — APPROVE/CHANGES_REQUESTED (Wave 2 T12)"
```

---

### Task 13: Client Self-Serve Meeting Booking (In-Portal)

**Context:** `Appointment` model exists. Currently only ADMIN/STAFF create appointments. This adds `POST /portal/appointments/book` for clients to book a meeting slot, with a configurable list of available slots. The admin defines availability slots; the client picks one.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Create: `services/core/src/routes/availability.ts`
- Modify: `services/core/src/routes/appointments.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Add AvailabilitySlot model to schema**

```prisma
model AvailabilitySlot {
  id          String    @id @default(cuid())
  adminId     String    // admin userId who defined this slot
  startsAt    DateTime
  endsAt      DateTime
  booked      Boolean   @default(false)
  appointmentId String? // set when booked
  createdAt   DateTime  @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
cd services/core
npx prisma migrate dev --name add_availability_slots
```

- [ ] **Step 3: Create availability.ts routes**

Create `services/core/src/routes/availability.ts`:

```typescript
// GET  /portal/availability          → CLIENT: list open slots for next 14 days
// POST /portal/availability          → ADMIN: create availability slot
// POST /portal/appointments/book     → CLIENT: book a slot (creates Appointment + Daily.co room)
// DELETE /portal/availability/:id   → ADMIN: remove slot

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { createDailyRoom } from "../lib/daily.js";

export async function registerAvailabilityRoutes(app: FastifyInstance): Promise<void> {

  app.get("/portal/availability", async (request) => {
    const scope = readScopeHeaders(request);
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 3600_000);

    const slots = await prisma.availabilitySlot.findMany({
      where: { booked: false, startsAt: { gte: now, lte: twoWeeks } },
      orderBy: { startsAt: "asc" },
    });
    return { success: true, data: slots, meta: { requestId: scope.requestId } } as ApiResponse<typeof slots>;
  });

  app.post("/portal/availability", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    }
    const body = request.body as { startsAt: string; endsAt: string };
    const slot = await prisma.availabilitySlot.create({
      data: { adminId: scope.userId ?? "unknown", startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt) },
    });
    return reply.code(201).send({ success: true, data: slot } as ApiResponse<typeof slot>);
  });

  app.post("/portal/appointments/book", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Client only" } } as ApiResponse);
    }
    const body = request.body as { slotId: string; topic?: string; projectId?: string };
    if (!body.slotId) return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "slotId required" } } as ApiResponse);

    const slot = await prisma.availabilitySlot.findUnique({ where: { id: body.slotId } });
    if (!slot || slot.booked) {
      return reply.code(409).send({ success: false, error: { code: "SLOT_UNAVAILABLE", message: "Slot is no longer available" } } as ApiResponse);
    }

    const roomName = `booking-${body.slotId.slice(0, 8)}-${Date.now()}`;
    const room = await createDailyRoom({ name: roomName, startsAt: slot.startsAt, durationMin: 60 });

    const appointment = await prisma.appointment.create({
      data: {
        clientId:      scope.clientId ?? "unknown",
        scheduledAt:   slot.startsAt,
        durationMins:  60,                          // durationMins Int — not durationMin
        type:          "CHECK_IN",                  // type String — Appointment has no topic field
        notes:         body.topic ?? "Client Meeting",  // use notes for the meeting subject
        videoRoomUrl:  room?.url ?? null,
        status:        "PENDING",                   // default status is PENDING
      },
    });

    await prisma.availabilitySlot.update({
      where: { id: slot.id },
      data: { booked: true, appointmentId: appointment.id },
    });

    return reply.code(201).send({ success: true, data: { appointment, videoRoomUrl: room?.url ?? null } } as ApiResponse);
  });

  app.delete("/portal/availability/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    const { id } = request.params as { id: string };
    await prisma.availabilitySlot.delete({ where: { id } }).catch(() => {});
    return { success: true, data: null } as ApiResponse;
  });
}
```

- [ ] **Step 4: Register routes in core app**

Open `services/core/src/app.ts`. Add:

```typescript
import { registerAvailabilityRoutes } from "./routes/availability.js";
// ... in app setup:
await registerAvailabilityRoutes(app);
```

- [ ] **Step 5: Add gateway endpoints**

Create `apps/gateway/src/routes/availability.controller.ts` using the `proxyRequest` + `@Headers()` pattern. Add these four methods:

```typescript
@Roles("CLIENT", "ADMIN", "STAFF")
@Get("portal/availability")
async listSlots(...headers): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/portal/availability`, "GET", undefined, this.headers(...));
}

@Roles("ADMIN")
@Post("portal/availability")
async createSlot(@Body() body: unknown, ...headers): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/portal/availability`, "POST", body, this.headers(...));
}

@Roles("CLIENT")
@Post("portal/appointments/book")
async bookSlot(@Body() body: unknown, ...headers): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/portal/appointments/book`, "POST", body, this.headers(...));
}

@Roles("ADMIN")
@Delete("portal/availability/:id")
async deleteSlot(@Param("id") id: string, ...headers): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/portal/availability/${id}`, "DELETE", undefined, this.headers(...));
}
```

Follow the full `@Headers("x-user-id") userId?: string` decorator pattern for all `...headers` parameters, same as `forum.controller.ts`. Register in `apps/gateway/src/modules/app.module.ts`.

- [ ] **Step 6: Commit**

```bash
git add services/core/prisma/ \
        services/core/src/routes/availability.ts \
        services/core/src/app.ts \
        apps/gateway/src/routes/
git commit -m "feat: client self-serve meeting booking with Daily.co room creation (Wave 2 T13)"
```

---

### Task 14: Client Onboarding Checklist (First-Login Flow)

**Context:** `ClientOnboardingRecord` model exists (tracks steps). This task adds a `GET /portal/onboarding/checklist` endpoint and a first-login modal on the client dashboard that guides new clients through 5 steps: profile complete, first meeting booked, first project viewed, first message sent, contract signed.

**Files:**
- Modify: `services/core/src/routes/client-onboarding-cx.ts`
- Create: `apps/web/src/components/client/maphari-dashboard/onboarding-checklist.tsx`
- Modify: `apps/web/src/app/style/client/core.module.css`

- [ ] **Step 1: Verify/add checklist endpoint in client-onboarding-cx.ts**

Open `services/core/src/routes/client-onboarding-cx.ts`. Find or add:

```typescript
// GET /portal/onboarding/checklist — computed checklist for current client
app.get("/portal/onboarding/checklist", async (request) => {
  const scope = readScopeHeaders(request);
  const clientId = scope.clientId ?? "unknown";

  const [profile, appointments, projects, messages, contracts] = await Promise.all([
    prisma.clientProfile.findFirst({ where: { clientId }, select: { id: true } }),
    prisma.appointment.findFirst({ where: { clientId } }),
    prisma.project.findFirst({ where: { clientId } }),
    prisma.communicationLog.findFirst({ where: { clientId, direction: "OUTBOUND" } }),
    prisma.clientContract.findFirst({ where: { clientId, signedAt: { not: null } } }),
  ]);

  const steps = [
    { id: "profile",   label: "Complete your profile",   done: !!profile },
    { id: "meeting",   label: "Book your first meeting",  done: !!appointments },
    { id: "project",   label: "View your project",        done: !!projects },
    { id: "message",   label: "Send a message",           done: !!messages },
    { id: "contract",  label: "Sign your contract",       done: !!contracts },
  ];

  const allDone = steps.every((s) => s.done);
  const checklist = { steps, allDone, completedCount: steps.filter((s) => s.done).length };
  return { success: true, data: checklist, meta: { requestId: scope.requestId } } as ApiResponse<typeof checklist>;
});
```

- [ ] **Step 2: Create OnboardingChecklist component**

Create `apps/web/src/components/client/maphari-dashboard/onboarding-checklist.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { cx } from "./style";

interface ChecklistStep { id: string; label: string; done: boolean; }

interface Props {
  session: any;
  onDismiss: () => void;
}

export function OnboardingChecklist({ session, onDismiss }: Props) {
  const [steps, setSteps] = useState<ChecklistStep[]>([]);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:4000"}/portal/onboarding/checklist`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setSteps(d.data.steps); setAllDone(d.data.allDone); } })
      .catch(() => {});
  }, [session]);

  if (allDone) return null;

  return (
    <div className={cx("onboardingOverlay")}>
      <div className={cx("onboardingModal")}>
        <div className={cx("onboardingHeader")}>
          <h2 className={cx("onboardingTitle")}>Welcome to Maphari! 👋</h2>
          <p className={cx("onboardingSubtitle")}>Complete these steps to get started.</p>
        </div>
        <ul className={cx("onboardingList")}>
          {steps.map((step) => (
            <li key={step.id} className={cx("onboardingStep", step.done ? "onboardingStepDone" : "")}>
              <span className={cx("onboardingStepIcon")}>{step.done ? "✓" : "○"}</span>
              <span className={cx("onboardingStepLabel")}>{step.label}</span>
            </li>
          ))}
        </ul>
        <button type="button" className={cx("onboardingDismiss")} onClick={onDismiss}>
          Continue to dashboard
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add CSS for onboarding modal**

In `apps/web/src/app/style/client/core.module.css`, append:

```css
/* ── Onboarding Checklist Modal ─────────────────────────────────────────── */
.onboardingOverlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.onboardingModal {
  background: var(--s1); border: 1px solid var(--b2);
  border-radius: var(--r-lg); padding: 32px; width: 100%; max-width: 420px;
  box-shadow: var(--shadow-modal);
}
.onboardingTitle { font-size: 20px; font-weight: 700; margin: 0 0 6px; color: var(--text-1); }
.onboardingSubtitle { font-size: 13px; color: var(--text-3); margin: 0 0 24px; }
.onboardingList { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 12px; }
.onboardingStep { display: flex; align-items: center; gap: 10px; }
.onboardingStepIcon { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--b3); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--text-3); flex-shrink: 0; }
.onboardingStepDone .onboardingStepIcon { background: var(--lime); border-color: var(--lime); color: #000; font-weight: 700; }
.onboardingStepLabel { font-size: 14px; color: var(--text-2); }
.onboardingStepDone .onboardingStepLabel { color: var(--text-1); }
.onboardingDismiss { width: 100%; padding: 10px; background: var(--lime); color: #000; font-weight: 600; border: none; border-radius: var(--r-sm); cursor: pointer; }
```

- [ ] **Step 4: Show modal on first login**

In `apps/web/src/components/client/maphari-client-dashboard.tsx`, add state:

```tsx
const [showOnboarding, setShowOnboarding] = useState(false);
// In useEffect on mount, fetch /portal/onboarding/checklist and show if !allDone
```

Render `<OnboardingChecklist>` conditionally inside the layout.

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/client-onboarding-cx.ts \
        apps/web/src/components/client/maphari-dashboard/onboarding-checklist.tsx \
        apps/web/src/app/style/client/core.module.css \
        apps/web/src/components/client/maphari-client-dashboard.tsx
git commit -m "feat: client onboarding checklist first-login modal (Wave 2 T14)"
```

---

### Task 15: Budget Burn Tracker (Client Portal)

**Context:** Projects have `budget` field. `ProjectTimeEntry` has hours. Invoices have `totalAmount`. This task adds `GET /portal/projects/:id/budget-burn` which returns budget used vs. remaining and a projected run-out date based on burn rate.

**Files:**
- Create: `services/core/src/routes/budget-burn.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Create budget-burn route**

Create `services/core/src/routes/budget-burn.ts`:

```typescript
// GET /portal/projects/:id/budget-burn — budget usage + burn rate + projection
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export async function registerBudgetBurnRoutes(app: FastifyInstance): Promise<void> {
  app.get("/portal/projects/:id/budget-burn", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: projectId } = request.params as { id: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    const project = await prisma.project.findFirst({
      where: { id: projectId, ...(scopedClientId ? { clientId: scopedClientId } : {}) },
      // budgetCents is BigInt; startAt and dueAt are the actual date field names
      select: { id: true, name: true, budgetCents: true, startAt: true, dueAt: true, clientId: true },
    });

    if (!project) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } } as ApiResponse);
    }

    // Sum paid/pending invoices against this project
    const invoices = await prisma.project.findUnique({
      where: { id: projectId },
      select: { client: { select: { invoices: { where: { projectId }, select: { totalAmount: true, status: true } } } } },
    }).then((p) => p?.client?.invoices ?? []);

    const billedCents = invoices.reduce((sum, inv) => sum + (inv.totalAmount ?? 0), 0);

    // Weekly burn rate from time entries (last 4 weeks)
    // ProjectTimeEntry.minutes is Int (not hours Float)
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 3600_000);
    const recentEntries = await prisma.projectTimeEntry.findMany({
      where: { projectId, createdAt: { gte: fourWeeksAgo } },
      select: { minutes: true },
    });

    const totalMinutesLast4Weeks = recentEntries.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
    const weeklyBurnHours = (totalMinutesLast4Weeks / 60) / 4;

    // budgetCents is BigInt — convert to number for arithmetic
    const budgetCents = Number(project.budgetCents ?? 0);
    const remainingCents = Math.max(0, budgetCents - billedCents);
    const burnPercent = budgetCents > 0 ? Math.round((billedCents / budgetCents) * 100) : 0;

    // Project run-out projection
    const allEntries = await prisma.projectTimeEntry.aggregate({
      where: { projectId },
      _sum: { minutes: true },
    });
    const totalHours = (allEntries._sum.minutes ?? 0) / 60;
    const impliedHourlyRateCents = totalHours > 0 ? billedCents / totalHours : 0;
    const projectedWeeksRemaining = impliedHourlyRateCents > 0 && weeklyBurnHours > 0
      ? Math.ceil(remainingCents / (weeklyBurnHours * impliedHourlyRateCents))
      : null;

    const projectedEndDate = projectedWeeksRemaining != null
      ? new Date(Date.now() + projectedWeeksRemaining * 7 * 24 * 3600_000).toISOString().split("T")[0]
      : null;

    // Convert cents to rand for display (÷100)
    const result = {
      projectId,
      projectName:       project.name,
      budgetRand:        budgetCents / 100,
      billedRand:        billedCents / 100,
      remainingRand:     remainingCents / 100,
      burnPercent,
      weeklyBurnHours,
      projectedEndDate,
      dueAt:             project.dueAt?.toISOString().split("T")[0] ?? null,
    };

    return { success: true, data: result, meta: { requestId: scope.requestId } } as ApiResponse<typeof result>;
  });
}
```

- [ ] **Step 2: Register in core app**

Open `services/core/src/app.ts`:

```typescript
import { registerBudgetBurnRoutes } from "./routes/budget-burn.js";
// ... in app setup:
await registerBudgetBurnRoutes(app);
```

- [ ] **Step 3: Gateway endpoint**

Add to the existing projects gateway controller (or create `budget-burn.controller.ts`). Use the canonical pattern:

```typescript
@Roles("CLIENT", "ADMIN", "STAFF")
@Get("portal/projects/:id/budget-burn")
async getBudgetBurn(
  @Param("id") id: string,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-client-id") clientId?: string,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string,
): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/portal/projects/${id}/budget-burn`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
}
```

- [ ] **Step 4: Client UI component**

In the client project overview page, add a `BudgetBurnGauge` component that:
1. Fetches `/portal/projects/:id/budget-burn`
2. Renders a horizontal progress bar (green < 70%, amber 70-89%, red ≥ 90%)
3. Shows "R{billed} / R{budget} · {burnPercent}% used · Est. end: {projectedEndDate}"

```tsx
function BudgetBurnGauge({ projectId, session }: { projectId: string; session: any }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`${BASE}/portal/projects/${projectId}/budget-burn`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    }).then(r => r.json()).then(d => d.success && setData(d.data)).catch(() => {});
  }, [projectId, session]);

  if (!data || !data.budgetRand) return null;
  const color = data.burnPercent >= 90 ? "red" : data.burnPercent >= 70 ? "amber" : "green";

  return (
    <div className={cx("budgetBurnCard")}>
      <div className={cx("budgetBurnHeader")}>
        <span className={cx("budgetBurnLabel")}>Budget</span>
        <span className={cx("budgetBurnValues")}>R{data.billedRand.toLocaleString()} / R{data.budgetRand.toLocaleString()}</span>
      </div>
      <div className={cx("budgetBurnTrack")}>
        <div className={cx("budgetBurnFill", `budgetBurnFill${color.charAt(0).toUpperCase() + color.slice(1)}`)} style={{ width: `${Math.min(data.burnPercent, 100)}%` }} />
      </div>
      <div className={cx("budgetBurnFooter")}>
        <span className={cx("budgetBurnPct")}>{data.burnPercent}% used</span>
        {data.projectedEndDate && <span className={cx("budgetBurnEst")}>Est. end: {data.projectedEndDate}</span>}
      </div>
    </div>
  );
}
```

Add CSS classes `budgetBurnCard`, `budgetBurnTrack`, `budgetBurnFill`, etc. in `pages-misc.module.css` (client).

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/budget-burn.ts \
        services/core/src/app.ts \
        apps/gateway/src/routes/ \
        apps/web/src/components/client/
git commit -m "feat: budget burn tracker — rate, percent, projected end date (Wave 2 T15)"
```

---

### Task 16: Client Referral Tracking + Invoice Credits

**Context:** `Referral` model already exists. Route `services/core/src/routes/referrals.ts` exists. This task verifies the referral flow works end-to-end and adds a credits display to the client portal. If no credit mechanism exists, adds `referralCredit` accumulation on `ClientProfile`.

**Files:**
- Read: `services/core/src/routes/referrals.ts`
- Modify: `services/core/prisma/schema.prisma` (if needed)
- Modify: client dashboard referral page

- [ ] **Step 1: Read referrals route**

```bash
cat services/core/src/routes/referrals.ts
```

Note: the actual `Referral` model fields are `referredByName String`, `referredByEmail String?`, `referredClientId String?`, `status String`, `rewardAmountCents Int?`, `rewardedAt DateTime?`. There is no `referrerId` FK. Referrals are submitted by anyone (not linked to a client account by FK).

- [ ] **Step 2: Add credit tracking fields if missing**

The `rewardAmountCents` field already exists. Add a `creditApplied` flag if missing:

```prisma
model Referral {
  // ... existing fields ...
  creditApplied  Boolean  @default(false)  // set true when credit is applied to invoice
}
```

Run: `npx prisma migrate dev --name add_referral_credit_applied`

- [ ] **Step 3: Add referral summary endpoint**

In `services/core/src/routes/referrals.ts`, add:

```typescript
// GET /portal/referrals/summary — CLIENT: referrals submitted with their email + reward status
// Since Referral has no clientId FK, we match by the client's email
app.get("/portal/referrals/summary", async (request) => {
  const scope = readScopeHeaders(request);
  // Requires client email from scope — passed via x-user-email header if set,
  // or look up from ClientProfile
  const clientProfile = scope.clientId
    ? await prisma.clientProfile.findFirst({ where: { clientId: scope.clientId }, select: { email: true } })
    : null;
  const clientEmail = clientProfile?.email ?? null;

  const referrals = clientEmail
    ? await prisma.referral.findMany({
        where: { referredByEmail: clientEmail },
        select: { id: true, status: true, rewardAmountCents: true, creditApplied: true, createdAt: true },
      })
    : [];

  const totalRewardCents = referrals.reduce((sum, r) => sum + (r.rewardAmountCents ?? 0), 0);
  const availableCents = referrals
    .filter((r) => !r.creditApplied)
    .reduce((sum, r) => sum + (r.rewardAmountCents ?? 0), 0);

  return {
    success: true,
    data: {
      totalRewardRand: totalRewardCents / 100,
      availableRand:   availableCents / 100,
      referralCount:   referrals.length,
      referrals,
    },
    meta: { requestId: scope.requestId },
  } as ApiResponse;
});
```

- [ ] **Step 4: Show referral link and credits in client portal**

In the client referral page, display:
- Unique referral link: `https://maphari.co.za/ref/{clientId}`
- Credits earned + available
- Table of past referrals with status badges

- [ ] **Step 5: Commit**

```bash
git add services/core/prisma/ services/core/src/routes/referrals.ts \
        apps/web/src/components/client/
git commit -m "feat: referral credits tracking + client portal referral page (Wave 2 T16)"
```

---

## PHASE 5 — AI & CREATIVE FEATURES

---

### Task 17: Predictive Churn Score (NPS + Health + Payment Speed)

**Context:** `ClientHealthScore` model exists with `score` and `trend`. This adds a computed `churnRisk` field derived from: NPS < 7 = high risk, health score < 40 = risk, any invoice overdue > 14 days = risk. The score 0-100 (higher = more at risk). Endpoint: `GET /clients/:id/churn-risk`.

**Files:**
- Create: `services/core/src/routes/churn-risk.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Create churn-risk route**

Create `services/core/src/routes/churn-risk.ts`:

```typescript
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerChurnRiskRoutes(app: FastifyInstance): Promise<void> {
  app.get("/clients/:id/churn-risk", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin or Staff only" } } as ApiResponse);
    }

    const { id: clientId } = request.params as { id: string };

    const [healthScore, surveys, invoices] = await Promise.all([
      prisma.clientHealthScore.findFirst({ where: { clientId }, orderBy: { recordedAt: "desc" } }),
      prisma.satisfactionSurvey.findMany({
        where: { clientId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { npsScore: true }
      }),
      prisma.project.findFirst({
        where: { clientId },
        select: { client: { select: { invoices: { where: { status: "OVERDUE" }, select: { dueAt: true } } } } }
      })
    ]);

    const signals: string[] = [];
    let riskScore = 0;

    // Signal 1: Health score < 40 → +35 risk
    const hs = healthScore?.score ?? 50;
    if (hs < 40) { riskScore += 35; signals.push(`Low health score: ${hs}`); }
    else if (hs < 60) { riskScore += 15; signals.push(`Moderate health score: ${hs}`); }

    // Signal 2: NPS < 7 → +30 risk
    const avgNps = surveys.length > 0
      ? surveys.reduce((s, sv) => s + (sv.npsScore ?? 0), 0) / surveys.length
      : null;
    if (avgNps !== null && avgNps < 7) { riskScore += 30; signals.push(`Low NPS: ${avgNps.toFixed(1)}`); }

    // Signal 3: Overdue invoices > 14 days → +35 risk
    const overdueInvoices = invoices?.client?.invoices ?? [];
    const seriouslyOverdue = overdueInvoices.filter((inv) => {
      if (!inv.dueAt) return false;
      const days = (Date.now() - inv.dueAt.getTime()) / 86_400_000;
      return days > 14;
    });
    if (seriouslyOverdue.length > 0) { riskScore += 35; signals.push(`${seriouslyOverdue.length} invoice(s) overdue > 14 days`); }

    const churnRisk = Math.min(100, riskScore);
    const level = churnRisk >= 70 ? "HIGH" : churnRisk >= 40 ? "MEDIUM" : "LOW";

    return {
      success: true,
      data: { clientId, churnRisk, level, signals, healthScore: hs, avgNps },
      meta: { requestId: scope.requestId }
    } as ApiResponse;
  });
}
```

- [ ] **Step 2: Register + gateway**

In `services/core/src/app.ts`, add:

```typescript
import { registerChurnRiskRoutes } from "./routes/churn-risk.js";
// ... in app setup:
await registerChurnRiskRoutes(app);
```

For the gateway, add to the existing clients controller (or create `churn-risk.controller.ts`) using the canonical pattern:

```typescript
@Roles("ADMIN", "STAFF")
@Get("clients/:id/churn-risk")
async getChurnRisk(
  @Param("id") id: string,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-client-id") clientId?: string,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string,
): Promise<ApiResponse> {
  return proxyRequest(`${this.baseUrl}/clients/${id}/churn-risk`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
}
```

- [ ] **Step 3: Show churn risk badge on admin client list**

In the admin client list page, next to each client name, show a risk badge:
- 🔴 HIGH (≥70), 🟡 MEDIUM (40-69), 🟢 LOW (<40)

Fetch churn risk per client in the client list query (add `?includeChurnRisk=1` and batch-compute on backend, or fetch per-client on hover/expand).

- [ ] **Step 4: Commit**

```bash
git add services/core/src/routes/churn-risk.ts \
        services/core/src/app.ts \
        apps/gateway/src/routes/ \
        apps/web/src/components/admin/
git commit -m "feat: predictive churn risk score from NPS + health + payment signals (Wave 2 T17)"
```

---

### Task 18: Client Sentiment Analysis on Messages

**Context:** Messages in `CommunicationLog` have a `direction` and `content`. When a CLIENT sends a message, we can run sentiment analysis via the AI service and flag negative sentiment to admins. This task adds a webhook-style listener that scores new CLIENT messages.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Modify: `services/core/src/routes/communication-logs.ts`
- Modify: `services/ai/src/routes/ai.ts`

- [ ] **Step 1: Add sentiment fields to CommunicationLog**

The `CommunicationLog` model currently has `subject String` but no message body field. Add both a `body` field for message content and the sentiment fields:

```prisma
model CommunicationLog {
  // ... existing fields (id, clientId, type, subject, fromName, direction, etc.) ...
  body            String?  // message body / content (was missing from original model)
  sentimentScore  Float?   // -1.0 (negative) to 1.0 (positive)
  sentimentLabel  String?  // POSITIVE | NEUTRAL | NEGATIVE
}
```

Run: `npx prisma migrate dev --name add_communication_body_sentiment`

- [ ] **Step 2: Add sentiment analysis on message create**

In `services/core/src/routes/communication-logs.ts`, after creating a log entry where `direction === "INBOUND"` (client message):

```typescript
// Fire-and-forget sentiment analysis for client messages
// Uses `subject` as the text to analyse if `body` is empty
const textToAnalyse = createdLog.body ?? createdLog.subject;
if (createdLog.direction === "INBOUND" && textToAnalyse) {
  (async () => {
    try {
      const aiRes = await fetch(
        `${process.env.AI_SERVICE_URL ?? "http://localhost:4007"}/ai/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
          body: JSON.stringify({ type: "sentiment", content: textToAnalyse.slice(0, 500) }),
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (aiRes.ok) {
        const d = (await aiRes.json()) as { success?: boolean; data?: { score?: number; label?: string } };
        if (d.success && d.data) {
          await prisma.communicationLog.update({
            where: { id: createdLog.id },
            data: { sentimentScore: d.data.score ?? null, sentimentLabel: d.data.label ?? null },
          });
        }
      }
    } catch { /* non-fatal */ }
  })();
}
```

- [ ] **Step 3: Add sentiment AI handler**

In `services/ai/src/routes/ai.ts`:

```typescript
if (body.type === "sentiment") {
  const prompt = `Rate the sentiment of this client message on a scale from -1.0 (very negative) to 1.0 (very positive). Reply with JSON only: {"score": 0.5, "label": "POSITIVE"}. Labels: POSITIVE (>0.2), NEUTRAL (-0.2 to 0.2), NEGATIVE (<-0.2).\n\nMessage: ${body.content}`;
  const rawText = await generateText(prompt);
  try {
    const parsed = JSON.parse(rawText.match(/\{.*\}/s)?.[0] ?? "{}") as { score?: number; label?: string };
    return { success: true, data: parsed };
  } catch {
    return { success: true, data: { score: 0, label: "NEUTRAL" } };
  }
}
```

- [ ] **Step 4: Add `GET /admin/sentiment-alerts` endpoint**

In `services/core/src/routes/communication-logs.ts`:

```typescript
// GET /admin/sentiment-alerts — ADMIN: recent NEGATIVE client messages
app.get("/admin/sentiment-alerts", async (request, reply) => {
  const scope = readScopeHeaders(request);
  if (scope.role !== "ADMIN") return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);

  const alerts = await prisma.communicationLog.findMany({
    where: { sentimentLabel: "NEGATIVE", direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
    take: 50,
    // content → body (added in migration) or subject as fallback
    select: { id: true, clientId: true, subject: true, body: true, sentimentScore: true, createdAt: true },
  });

  return { success: true, data: alerts, meta: { requestId: scope.requestId } } as ApiResponse<typeof alerts>;
});
```

- [ ] **Step 5: Show sentiment badge on admin messages page**

In the admin messages page, for each inbound message show a coloured sentiment pill: 🟢 POSITIVE, ⚪ NEUTRAL, 🔴 NEGATIVE.

- [ ] **Step 6: Commit**

```bash
git add services/core/prisma/ \
        services/core/src/routes/communication-logs.ts \
        services/ai/src/routes/ai.ts \
        apps/web/src/components/admin/
git commit -m "feat: client sentiment analysis on inbound messages + admin alerts (Wave 2 T18)"
```

---

### Task 19: White-Label CSS Variables Per Tenant

**Context:** Each client tenant could have custom accent/background colours stored in `ClientProfile`. The client portal reads these and injects them as CSS custom properties at the root of the portal layout, overriding the default lime green accent.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`
- Modify: `apps/web/src/app/style/client/core.module.css`

- [ ] **Step 1: Add branding fields to ClientProfile**

```prisma
model ClientProfile {
  // ... existing ...
  brandAccentColor   String?   // e.g. "#0052cc"
  brandLogoUrl       String?
  brandName          String?   // override for portal header
}
```

Run: `npx prisma migrate dev --name add_client_branding`

- [ ] **Step 2: Add GET /portal/branding endpoint**

In `services/core/src/routes/client-profile.ts` (or create new):

```typescript
app.get("/portal/branding", async (request) => {
  const scope = readScopeHeaders(request);
  const clientId = scope.clientId;
  if (!clientId) return { success: true, data: null };

  const profile = await prisma.clientProfile.findFirst({
    where: { clientId },
    select: { brandAccentColor: true, brandLogoUrl: true, brandName: true },
  });
  return { success: true, data: profile ?? null } as ApiResponse;
});
```

- [ ] **Step 3: Inject CSS variables in client dashboard root**

In `apps/web/src/components/client/maphari-client-dashboard.tsx`:

```tsx
// In the component, after fetching branding:
const [branding, setBranding] = useState<{ brandAccentColor?: string | null } | null>(null);

useEffect(() => {
  fetch(`${BASE}/portal/branding`, { headers: { Authorization: `Bearer ${session?.accessToken}` } })
    .then(r => r.json())
    .then(d => d.success && setBranding(d.data))
    .catch(() => {});
}, [session]);

// In the JSX, on the root div:
<div
  className={cx("clientRoot")}
  style={branding?.brandAccentColor ? {
    "--lime":    branding.brandAccentColor,
    "--lime2":   branding.brandAccentColor,
    "--accent":  branding.brandAccentColor,
  } as React.CSSProperties : undefined}
>
```

- [ ] **Step 4: Add admin UI to set branding per client**

In the admin client detail page, add a "Branding" section with:
- Colour picker for accent colour (input type="color")
- Logo URL input
- Brand name input
- Save button calling `PATCH /clients/:id/profile` with branding fields

- [ ] **Step 5: Commit**

```bash
git add services/core/prisma/ \
        services/core/src/routes/client-profile.ts \
        apps/web/src/components/client/maphari-client-dashboard.tsx \
        apps/web/src/components/admin/
git commit -m "feat: white-label CSS variables per client tenant (Wave 2 T19)"
```

---

### Task 20: Webhook / Zapier Integration Endpoint

**Context:** `services/core/src/routes/webhooks.ts` and `services/core/src/routes/integrations.ts` already exist. This task verifies they work and adds a generic outbound webhook dispatcher that fires when key events occur (project created, invoice paid, milestone approved).

**Files:**
- Read + verify: `services/core/src/routes/webhooks.ts`
- Modify: `services/core/src/lib/webhook-dispatcher.ts` (create)

- [ ] **Step 1: Read existing webhooks route**

```bash
cat services/core/src/routes/webhooks.ts
```

Note: Does a `WebhookEndpoint` model exist? Can admins register a URL + events to subscribe?

- [ ] **Step 2: Create webhook dispatcher helper**

Create `services/core/src/lib/webhook-dispatcher.ts`:

```typescript
// ── webhook-dispatcher.ts — fire outbound webhooks for platform events ────────
import { prisma } from "./prisma.js";

export interface WebhookEventPayload {
  event:       string;    // e.g. "project.created"
  resourceType: string;
  resourceId:  string | null;
  data:        unknown;
  timestamp:   string;
}

export function dispatchWebhooks(payload: WebhookEventPayload): void {
  (async () => {
    try {
      // Look up registered endpoints for this event
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: { active: true, events: { contains: payload.event } },
      }).catch(() => [] as any[]);

      for (const endpoint of endpoints) {
        fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(endpoint.secret ? { "X-Maphari-Signature": endpoint.secret } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        }).catch((err) => {
          console.error(`[webhook] Failed to dispatch to ${endpoint.url}:`, err);
        });
      }
    } catch {
      // Non-fatal
    }
  })();
}
```

- [ ] **Step 3: Wire dispatcher into key events**

Do NOT rewrite `writeAuditEvent` from Task 3 — its fire-and-forget `.catch()` semantics must remain unchanged. Instead, add a separate `writeAuditEventAndDispatch` wrapper in `audit.ts` that calls the existing helper then separately fires webhooks:

```typescript
import { dispatchWebhooks } from "./webhook-dispatcher.js";

const WEBHOOK_EVENT_MAP: Record<string, string> = {
  PROJECT_CREATED:      "project.created",
  INVOICE_PAID:         "invoice.paid",
  MILESTONE_APPROVED:   "milestone.approved",
  CONTRACT_SIGNED:      "contract.signed",
  DELIVERABLE_APPROVED: "deliverable.approved",
};

// writeAuditEvent from Task 3 stays exactly as-is (fire-and-forget with .catch()).
// New: call this wrapper in routes that need webhook dispatch.
export function writeAuditEventAndDispatch(payload: AuditPayload): void {
  writeAuditEvent(payload);  // keep original semantics — never throws
  const webhookEvent = WEBHOOK_EVENT_MAP[payload.action];
  if (webhookEvent) {
    dispatchWebhooks({
      event:        webhookEvent,
      resourceType: payload.resourceType,
      resourceId:   payload.resourceId ?? null,
      data:         { actorId: payload.actorId, actorRole: payload.actorRole, details: payload.details },
      timestamp:    new Date().toISOString(),
    });
  }
}
```

Update the routes from Task 3 (projects, milestone-approvals, etc.) to call `writeAuditEventAndDispatch` instead of `writeAuditEvent` for the events listed in `WEBHOOK_EVENT_MAP`.
```

Note: This changes the `writeAuditEvent` implementation from fire-and-forget `.catch()` to `.then().catch()`.

- [ ] **Step 4: Verify WebhookEndpoint model exists in schema**

```bash
grep "model WebhookEndpoint" services/core/prisma/schema.prisma
```

If missing, add:

```prisma
model WebhookEndpoint {
  id        String   @id @default(cuid())
  url       String
  events    String   // comma-separated: "project.created,invoice.paid"
  secret    String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

Run migration if added.

- [ ] **Step 5: Commit**

```bash
git add services/core/src/lib/webhook-dispatcher.ts \
        services/core/src/lib/audit.ts \
        services/core/prisma/ \
        services/core/src/routes/webhooks.ts
git commit -m "feat: outbound webhook dispatcher for Zapier/integration events (Wave 2 T20)"
```

---

## PHASE 5B — FUTURE / DEFERRED

The following tasks are architecturally sound but require external vendor accounts or longer development cycles. They are documented here for future sprints.

---

### Task 21: Automated Weekly Progress Reports (PDF via Puppeteer)

**Approach:** A cron job runs every Monday at 08:00 for each active client. It fetches project progress, milestones completed, and hours logged for the past week, renders an HTML template, then converts to PDF using `puppeteer` (headless Chrome) and sends via the notifications service.

**Schema change needed:** `WeeklyReport` model with `clientId`, `weekStarting`, `pdfUrl`, `sentAt`.

**Key files:**
- `services/core/src/cron/weekly-reports.ts` — cron + HTML template
- `services/core/src/routes/weekly-reports.ts` — GET /portal/reports endpoint
- Dependency: `npm install puppeteer` in `services/core`

**Why deferred:** Puppeteer adds ~300MB to the Docker image. Consider serverless PDF (html-pdf-node or wkhtmltopdf) as a lighter alternative, or use a PDF generation API (PDFShift, Gotenberg) to keep the service lean.

---

### Task 22: Mobile Companion App (React Native + Expo)

**Approach:** New repo `apps/mobile` using Expo SDK 51+. Uses `expo-router` for navigation. Connects to `apps/gateway` via the same JWT auth tokens. Covers: notifications, project status, standup submission, message read/reply.

**Why deferred:** Requires Apple Developer account ($99/yr), Google Play account ($25 one-time), Expo EAS account, and dedicated QA cycle. Not a blocker for web deployment.

**Architecture decision:** Share API client code by publishing `@maphari/api-client` from `packages/` and installing in both `apps/web` and `apps/mobile`.

---

### Task 23: Embedded Daily.co Video (In-Portal iFrame SDK)

**Approach:** Replace `window.open(roomUrl)` with the `@daily-co/daily-js` browser SDK embedded directly in the portal as a modal. The client never leaves the portal. Controls (mute, camera, screenshare, leave) are custom-styled in Maphari brand.

**Why deferred:** `@daily-co/daily-js` is a 500KB bundle. Requires proper CSP headers (`frame-src daily.co`). The current "open in new tab" approach is acceptable for MVP.

**Key files when implementing:**
- `apps/web/src/components/shared/video-call-modal.tsx` — DailyIframe wrapper
- `apps/web/src/app/style/shared/video-call.module.css`
- Update `apps/web/next.config.ts` to allow `daily.co` in CSP

---

## Execution Order Summary

| Priority | Task | Effort | Blocker? |
|----------|------|--------|----------|
| 1 | T1: Daily.co cloud recording | 1h | Yes — no recording otherwise |
| 2 | T2: Meeting transcription + AI summary | 2h | Yes — advertised feature |
| 3 | T3: Audit event writes | 2h | Yes — accountability gap |
| 4 | T4: Notification email e2e | 1h | Yes — broken pipeline |
| 5 | T5: Stripe webhook verification | 1h | Yes — billing unverified |
| 6 | T6: Admin proposed-action API | 2h | No |
| 7 | T7: Admin approval UI | 2h | No |
| 8 | T8: Standup crons | 1h | No |
| 9 | T9: @mention notifications | 1h | No |
| 10 | T10: Handover AI summary | 1h | No |
| 11 | T11: Staff skill matrix | 1h | No |
| 12 | T12: Deliverable approval flow | 2h | No |
| 13 | T13: Self-serve meeting booking | 3h | No |
| 14 | T14: Client onboarding checklist | 2h | No |
| 15 | T15: Budget burn tracker | 2h | No |
| 16 | T16: Referral credits | 1h | No |
| 17 | T17: Churn risk score | 2h | No |
| 18 | T18: Sentiment analysis | 2h | No |
| 19 | T19: White-label CSS vars | 1h | No |
| 20 | T20: Webhook dispatcher | 1h | No |

**Total estimated effort: ~32 hours of focused development.**

Deploy after completing T1–T5 (all blockers). Then T6–T20 in any order — each is independently deployable.
