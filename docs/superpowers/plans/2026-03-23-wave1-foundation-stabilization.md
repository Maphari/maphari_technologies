# Wave 1 — Foundation & Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1.1 through v1.4 — fix all admin stub pages, activate the real-time layer across all three portals, wire cross-portal communication and the shared calendar, and give staff OKR/goal tracking, peer reviews, and timesheet approvals.

**Architecture:** Four sequential versions, each a self-contained deployable release. All changes flow through the same path: Prisma schema → core service route → gateway controller → web API client → React page. EventBus (already wired) carries cross-service events. Ably (already provisioned) carries real-time UI updates. No new services introduced — all work happens in `services/core`, `apps/gateway`, and `apps/web`.

**Tech Stack:** Next.js 16 (Turbopack), TypeScript, Prisma (PostgreSQL), Fastify (core service), NestJS (gateway), Zod contracts, Ably (realtime), pnpm monorepo. TypeScript check: `pnpm --filter @maphari/web exec tsc --noEmit`. Prisma migrate: `cd services/core && pnpm prisma migrate dev --name <name>`.

**Spec:** `docs/superpowers/specs/2026-03-23-25-versions-roadmap-design.md` (Wave 1 section)

---

## File Map

### v1.1 — Admin Backend Hardening

| Action | File |
|--------|------|
| Modify | `services/core/prisma/schema.prisma` |
| Create | `services/core/src/routes/crises.ts` |
| Create | `services/core/src/routes/compliance.ts` |
| Create | `services/core/src/routes/fy-checklist.ts` |
| Modify | `services/core/src/app.ts` |
| Create | `apps/gateway/src/routes/crises.controller.ts` |
| Create | `apps/gateway/src/routes/compliance.controller.ts` |
| Create | `apps/gateway/src/routes/fy-checklist.controller.ts` |
| Modify | `apps/gateway/src/modules/app.module.ts` |
| Modify | `apps/web/src/lib/api/admin/governance.ts` |
| Modify | `apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/legal-page.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx` |
| Create | `services/core/src/seeds/compliance-seed.ts` |
| Create | `services/core/src/seeds/fy-checklist-seed.ts` |

### v1.2 — Real-Time Layer Activation

| Action | File |
|--------|------|
| Modify | `packages/platform/src/events/topics.ts` |
| Modify | `services/core/src/routes/projects.ts` |
| Modify | `services/core/src/routes/invoices.ts` |
| Modify | `services/core/src/routes/leads.ts` |
| Modify | `services/core/src/routes/milestones.ts` |
| Verify | `apps/gateway/src/routes/realtime-events.service.ts` (auto-subscribes — no changes expected) |
| Modify | `apps/web/src/components/admin/dashboard/chrome.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/` (revenue/finance page — identify in Task 11) |
| Modify | `apps/web/src/components/client/maphari-client-dashboard.tsx` |

### v1.3 — Communication Foundations

| Action | File |
|--------|------|
| Modify | `services/core/prisma/schema.prisma` |
| Create | `services/core/src/routes/calendar.ts` |
| Modify | `services/core/src/routes/conversations.ts` |
| Modify | `services/core/src/routes/search.ts` |
| Create | `apps/gateway/src/routes/calendar.controller.ts` |
| Modify | `apps/gateway/src/routes/conversation-management.controller.ts` |
| Modify | `apps/gateway/src/routes/search.controller.ts` |
| Modify | `apps/gateway/src/modules/app.module.ts` |
| Create | `apps/web/src/lib/api/admin/calendar.ts` |
| Create | `apps/web/src/lib/api/staff/calendar.ts` |
| Modify | `apps/web/src/lib/api/portal/meetings.ts` |
| Create | `apps/web/src/lib/api/staff/messages.ts` |
| Modify | `apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx` |
| Create | `apps/web/src/components/staff/staff-dashboard/pages/calendar-page.tsx` |
| Modify | `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx` |
| Modify | `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx` |
| Modify | `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx` |

### v1.4 — Staff Empowerment Suite

| Action | File |
|--------|------|
| Modify | `services/core/prisma/schema.prisma` |
| Create | `services/core/src/routes/staff-goals.ts` |
| Create | `services/core/src/routes/peer-reviews.ts` |
| Modify | `services/core/src/routes/time-entries.ts` |
| Create | `apps/gateway/src/routes/staff-goals.controller.ts` |
| Create | `apps/gateway/src/routes/peer-reviews.controller.ts` |
| Modify | `apps/gateway/src/routes/time-entries.controller.ts` |
| Modify | `apps/gateway/src/modules/app.module.ts` |
| Create | `apps/web/src/lib/api/staff/goals.ts` |
| Create | `apps/web/src/lib/api/staff/peer-reviews.ts` |
| Modify | `apps/web/src/lib/api/staff/time.ts` |
| Modify | `apps/web/src/lib/api/admin/hr.ts` |
| Create | `apps/web/src/components/staff/staff-dashboard/pages/my-goals-page.tsx` |
| Create | `apps/web/src/components/staff/staff-dashboard/pages/peer-review-page.tsx` |
| Modify | `apps/web/src/components/staff/staff-dashboard/pages/mycapacity-page.tsx` |
| Modify | `apps/web/src/components/staff/staff-dashboard/ui.tsx` (nav entries) |
| Create | `services/core/src/cron/peer-review-cycle.ts` |
| Modify | `apps/web/src/components/admin/dashboard/pages/` (HR/payroll page — identify with `find` in Task 23 Step 6) |

---

## VERSION 1.1 — Admin Backend Hardening

---

### Task 1: Prisma Models — Crisis, Compliance, DataRetention, FyChecklist

**Files:**
- Modify: `services/core/prisma/schema.prisma`

- [ ] **Step 1: Add models to schema**

Open `services/core/prisma/schema.prisma` and append:

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

- [ ] **Step 2: Run migration**

```bash
cd services/core && pnpm prisma migrate dev --name add-v1-1-admin-models
```

Expected: Migration applied, `generated/prisma` client updated.

- [ ] **Step 3: Commit**

```bash
git add services/core/prisma/schema.prisma services/core/src/generated/
git commit -m "feat(db): add Crisis, ComplianceRecord, DataRetentionPolicy, FyChecklistItem models"
```

---

### Task 2: Core Routes — Crises

**Files:**
- Create: `services/core/src/routes/crises.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Read existing route pattern**

Read `services/core/src/routes/projects.ts` lines 1–50 to understand the Fastify route shape, auth guard pattern, and how `prisma` is accessed via `fastify.prisma`.

- [ ] **Step 2: Create crises route**

Create `services/core/src/routes/crises.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export async function crisesRoutes(fastify: FastifyInstance) {
  // GET /crises — list all (admin only)
  fastify.get('/', async (request, reply) => {
    const role = request.headers['x-user-role'];
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    const crises = await fastify.prisma.crisis.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return crises;
  });

  // POST /crises — create
  fastify.post<{ Body: { title: string; severity: string; description?: string; clientId?: string } }>(
    '/',
    async (request, reply) => {
      const role = request.headers['x-user-role'];
      if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

      const { title, severity, description, clientId } = request.body;
      const crisis = await fastify.prisma.crisis.create({
        data: { title, severity, description, clientId, status: 'ACTIVE' },
      });
      return reply.status(201).send(crisis);
    }
  );

  // PATCH /crises/:id — update status/severity
  fastify.patch<{ Params: { id: string }; Body: { status?: string; severity?: string; resolvedAt?: string } }>(
    '/:id',
    async (request, reply) => {
      const role = request.headers['x-user-role'];
      if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

      const { id } = request.params;
      const { status, severity, resolvedAt } = request.body;
      const crisis = await fastify.prisma.crisis.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(severity && { severity }),
          ...(resolvedAt && { resolvedAt: new Date(resolvedAt) }),
        },
      });
      return crisis;
    }
  );
}
```

- [ ] **Step 3: Register route in app.ts**

In `services/core/src/app.ts`, find where other routes are registered (e.g. `app.register(projectsRoutes, { prefix: '/projects' })`) and add:

```typescript
import { crisesRoutes } from './routes/crises';
// ...
app.register(crisesRoutes, { prefix: '/crises' });
```

- [ ] **Step 4: TypeScript check**

```bash
cd services/core && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/crises.ts services/core/src/app.ts
git commit -m "feat(core): add crises CRUD routes"
```

---

### Task 3: Core Routes — Compliance & FyChecklist

**Files:**
- Create: `services/core/src/routes/compliance.ts`
- Create: `services/core/src/routes/fy-checklist.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Create compliance route**

Create `services/core/src/routes/compliance.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export async function complianceRoutes(fastify: FastifyInstance) {
  // GET /compliance — list all compliance records
  fastify.get('/', async (request, reply) => {
    const role = request.headers['x-user-role'];
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
    return fastify.prisma.complianceRecord.findMany({ orderBy: { area: 'asc' } });
  });

  // PATCH /compliance/:id — update status/notes
  fastify.patch<{ Params: { id: string }; Body: { status?: string; riskLevel?: string; notes?: string; nextAudit?: string } }>(
    '/:id',
    async (request, reply) => {
      const role = request.headers['x-user-role'];
      if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

      const { id } = request.params;
      const { status, riskLevel, notes, nextAudit } = request.body;
      return fastify.prisma.complianceRecord.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(riskLevel && { riskLevel }),
          ...(notes !== undefined && { notes }),
          ...(nextAudit && { nextAudit: new Date(nextAudit) }),
        },
      });
    }
  );

  // GET /compliance/data-retention — list retention policies
  fastify.get('/data-retention', async (request, reply) => {
    const role = request.headers['x-user-role'];
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
    return fastify.prisma.dataRetentionPolicy.findMany({ orderBy: { dataType: 'asc' } });
  });
}
```

- [ ] **Step 2: Create fy-checklist route**

Create `services/core/src/routes/fy-checklist.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export async function fyChecklistRoutes(fastify: FastifyInstance) {
  // GET /fy-checklist?year=2025-2026
  fastify.get<{ Querystring: { year?: string } }>('/', async (request, reply) => {
    const role = request.headers['x-user-role'];
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    const year = request.query.year ?? getCurrentFiscalYear();
    return fastify.prisma.fyChecklistItem.findMany({
      where: { fiscalYear: year },
      orderBy: { category: 'asc' },
    });
  });

  // PATCH /fy-checklist/:id — toggle done
  fastify.patch<{ Params: { id: string }; Body: { done: boolean; doneBy?: string } }>(
    '/:id',
    async (request, reply) => {
      const role = request.headers['x-user-role'];
      if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

      const { id } = request.params;
      const { done, doneBy } = request.body;
      return fastify.prisma.fyChecklistItem.update({
        where: { id },
        data: {
          done,
          doneAt: done ? new Date() : null,
          doneBy: done ? (doneBy ?? null) : null,
        },
      });
    }
  );
}

function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  // Fiscal year starts March (adjust if different)
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
```

- [ ] **Step 3: Register both routes in app.ts**

```typescript
import { complianceRoutes } from './routes/compliance';
import { fyChecklistRoutes } from './routes/fy-checklist';
// ...
app.register(complianceRoutes, { prefix: '/compliance' });
app.register(fyChecklistRoutes, { prefix: '/fy-checklist' });
```

- [ ] **Step 4: TypeScript check**

```bash
cd services/core && pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/compliance.ts services/core/src/routes/fy-checklist.ts services/core/src/app.ts
git commit -m "feat(core): add compliance and FY checklist routes"
```

