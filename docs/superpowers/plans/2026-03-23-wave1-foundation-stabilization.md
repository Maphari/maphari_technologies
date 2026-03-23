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
| Modify | `apps/gateway/src/routes/realtime.controller.ts` |
| Modify | `services/core/src/routes/projects.ts` |
| Modify | `services/core/src/routes/invoices.ts` |
| Modify | `services/core/src/routes/leads.ts` |
| Modify | `services/core/src/routes/milestones.ts` |
| Create | `apps/web/src/lib/api/admin/realtime.ts` |
| Create | `apps/web/src/lib/hooks/use-ably-channel.ts` |
| Modify | `apps/web/src/components/admin/dashboard/chrome.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx` |
| Modify | `apps/web/src/components/admin/dashboard/pages/` (revenue/finance page — identify in Task 8) |
| Modify | `apps/web/src/components/client/maphari-client-dashboard.tsx` |
| Modify | `apps/web/src/components/client/maphari-dashboard/pages/dashboard-page.tsx` |
| Modify | `apps/web/src/components/staff/staff-dashboard/pages/` (team structure page — identify in Task 11) |

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

Read `apps/gateway/src/routes/clients.controller.ts` lines 1–60 to understand: how `HttpService` is used to proxy to core, the `@UseGuards(JwtAuthGuard)` pattern, and how request headers are forwarded.

- [ ] **Step 2: Create crises controller**

Create `apps/gateway/src/routes/crises.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Controller('crises')
@UseGuards(JwtAuthGuard)
export class CrisesController {
  constructor(private readonly http: HttpService) {}

  private headers(req: Request) {
    return {
      'x-user-role': req.headers['x-user-role'],
      'x-tenant-id': req.headers['x-tenant-id'],
      authorization: req.headers['authorization'],
    };
  }

  @Get()
  async getCrises(@Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.CORE_URL}/crises`, { headers: this.headers(req) })
    );
    return data;
  }

  @Post()
  async createCrisis(@Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.post(`${process.env.CORE_URL}/crises`, body, { headers: this.headers(req) })
    );
    return data;
  }

  @Patch(':id')
  async updateCrisis(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.patch(`${process.env.CORE_URL}/crises/${id}`, body, { headers: this.headers(req) })
    );
    return data;
  }
}
```

- [ ] **Step 3: Create compliance controller**

Create `apps/gateway/src/routes/compliance.controller.ts`:

```typescript
import { Controller, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly http: HttpService) {}

  private headers(req: Request) {
    return {
      'x-user-role': req.headers['x-user-role'],
      'x-tenant-id': req.headers['x-tenant-id'],
      authorization: req.headers['authorization'],
    };
  }

  @Get()
  async getCompliance(@Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.CORE_URL}/compliance`, { headers: this.headers(req) })
    );
    return data;
  }

  @Patch(':id')
  async updateCompliance(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.patch(`${process.env.CORE_URL}/compliance/${id}`, body, { headers: this.headers(req) })
    );
    return data;
  }

  @Get('data-retention')
  async getDataRetention(@Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.CORE_URL}/compliance/data-retention`, { headers: this.headers(req) })
    );
    return data;
  }
}
```

- [ ] **Step 4: Create fy-checklist controller**

Create `apps/gateway/src/routes/fy-checklist.controller.ts`:

```typescript
import { Controller, Get, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Controller('fy-checklist')
@UseGuards(JwtAuthGuard)
export class FyChecklistController {
  constructor(private readonly http: HttpService) {}

  private headers(req: Request) {
    return {
      'x-user-role': req.headers['x-user-role'],
      'x-tenant-id': req.headers['x-tenant-id'],
      authorization: req.headers['authorization'],
    };
  }

  @Get()
  async getChecklist(@Query('year') year: string, @Req() req: Request) {
    const url = year
      ? `${process.env.CORE_URL}/fy-checklist?year=${year}`
      : `${process.env.CORE_URL}/fy-checklist`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers(req) })
    );
    return data;
  }

  @Patch(':id')
  async toggleItem(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.patch(`${process.env.CORE_URL}/fy-checklist/${id}`, body, { headers: this.headers(req) })
    );
    return data;
  }
}
```

- [ ] **Step 5: Register controllers in app.module.ts**

In `apps/gateway/src/modules/app.module.ts`, import and add to the `controllers` array:

```typescript
import { CrisesController } from './routes/crises.controller';
import { ComplianceController } from './routes/compliance.controller';
import { FyChecklistController } from './routes/fy-checklist.controller';
// Add to controllers: [..., CrisesController, ComplianceController, FyChecklistController]
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