---

### Task 4: Seed Scripts — Compliance Records & FY Checklist

**Files:**
- Create: `services/core/src/seeds/compliance-seed.ts`
- Create: `services/core/src/seeds/fy-checklist-seed.ts`

- [ ] **Step 1: Read existing seed pattern**

Check if `services/core/prisma/seed.ts` or `services/core/src/seeds/` exists. Read it to understand how seeds are structured.

- [ ] **Step 2: Create compliance seed**

Create `services/core/src/seeds/compliance-seed.ts`:

```typescript
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const records = [
  { area: 'GDPR', status: 'COMPLIANT', riskLevel: 'LOW', lastAudit: new Date('2025-12-01'), nextAudit: new Date('2026-12-01') },
  { area: 'POPIA', status: 'COMPLIANT', riskLevel: 'LOW', lastAudit: new Date('2025-11-01'), nextAudit: new Date('2026-11-01') },
  { area: 'SARS', status: 'COMPLIANT', riskLevel: 'LOW', lastAudit: new Date('2026-02-01'), nextAudit: new Date('2027-02-01') },
  { area: 'ISO27001', status: 'AT_RISK', riskLevel: 'MEDIUM', lastAudit: new Date('2025-09-01'), nextAudit: new Date('2026-06-01') },
  { area: 'POPIA_DATA_SUBJECT', status: 'COMPLIANT', riskLevel: 'LOW', lastAudit: new Date('2026-01-01'), nextAudit: new Date('2027-01-01') },
  { area: 'CONSUMER_PROTECTION', status: 'COMPLIANT', riskLevel: 'LOW', lastAudit: new Date('2026-01-15'), nextAudit: new Date('2027-01-15') },
];

export async function seedCompliance() {
  const count = await prisma.complianceRecord.count();
  if (count > 0) { console.log('Compliance records already seeded'); return; }

  await prisma.complianceRecord.createMany({ data: records });
  console.log(`Seeded ${records.length} compliance records`);
}
```

- [ ] **Step 3: Create FY checklist seed**

Create `services/core/src/seeds/fy-checklist-seed.ts`:

```typescript
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const items = [
  // REVENUE
  { label: 'Reconcile all invoices for FY', category: 'REVENUE' },
  { label: 'Confirm all retainer payments received', category: 'REVENUE' },
  { label: 'Write off uncollectable debts', category: 'REVENUE' },
  { label: 'Prepare revenue summary report', category: 'REVENUE' },
  // TAX
  { label: 'File provisional tax return', category: 'TAX' },
  { label: 'Prepare VAT reconciliation', category: 'TAX' },
  { label: 'Submit PAYE reconciliation (EMP501)', category: 'TAX' },
  { label: 'Confirm no outstanding SARS penalties', category: 'TAX' },
  // PAYROLL
  { label: 'Issue IRP5 certificates to all staff', category: 'PAYROLL' },
  { label: 'Confirm final leave balances', category: 'PAYROLL' },
  { label: 'Process annual bonus payments', category: 'PAYROLL' },
  { label: 'Update payroll rates for new FY', category: 'PAYROLL' },
  // ARCHIVE
  { label: 'Archive all project files for FY', category: 'ARCHIVE' },
  { label: 'Back up financial records offsite', category: 'ARCHIVE' },
  { label: 'Update data retention register', category: 'ARCHIVE' },
];

function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export async function seedFyChecklist() {
  const fiscalYear = getCurrentFiscalYear();
  const count = await prisma.fyChecklistItem.count({ where: { fiscalYear } });
  if (count > 0) { console.log(`FY checklist already seeded for ${fiscalYear}`); return; }

  await prisma.fyChecklistItem.createMany({
    data: items.map(item => ({ ...item, fiscalYear })),
  });
  console.log(`Seeded ${items.length} FY checklist items for ${fiscalYear}`);
}
```

- [ ] **Step 4: Wire seeds into main seed entry point**

Find or create `services/core/prisma/seed.ts` and add:

```typescript
import { seedCompliance } from '../src/seeds/compliance-seed';
import { seedFyChecklist } from '../src/seeds/fy-checklist-seed';

async function main() {
  await seedCompliance();
  await seedFyChecklist();
}

main().catch(console.error);
```

- [ ] **Step 5: Run seeds**

```bash
cd services/core && pnpm prisma db seed
```

Expected: "Seeded 6 compliance records" and "Seeded 15 FY checklist items for 2025-2026".

- [ ] **Step 6: Commit**

```bash
git add services/core/src/seeds/ services/core/prisma/seed.ts
git commit -m "feat(core): add compliance and FY checklist seed scripts"
```

---

### Task 5: Gateway Controllers — Crises, Compliance, FyChecklist

**Files:**
- Create: `apps/gateway/src/routes/crises.controller.ts`
- Create: `apps/gateway/src/routes/compliance.controller.ts`
- Create: `apps/gateway/src/routes/fy-checklist.controller.ts`
- Modify: `apps/gateway/src/modules/app.module.ts`

- [ ] **Step 1: Read existing gateway controller pattern**

Read `apps/gateway/src/routes/clients.controller.ts` lines 1–40 to confirm the pattern. You will see:
- `import { proxyRequest } from "../utils/proxy-request.js"` — thin fetch-based proxy helper
- `import { Roles } from "../auth/roles.decorator.js"` — role guard decorator
- `@Controller()` class decorator with NO path prefix
- Individual routes use `@Get("path/to/resource")` with full path
- Headers extracted via `@Headers("x-user-id")`, `@Headers("x-user-role")`, etc.
- Upstream URL: `const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002"`
- No `HttpService`, no `@nestjs/axios`, no `JwtAuthGuard`

- [ ] **Step 2: Create crises controller**

Create `apps/gateway/src/routes/crises.controller.ts`:

```typescript
import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class CrisesController {
  @Roles("ADMIN")
  @Get("admin/crises")
  async listCrises(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/crises`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Post("admin/crises")
  async createCrisis(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/crises`, "POST", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Patch("admin/crises/:id")
  async updateCrisis(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/crises/${id}`, "PATCH", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
```

- [ ] **Step 3: Create compliance controller**

Create `apps/gateway/src/routes/compliance.controller.ts`:

```typescript
import { Body, Controller, Get, Headers, Param, Patch } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class ComplianceController {
  @Roles("ADMIN")
  @Get("admin/compliance")
  async listCompliance(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/compliance`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Patch("admin/compliance/:id")
  async updateCompliance(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/compliance/${id}`, "PATCH", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
```

- [ ] **Step 4: Create fy-checklist controller**

Create `apps/gateway/src/routes/fy-checklist.controller.ts`:

```typescript
import { Body, Controller, Get, Headers, Param, Patch, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class FyChecklistController {
  @Roles("ADMIN")
  @Get("admin/fy-checklist")
  async listChecklist(
    @Query("year") year?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const qs = year ? `?year=${encodeURIComponent(year)}` : "";
    return proxyRequest(`${baseUrl}/fy-checklist${qs}`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Patch("admin/fy-checklist/:id")
  async toggleItem(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/fy-checklist/${id}`, "PATCH", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
```

- [ ] **Step 5: Register controllers in app.module.ts**

In `apps/gateway/src/modules/app.module.ts`, import and add to the `controllers` array:

```typescript
// Note: app.module.ts lives in modules/ — use ../routes/ prefix + .js extension (NodeNext moduleResolution)
import { CrisesController } from '../routes/crises.controller.js';
import { ComplianceController } from '../routes/compliance.controller.js';
import { FyChecklistController } from '../routes/fy-checklist.controller.js';
// Add to controllers array: [..., CrisesController, ComplianceController, FyChecklistController]
```

- [ ] **Step 6: TypeScript check**

```bash
cd apps/gateway && pnpm exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add apps/gateway/src/routes/crises.controller.ts apps/gateway/src/routes/compliance.controller.ts apps/gateway/src/routes/fy-checklist.controller.ts apps/gateway/src/modules/app.module.ts
git commit -m "feat(gateway): add crises, compliance, FY checklist controllers"
```

---

### Task 6: Web API Functions — governance.ts

**Files:**
- Modify: `apps/web/src/lib/api/admin/governance.ts`

> **Pattern:** This file already uses `withAuthorizedSession` + `callGateway` from `./_shared` and `AuthSession` from `../../auth/session`. Match that pattern exactly — do NOT introduce `withRefresh`, `fetch`, or `GATEWAY_URL`.

- [ ] **Step 1: Read governance.ts to confirm pattern**

Read `apps/web/src/lib/api/admin/governance.ts` lines 1–30 to confirm the import block. You will see:
```typescript
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";
```

- [ ] **Step 2: Add Crisis types and API functions**

Append to `governance.ts`:

```typescript
// ── Types — Crises ────────────────────────────────────────────────────────────
export interface AdminCrisis {
  id: string;
  title: string;
  severity: string;
  status: string;
  description: string | null;
  clientId: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export async function loadAdminCrisesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminCrisis[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCrisis[]>("/admin/crises", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createCrisisWithRefresh(
  session: AuthSession,
  data: { title: string; severity: string; description?: string; clientId?: string }
): Promise<AuthorizedResult<AdminCrisis>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCrisis>("/admin/crises", token, { method: "POST", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function updateCrisisWithRefresh(
  session: AuthSession,
  id: string,
  data: { status?: string; severity?: string; resolvedAt?: string }
): Promise<AuthorizedResult<AdminCrisis>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCrisis>(`/admin/crises/${id}`, token, { method: "PATCH", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Types — Compliance ────────────────────────────────────────────────────────
export interface ComplianceRecord {
  id: string;
  area: string;
  status: string;
  riskLevel: string;
  lastAudit: string;
  nextAudit: string;
  notes: string | null;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retainYears: number;
  lastPurge: string | null;
  nextPurge: string;
  status: string;
}

export interface FyChecklistItem {
  id: string;
  fiscalYear: string;
  label: string;
  category: string;
  done: boolean;
  doneAt: string | null;
  doneBy: string | null;
}

export async function loadAdminComplianceWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ComplianceRecord[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<ComplianceRecord[]>("/admin/compliance", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function updateComplianceRecordWithRefresh(
  session: AuthSession,
  id: string,
  data: { status?: string; riskLevel?: string; notes?: string; nextAudit?: string }
): Promise<AuthorizedResult<ComplianceRecord>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<ComplianceRecord>(`/admin/compliance/${id}`, token, { method: "PATCH", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function loadAdminDataRetentionWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<DataRetentionPolicy[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<DataRetentionPolicy[]>("/admin/compliance/data-retention", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function loadFyChecklistWithRefresh(
  session: AuthSession,
  year?: string
): Promise<AuthorizedResult<FyChecklistItem[]>> {
  return withAuthorizedSession(session, async (token) => {
    const qs = year ? `?year=${encodeURIComponent(year)}` : "";
    const res = await callGateway<FyChecklistItem[]>(`/admin/fy-checklist${qs}`, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function toggleFyChecklistItemWithRefresh(
  session: AuthSession,
  id: string,
  data: { done: boolean; doneBy?: string }
): Promise<AuthorizedResult<FyChecklistItem>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<FyChecklistItem>(`/admin/fy-checklist/${id}`, token, { method: "PATCH", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
```

> **Gateway path note:** The three new controllers use `@Controller('admin/crises')`, `@Controller('admin/compliance')`, `@Controller('admin/fy-checklist')` — so gateway routes are `/admin/crises`, `/admin/compliance`, `/admin/fy-checklist`, matching what the web API clients call.

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/admin/governance.ts
git commit -m "feat(web): add crisis, compliance, FY checklist API functions to governance.ts"
```

---

### Task 7a: Wire crisis-command-page.tsx

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx`

- [ ] **Step 1: Read the page**

Read `apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx` in full. Note: what static `activeCrises`/`resolved` arrays exist, what workspace hook is used (e.g. `useAdminWorkspace`), whether a session object is available, and which CSS classes are already applied.

- [ ] **Step 2: Replace static data with live fetch**

Remove the hardcoded crisis arrays. Add:

```typescript
const [crises, setCrises] = useState<Crisis[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!session) return;
  loadAdminCrisesWithRefresh(session)
    .then(r => { if (r.data) setCrises(r.data); else if (r.error) setError(r.error.message); })
    .catch(() => setError('Failed to load crises'))
    .finally(() => setLoading(false));
}, [session]);

const activeCrises = crises.filter(c => c.status !== 'RESOLVED');
const resolved = crises.filter(c => c.status === 'RESOLVED');
```

- [ ] **Step 3: Add loading and error states**

Where the crisis list is rendered, add a guard:

```typescript
if (loading) return <div className={cx(s.skeleton)} style={{ height: 200 }} />;
if (error) return <div className={cx(s.errorMsg)}>{error}</div>;
```

- [ ] **Step 4: Wire "Log Crisis" button**

Add a `useState<boolean>` for `showLogModal`. On form submit:

```typescript
async function handleLogCrisis(form: { title: string; severity: string; description?: string }) {
  await createCrisisWithRefresh(session, form);
  const updated = await loadAdminCrisesWithRefresh(session);
  if (updated.data) setCrises(updated.data);
  setShowLogModal(false);
}
```

- [ ] **Step 5: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx
git commit -m "fix(admin): wire crisis-command-page to real API"
```

---

### Task 7b: Wire quality-assurance-page.tsx

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx`

- [ ] **Step 1: Read the page and discover what data it uses**

Read `apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx` in full. Note:
- What stub/hardcoded data arrays exist and what type they are
- What existing API functions the page already imports (if any)
- Whether it's completely static or partially wired

- [ ] **Step 2: Discover the deliverables API function that exists**

Run:
```bash
grep -r "deliverable\|Deliverable\|PENDING_REVIEW" apps/web/src/lib/api/admin/ --include="*.ts" -n | head -20
```

Read the found file(s) to get the exact function name and signature. The function will be something like `loadAdminDeliverablesWithRefresh(session, projectId?)` — but the exact signature may differ. Use whatever you find.

> **If no admin-wide deliverables function exists:** The existing deliverables API may be project-scoped. In that case, skip the API call and instead leave a `// TODO: add loadAdminDeliverablesWithRefresh once available` comment, and wire the page to show a static "API coming in v1.2" placeholder. Do not invent non-existent function names.

- [ ] **Step 3: Replace static data with API call (using the real function found in Step 2)**

Using the exact function name and signature found in Step 2:

```typescript
const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session) return;
  // Use the actual function name you found in Step 2
  loadAdminDeliverablesWithRefresh(session)
    .then(r => { if (r.data) setDeliverables(r.data); })
    .finally(() => setLoading(false));
}, [session]);
```

- [ ] **Step 4: Wire approve/reject if applicable**

If the page has approve/reject buttons, discover the corresponding API function names with:
```bash
grep -r "approve\|reject" apps/web/src/lib/api/admin/ --include="*.ts" -n | grep -i deliv
```

Wire them using the real function names found. Do NOT call `approveDeliverableWithRefresh` or `rejectDeliverableWithRefresh` unless those exact names appear in the grep output.

- [ ] **Step 5: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx
git commit -m "fix(admin): wire quality-assurance-page to real deliverables API"
```

---

### Task 7c: Wire legal-page.tsx

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/legal-page.tsx`

- [ ] **Step 1: Read the page**

Read `apps/web/src/components/admin/dashboard/pages/legal-page.tsx` in full. Note what static `compliance` and `dataRetention` arrays exist.

- [ ] **Step 2: Replace static compliance array**

```typescript
const [compliance, setCompliance] = useState<ComplianceRecord[]>([]);
const [dataRetention, setDataRetention] = useState<DataRetentionPolicy[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session) return;
  Promise.all([
    loadAdminComplianceWithRefresh(session),
    loadAdminDataRetentionWithRefresh(session),
  ])
    .then(([comp, ret]) => {
      if (comp.data) setCompliance(comp.data);
      if (ret.data) setDataRetention(ret.data);
    })
    .finally(() => setLoading(false));
}, [session]);
```

- [ ] **Step 3: Wire compliance status dropdowns**

For each compliance row status `<select>`:

```typescript
async function handleComplianceStatusChange(id: string, status: string) {
  await updateComplianceRecordWithRefresh(session, id, { status });
  setCompliance(prev =>
    prev.map(r => (r.id === id ? { ...r, status } : r))
  );
}
```

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/legal-page.tsx
git commit -m "fix(admin): wire legal-page to compliance and data-retention APIs"
```

---

### Task 7d: Wire financial-year-closeout-page.tsx

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx`

- [ ] **Step 1: Read the page**

Read `apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx` in full. Note the hardcoded checklist item array and any fiscal year filter UI.

- [ ] **Step 2: Replace hardcoded checklist with live fetch**

```typescript
const [items, setItems] = useState<FyChecklistItem[]>([]);
const [loading, setLoading] = useState(true);
const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear());

useEffect(() => {
  if (!session) return;
  loadFyChecklistWithRefresh(session, fiscalYear)
    .then(r => { if (r.data) setItems(r.data); })
    .finally(() => setLoading(false));
}, [session, fiscalYear]);

function getCurrentFiscalYear() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() + 1 >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
```

- [ ] **Step 3: Wire checkbox toggles**

```typescript
async function handleToggle(item: FyChecklistItem) {
  const updated = await toggleFyChecklistItemWithRefresh(session, item.id, {
    done: !item.done,
    doneBy: session.user.email,
  });
  setItems(prev => prev.map(i => (i.id === item.id ? (updated.data ?? i) : i)));
}
```

Replace each static checkbox `onChange` with `() => handleToggle(item)`.

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx
git commit -m "fix(admin): wire financial-year-closeout-page to FY checklist API"
```

---

## VERSION 1.2 — Real-Time Layer Activation

---

### Task 8: Wire EventBus Publish Calls in Core Routes

**Files:**
- Modify: `services/core/src/routes/projects.ts`
- Modify: `services/core/src/routes/invoices.ts`
- Modify: `services/core/src/routes/leads.ts`
- Modify: `services/core/src/routes/milestones.ts`
- Modify: `packages/platform/src/events/topics.ts`

> **Architecture:** Core publishes `DomainEvent` objects to `NatsEventBus` (singleton imported from `../lib/infrastructure.js`). The gateway's `RealtimeEventsService.onModuleInit` subscribes to ALL `EventTopics` values automatically and streams them via SSE to connected browsers. No Ably, no gateway changes needed — publishing from core is enough.

> **EventBus pattern (from existing routes like `clients.ts` and `projects.ts`):**
> ```typescript
> import { eventBus } from '../lib/infrastructure.js';
> import { EventTopics } from '@maphari/platform';
> import { randomUUID } from 'node:crypto';
> // ...
> await eventBus.publish({
>   eventId: randomUUID(),
>   occurredAt: new Date().toISOString(),
>   topic: EventTopics.projectStatusUpdated,
>   payload: { projectId: project.id, status: project.status },
> });
> ```

- [ ] **Step 1: Add milestoneUpdated topic to EventTopics**

In `packages/platform/src/events/topics.ts`, add one entry to the `EventTopics` object (milestones have no existing topic):

```typescript
// Add inside the EventTopics const object:
milestoneUpdated: "core.milestone.updated",
```

Run:
```bash
cd packages/platform && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Publish events in core routes after mutations**

In each file, add the import at the top if not already present:
```typescript
import { eventBus } from '../lib/infrastructure.js';
import { EventTopics } from '@maphari/platform';
import { randomUUID } from 'node:crypto';
```

In `projects.ts`, after a status update PATCH succeeds, add:
```typescript
await eventBus.publish({
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  topic: EventTopics.projectStatusUpdated,
  payload: { projectId: project.id, status: project.status, clientId: project.clientId ?? undefined },
});
```

In `invoices.ts`, after invoice is marked paid, add:
```typescript
await eventBus.publish({
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  topic: EventTopics.invoicePaid,
  payload: { invoiceId: invoice.id, clientId: invoice.clientId },
});
```

In `leads.ts`, after lead created, add:
```typescript
await eventBus.publish({
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  topic: EventTopics.leadCreated,
  payload: { leadId: lead.id },
});
```

In `milestones.ts`, after milestone marked complete, add:
```typescript
await eventBus.publish({
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  topic: EventTopics.milestoneUpdated,
  payload: { milestoneId: milestone.id, projectId: milestone.projectId, clientId: milestone.project?.clientId ?? undefined },
});
```

> **Note:** Before adding these, read each route file to find the exact handler where the mutation completes (look for the `reply.send(...)` call). Place the `eventBus.publish` call just before or after `reply.send`. If a route already calls `eventBus.publish`, extend it rather than duplicating.

- [ ] **Step 3: TypeScript check**

```bash
cd services/core && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/platform/src/events/topics.ts services/core/src/routes/projects.ts services/core/src/routes/invoices.ts services/core/src/routes/leads.ts services/core/src/routes/milestones.ts
git commit -m "feat(core): publish realtime events on project/invoice/lead/milestone mutations"
```

---

### Task 9: Verify Gateway Auto-Subscribes to New EventTopic

**Files:**
- No files to modify (verification only)

> **Architecture confirmation:** `apps/gateway/src/routes/realtime-events.service.ts` subscribes to EVERY topic in `EventTopics` on startup via:
> ```typescript
> const topics = Array.from(new Set(Object.values(EventTopics)));
> await Promise.all(topics.map(async (topic) => this.eventBus.subscribe(topic, ...)));
> ```
> Adding `milestoneUpdated` to `EventTopics` in Task 8 Step 1 is all that is needed — the gateway automatically picks it up on next restart. No code changes to `realtime.controller.ts` or `realtime-events.service.ts` are required.

- [ ] **Step 1: Confirm auto-subscription pattern**

Read `apps/gateway/src/routes/realtime-events.service.ts` and verify `onModuleInit` subscribes via `Object.values(EventTopics)`. Confirm the new `milestoneUpdated` topic will be included automatically.

Expected: `onModuleInit` iterates all EventTopics values with no per-topic whitelisting.

- [ ] **Step 2: Gateway TypeScript check**

```bash
cd apps/gateway && pnpm exec tsc --noEmit
```

Expected: No errors (the new `milestoneUpdated` key is a valid `EventTopic`).

- [ ] **Step 3: Commit**

```bash
git add apps/gateway/src/routes/realtime-events.service.ts
# Nothing to stage if no changes were needed — use empty commit only if Step 1 required a fix.
# If no gateway changes: skip this commit and proceed to Task 10.
git commit -m "chore(gateway): confirm auto-subscription covers milestoneUpdated topic" --allow-empty
```

---

### Task 10: Admin Portal — Live Indicator & Auto-Refresh

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/chrome.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx`

> **Architecture:** The web app uses `useRealtimeRefresh(session, onRefresh)` from `@/lib/auth/use-realtime-refresh`. This hook opens an SSE stream to `GET /events/stream` (token exchanged at `POST /events/stream-token`) and calls `onRefresh()` on any `refresh` event. It returns `{ isConnected: boolean }`. No Ably, no custom token API needed. The admin topbar already has an `isLive` prop and renders a `topbarLiveBadge` + `topbarLiveDot` when `isLive` is `true` — do NOT add new CSS classes.

- [ ] **Step 1: Read chrome.tsx**

Read `apps/web/src/components/admin/dashboard/chrome.tsx` in full to understand:
- Whether `useRealtimeRefresh` is already imported and called
- How the topbar is rendered and which props it receives
- Where `session` is available

- [ ] **Step 2: Wire useRealtimeRefresh in chrome.tsx**

If `useRealtimeRefresh` is not yet called in `chrome.tsx`:

Add the import:
```typescript
import { useRealtimeRefresh } from "@/lib/auth/use-realtime-refresh";
```

Add the hook call inside the component (pass a no-op or an existing data-refresh callback):
```typescript
const { isConnected } = useRealtimeRefresh(session ?? null, () => {
  // Trigger a soft refresh of the page data when any realtime event arrives.
  // If chrome.tsx already has a refetch/reload callback, call it here.
});
```

Pass `isLive={isConnected}` to the topbar component.

> If `useRealtimeRefresh` is already wired and `isConnected` is already passed to the topbar, skip this step and note it in the commit message.

- [ ] **Step 3: Auto-refresh owners workspace on realtime event**

Read `apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx` to find the existing data-loading function (look for a `useEffect` that fetches project/revenue data, or a `load`/`refresh` function).

In that page, add:
```typescript
import { useRealtimeRefresh } from "@/lib/auth/use-realtime-refresh";
// ...
useRealtimeRefresh(session, () => {
  // Call the existing data-refresh function discovered above, e.g.:
  // void loadDashboardData();
});
```

> `useRealtimeRefresh` fires `onRefresh` on any SSE event (any domain event type). It is topic-blind by design — the page does a full data reload on any event. This is correct for Wave 1.

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/dashboard/chrome.tsx apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx
git commit -m "feat(admin): wire useRealtimeRefresh for Live indicator and owners workspace auto-refresh"
```

---

### Task 11: Realtime Subscriptions — Client Portal, Admin Leads, Admin Revenue

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/` (revenue page — see Step 1)

> **Architecture:** All three portals use `useRealtimeRefresh(session, onRefresh)` from `@/lib/auth/use-realtime-refresh`. This hook calls `onRefresh()` on any SSE `refresh` event. SSE events are topic-blind at the hook level — on any domain event, `onRefresh` is called and the component does a full data reload. This is the correct Wave 1 pattern. Staff presence dots (Ably-specific feature) are deferred to a later wave when a WebSocket or presence layer is introduced.

- [ ] **Step 1: Identify admin revenue page**

Run:
```bash
grep -r "revenue\|MRR\|finance\|billing" apps/web/src/components/admin/dashboard/pages --include="*.tsx" -l
```

Read the top result to confirm it renders a revenue chart or billing summary. Note the file path.

- [ ] **Step 2: Add useRealtimeRefresh to client dashboard**

Read `apps/web/src/components/client/maphari-client-dashboard.tsx` to find the existing notification/data refresh function.

Add the hook:
```typescript
import { useRealtimeRefresh } from "@/lib/auth/use-realtime-refresh";
// ...
useRealtimeRefresh(session, () => {
  // Call the existing notification/project refresh function — look for loadNotifications(), refreshData(), etc.
  // e.g.: void loadNotifications();
});
```

> If `useRealtimeRefresh` is already present in this file, skip this step.

- [ ] **Step 3: Add useRealtimeRefresh to admin leads page**

Read `apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx` to find the existing data-loading function.

Add the hook:
```typescript
import { useRealtimeRefresh } from "@/lib/auth/use-realtime-refresh";
// ...
useRealtimeRefresh(session, () => {
  // Call the existing leads refresh function — e.g.: void loadLeads();
});
```

- [ ] **Step 4: Add useRealtimeRefresh to revenue page**

Read the revenue page identified in Step 1 to find the existing data-loading function.

Add the hook using the same pattern as Steps 2 and 3:
```typescript
useRealtimeRefresh(session, () => {
  // Call the existing revenue data refresh function.
});
```

- [ ] **Step 5: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/client/maphari-client-dashboard.tsx apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx
# Also stage the revenue page identified in Step 1:
# git add apps/web/src/components/admin/dashboard/pages/<revenue-page>.tsx
git commit -m "feat(v1.2): wire useRealtimeRefresh in client portal, admin leads, admin revenue"
```

---

## VERSION 1.3 — Communication Foundations

---

### Task 12: Prisma Model — CalendarEvent

**Files:**
- Modify: `services/core/prisma/schema.prisma`

- [ ] **Step 1: Add model**

Append to `schema.prisma`:

```prisma
model CalendarEvent {
  id         String   @id @default(cuid())
  title      String
  startAt    DateTime
  endAt      DateTime
  type       String   // APPOINTMENT | MILESTONE | INVOICE_DUE | LEAVE | SPRINT
  sourceId   String
  sourceType String
  roles      String[]
  clientId   String?
  staffId    String?
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
cd services/core && pnpm prisma migrate dev --name add-calendar-event
```

- [ ] **Step 3: Commit**

```bash
git add services/core/prisma/schema.prisma services/core/src/generated/
git commit -m "feat(db): add CalendarEvent model"
```

---

### Task 13: Core Route — Calendar

**Files:**
- Create: `services/core/src/routes/calendar.ts`
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Create calendar route**

Create `services/core/src/routes/calendar.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export async function calendarRoutes(fastify: FastifyInstance) {
  // GET /calendar/events?from=&to=&role=
  fastify.get<{ Querystring: { from: string; to: string; role?: string } }>(
    '/events',
    async (request, reply) => {
      const { from, to, role } = request.query;
      const userRole = request.headers['x-user-role'] as string;
      const clientId = request.headers['x-client-id'] as string | undefined;
      const staffId = request.headers['x-user-id'] as string | undefined;

      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Aggregate from multiple sources based on role
      const events: any[] = [];

      // Appointments — uses `scheduledAt` (not `startAt`); duration stored as `durationMins`
      // `Appointment` has no `staffId` field; scoped to `clientId` only for CLIENT role
      const appointments = await fastify.prisma.appointment.findMany({
        where: {
          scheduledAt: { gte: fromDate, lte: toDate },
          ...(userRole === 'CLIENT' && clientId ? { clientId } : {}),
        },
      });
      events.push(...appointments.map(a => {
        const endAt = new Date(a.scheduledAt.getTime() + (a.durationMins ?? 60) * 60_000);
        return {
          id: a.id, title: a.type ?? 'Appointment', startAt: a.scheduledAt, endAt,
          type: 'APPOINTMENT', sourceId: a.id, sourceType: 'Appointment', roles: ['ADMIN', 'STAFF', 'CLIENT'],
        };
      }));

      // Project milestones — uses `dueAt` (not `dueDate`)
      const milestones = await fastify.prisma.projectMilestone.findMany({
        where: {
          dueAt: { gte: fromDate, lte: toDate },
          ...(userRole === 'CLIENT' && clientId ? { project: { clientId } } : {}),
        },
        include: { project: true },
      });
      events.push(...milestones.map(m => ({
        id: m.id, title: m.title, startAt: m.dueAt, endAt: m.dueAt,
        type: 'MILESTONE', sourceId: m.id, sourceType: 'ProjectMilestone', roles: ['ADMIN', 'STAFF', 'CLIENT'],
        clientId: m.project.clientId,
      })));

      return events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
  );

  // GET /calendar/export.ics
  fastify.get('/export.ics', async (request, reply) => {
    // Return a basic iCal file with events for the next 90 days
    const now = new Date();
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const milestones = await fastify.prisma.projectMilestone.findMany({
      where: { dueAt: { gte: now, lte: future } },
    });

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Maphari Technologies//Calendar//EN',
      ...milestones.flatMap(m => m.dueAt ? [
        'BEGIN:VEVENT',
        `UID:milestone-${m.id}@maphari`,
        `SUMMARY:${m.title}`,
        `DTSTART:${formatIcalDate(m.dueAt)}`,
        `DTEND:${formatIcalDate(m.dueAt)}`,
        'END:VEVENT',
      ].join('\r\n') : []),
      'END:VCALENDAR',
    ].join('\r\n');

    reply.header('Content-Type', 'text/calendar');
    reply.header('Content-Disposition', 'attachment; filename="maphari-calendar.ics"');
    return ical;
  });
}

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
```

- [ ] **Step 2: Register in app.ts**

```typescript
import { calendarRoutes } from './routes/calendar';
app.register(calendarRoutes, { prefix: '/calendar' });
```

- [ ] **Step 3: TypeScript check + commit**

```bash
cd services/core && pnpm exec tsc --noEmit
git add services/core/src/routes/calendar.ts services/core/src/app.ts
git commit -m "feat(core): add calendar aggregation and iCal export routes"
```

---

### Task 14: Extend Conversations — Allow STAFF Origin

**Files:**
- Modify: `services/core/src/routes/conversations.ts`

- [ ] **Step 1: Read existing conversations route**

Read `services/core/src/routes/conversations.ts` to understand how `POST /conversations` is guarded and what fields exist on the conversation model.

- [ ] **Step 2: Add createdByRole field to Prisma schema**

In `schema.prisma`, find the `Conversation` model and add (if missing):
```prisma
createdByRole String @default("ADMIN") // ADMIN | STAFF
```

Run migration:
```bash
cd services/core && pnpm prisma migrate dev --name add-conversation-created-by-role
```

- [ ] **Step 3: Allow STAFF to create conversations**

In `conversations.ts` POST handler, change the role guard from:
```typescript
if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
```
to:
```typescript
if (!['ADMIN', 'STAFF'].includes(role)) return reply.status(403).send({ error: 'Forbidden' });
```

And set `createdByRole` from the header:
```typescript
data: { ...body, createdByRole: role }
```

- [ ] **Step 4: TypeScript check + commit**

```bash
cd services/core && pnpm exec tsc --noEmit
git add services/core/src/routes/conversations.ts services/core/prisma/schema.prisma services/core/src/generated/
git commit -m "feat(core): allow STAFF to create conversations; add createdByRole field"
```

---

### Task 15: Gateway Controller — Calendar

**Files:**
- Create/Verify: `apps/gateway/src/routes/calendar.controller.ts`
- Modify: `apps/gateway/src/modules/app.module.ts`

> **Discovery note:** `calendar.controller.ts` may already exist in the gateway. Check:
> ```bash
> ls apps/gateway/src/routes/calendar.controller.ts 2>&1
> ```
> If it exists, read it to understand the pattern it uses (`proxyRequest`/`@Roles` or `HttpService`/`firstValueFrom`). If both GET `/events` and GET `/export.ics` endpoints already exist, skip Step 1 entirely.

- [ ] **Step 1: Read existing calendar controller (or create if absent)**

If the file exists:
- Read it in full
- Confirm `GET /calendar/events` and `GET /calendar/export.ics` both proxy to the core service
- If any endpoint is missing, add it using the **same pattern as the rest of the file** (do NOT mix patterns)
- If the file uses `proxyRequest` + `@Roles`, follow that. If it uses `HttpService`/`firstValueFrom`, follow that

If the file does NOT exist, create it using the `proxyRequest` + `@Roles` pattern (same as `clients.controller.ts`):

```typescript
import { Controller, Get, Headers, Query, Res } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class CalendarController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("calendar/events")
  async listCalendarEvents(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return proxyRequest(`${baseUrl}/calendar/events?${qs.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
```

> Note: iCal export (`GET /calendar/export.ics`) returns `text/calendar` — if the existing controller has this route, keep it as-is. Adding it with `proxyRequest` is not straightforward as it requires passthrough of binary/text response headers. Defer iCal export to a future task if it doesn't already exist.

- [ ] **Step 2: Register in app.module.ts (if not already registered)**

```typescript
// Note: app.module.ts lives in modules/ — use ../routes/ prefix + .js extension (NodeNext moduleResolution)
import { CalendarController } from '../routes/calendar.controller.js';
// Add CalendarController to controllers array (if not already present)
```

- [ ] **Step 3: TypeScript check + commit**

```bash
cd apps/gateway && pnpm exec tsc --noEmit
git add apps/gateway/src/routes/calendar.controller.ts apps/gateway/src/modules/app.module.ts
git commit -m "feat(gateway): verify/extend calendar controller with events + iCal export"
```

---

### Task 16: Web API — Calendar + Staff Messaging

**Files:**
- Create: `apps/web/src/lib/api/admin/calendar.ts`
- Create: `apps/web/src/lib/api/staff/calendar.ts`
- Modify: `apps/web/src/lib/api/portal/meetings.ts`
- Create/Modify: `apps/web/src/lib/api/staff/messages.ts`

> **Pattern:** Admin files use `withAuthorizedSession`/`callGateway` from `./_shared` and `import type { AuthSession } from "../../auth/session"`. Staff files use the same utilities from `./internal`. Do NOT use `withRefresh`, `fetch`, or `GATEWAY_URL`.

- [ ] **Step 1: Check if admin/calendar.ts and staff/calendar.ts already exist**

```bash
ls apps/web/src/lib/api/admin/calendar.ts apps/web/src/lib/api/staff/calendar.ts 2>&1
```

If either file already exists, read it before modifying to avoid overwriting existing exports.

- [ ] **Step 2: Create admin calendar API**

Create `apps/web/src/lib/api/admin/calendar.ts`:

```typescript
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

// CalendarEvent interface matches the existing staff/calendar.ts and admin/calendar.ts files:
// `date: string` (NOT startAt/endAt) — confirmed from existing codebase
export interface CalendarEvent {
  id: string;
  type: "appointment" | "milestone" | "sprint_deadline";
  title: string;
  date: string;
  clientName?: string;
  projectName?: string;
  status?: string;
  sourceId: string;
}

export async function loadAdminCalendarEventsWithRefresh(
  session: AuthSession,
  from: string,
  to: string
): Promise<AuthorizedResult<CalendarEvent[]>> {
  return withAuthorizedSession(session, async (token) => {
    // Gateway CalendarController uses @Get("calendar/events") — no /admin/ prefix
    const res = await callGateway<CalendarEvent[]>(`/calendar/events?from=${from}&to=${to}`, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
```

- [ ] **Step 3: Create staff calendar API**

Create `apps/web/src/lib/api/staff/calendar.ts`:

```typescript
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./internal";
import type { CalendarEvent } from "../admin/calendar";

export async function loadStaffCalendarEventsWithRefresh(
  session: AuthSession,
  from: string,
  to: string
): Promise<AuthorizedResult<CalendarEvent[]>> {
  return withAuthorizedSession(session, async (token) => {
    // Gateway CalendarController uses @Get("calendar/events") — no /staff/ prefix
    const res = await callGateway<CalendarEvent[]>(`/calendar/events?from=${from}&to=${to}`, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
```

- [ ] **Step 4: Add staff message creation function**

Read `apps/web/src/lib/api/staff/messages.ts` if it exists; otherwise create it. Add (or append) this function:

```typescript
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./internal";

export interface StaffConversation {
  id: string;
  clientId: string;
  subject: string;
  status: string;
  createdByRole: string;
  createdAt: string;
}

export async function createStaffClientMessageWithRefresh(
  session: AuthSession,
  data: { clientId: string; subject: string; body: string }
): Promise<AuthorizedResult<StaffConversation>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<StaffConversation>("/staff/conversations", token, {
      method: "POST",
      body: { ...data, createdByRole: "STAFF" },
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
```

- [ ] **Step 5: Verify portal/meetings.ts already has loadPortalCalendarEventsWithRefresh**

Read `apps/web/src/lib/api/portal/meetings.ts` and grep for `loadPortalCalendarEventsWithRefresh`. This function already exists and calls `GET /calendar/events?from=...&to=...` (confirmed). It returns `PortalCalendarEvent[]` with a `date: string` field.

If it exists → do nothing. If somehow missing → add it following the existing pattern, calling `/calendar/events` (NOT `/portal/calendar/events`).

- [ ] **Step 6: TypeScript check + commit**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
git add apps/web/src/lib/api/admin/calendar.ts apps/web/src/lib/api/staff/calendar.ts apps/web/src/lib/api/staff/messages.ts apps/web/src/lib/api/portal/meetings.ts
git commit -m "feat(web): add calendar and staff messaging API functions"
```

---

### Task 17: Calendar Pages — Admin, Staff, Client

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx` (or booking-appointments page — check which has the calendar)
- Create: `apps/web/src/components/staff/staff-dashboard/pages/calendar-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`

- [ ] **Step 1: Identify admin booking/appointments page**

Run:
```bash
grep -r "appointment\|booking\|Appointment" apps/web/src/components/admin/dashboard/pages --include="*.tsx" -l
```

The spec names `booking-appointments-page.tsx` — confirm it exists at that path. Read it to understand: what data it shows, whether it's wired to an API, and what components it uses. Extend this file with a month/week view toggle using the new `loadAdminCalendarEventsWithRefresh` function.

- [ ] **Step 2: Create staff calendar-page.tsx**

Create `apps/web/src/components/staff/staff-dashboard/pages/calendar-page.tsx`:

```typescript
'use client';
import { useState, useEffect } from 'react';
import type { AuthSession } from '@/lib/auth/session';
import { loadStaffCalendarEventsWithRefresh, type CalendarEvent } from '@/lib/api/staff/calendar';

function addDays(date: Date, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date: Date) { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }

export default function CalendarPage({ session }: { session: AuthSession }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewStart, setViewStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    const from = viewStart.toISOString();
    const to = addDays(viewStart, 7).toISOString();
    loadStaffCalendarEventsWithRefresh(session, from, to).then(r => {
      if (r.data) setEvents(r.data);
    });
  }, [session, viewStart]);

  const weekLabel = `${viewStart.toLocaleDateString()} – ${addDays(viewStart, 6).toLocaleDateString()}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setViewStart(d => addDays(d, -7))}>← Prev</button>
        <span style={{ fontWeight: 600 }}>{weekLabel}</span>
        <button onClick={() => setViewStart(d => addDays(d, 7))}>Next →</button>
        <a href="/api/v1/calendar/export.ics" download style={{ marginLeft: 'auto' }}>Download iCal</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.length === 0 && <p style={{ color: 'var(--muted)' }}>No events this week.</p>}
        {events.map(event => (
          <div key={event.id} style={{ padding: '10px 14px', border: '1px solid var(--b2)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
            {/* CalendarEvent interface uses `date: string`, NOT `startAt` */}
            <span>{new Date(event.date).toLocaleDateString()}</span>
            <span style={{ fontWeight: 500 }}>{event.title}</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{event.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Add this page to the staff nav config in `ui.tsx`.

- [ ] **Step 3: Extend client book-call page with upcoming schedule**

Read `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx` in full to understand its current structure.

After the existing booking UI, add a "My Schedule" section:

```typescript
// portal/meetings.ts already exports loadPortalCalendarEventsWithRefresh (NOT loadClientCalendar...)
// PortalCalendarEvent interface in meetings.ts uses `date: string`, NOT `startAt`
import { loadPortalCalendarEventsWithRefresh, type PortalCalendarEvent } from '@/lib/api/portal/meetings';

// In the component body:
const [upcomingEvents, setUpcomingEvents] = useState<PortalCalendarEvent[]>([]);

useEffect(() => {
  if (!session) return;
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // next 30 days
  loadPortalCalendarEventsWithRefresh(session, from, to).then(r => {
    if (r.data) setUpcomingEvents(r.data);
  });
}, [session]);

// In JSX, below the booking form:
// <section>
//   <h3>My Schedule (Next 30 Days)</h3>
//   {upcomingEvents.length === 0 ? (
//     <p>No upcoming events.</p>
//   ) : (
//     upcomingEvents.map(ev => (
//       <div key={ev.id}>
//         <span>{new Date(ev.date).toLocaleDateString()}</span>   {/* date, not startAt */}
//         <span>{ev.title}</span>
//         <span>{ev.type}</span>
//       </div>
//     ))
//   )}
// </section>
```

- [ ] **Step 4: Add "New Message" button to staff communication page**

Find the staff communication/messaging page:
```bash
find apps/web/src/components/staff/staff-dashboard/pages -name "*communication*" -o -name "*message*"
```

Read the found file (`communication-history-page.tsx`). Add a "New Message" button that opens a modal:

```typescript
import { createStaffClientMessageWithRefresh } from '@/lib/api/staff/messages';

// State:
const [showMsgModal, setShowMsgModal] = useState(false);
const [msgForm, setMsgForm] = useState({ clientId: '', subject: '', body: '' });

async function handleSendMessage(e: React.FormEvent) {
  e.preventDefault();
  await createStaffClientMessageWithRefresh(session, msgForm);
  setShowMsgModal(false);
  setMsgForm({ clientId: '', subject: '', body: '' });
  // Optionally re-fetch conversation list
}

// In JSX, near the page header:
// <button onClick={() => setShowMsgModal(true)}>+ New Message</button>
// {showMsgModal && (
//   <dialog open>
//     <form onSubmit={handleSendMessage}>
//       <input placeholder="Client ID" value={msgForm.clientId} onChange={e => setMsgForm(f => ({ ...f, clientId: e.target.value }))} required />
//       <input placeholder="Subject" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))} required />
//       <textarea placeholder="Message" value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))} required />
//       <button type="submit">Send</button>
//       <button type="button" onClick={() => setShowMsgModal(false)}>Cancel</button>
//     </form>
//   </dialog>
// )}
```

- [ ] **Step 5: TypeScript check + commit**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
git add apps/web/src/components/staff/staff-dashboard/pages/calendar-page.tsx apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx
git commit -m "feat(v1.3): add calendar pages across all portals and staff→client messaging"
```

---

### Task 17b: Client Messages Page + Command Palette Wiring

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx`
- Modify: `services/core/src/routes/search.ts`
- Modify: `apps/gateway/src/routes/search.controller.ts`

> **Spec requirements:**
> - Client `messages-page.tsx`: surface staff-initiated threads (conversations with `createdByRole=STAFF`)
> - Search: add role-based scope so admin gets `?role=ADMIN`, staff gets `?role=STAFF`

- [ ] **Step 1: Read client messages-page.tsx**

Read `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx` to understand its current structure and what conversations it already loads.

- [ ] **Step 2: Show staff-initiated threads**

Find where conversations are fetched. Ensure the query includes conversations where `createdByRole=STAFF` in addition to any existing filter. If the existing fetch already loads all conversations for the client, no change is needed — confirm by checking the API response includes `createdByRole`. If filtered, add a note/section to display staff-initiated threads distinctly:

```typescript
const staffThreads = conversations.filter(c => c.createdByRole === 'STAFF');
// Render these in a "Messages from Maphari" section
```

- [ ] **Step 3: Read and extend search route**

Read `services/core/src/routes/search.ts` to understand how results are scoped. Add `role` query param handling:

```typescript
// In the GET /search handler, read `role` from headers or query:
const userRole = request.headers['x-user-role'] as string;
// Use userRole to filter which models are searched:
// ADMIN: all results
// STAFF: projects, clients, conversations
// CLIENT: only own projects, milestones, invoices
```

- [ ] **Step 4: Update search controller to pass role header**

Read `apps/gateway/src/routes/search.controller.ts`. Ensure `x-user-role` is forwarded in the proxy request headers (it likely is via the existing `headers(req)` helper — confirm and leave a comment if already correct).

- [ ] **Step 5: TypeScript check + commit**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
cd services/core && pnpm exec tsc --noEmit
git add apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx services/core/src/routes/search.ts apps/gateway/src/routes/search.controller.ts
git commit -m "feat(v1.3): client messages show staff threads; search adds role-based scope"
```

---

## VERSION 1.4 — Staff Empowerment Suite

---

### Task 18: Prisma Schema — Extend PeerReview + ProjectTimeEntry for v1.4

**Files:**
- Modify: `services/core/prisma/schema.prisma`

> **Note:** `StaffGoal` already exists in the schema (with `id`, `staffUserId`, `title`, `description`, `targetDate`, `progress`, `status`, `quarter`). Do NOT add it again. `PeerReview` also already exists but needs a `quarter` field. `ProjectTimeEntry` needs approval/rejection tracking fields.

- [ ] **Step 1: Read the existing models**

Run to confirm what fields already exist:
```bash
grep -A 25 "^model PeerReview " services/core/prisma/schema.prisma
grep -A 25 "^model ProjectTimeEntry " services/core/prisma/schema.prisma
grep -A 20 "^model StaffGoal " services/core/prisma/schema.prisma
```

- [ ] **Step 2: Add `quarter` field to existing PeerReview model**

Find the `model PeerReview` block in `schema.prisma`. Add after the last existing field (before the closing `}`):
```prisma
  quarter     String?   // "Q1-2026" — null for reviews not tied to a cycle
```

- [ ] **Step 3: Add approval fields to existing ProjectTimeEntry model**

Find `model ProjectTimeEntry` in `schema.prisma`. The model already has `status` and `submittedAt`. Add the missing fields after `submittedAt`:
```prisma
  approvedAt      DateTime?
  approvedBy      String?
  rejectedAt      DateTime?
  rejectionReason String?
```

- [ ] **Step 4: Run migration**

```bash
cd services/core && pnpm prisma migrate dev --name add-v1-4-peer-review-quarter-timeentry-approval
```

Expected: Two new columns added — `PeerReview.quarter`, `ProjectTimeEntry.approvedAt/approvedBy/rejectedAt/rejectionReason`.

- [ ] **Step 5: Commit**

```bash
git add services/core/prisma/schema.prisma services/core/src/generated/
git commit -m "feat(db): add quarter to PeerReview; add approval fields to ProjectTimeEntry (v1.4)"
```

---

### Task 19: Core Routes — Staff Goals & Peer Reviews

**Files:**
- Create/Verify: `services/core/src/routes/staff-goals.ts`
- Create/Verify: `services/core/src/routes/peer-reviews.ts`
- Modify: `services/core/src/app.ts`

> **Discovery note:** These route files may already exist. Check before creating:
> ```bash
> ls services/core/src/routes/staff-goals.ts services/core/src/routes/peer-reviews.ts 2>&1
> ```
> If they exist, read them and verify the endpoint shapes match what the plan expects. Only create from the snippets below if the files are absent.

- [ ] **Step 1: Create staff-goals route (if not already present)**

If `services/core/src/routes/staff-goals.ts` does not exist, create it:

```typescript
import { FastifyInstance } from 'fastify';

export async function staffGoalsRoutes(fastify: FastifyInstance) {
  const getStaffId = (req: any) => req.headers['x-user-id'] as string;

  fastify.get('/', async (request) => {
    const staffUserId = getStaffId(request);
    const quarter = (request.query as any).quarter;
    return fastify.prisma.staffGoal.findMany({
      where: { staffUserId, ...(quarter ? { quarter } : {}) },
      orderBy: { targetDate: 'asc' },
    });
  });

  fastify.post<{ Body: { title: string; description?: string; targetDate: string; quarter: string } }>(
    '/',
    async (request, reply) => {
      const staffUserId = getStaffId(request);
      const { title, description, targetDate, quarter } = request.body;
      const goal = await fastify.prisma.staffGoal.create({
        data: { staffUserId, title, description, targetDate: new Date(targetDate), quarter },
      });
      return reply.status(201).send(goal);
    }
  );

  fastify.patch<{ Params: { id: string }; Body: { progress?: number; status?: string; title?: string } }>(
    '/:id',
    async (request) => {
      const { id } = request.params;
      const { progress, status, title } = request.body;
      return fastify.prisma.staffGoal.update({
        where: { id },
        data: {
          ...(progress !== undefined && { progress }),
          ...(status && { status }),
          ...(title && { title }),
        },
      });
    }
  );
}
```

- [ ] **Step 2: Create peer-reviews route (if not already present)**

> **Data model note:** The existing `PeerReview` model is flat — it uses `score: Int?` and `feedback: String?` directly on the review, not a separate answers table. There is no `PeerReviewAnswer` model. The route reflects this flat structure.

Create `services/core/src/routes/peer-reviews.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export async function peerReviewsRoutes(fastify: FastifyInstance) {
  const getReviewerId = (req: any) => req.headers['x-user-id'] as string;

  // GET /peer-reviews — reviews submitted by this staff member
  fastify.get('/', async (request) => {
    const reviewerId = getReviewerId(request);
    return fastify.prisma.peerReview.findMany({
      where: { reviewerId },
      orderBy: { createdAt: 'desc' },
    });
  });

  // POST /peer-reviews — submit a new review
  fastify.post<{ Body: { revieweeId: string; quarter?: string; score: number; feedback?: string } }>(
    '/',
    async (request, reply) => {
      const reviewerId = getReviewerId(request);
      const { revieweeId, quarter, score, feedback } = request.body;
      const review = await fastify.prisma.peerReview.create({
        data: {
          reviewerId,
          revieweeId,
          quarter: quarter ?? null,
          score,
          feedback: feedback ?? null,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
      return reply.status(201).send(review);
    }
  );
}
```

- [ ] **Step 3: Register routes**

```typescript
import { staffGoalsRoutes } from './routes/staff-goals';
import { peerReviewsRoutes } from './routes/peer-reviews';
app.register(staffGoalsRoutes, { prefix: '/staff-goals' });
app.register(peerReviewsRoutes, { prefix: '/peer-reviews' });
```

- [ ] **Step 4: TypeScript check + commit**

```bash
cd services/core && pnpm exec tsc --noEmit
git add services/core/src/routes/staff-goals.ts services/core/src/routes/peer-reviews.ts services/core/src/app.ts
git commit -m "feat(core): add staff goals and peer reviews routes"
```

---

### Task 20: Core Route — Timesheet Submit/Approve/Reject

**Files:**
- Modify: `services/core/src/routes/time-entries.ts`

- [ ] **Step 1: Read existing time-entries route**

Read `services/core/src/routes/time-entries.ts` in full. Check if `/:id/submit`, `/:id/approve`, and `/:id/reject` endpoints already exist. If they do, confirm they use `projectTimeEntry` (not `timeEntry`) and that the approve endpoint sets `approvedBy`. If all three exist and are correct, skip Step 2 entirely and go straight to the TypeScript check.

- [ ] **Step 2: Add submit, approve, reject endpoints (only if missing)**

```typescript
// PATCH /time-entries/:id/submit — staff submits
fastify.patch<{ Params: { id: string } }>('/:id/submit', async (request, reply) => {
  const role = request.headers['x-user-role'];
  if (!['STAFF'].includes(role as string)) return reply.status(403).send({ error: 'Forbidden' });

  const { id } = request.params;
  return fastify.prisma.projectTimeEntry.update({
    where: { id },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
});

// PATCH /time-entries/:id/approve — admin approves
fastify.patch<{ Params: { id: string }; Body: { approvedBy: string } }>('/:id/approve', async (request, reply) => {
  const role = request.headers['x-user-role'];
  if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

  const { id } = request.params;
  return fastify.prisma.projectTimeEntry.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: request.body.approvedBy },
  });
});

// PATCH /time-entries/:id/reject — admin rejects
fastify.patch<{ Params: { id: string }; Body: { reason: string } }>('/:id/reject', async (request, reply) => {
  const role = request.headers['x-user-role'];
  if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

  const { id } = request.params;
  return fastify.prisma.projectTimeEntry.update({
    where: { id },
    data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: request.body.reason },
  });
});
```

- [ ] **Step 3: TypeScript check + commit**

```bash
cd services/core && pnpm exec tsc --noEmit
git add services/core/src/routes/time-entries.ts
git commit -m "feat(core): add timesheet submit/approve/reject endpoints"
```

---

### Task 21: Gateway Controllers — Staff Goals, Peer Reviews, Timesheet Actions

**Files:**
- Create/Verify: `apps/gateway/src/routes/staff-goals.controller.ts`
- Create/Verify: `apps/gateway/src/routes/peer-reviews.controller.ts`
- Modify: `apps/gateway/src/routes/time-entries.controller.ts`
- Modify: `apps/gateway/src/modules/app.module.ts`

> **Discovery note:** These controllers may already exist (the existing `staff.controller.ts` handles staff/goals routes). Check before creating:
> ```bash
> ls apps/gateway/src/routes/staff-goals.controller.ts apps/gateway/src/routes/peer-reviews.controller.ts 2>&1
> grep -r "staff/goals\|peer-reviews" apps/gateway/src/routes --include="*.ts" -l
> ```
> If routes for staff goals and peer reviews already exist in any controller, do NOT add duplicate controllers — instead verify the routes are complete and move to timesheet actions (Step 3).

- [ ] **Step 1: Create staff-goals controller (only if no existing route handles /staff/goals)**

> **Pattern:** Use the same `proxyRequest` + `@Roles` + `@Headers` pattern as `clients.controller.ts`. No `HttpService`, no `@nestjs/axios`, no `JwtAuthGuard`.

If no controller handles `staff/goals`, create `apps/gateway/src/routes/staff-goals.controller.ts`:

```typescript
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class StaffGoalsController {
  @Roles("ADMIN", "STAFF")
  @Get("staff/goals")
  async listGoals(
    @Query("quarter") quarter?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const qs = quarter ? `?quarter=${encodeURIComponent(quarter)}` : "";
    return proxyRequest(`${baseUrl}/staff/goals${qs}`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("staff/goals")
  async createGoal(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/staff/goals`, "POST", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("staff/goals/:id")
  async updateGoal(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/staff/goals/${id}`, "PATCH", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Delete("staff/goals/:id")
  async deleteGoal(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/staff/goals/${id}`, "DELETE", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
```

- [ ] **Step 2: Create peer-reviews controller (only if no existing route handles /peer-reviews)**

> **Gateway staff routes:** `staff.controller.ts` already has `@Get("peer-reviews")`, `@Post("peer-reviews")`, `@Patch("peer-reviews/:id/submit")`. If these exist, skip this step entirely — do NOT create a duplicate controller.

If the routes do NOT exist, create `apps/gateway/src/routes/peer-reviews.controller.ts`:

```typescript
import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class PeerReviewsController {
  @Roles("ADMIN", "STAFF")
  @Get("peer-reviews")
  async listPeerReviews(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/peer-reviews`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("peer-reviews")
  async createPeerReview(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/peer-reviews`, "POST", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("peer-reviews/:id/submit")
  async submitPeerReview(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/peer-reviews/${id}/submit`, "PATCH", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
```

- [ ] **Step 3: Extend time-entries controller with submit/approve/reject**

Read `apps/gateway/src/routes/time-entries.controller.ts` in full. Note the existing pattern — the controller uses `@Controller()` with no prefix and the same `proxyRequest` + `@Roles` + `@Headers` pattern.

Add these methods if not already present (check before adding):

```typescript
@Roles("STAFF")
@Patch("time-entries/:id/submit")
async submitTimesheet(
  @Param("id") id: string,
  @Body() body: unknown,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string
): Promise<ApiResponse> {
  const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  return proxyRequest(`${baseUrl}/time-entries/${id}/submit`, "PATCH", body, {
    "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
    "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
  });
}

@Roles("ADMIN")
@Patch("time-entries/:id/approve")
async approveTimesheet(
  @Param("id") id: string,
  @Body() body: unknown,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string
): Promise<ApiResponse> {
  const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  return proxyRequest(`${baseUrl}/time-entries/${id}/approve`, "PATCH", body, {
    "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
    "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
  });
}

@Roles("ADMIN")
@Patch("time-entries/:id/reject")
async rejectTimesheet(
  @Param("id") id: string,
  @Body() body: unknown,
  @Headers("x-user-id") userId?: string,
  @Headers("x-user-role") role?: Role,
  @Headers("x-request-id") requestId?: string,
  @Headers("x-trace-id") traceId?: string
): Promise<ApiResponse> {
  const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  return proxyRequest(`${baseUrl}/time-entries/${id}/reject`, "PATCH", body, {
    "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
    "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
  });
}
```

- [ ] **Step 4: Register in app.module.ts**

```typescript
// Note: app.module.ts lives in modules/ — use ../routes/ prefix + .js extension (NodeNext moduleResolution)
import { StaffGoalsController } from '../routes/staff-goals.controller.js';
import { PeerReviewsController } from '../routes/peer-reviews.controller.js';
// Add to controllers array: StaffGoalsController, PeerReviewsController
// time-entries controller already registered — no change needed to module for it
```

- [ ] **Step 5: TypeScript check + commit**

```bash
cd apps/gateway && pnpm exec tsc --noEmit
git add apps/gateway/src/routes/staff-goals.controller.ts apps/gateway/src/routes/peer-reviews.controller.ts apps/gateway/src/routes/time-entries.controller.ts apps/gateway/src/modules/app.module.ts
git commit -m "feat(gateway): add staff goals, peer reviews, timesheet action controllers"
```

---

### Task 22: Web API — Staff Peer Reviews, Timesheet

**Files:**
- Confirm: `apps/web/src/lib/api/staff/goals.ts` (already exists — verify exports only)
- Create: `apps/web/src/lib/api/staff/peer-reviews.ts`
- Modify: `apps/web/src/lib/api/staff/time.ts`
- Modify: `apps/web/src/lib/api/admin/hr.ts`

> **Pattern:** All files use `withAuthorizedSession`/`callGateway` from `./internal` (staff) or `./_shared` (admin) and `import type { AuthSession } from "../../auth/session"`.

- [ ] **Step 1: Confirm goals.ts already has the needed exports**

Read `apps/web/src/lib/api/staff/goals.ts`. Verify it exports: `loadStaffGoalsWithRefresh`, `createStaffGoalWithRefresh`, `updateStaffGoalWithRefresh`, and the `StaffGoal` interface. If any are missing, add them following the existing pattern in the file. Do NOT overwrite the file.

- [ ] **Step 2: Create peer-reviews API**

> **Data model:** The existing `PeerReview` model is flat — `score: Int?` and `feedback: String?` directly on the review. No nested answers table.

Create `apps/web/src/lib/api/staff/peer-reviews.ts`:

```typescript
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

export interface PeerReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  quarter: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  submittedAt: string | null;
  createdAt: string;
}

export async function loadMyPeerReviewsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PeerReview[]>> {
  return withAuthorizedSession(session, async (token) => {
    // Gateway staff.controller.ts routes peer-reviews at /peer-reviews (NO /staff/ prefix)
    const res = await callGateway<PeerReview[]>("/peer-reviews", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function submitPeerReviewWithRefresh(
  session: AuthSession,
  data: { revieweeId: string; quarter?: string; score: number; feedback?: string }
): Promise<AuthorizedResult<PeerReview>> {
  return withAuthorizedSession(session, async (token) => {
    // POST /peer-reviews — gateway staff.controller.ts, no /staff/ prefix
    const res = await callGateway<PeerReview>("/peer-reviews", token, { method: "POST", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
```

- [ ] **Step 3: Extend time.ts — add submit function**

Read `apps/web/src/lib/api/staff/time.ts` to confirm its import pattern. Append:

```typescript
export async function submitTimesheetWithRefresh(
  session: AuthSession,
  entryId: string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<{ id: string; status: string }>(
      // Gateway TimeEntriesController has @Controller() with no prefix → /time-entries/:id/submit
      `/time-entries/${entryId}/submit`,
      token,
      { method: "PATCH", body: {} }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
```

- [ ] **Step 4: Extend hr.ts — add approve/reject functions**

Read `apps/web/src/lib/api/admin/hr.ts` to confirm its import pattern (it uses `_shared`). Append:

```typescript
// NOTE: Before adding these functions, run:
//   grep -n "approve\|reject\|timesheet\|Timesheet" apps/web/src/lib/api/admin/hr.ts
// If approveTimesheetWithRefresh/rejectTimesheetWithRefresh already exist, do NOT add duplicates.
// The gateway time-entries controller is at @Controller() (no prefix), so routes are /time-entries/:id/approve
// NOT /admin/time-entries/:id/approve

export async function approveTimesheetWithRefresh(
  session: AuthSession,
  entryId: string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<{ id: string; status: string }>(
      `/time-entries/${entryId}/approve`,
      token,
      { method: "PATCH", body: { approvedBy: session.user.email } }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function rejectTimesheetWithRefresh(
  session: AuthSession,
  entryId: string,
  reason: string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<{ id: string; status: string }>(
      `/time-entries/${entryId}/reject`,
      token,
      { method: "PATCH", body: { reason } }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
```

- [ ] **Step 5: TypeScript check + commit**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
git add apps/web/src/lib/api/staff/peer-reviews.ts apps/web/src/lib/api/staff/time.ts apps/web/src/lib/api/admin/hr.ts
git commit -m "feat(web): add peer reviews API; extend time.ts and hr.ts with submit/approve/reject"
```

---

### Task 23: Staff Pages — My Goals, Peer Reviews, Capacity, Time Log

**Files:**
- Create: `apps/web/src/components/staff/staff-dashboard/pages/my-goals-page.tsx`
- Create: `apps/web/src/components/staff/staff-dashboard/pages/peer-review-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/mycapacity-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/ui.tsx`

- [ ] **Step 1: Read mycapacity-page.tsx**

Read the existing capacity page to understand what data it already has and whether it's wired to an API or stub.

- [ ] **Step 2: Create my-goals-page.tsx**

Create `apps/web/src/components/staff/staff-dashboard/pages/my-goals-page.tsx`:

```typescript
'use client';
import { useState, useEffect } from 'react';
import type { AuthSession } from '@/lib/auth/session';
import {
  loadStaffGoalsWithRefresh,
  createStaffGoalWithRefresh,
  updateStaffGoalWithRefresh,
  type StaffGoal,
} from '@/lib/api/staff/goals';

// StaffGoal is imported from goals.ts — field is `progress: number` (0-100), NOT `progressPct`

function getCurrentQuarter(): string {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  const q = m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
  return `Q${q}-${y}`;
}

const QUARTERS = ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026'];

export default function MyGoalsPage({ session }: { session: AuthSession }) {
  const [goals, setGoals] = useState<StaffGoal[]>([]);
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', quarter });

  useEffect(() => {
    loadStaffGoalsWithRefresh(session, quarter).then(r => { if (r.data) setGoals(r.data); });
  }, [session, quarter]);

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    await createStaffGoalWithRefresh(session, { ...form, quarter });
    const updated = await loadStaffGoalsWithRefresh(session, quarter);
    if (updated.data) setGoals(updated.data);
    setShowModal(false);
    setForm({ title: '', description: '', targetDate: '', quarter });
  }

  async function handleMarkAchieved(id: string) {
    await updateStaffGoalWithRefresh(session, id, { status: 'ACHIEVED' as const });
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, status: 'ACHIEVED' as const } : g)));
  }

  const circumference = 2 * Math.PI * 20; // radius=20

  return (
    <div>
      {/* Quarter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {QUARTERS.map(q => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            style={{ fontWeight: quarter === q ? 700 : 400 }}
          >
            {q}
          </button>
        ))}
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
          + Add Goal
        </button>
      </div>

      {/* Goal cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {goals.map(goal => (
          <div key={goal.id} style={{ padding: 16, border: '1px solid var(--b2)', borderRadius: 'var(--r-md)' }}>
            {/* Circular progress ring */}
            <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={24} cy={24} r={20} fill="none" stroke="var(--s2)" strokeWidth={4} />
              <circle
                cx={24} cy={24} r={20} fill="none"
                stroke="var(--lime)" strokeWidth={4}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - goal.progress / 100)}
                strokeLinecap="round"
              />
            </svg>

            <h3 style={{ margin: '8px 0 4px' }}>{goal.title}</h3>
            {goal.description && <p style={{ color: 'var(--muted)', fontSize: 13 }}>{goal.description}</p>}
            <span>{goal.status}</span>

            {goal.status === 'ACTIVE' && (
              <button onClick={() => handleMarkAchieved(goal.id)} style={{ marginTop: 12 }}>
                Mark Achieved
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Goal modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form onSubmit={handleAddGoal} style={{ background: 'var(--s1)', padding: 24, borderRadius: 'var(--r-md)', width: 400 }}>
            <h2>Add Goal</h2>
            <label>Title<input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></label>
            <label>Description<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
            <label>Target Date<input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} /></label>
            <label>Quarter
              <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create peer-review-page.tsx**

> **Data model:** `PeerReview` is flat — `score: number | null` (1–5 overall) and `feedback: string | null`. No nested answer dimensions. The form collects one overall score and one feedback text field.

Create `apps/web/src/components/staff/staff-dashboard/pages/peer-review-page.tsx`:

```typescript
'use client';
import { useState, useEffect } from 'react';
import type { AuthSession } from '@/lib/auth/session';
import {
  loadMyPeerReviewsWithRefresh,
  submitPeerReviewWithRefresh,
  type PeerReview,
} from '@/lib/api/staff/peer-reviews';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{ color: n <= value ? 'var(--lime)' : 'var(--muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PeerReviewPage({ session }: { session: AuthSession }) {
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [revieweeId, setRevieweeId] = useState('');
  const [score, setScore] = useState(3);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMyPeerReviewsWithRefresh(session).then(r => { if (r.data) setReviews(r.data); });
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await submitPeerReviewWithRefresh(session, { revieweeId, score, feedback: feedback || undefined });
    const updated = await loadMyPeerReviewsWithRefresh(session);
    if (updated.data) setReviews(updated.data);
    setShowForm(false);
    setRevieweeId('');
    setScore(3);
    setFeedback('');
    setSubmitting(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Peer Reviews</h2>
        <button onClick={() => setShowForm(true)}>+ New Review</button>
      </div>

      {reviews.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No reviews submitted yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ padding: '12px 16px', border: '1px solid var(--b2)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Reviewee: {r.revieweeId}</span>
              <span style={{ color: 'var(--muted)' }}>{r.quarter ?? '—'}</span>
              <span>Score: {r.score ?? '—'}</span>
              <span>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--s1)', padding: 24, borderRadius: 'var(--r-md)', width: 440 }}>
            <h2>New Peer Review</h2>

            <label style={{ display: 'block', marginBottom: 16 }}>
              Reviewee Staff Profile ID
              <input
                required
                value={revieweeId}
                onChange={e => setRevieweeId(e.target.value)}
                placeholder="Staff profile ID"
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              Overall Score
              <StarRating value={score} onChange={setScore} />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              Feedback (optional)
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Written feedback..."
                style={{ display: 'block', width: '100%', marginTop: 4, minHeight: 80 }}
              />
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Enhance mycapacity-page.tsx**

Add weekly bar chart: for each day of the current week, show:
- Hours allocated (from time entries with `status !== 'REJECTED'`)
- Hours available (standard working hours, e.g. 8h/day)

Use a simple CSS bar chart (no external charting library needed):
```typescript
// StaffTimeEntry uses `minutes: number` (NOT hours) and `loggedAt: string` (NOT date)
const allocatedMins = entries.filter(e => isSameDay(e.loggedAt, day)).reduce((sum, e) => sum + e.minutes, 0);
const allocated = allocatedMins / 60;
const available = 8;
const pct = Math.min((allocated / available) * 100, 100);
// <div style={{ width: `${pct}%` }} className={cx(s.barFill, allocated > available && s.barOverload)} />
```

Add "Flag Overload" button when any day exceeds 8h.

- [ ] **Step 5: Add "Submit Week" to time-log page**

Find the staff time-log page:
```bash
find apps/web/src/components/staff/staff-dashboard/pages -name "*time*" -o -name "*log*"
```

Read the found page. Locate where time entries are rendered. Add a "Submit Week" button:

```typescript
import { submitTimesheetWithRefresh } from '@/lib/api/staff/time';

async function handleSubmitWeek() {
  const draftEntries = entries.filter(e => e.status === 'DRAFT');
  for (const entry of draftEntries) {
    await submitTimesheetWithRefresh(session, entry.id);
  }
  // Re-fetch entries to reflect SUBMITTED status
  // Use whatever function loads time entries in this page — check the existing useEffect.
  // The staff/time.ts module exports getMyTimeEntries(session) with no date params.
  const updated = await getMyTimeEntries(session);
  if (updated.data) setEntries(updated.data);
}

// In JSX, near the week controls:
// <button onClick={handleSubmitWeek} disabled={entries.every(e => e.status !== 'DRAFT')}>
//   Submit Week
// </button>
```

- [ ] **Step 6: Admin HR — pending timesheets queue**

Find the admin HR/payroll page:
```bash
find apps/web/src/components/admin/dashboard/pages -name "*hr*" -o -name "*payroll*"
```

Read the found page. Add a "Pending Timesheets" section with approve/reject:

```typescript
import { approveTimesheetWithRefresh, rejectTimesheetWithRefresh } from '@/lib/api/admin/hr';

// State
const [pendingEntries, setPendingEntries] = useState<ProjectTimeEntry[]>([]);
const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
const [rejectReason, setRejectReason] = useState('');

useEffect(() => {
  if (!session) return;
  // Check actual function name: grep -n "pending\|Pending\|submit" apps/web/src/lib/api/admin/hr.ts
  // The function may be called loadPendingTimesheetsWithRefresh — use whatever you find
  loadPendingTimesheetsWithRefresh(session)
    .then(r => { if (r.data) setPendingEntries(r.data); });
}, [session]);

async function handleApprove(id: string) {
  await approveTimesheetWithRefresh(session, id);
  setPendingEntries(prev => prev.filter(e => e.id !== id));
}

async function handleReject() {
  if (!rejectModal) return;
  await rejectTimesheetWithRefresh(session, rejectModal.id, rejectReason);
  setPendingEntries(prev => prev.filter(e => e.id !== rejectModal.id));
  setRejectModal(null);
  setRejectReason('');
}

// In JSX:
// {pendingEntries.map(entry => (
//   <div key={entry.id}>
//     <span>{entry.staffName} — {entry.taskLabel} — {entry.minutes}min</span>
//     <button onClick={() => handleApprove(entry.id)}>Approve</button>
//     <button onClick={() => setRejectModal({ id: entry.id })}>Reject</button>
//   </div>
// ))}
// {rejectModal && (
//   <dialog open>
//     <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Rejection reason" />
//     <button onClick={handleReject}>Confirm</button>
//     <button onClick={() => setRejectModal(null)}>Cancel</button>
//   </dialog>
// )}
```

> **Note:** `loadPendingTimesheetsWithRefresh` needs to be added to `apps/web/src/lib/api/admin/hr.ts` if not present. The gateway `TimeEntriesController` is decorated `@Controller()` with no path prefix, so the route is `GET /time-entries?status=SUBMITTED` (NOT `/admin/time-entries`). Confirm by reading `apps/gateway/src/routes/time-entries.controller.ts` before writing any path.

- [ ] **Step 7: Add nav entries in staff ui.tsx**

Find the nav config in `apps/web/src/components/staff/staff-dashboard/ui.tsx` and add:
- "My Goals" → `my-goals-page.tsx`
- "Peer Reviews" → `peer-review-page.tsx`

- [ ] **Step 8: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9: Final v1.4 commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/my-goals-page.tsx apps/web/src/components/staff/staff-dashboard/pages/peer-review-page.tsx apps/web/src/components/staff/staff-dashboard/pages/mycapacity-page.tsx apps/web/src/components/staff/staff-dashboard/ui.tsx
git commit -m "feat(staff): add My Goals, Peer Reviews pages; enhance capacity chart; Submit Week button (v1.4)"
```

---

### Task 24: Peer Review Cron — Quarterly Auto-Open/Close

**Files:**
- Create: `services/core/src/cron/peer-review-cycle.ts`
- Modify: `services/core/src/app.ts`

> **Spec requirement:** "Peer review cycle: quarterly auto-open/close via cron." On the first day of each quarter, the cron announces the review window is open. Staff submit peer reviews voluntarily through the UI during the quarter window. On the last day of the quarter, all unsubmitted PENDING reviews are automatically closed to `status=SUBMITTED`. Note: `PeerReview.reviewerId` is a non-nullable FK to `StaffProfile` — only real staff-submitted records can exist; the cron cannot auto-create placeholder records.

- [ ] **Step 1: Discover the existing cron/scheduler pattern**

Run:
```bash
grep -r "cron\|schedule\|setInterval\|setTimeout.*repeat\|node-cron\|fastify-cron" services/core/src --include="*.ts" -l
```

If a cron library is already in use, read one example to understand the invocation pattern. If none exists, check `services/core/package.json` for `node-cron` or `croner`. We will use `node-cron` (add it if absent).

- [ ] **Step 2: Add node-cron if not present**

If `node-cron` is not in `services/core/package.json`:
```bash
cd services/core && pnpm add node-cron && pnpm add -D @types/node-cron
```

- [ ] **Step 3: Create peer-review-cycle.ts**

> **Design note:** `PeerReview.reviewerId` is a required FK to `StaffProfile.id` — there is no system user and no sentinel value is valid. The cron therefore does NOT auto-create `PeerReview` records. Instead, `scheduleQuarterOpen` announces the cycle via a log (and can emit an event for a future notification hook). Staff submit their own reviews through the UI during the window. `scheduleQuarterClose` auto-closes any PENDING reviews that were legitimately created by real staff members before the window ended.

Create `services/core/src/cron/peer-review-cycle.ts`:

```typescript
import cron from 'node-cron';
import { PrismaClient } from '../generated/prisma';

// Runs at 00:01 on day 1 of months: Jan, Apr, Jul, Oct (quarter start)
// Cron: "1 0 1 1,4,7,10 *"
// Does NOT auto-create PeerReview records — reviewerId is a required FK to StaffProfile
// and there is no valid system user. Staff create their own reviews via the UI.
export function scheduleQuarterOpen(prisma: PrismaClient) {
  cron.schedule('1 0 1 1,4,7,10 *', async () => {
    const quarter = getCurrentQuarter();
    console.log(`[peer-review-cron] Peer review window OPEN for ${quarter}. Staff may now submit reviews.`);
    // Future: emit an EventBus event here to trigger in-app notifications to all active staff.
  });
}

// Runs at 23:55 on day 28 of months: Mar, Jun, Sep, Dec (quarter end — conservative date)
// Cron: "55 23 28 3,6,9,12 *"
export function scheduleQuarterClose(prisma: PrismaClient) {
  cron.schedule('55 23 28 3,6,9,12 *', async () => {
    const quarter = getCurrentQuarter();
    console.log(`[peer-review-cron] Closing review cycle for ${quarter}`);

    // Auto-close any PENDING reviews created by staff during the window.
    // These records have a valid reviewerId (real StaffProfile.id) so the update is safe.
    const result = await prisma.peerReview.updateMany({
      where: { quarter, status: 'PENDING' },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    console.log(`[peer-review-cron] Auto-closed ${result.count} pending reviews for ${quarter}`);
  });
}

function getCurrentQuarter(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const q = m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
  return `Q${q}-${y}`;
}
```

- [ ] **Step 4: Register cron jobs in app.ts**

In `services/core/src/app.ts`, after the Prisma plugin is registered (so `fastify.prisma` is available), add:

```typescript
import { scheduleQuarterOpen, scheduleQuarterClose } from './cron/peer-review-cycle';
// ...
// After fastify.ready() or in an onReady hook:
fastify.addHook('onReady', async () => {
  scheduleQuarterOpen(fastify.prisma);
  scheduleQuarterClose(fastify.prisma);
  console.log('[cron] Peer review cycle jobs registered');
});
```

> **Note:** If `services/core` uses a different startup hook (e.g. `app.listen` callback), call these functions after `prisma` is confirmed available — not at module load time.

- [ ] **Step 5: TypeScript check**

```bash
cd services/core && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add services/core/src/cron/peer-review-cycle.ts services/core/src/app.ts
git commit -m "feat(core): add quarterly peer-review cron open/close cycle (v1.4)"
```

---

## Final Wave 1 Checkpoint

After all tasks complete, run a full TypeScript check across the monorepo:

```bash
pnpm --filter @maphari/web exec tsc --noEmit
cd services/core && pnpm exec tsc --noEmit
cd apps/gateway && pnpm exec tsc --noEmit
```

Then tag the release:

```bash
git tag v1.4 -m "Wave 1 complete: Foundation & Stabilization"
git push origin v1.4
```

---

## Execution Choice

Plan complete and saved to `docs/superpowers/plans/2026-03-23-wave1-foundation-stabilization.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, TypeScript check + commit after each, review between tasks, fast parallel iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch with checkpoints

Which approach?