> **Gateway path note:** The gateway routes crises under `/admin/crises` (matching the `@Controller('crises')` with `/admin` prefix) — confirm in Tasks 5/gateway by checking the controller prefix set in `app.module.ts`.

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
    doneBy: session.user.name,
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

### Task 8: Understand and Wire EventBus→Ably Bridge

**Files:**
- Modify: `services/core/src/routes/projects.ts`
- Modify: `services/core/src/routes/invoices.ts`
- Modify: `services/core/src/routes/leads.ts`
- Modify: `services/core/src/routes/milestones.ts`

> **Architecture note:** Core publishes to EventBus → Gateway subscribes to EventBus → Gateway broadcasts to Ably. Ably is NOT in core — it lives in the gateway only. Core only publishes lightweight EventBus events; the gateway translates them into Ably channel messages.

- [ ] **Step 1: Understand the EventBus implementation**

Run this grep to find the EventBus implementation:
```bash
grep -r "eventBus\|EventBus\|event-bus" services/core/src --include="*.ts" -l
```

Read the found file(s) to understand: how `publish(topic, payload)` works, what the type of `topic` is, and how routes access the bus (via `fastify.eventBus` decorator or imported singleton).

- [ ] **Step 2: Understand how gateway subscribes to EventBus**

Run:
```bash
grep -r "EventBus\|EventPattern\|subscribe" apps/gateway/src --include="*.ts" -l
```

Read the found files. The gateway subscribes to EventBus events either via NestJS `@EventPattern` decorators or manual `.subscribe()` calls in `onModuleInit`. Note the exact mechanism — you will use this in Task 9.

- [ ] **Step 3: Publish events in core after mutations**

In `projects.ts`, after a status update PATCH, add:
```typescript
await fastify.eventBus.publish('realtime.projectUpdated', {
  projectId: project.id,
  status: project.status,
  clientId: project.clientId ?? undefined,
});
```

In `invoices.ts`, after invoice created/marked paid:
```typescript
await fastify.eventBus.publish('realtime.invoicePaid', {
  invoiceId: invoice.id,
  clientId: invoice.clientId,
  amountCents: invoice.amountCents,
});
```

In `leads.ts`, after lead created:
```typescript
await fastify.eventBus.publish('realtime.leadCreated', { leadId: lead.id });
```

In `milestones.ts`, after milestone marked complete:
```typescript
await fastify.eventBus.publish('realtime.milestoneCompleted', {
  milestoneId: milestone.id,
  projectId: milestone.projectId,
  clientId: milestone.project?.clientId ?? undefined,
  title: milestone.title,
});
```

> If `fastify.eventBus` is not available as a decorator, import the singleton directly — match the exact pattern used elsewhere in the codebase (from Step 1).

- [ ] **Step 4: TypeScript check**

```bash
cd services/core && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/projects.ts services/core/src/routes/invoices.ts services/core/src/routes/leads.ts services/core/src/routes/milestones.ts
git commit -m "feat(core): publish realtime events on project/invoice/lead/milestone mutations"
```

---

### Task 9: Realtime Controller — Broadcast Helpers

**Files:**
- Modify: `apps/gateway/src/routes/realtime.controller.ts`

- [ ] **Step 1: Read existing realtime controller**

Read `apps/gateway/src/routes/realtime.controller.ts` in full to understand: how Ably is initialised, whether there's a `publishToChannel` helper, and what the token endpoint looks like.

- [ ] **Step 2: Read the existing realtime controller fully**

Read `apps/gateway/src/routes/realtime.controller.ts` in full. Note:
- What NestJS service/module holds the Ably client (e.g. `this.ablyService`, `this.realtime`)
- Whether `OnModuleInit` and `onModuleInit()` are already implemented
- The exact method to get an Ably channel and publish (e.g. `this.ably.channels.get(name).publish(event, data)`)

- [ ] **Step 3: Add broadcast helper methods**

Add these private methods to the controller class. Adjust `this.ably` to match the actual Ably client property name from Step 2:

```typescript
private async broadcastProjectUpdate(payload: { projectId: string; status: string; clientId?: string }) {
  await this.ably.channels.get('admin:global').publish('project.updated', payload);
  if (payload.clientId) {
    await this.ably.channels.get(`client:${payload.clientId}`).publish('project.updated', payload);
  }
}

private async broadcastInvoicePaid(payload: { invoiceId: string; clientId: string }) {
  await this.ably.channels.get('admin:global').publish('invoice.paid', payload);
  await this.ably.channels.get(`client:${payload.clientId}`).publish('invoice.created', payload);
}

private async broadcastLeadCreated(payload: { leadId: string }) {
  await this.ably.channels.get('admin:global').publish('lead.created', payload);
}

private async broadcastMilestoneCompleted(payload: { milestoneId: string; projectId: string; clientId?: string; title: string }) {
  await this.ably.channels.get('admin:global').publish('milestone.completed', payload);
  if (payload.clientId) {
    await this.ably.channels.get(`client:${payload.clientId}`).publish('milestone.completed', payload);
  }
}
```

- [ ] **Step 4: Wire EventBus subscriptions in onModuleInit**

Add or extend `onModuleInit()` in the controller. The exact subscription API depends on what you found in Task 8 Step 2. Two common patterns:

**Pattern A — NestJS EventBus (if using `@nestjs/cqrs` or similar):**
```typescript
implements OnModuleInit {
  onModuleInit() {
    this.eventBus.subscribe('realtime.projectUpdated', (p) => this.broadcastProjectUpdate(p));
    this.eventBus.subscribe('realtime.invoicePaid', (p) => this.broadcastInvoicePaid(p));
    this.eventBus.subscribe('realtime.leadCreated', (p) => this.broadcastLeadCreated(p));
    this.eventBus.subscribe('realtime.milestoneCompleted', (p) => this.broadcastMilestoneCompleted(p));
  }
}
```

**Pattern B — Redis pub/sub or custom event emitter (if that's what the codebase uses):**
```typescript
onModuleInit() {
  this.eventEmitter.on('realtime.projectUpdated', (p) => this.broadcastProjectUpdate(p));
  this.eventEmitter.on('realtime.invoicePaid', (p) => this.broadcastInvoicePaid(p));
  this.eventEmitter.on('realtime.leadCreated', (p) => this.broadcastLeadCreated(p));
  this.eventEmitter.on('realtime.milestoneCompleted', (p) => this.broadcastMilestoneCompleted(p));
}
```

Match the pattern to what you found in Step 2. Inject the EventBus/emitter in the constructor if not already present.

- [ ] **Step 5: TypeScript check**

```bash
cd apps/gateway && pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/gateway/src/routes/realtime.controller.ts
git commit -m "feat(gateway): add Ably broadcast helpers for project/invoice/lead/milestone events"
```

---

### Task 10: Admin Portal — Live Indicator & Auto-Refresh

**Files:**
- Create: `apps/web/src/lib/api/admin/realtime.ts`
- Modify: `apps/web/src/components/admin/dashboard/chrome.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx`

- [ ] **Step 1: Create admin/realtime.ts**

Create `apps/web/src/lib/api/admin/realtime.ts`:

```typescript
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

export interface RealtimeToken {
  token: string;
}

export async function loadRealtimeTokenWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<RealtimeToken>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<RealtimeToken>("/admin/realtime/token", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
```

> **Note:** The Ably token endpoint (`GET /admin/realtime/token`) must exist in `realtime.controller.ts`. Read that controller to confirm the route. If the endpoint is at a different path, adjust the path above.

- [ ] **Step 2: Read chrome.tsx**

Read `apps/web/src/components/admin/dashboard/chrome.tsx` to find the topbar area where the "Live" indicator will live.

- [ ] **Step 3: Add Ably connection hook**

Create a minimal hook inline or in a new file `apps/web/src/lib/hooks/use-ably-channel.ts`:

```typescript
import { useEffect, useRef } from 'react';
import Ably from 'ably';

export function useAblyChannel(
  token: string | null,
  channelName: string,
  eventName: string,
  onMessage: (data: any) => void
) {
  const clientRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    if (!token) return;
    const client = new Ably.Realtime({ token });
    clientRef.current = client;
    const channel = client.channels.get(channelName);
    channel.subscribe(eventName, (msg) => onMessage(msg.data));
    return () => { client.close(); };
  }, [token, channelName, eventName]);
}
```

- [ ] **Step 3: Wire Live indicator in chrome.tsx**

In the admin topbar, fetch a realtime token and show a pulsing dot when connected. Use a ref to hold the client so the cleanup function can close it synchronously:

```typescript
const [live, setLive] = useState(false);
const ablyRef = useRef<Ably.Realtime | null>(null);

useEffect(() => {
  if (!session) return;
  let cancelled = false;

  loadRealtimeTokenWithRefresh(session).then((r) => {
    const token = r.data?.token;
    if (!token) return;
    if (cancelled) return; // component unmounted before promise resolved
    const client = new Ably.Realtime({ token });
    ablyRef.current = client;
    client.connection.on('connected', () => setLive(true));
    client.connection.on('disconnected', () => setLive(false));
    client.connection.on('failed', () => setLive(false));
  });

  return () => {
    cancelled = true;        // prevent setState after unmount
    ablyRef.current?.close(); // close synchronously if already created
    ablyRef.current = null;
  };
}, [session]);

// In JSX topbar:
{live && <span className={cx(s.liveIndicator)}>● Live</span>}
```

Add `.liveIndicator` CSS class (pulsing green dot, `font-size: 11px`, `color: var(--lime)`, `animation: pulse 2s infinite`).

- [ ] **Step 4: Auto-refresh executive dashboard on project.updated**

In `owners-workspace-page.tsx`, subscribe to `admin:global` → `project.updated` and call the existing refresh function when received.

- [ ] **Step 5: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api/admin/realtime.ts apps/web/src/components/admin/dashboard/chrome.tsx apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx apps/web/src/lib/hooks/use-ably-channel.ts
git commit -m "feat(admin): add Live indicator and auto-refresh on realtime events"
```

---

### Task 11: Realtime Subscriptions — Client Portal, Admin Leads, Admin Revenue, Staff Presence

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/` (revenue page — see Step 1)
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/` (team structure page — see Step 3)

- [ ] **Step 1: Identify admin revenue page**

Run:
```bash
grep -r "revenue\|MRR\|finance\|billing" apps/web/src/components/admin/dashboard/pages --include="*.tsx" -l
```

Read the top result to confirm it renders a revenue chart. Note the file path — this is what you'll modify for the `invoice.paid` subscription.

- [ ] **Step 2: Subscribe to client channel on mount**

In `maphari-client-dashboard.tsx`, use the same ref-based cleanup pattern from Task 10 Step 3:

```typescript
const ablyRef = useRef<Ably.Realtime | null>(null);

useEffect(() => {
  const clientId = session?.user?.clientId;
  if (!clientId) return;
  let cancelled = false;

  loadRealtimeTokenWithRefresh(session).then((r) => {
    const token = r.data?.token;
    if (!token) return;
    if (cancelled) return;
    const client = new Ably.Realtime({ token });
    ablyRef.current = client;
    const channel = client.channels.get(`client:${clientId}`);

    channel.subscribe('milestone.completed', (msg) => {
      showToast(`Milestone reached: ${msg.data.title}`);
    });

    channel.subscribe('invoice.created', () => {
      refreshNotifications(); // call existing notification refresh function
    });
  });

  return () => {
    cancelled = true;
    ablyRef.current?.close();
    ablyRef.current = null;
  };
}, [session?.user?.clientId]);
```

- [ ] **Step 3: Identify staff team structure page**

Run:
```bash
grep -r "team\|presence\|online" apps/web/src/components/staff/staff-dashboard/pages --include="*.tsx" -l
```

Read the top result. If a team structure page exists, add a presence dot per staff member using Ably presence. If none exists, add the presence dot to the `owners-workspace-page.tsx` team section instead.

**Presence implementation:**
```typescript
// In the team structure component, after Ably token fetch:
const presenceChannel = client.channels.get('admin:global');
presenceChannel.presence.enter({ staffId: session.user.id });
presenceChannel.presence.subscribe((member) => {
  setOnlineStaff(prev => ({ ...prev, [member.data.staffId]: member.action !== 'leave' }));
});
// Render: {onlineStaff[staff.id] && <span className={cx(s.presenceDot)} />}
```

- [ ] **Step 4: Admin leads page — badge increment on lead.created**

In `admin-leads-page-client.tsx`, add subscription to `admin:global` → `lead.created`:

```typescript
// After Ably token fetch (use same ref pattern):
channel.subscribe('lead.created', () => {
  // Option A — if the page has a local leads count, increment it:
  setNewLeadCount(prev => prev + 1);
  // Option B — call the existing refresh function if available:
  // refreshLeads();
});
// Render a "New" badge near the leads count if newLeadCount > 0
```

- [ ] **Step 5: Admin revenue page — auto-update on invoice.paid**

In the revenue page identified in Step 1, add subscription to `admin:global` → `invoice.paid`:

```typescript
channel.subscribe('invoice.paid', () => {
  // Call the existing revenue/stats refresh function
  refreshRevenue();
});
```

- [ ] **Step 6: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/client/maphari-client-dashboard.tsx apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx
# Also stage the revenue page and staff presence page you identified and modified in Steps 1 and 3:
# git add apps/web/src/components/admin/dashboard/pages/<revenue-page>.tsx
# git add apps/web/src/components/staff/staff-dashboard/pages/<team-page>.tsx
git commit -m "feat(v1.2): realtime subscriptions — client milestone toast, invoice badge, admin leads badge, revenue refresh, staff presence"
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
          id: a.id, title: a.title ?? 'Appointment', startAt: a.scheduledAt, endAt,
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
- Create: `apps/gateway/src/routes/calendar.controller.ts`
- Modify: `apps/gateway/src/modules/app.module.ts`

- [ ] **Step 1: Create calendar controller**

Create `apps/gateway/src/routes/calendar.controller.ts`:

```typescript
import { Controller, Get, Query, Req, UseGuards, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { Request, Response } from 'express';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly http: HttpService) {}

  private headers(req: Request) {
    return {
      'x-user-role': req.headers['x-user-role'],
      'x-tenant-id': req.headers['x-tenant-id'],
      'x-client-id': req.headers['x-client-id'],
      'x-user-id': req.headers['x-user-id'],
      authorization: req.headers['authorization'],
    };
  }

  @Get('events')
  async getEvents(@Query('from') from: string, @Query('to') to: string, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.CORE_URL}/calendar/events?from=${from}&to=${to}`, {
        headers: this.headers(req),
      })
    );
    return data;
  }

  @Get('export.ics')
  async exportIcs(@Req() req: Request, @Res() res: Response) {
    const { data, headers } = await firstValueFrom(
      this.http.get(`${process.env.CORE_URL}/calendar/export.ics`, {
        headers: this.headers(req),
        responseType: 'text',
      })
    );
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="maphari-calendar.ics"');
    res.send(data);
  }
}
```

- [ ] **Step 2: Register in app.module.ts**

```typescript
import { CalendarController } from './routes/calendar.controller';
// Add CalendarController to controllers array
```

- [ ] **Step 3: TypeScript check + commit**

```bash
cd apps/gateway && pnpm exec tsc --noEmit
git add apps/gateway/src/routes/calendar.controller.ts apps/gateway/src/modules/app.module.ts
git commit -m "feat(gateway): add calendar controller with events + iCal export"
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

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  type: string;
  sourceId: string;
  sourceType: string;
  clientId: string | null;
  roles: string[];
}

export async function loadAdminCalendarEventsWithRefresh(
  session: AuthSession,
  from: string,
  to: string
): Promise<AuthorizedResult<CalendarEvent[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<CalendarEvent[]>(`/admin/calendar/events?from=${from}&to=${to}`, token);
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
    const res = await callGateway<CalendarEvent[]>(`/staff/calendar/events?from=${from}&to=${to}`, token);
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

- [ ] **Step 5: Add portal calendar fetch to portal/meetings.ts**

Read `apps/web/src/lib/api/portal/meetings.ts` to understand the existing function structure and import pattern. Append a function to load calendar events for the client:

```typescript
// Add this to portal/meetings.ts (adjust import pattern to match what the file already uses)
export async function loadClientCalendarEventsWithRefresh(
  session: AuthSession,
  from: string,
  to: string
): Promise<AuthorizedResult<CalendarEvent[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<CalendarEvent[]>(`/portal/calendar/events?from=${from}&to=${to}`, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
```

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
            <span>{new Date(event.startAt).toLocaleDateString()}</span>
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
import { loadClientCalendarEventsWithRefresh, type CalendarEvent } from '@/lib/api/portal/meetings';

// In the component body:
const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

useEffect(() => {
  if (!session) return;
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // next 30 days
  loadClientCalendarEventsWithRefresh(session, from, to).then(r => {
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
//         <span>{new Date(ev.startAt).toLocaleDateString()}</span>
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

If no controller handles `staff/goals`, create `apps/gateway/src/routes/staff-goals.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Controller('staff-goals')
@UseGuards(JwtAuthGuard)
export class StaffGoalsController {
  constructor(private readonly http: HttpService) {}

  private headers(req: Request) {
    return {
      'x-user-role': req.headers['x-user-role'],
      'x-user-id': req.headers['x-user-id'],
      'x-tenant-id': req.headers['x-tenant-id'],
      authorization: req.headers['authorization'],
    };
  }

  @Get()
  async getGoals(@Query('quarter') quarter: string, @Req() req: Request) {
    const url = quarter
      ? `${process.env.CORE_URL}/staff-goals?quarter=${quarter}`
      : `${process.env.CORE_URL}/staff-goals`;
    const { data } = await firstValueFrom(this.http.get(url, { headers: this.headers(req) }));
    return data;
  }

  @Post()
  async createGoal(@Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.post(`${process.env.CORE_URL}/staff-goals`, body, { headers: this.headers(req) })
    );
    return data;
  }

  @Patch(':id')
  async updateGoal(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.patch(`${process.env.CORE_URL}/staff-goals/${id}`, body, { headers: this.headers(req) })
    );
    return data;
  }
}
```

- [ ] **Step 2: Create peer-reviews controller**

Create `apps/gateway/src/routes/peer-reviews.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Controller('peer-reviews')
@UseGuards(JwtAuthGuard)
export class PeerReviewsController {
  constructor(private readonly http: HttpService) {}

  private headers(req: Request) {
    return {
      'x-user-role': req.headers['x-user-role'],
      'x-user-id': req.headers['x-user-id'],
      'x-tenant-id': req.headers['x-tenant-id'],
      authorization: req.headers['authorization'],
    };
  }

  @Get()
  async getMyReviews(@Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.CORE_URL}/peer-reviews`, { headers: this.headers(req) })
    );
    return data;
  }

  @Post()
  async submitReview(@Body() body: any, @Req() req: Request) {
    const { data } = await firstValueFrom(
      this.http.post(`${process.env.CORE_URL}/peer-reviews`, body, { headers: this.headers(req) })
    );
    return data;
  }
}
```

- [ ] **Step 3: Extend time-entries controller with submit/approve/reject**

Find `apps/gateway/src/routes/time-entries.controller.ts`. Read it, then add:

```typescript
@Patch(':id/submit')
async submitTimesheet(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
  const { data } = await firstValueFrom(
    this.http.patch(`${process.env.CORE_URL}/time-entries/${id}/submit`, body, { headers: this.headers(req) })
  );
  return data;
}

@Patch(':id/approve')
async approveTimesheet(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
  const { data } = await firstValueFrom(
    this.http.patch(`${process.env.CORE_URL}/time-entries/${id}/approve`, body, { headers: this.headers(req) })
  );
  return data;
}

@Patch(':id/reject')
async rejectTimesheet(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
  const { data } = await firstValueFrom(
    this.http.patch(`${process.env.CORE_URL}/time-entries/${id}/reject`, body, { headers: this.headers(req) })
  );
  return data;
}
```

- [ ] **Step 4: Register in app.module.ts**

```typescript
import { StaffGoalsController } from './routes/staff-goals.controller';
import { PeerReviewsController } from './routes/peer-reviews.controller';
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
    const res = await callGateway<PeerReview[]>("/staff/peer-reviews", token);
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
    const res = await callGateway<PeerReview>("/staff/peer-reviews", token, { method: "POST", body: data });
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
      `/staff/time-entries/${entryId}/submit`,
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
const allocated = entries.filter(e => isSameDay(e.date, day)).reduce((sum, e) => sum + e.hours, 0);
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
  const updated = await loadTimeEntriesWithRefresh(session, weekStart, weekEnd);
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

> **Note:** `loadAdminTimesheetsPendingWithRefresh` needs to be added to `apps/web/src/lib/api/admin/hr.ts` if not present. The function calls `GET /admin/time-entries?status=SUBMITTED` on the gateway.

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

> **Spec requirement:** "Peer review cycle: quarterly auto-open/close via cron." On the first day of each quarter, all active staff members receive a new PeerReview record with `status=OPEN`. On the last day of the quarter, all OPEN reviews are automatically closed to `status=CLOSED`.

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

Create `services/core/src/cron/peer-review-cycle.ts`:

```typescript
import cron from 'node-cron';
import { PrismaClient } from '../generated/prisma';

// Runs at 00:01 on day 1 of months: Jan, Apr, Jul, Oct (quarter start)
// Cron: "1 0 1 1,4,7,10 *"
export function scheduleQuarterOpen(prisma: PrismaClient) {
  cron.schedule('1 0 1 1,4,7,10 *', async () => {
    const quarter = getCurrentQuarter();
    console.log(`[peer-review-cron] Opening review cycle for ${quarter}`);

    // StaffProfile is the authoritative staff record (not a User model — there is none)
    const staffProfiles = await prisma.staffProfile.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    // Create a PeerReview record for each staff member (as reviewee)
    // Idempotent: skip if record already exists for this quarter
    for (const profile of staffProfiles) {
      const existing = await prisma.peerReview.findFirst({
        where: { revieweeId: profile.id, quarter },
      });
      if (!existing) {
        await prisma.peerReview.create({
          data: {
            revieweeId: profile.id,
            // reviewerId is required by the schema — use a sentinel SYSTEM id for auto-created records
            reviewerId: 'SYSTEM',
            quarter,
            status: 'PENDING', // existing default status value in the schema
          },
        });
      }
    }

    console.log(`[peer-review-cron] Opened ${staffProfiles.length} review slots for ${quarter}`);
  });
}

// Runs at 23:55 on day 28 of months: Mar, Jun, Sep, Dec (quarter end — conservative date)
// Cron: "55 23 28 3,6,9,12 *"
export function scheduleQuarterClose(prisma: PrismaClient) {
  cron.schedule('55 23 28 3,6,9,12 *', async () => {
    const quarter = getCurrentQuarter();
    console.log(`[peer-review-cron] Closing review cycle for ${quarter}`);

    // Mark unsubmitted PENDING reviews for this quarter as SUBMITTED with no score
    // (indicates the cycle passed without a voluntary review being filed)
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
