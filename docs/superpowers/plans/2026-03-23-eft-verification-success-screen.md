# EFT Verification & Success Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake success screen with a real DB-linked reference code, add EFT proof-of-payment upload on the success screen, and give admins a verification panel to approve/reject deposits.

**Architecture:** Prisma migration adds `referenceCode` to `Project` and a new `EftVerification` model. Core service generates the reference code server-side and exposes four new routes. The gateway proxies them. The portal API client adds two new functions. The admin API client adds two new functions. The frontend success screen is rewritten to capture real DB state and show an EFT upload section.

**Tech Stack:** Prisma (PostgreSQL), Fastify (core service), NestJS (gateway), Next.js 16, TypeScript, CSS Modules

**Spec:** `docs/superpowers/specs/2026-03-23-eft-verification-success-screen-design.md`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `services/core/prisma/schema.prisma` | Modify | Add `referenceCode` to `Project`; add `EftVerification` model + `EftVerificationStatus` enum |
| `services/core/src/routes/projects.ts` | Modify | Generate `referenceCode` server-side in `POST /projects/requests` |
| `services/core/src/routes/eft-verification.ts` | **Create** | Four EFT routes: PATCH proof, GET status, GET admin list, POST verify |
| `services/core/src/app.ts` | Modify | Register `registerEftVerificationRoutes` |
| `apps/gateway/src/routes/projects.controller.ts` | Modify | Proxy the four new EFT routes |
| `apps/web/src/lib/api/portal/projects.ts` | Modify | Add `submitPortalEftProofWithRefresh`, `loadPortalEftStatusWithRefresh` |
| `apps/web/src/lib/api/admin/projects.ts` | Modify | Add `loadAdminEftPendingWithRefresh`, `verifyAdminEftDepositWithRefresh` |
| `apps/web/src/components/client/maphari-dashboard/pages/project-request-page.tsx` | Modify | Replace `submitted` bool with `submittedProject` state; rewrite success screen |
| `apps/web/src/app/style/client/pages-misc.module.css` | Modify | Add success screen CSS classes |
| `apps/web/src/components/admin/dashboard/pages/request-inbox-page.tsx` | Modify | Add EFT verification panel section |

---

## Task 1: Prisma Schema — `referenceCode` + `EftVerification`

**Files:**
- Modify: `services/core/prisma/schema.prisma`

- [ ] **Step 1: Add `referenceCode` field to `Project` model**

  Open `services/core/prisma/schema.prisma`. Find `model Project {` (around line 109). Add two lines after `updatedAt`:

  ```prisma
  referenceCode   String?  @unique  // PRJ-XXXXXX — human-readable reference, generated server-side
  eftVerification EftVerification?
  ```

- [ ] **Step 2: Add `EftVerificationStatus` enum**

  After the last `enum` block in the schema, add:

  ```prisma
  enum EftVerificationStatus {
    PENDING
    VERIFIED
    REJECTED
  }
  ```

- [ ] **Step 3: Add `EftVerification` model**

  After the `Project` model closing brace, add:

  ```prisma
  model EftVerification {
    id              String                @id @default(cuid())
    projectId       String                @unique
    clientId        String
    proofFileId     String
    proofFileName   String
    status          EftVerificationStatus @default(PENDING)
    verifiedBy      String?
    verifiedAt      DateTime?
    rejectedAt      DateTime?
    rejectionReason String?
    notes           String?
    createdAt       DateTime              @default(now())
    updatedAt       DateTime              @updatedAt

    project         Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

    @@map("eft_verifications")
  }
  ```

- [ ] **Step 4: Run migration**

  ```bash
  cd /Users/maphari/Projects/maphari_technologies
  pnpm --filter @maphari/core exec prisma migrate dev --name add_eft_verification
  ```

  Expected: migration file created, `prisma generate` runs automatically.

- [ ] **Step 5: Verify Prisma client updated**

  ```bash
  pnpm --filter @maphari/core exec prisma studio &
  # Check that EftVerification table appears, then Ctrl+C
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add services/core/prisma/
  git commit -m "feat(db): add referenceCode to Project + EftVerification model"
  ```

---

## Task 2: Core Service — Generate `referenceCode` on Project Creation

**Files:**
- Modify: `services/core/src/routes/projects.ts`

- [ ] **Step 1: Add `generateReferenceCode` helper near the top of the file**

  After the imports section (around line 30), add:

  ```ts
  /** Generates a unique PRJ-XXXXXX reference code with collision check. */
  async function generateReferenceCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    let code = `PRJ-${rand()}`;
    const existing = await prisma.project.findUnique({ where: { referenceCode: code }, select: { id: true } });
    if (existing) {
      code = `PRJ-${rand()}`;
      const existing2 = await prisma.project.findUnique({ where: { referenceCode: code }, select: { id: true } });
      if (existing2) {
        // Guaranteed unique fallback using Node crypto — no extra deps
        const { randomUUID } = await import("crypto");
        code = `PRJ-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
      }
    }
    return code;
  }
  ```

  > Note: Do NOT use `@paralleldrive/cuid2` — it may not be a direct dep. The safe fallback uses only Node built-ins.

- [ ] **Step 2: Generate `referenceCode` before `prisma.project.create`**

  In `app.post("/projects/requests", ...)`, find the `prisma.project.create({` call (around line 834). Just before it, add:

  ```ts
  const referenceCode = await generateReferenceCode();
  ```

- [ ] **Step 3: Include `referenceCode` in the `prisma.project.create` data**

  Inside the `data:` object of `prisma.project.create`, add:

  ```ts
  referenceCode,
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  cd /Users/maphari/Projects/maphari_technologies
  pnpm --filter @maphari/core exec tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add services/core/src/routes/projects.ts
  git commit -m "feat(core): generate referenceCode server-side on project request"
  ```

---

## Task 3: Core Service — EFT Verification Routes

**Files:**
- Create: `services/core/src/routes/eft-verification.ts`

- [ ] **Step 1: Create the file with all four routes**

  ```ts
  // ════════════════════════════════════════════════════════════════════════════
  // eft-verification.ts — EFT deposit proof upload + admin verification
  // Routes:
  //   PATCH /projects/:id/eft-proof              CLIENT
  //   GET   /clients/:clientId/projects/:id/eft-status  CLIENT/STAFF/ADMIN
  //   GET   /admin/eft-pending                   STAFF/ADMIN (read-only for STAFF)
  //   POST  /admin/eft-pending/:id/verify        ADMIN only
  // ════════════════════════════════════════════════════════════════════════════

  import type { FastifyInstance } from "fastify";
  import type { ApiResponse } from "@maphari/contracts";
  import { prisma } from "../lib/prisma.js";
  import { readScopeHeaders } from "../lib/scope.js";

  const ADMIN_EMAIL = process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com";
  const FILES_SERVICE_URL = process.env.FILES_SERVICE_URL ?? "http://localhost:4003";
  const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4005";

  // ── Helper: notify admin on proof upload ─────────────────────────────────────
  // Queries all ADMIN-role users from DB and sends one email per admin.
  async function notifyAdminEftProofUploaded(opts: {
    clientName: string;
    depositCents: number;
    referenceCode: string | null;
  }) {
    const ref = opts.referenceCode ?? "—";
    const amount = `R ${(opts.depositCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
    // Query all admin users from the User model (adjust model/field name if schema differs)
    let adminEmails: string[] = [ADMIN_EMAIL];
    try {
      const admins = await (prisma as unknown as { user?: { findMany: (args: unknown) => Promise<{ email: string }[]> } }).user?.findMany({
        where: { role: "ADMIN" },
        select: { email: true }
      });
      if (admins && admins.length > 0) {
        adminEmails = admins.map((a) => a.email).filter(Boolean);
      }
    } catch {
      // If User model not available, fall back to env email
    }
    for (const to of adminEmails) {
      try {
        await fetch(`${NOTIFICATIONS_SERVICE_URL}/notifications/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-role": "ADMIN", "x-user-id": "system" },
          body: JSON.stringify({
            to,
            subject: `New EFT proof uploaded — ${ref}`,
            html: `<p>${opts.clientName} uploaded proof of EFT payment (${amount}).</p><p>Reference: <strong>${ref}</strong></p><p>Log in to the admin dashboard to verify.</p>`
          }),
          signal: AbortSignal.timeout(8_000)
        });
      } catch (err) {
        console.warn("[eft] Admin notification failed:", err);
      }
    }
  }

  // ── Helper: notify client on verify/reject ────────────────────────────────────
  async function notifyClientEftDecision(opts: {
    clientEmail: string;
    action: "VERIFY" | "REJECT";
    referenceCode: string | null;
    depositCents: number;
    rejectionReason?: string;
  }) {
    const ref = opts.referenceCode ?? "—";
    const amount = `R ${(opts.depositCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
    const subject = opts.action === "VERIFY"
      ? `Your deposit has been verified — ${ref}`
      : `Action required: re-upload proof of payment — ${ref}`;
    const html = opts.action === "VERIFY"
      ? `<p>Your EFT deposit of ${amount} for project <strong>${ref}</strong> has been verified. Your project lead will be in touch within 1 business day.</p>`
      : `<p>Your proof of payment for <strong>${ref}</strong> was not accepted.</p><p>Reason: ${opts.rejectionReason}</p><p>Please log in and re-upload your proof of payment from your project dashboard.</p>`;
    try {
      await fetch(`${NOTIFICATIONS_SERVICE_URL}/notifications/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN", "x-user-id": "system" },
        body: JSON.stringify({ to: clientEmail, subject, html }),
        signal: AbortSignal.timeout(8_000)
      });
    } catch (err) {
      console.warn("[eft] Client notification failed:", err);
    }
  }

  export async function registerEftVerificationRoutes(app: FastifyInstance): Promise<void> {

    // ── PATCH /projects/:id/eft-proof ─────────────────────────────────────────
    app.patch("/projects/:id/eft-proof", async (request, reply) => {
      const scope = readScopeHeaders(request);
      if (scope.role !== "CLIENT") {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients only." } } as ApiResponse);
      }

      const { id } = request.params as { id: string };
      const body = request.body as { proofFileId?: string; proofFileName?: string };

      if (!body.proofFileId || !body.proofFileName) {
        return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "proofFileId and proofFileName are required." } } as ApiResponse);
      }

      // Auth scope: project must belong to this client
      const project = await prisma.project.findUnique({ where: { id }, select: { id: true, clientId: true, referenceCode: true, budgetCents: true } });
      if (!project || project.clientId !== scope.clientId) {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project not found." } } as ApiResponse);
      }

      // Validate file via files service
      try {
        const fileMeta = await fetch(`${FILES_SERVICE_URL}/files/${body.proofFileId}/meta`, {
          headers: { "x-user-role": "CLIENT", "x-user-id": scope.userId ?? "", "x-client-id": scope.clientId ?? "" },
          signal: AbortSignal.timeout(8_000)
        });
        if (!fileMeta.ok) {
          return reply.code(400).send({ success: false, error: { code: "INVALID_PROOF_FILE", message: "Proof file not found or not accessible." } } as ApiResponse);
        }
        const meta = await fileMeta.json() as { mimeType?: string; sizeBytes?: number };
        if (meta.mimeType && meta.mimeType !== "application/pdf") {
          return reply.code(400).send({ success: false, error: { code: "INVALID_PROOF_FILE", message: "Only PDF files are accepted." } } as ApiResponse);
        }
        if (meta.sizeBytes && meta.sizeBytes > 10 * 1024 * 1024) {
          return reply.code(400).send({ success: false, error: { code: "INVALID_PROOF_FILE", message: "File must be 10 MB or smaller." } } as ApiResponse);
        }
      } catch {
        return reply.code(502).send({ success: false, error: { code: "FILES_SERVICE_UNAVAILABLE", message: "Unable to validate file. Please retry." } } as ApiResponse);
      }

      const existing = await prisma.eftVerification.findUnique({ where: { projectId: id } });

      const verification = existing
        ? await prisma.eftVerification.update({
            where: { projectId: id },
            data: {
              proofFileId: body.proofFileId,
              proofFileName: body.proofFileName,
              status: "PENDING",
              rejectedAt: null,
              rejectionReason: null
            }
          })
        : await prisma.eftVerification.create({
            data: {
              projectId: id,
              clientId: project.clientId,
              proofFileId: body.proofFileId,
              proofFileName: body.proofFileName,
              status: "PENDING"
            }
          });

      // Fire-and-forget admin email
      const client = await prisma.client.findUnique({ where: { id: project.clientId }, select: { name: true } });
      notifyAdminEftProofUploaded({
        clientName: client?.name ?? project.clientId,
        depositCents: Number(project.budgetCents),
        referenceCode: project.referenceCode
      });

      const isNew = !existing;
      return reply.code(isNew ? 201 : 200).send({ success: true, data: { status: verification.status } } as ApiResponse);
    });

    // ── GET /clients/:clientId/projects/:id/eft-status ────────────────────────
    app.get("/clients/:clientId/projects/:id/eft-status", async (request, reply) => {
      const scope = readScopeHeaders(request);
      const { clientId, id } = request.params as { clientId: string; id: string };

      if (scope.role === "CLIENT" && scope.clientId !== clientId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
      }

      const verification = await prisma.eftVerification.findUnique({
        where: { projectId: id },
        select: { status: true, rejectionReason: true, verifiedAt: true, rejectedAt: true }
      });

      return {
        success: true,
        data: {
          status: verification?.status ?? null,
          rejectionReason: verification?.rejectionReason ?? null,
          verifiedAt: verification?.verifiedAt?.toISOString() ?? null,
          rejectedAt: verification?.rejectedAt?.toISOString() ?? null
        }
      } as ApiResponse;
    });

    // ── GET /admin/eft-pending ────────────────────────────────────────────────
    app.get("/admin/eft-pending", async (request, reply) => {
      const scope = readScopeHeaders(request);
      if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Staff or Admin only." } } as ApiResponse);
      }

      const { status } = request.query as { status?: string };
      const where = status ? { status: status as "PENDING" | "VERIFIED" | "REJECTED" } : {};

      const rows = await prisma.eftVerification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: {
              referenceCode: true,
              budgetCents: true,
              name: true,
              client: { select: { name: true } }
            }
          }
        }
      });

      // Note: `services` (selectedServices) is stored in the ProjectActivity JSON blob,
      // not as a first-class column on Project. Omit it from this response — the admin
      // panel shows project name instead. The AdminEftPendingItem type does NOT include services.
      const data = rows.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        referenceCode: r.project.referenceCode ?? null,
        clientId: r.clientId,
        clientName: r.project.client.name,
        projectName: r.project.name,
        depositCents: Number(r.project.budgetCents),
        proofFileId: r.proofFileId,
        proofFileName: r.proofFileName,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        verifiedBy: r.verifiedBy ?? null,
        verifiedAt: r.verifiedAt?.toISOString() ?? null,
        rejectedAt: r.rejectedAt?.toISOString() ?? null,
        rejectionReason: r.rejectionReason ?? null
      }));

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    });

    // ── POST /admin/eft-pending/:id/verify ────────────────────────────────────
    app.post("/admin/eft-pending/:id/verify", async (request, reply) => {
      const scope = readScopeHeaders(request);
      if (scope.role !== "ADMIN") {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
      }

      const { id } = request.params as { id: string };
      const body = request.body as { action?: "VERIFY" | "REJECT"; rejectionReason?: string };

      if (!body.action || !["VERIFY", "REJECT"].includes(body.action)) {
        return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "action must be VERIFY or REJECT." } } as ApiResponse);
      }
      if (body.action === "REJECT" && !body.rejectionReason?.trim()) {
        return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "rejectionReason is required when rejecting." } } as ApiResponse);
      }

      const verification = await prisma.eftVerification.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              referenceCode: true,
              budgetCents: true,
              // billingEmail lives on Client; ClientContact.email is the primary contact email
              client: { select: { billingEmail: true, contacts: { where: { isPrimary: true }, select: { email: true }, take: 1 } } }
            }
          }
        }
      });
      if (!verification) {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Verification not found." } } as ApiResponse);
      }

      const now = new Date();
      const updated = await prisma.eftVerification.update({
        where: { id },
        data: {
          status: body.action === "VERIFY" ? "VERIFIED" : "REJECTED",
          verifiedBy: body.action === "VERIFY" ? (scope.userId ?? null) : null,
          verifiedAt: body.action === "VERIFY" ? now : null,
          rejectedAt: body.action === "REJECT" ? now : null,
          rejectionReason: body.action === "REJECT" ? body.rejectionReason!.trim() : null
        }
      });

      // Fire-and-forget client email
      // Prefer primary contact email, fall back to billingEmail
      const clientEmail =
        verification.project.client.contacts[0]?.email ??
        verification.project.client.billingEmail ??
        null;
      if (clientEmail) {
        notifyClientEftDecision({
          clientEmail,
          action: body.action,
          referenceCode: verification.project.referenceCode,
          depositCents: Number(verification.project.budgetCents),
          rejectionReason: body.rejectionReason
        });
      }

      return { success: true, data: { status: updated.status } } as ApiResponse;
    });
  }
  ```

- [ ] **Step 2: Check TypeScript compiles**

  ```bash
  pnpm --filter @maphari/core exec tsc --noEmit
  ```

  Expected: no errors. Fix any Prisma type issues (e.g. `client.email` may not exist — replace with the correct field from the `Client` model in the schema).

- [ ] **Step 3: Commit**

  ```bash
  git add services/core/src/routes/eft-verification.ts
  git commit -m "feat(core): EFT verification routes"
  ```

---

## Task 4: Register EFT Routes in Core App

**Files:**
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Add import at top of `app.ts`**

  After the last import line, add:

  ```ts
  import { registerEftVerificationRoutes } from "./routes/eft-verification.js";
  ```

- [ ] **Step 2: Register routes in `createCoreApp`**

  Find the `// ── Churn Risk Score` comment near the bottom. After `await registerChurnRiskRoutes(app);`, add:

  ```ts
  // ── EFT Verification ───────────────────────────────────────────────────────
  await registerEftVerificationRoutes(app);
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  pnpm --filter @maphari/core exec tsc --noEmit
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add services/core/src/app.ts
  git commit -m "feat(core): register EFT verification routes"
  ```

---

## Task 5: Gateway — Proxy EFT Routes

**Files:**
- Modify: `apps/gateway/src/routes/projects.controller.ts`

- [ ] **Step 1: Add four proxy methods to `ProjectsController`**

  At the end of the class (before the closing `}`), add:

  ```ts
  @Roles("CLIENT")
  @Patch("projects/:id/eft-proof")
  async submitEftProof(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${id}/eft-proof`, "PATCH", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("CLIENT", "STAFF", "ADMIN")
  @Get("clients/:clientId/projects/:id/eft-status")
  async getEftStatus(
    @Param("clientId") clientId: string,
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") xClientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${clientId}/projects/${id}/eft-status`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": xClientId ?? "", "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("STAFF", "ADMIN")
  @Get("admin/eft-pending")
  async getEftPending(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    const q = query as Record<string, string>;
    if (q?.status) params.set("status", q.status);
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/admin/eft-pending${params.size ? `?${params}` : ""}`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Post("admin/eft-pending/:id/verify")
  async verifyEftDeposit(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/admin/eft-pending/${id}/verify`, "POST", body, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "", "x-trace-id": traceId ?? requestId ?? ""
    });
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/gateway exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/gateway/src/routes/projects.controller.ts
  git commit -m "feat(gateway): proxy EFT verification routes"
  ```

---

## Task 6: Portal API Client — EFT Functions

**Files:**
- Modify: `apps/web/src/lib/api/portal/projects.ts`

- [ ] **Step 1: Add EFT types and two functions at the end of the file**

  ```ts
  // ── EFT Verification ──────────────────────────────────────────────────────────

  export interface PortalEftStatus {
    status: "PENDING" | "VERIFIED" | "REJECTED" | null;
    rejectionReason: string | null;
    verifiedAt: string | null;
    rejectedAt: string | null;
  }

  export async function submitPortalEftProofWithRefresh(
    session: AuthSession,
    projectId: string,
    input: { proofFileId: string; proofFileName: string }
  ): Promise<AuthorizedResult<{ status: string }>> {
    return withAuthorizedSession(session, async (accessToken) => {
      const response = await callGateway<{ status: string }>(
        `/projects/${projectId}/eft-proof`,
        accessToken,
        { method: "PATCH", body: input }
      );
      if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
      if (!response.payload.success || !response.payload.data) {
        return {
          unauthorized: false, data: null,
          error: toGatewayError(
            response.payload.error?.code ?? "EFT_PROOF_SUBMIT_FAILED",
            response.payload.error?.message ?? "Unable to submit proof of payment."
          )
        };
      }
      return { unauthorized: false, data: response.payload.data, error: null };
    });
  }

  export async function loadPortalEftStatusWithRefresh(
    session: AuthSession,
    clientId: string,
    projectId: string
  ): Promise<AuthorizedResult<PortalEftStatus>> {
    return withAuthorizedSession(session, async (accessToken) => {
      const response = await callGateway<PortalEftStatus>(
        `/clients/${clientId}/projects/${projectId}/eft-status`,
        accessToken
      );
      if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
      if (!response.payload.success) {
        return {
          unauthorized: false, data: null,
          error: toGatewayError(
            response.payload.error?.code ?? "EFT_STATUS_FETCH_FAILED",
            response.payload.error?.message ?? "Unable to load EFT status."
          )
        };
      }
      return { unauthorized: false, data: response.payload.data ?? null, error: null };
    });
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/lib/api/portal/projects.ts
  git commit -m "feat(portal-api): add EFT proof submit + status loader"
  ```

---

## Task 7: Admin API Client — EFT Functions

**Files:**
- Modify: `apps/web/src/lib/api/admin/projects.ts`

- [ ] **Step 1: Add EFT types + two functions at the end of the admin projects API file**

  Open `apps/web/src/lib/api/admin/projects.ts`. At the bottom, add:

  ```ts
  // ── EFT Verification ──────────────────────────────────────────────────────────

  export interface AdminEftPendingItem {
    id: string;
    projectId: string;
    referenceCode: string | null;
    clientId: string;
    clientName: string;
    projectName: string;     // project name (services field omitted — lives in JSON blob)
    depositCents: number;
    proofFileId: string;
    proofFileName: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    createdAt: string;
    verifiedBy: string | null;
    verifiedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
  }

  // Uses the same withAuthorizedSession + callGateway + isUnauthorized + toGatewayError
  // pattern as every other function in this file (imported from "./_shared").

  export async function loadAdminEftPendingWithRefresh(
    session: AuthSession,
    options: { status?: "PENDING" | "VERIFIED" | "REJECTED" } = {}
  ): Promise<AuthorizedResult<AdminEftPendingItem[]>> {
    const params = new URLSearchParams();
    if (options.status) params.set("status", options.status);
    return withAuthorizedSession(session, async (accessToken) => {
      const response = await callGateway<AdminEftPendingItem[]>(
        `/admin/eft-pending${params.size ? `?${params}` : ""}`,
        accessToken
      );
      if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
      if (!response.payload.success) {
        return {
          unauthorized: false,
          data: [],
          error: toGatewayError(
            response.payload.error?.code ?? "EFT_PENDING_FETCH_FAILED",
            response.payload.error?.message ?? "Unable to load EFT verifications."
          )
        };
      }
      return { unauthorized: false, data: response.payload.data ?? [], error: null };
    });
  }

  export async function verifyAdminEftDepositWithRefresh(
    session: AuthSession,
    verificationId: string,
    input: { action: "VERIFY" | "REJECT"; rejectionReason?: string }
  ): Promise<AuthorizedResult<{ status: string }>> {
    return withAuthorizedSession(session, async (accessToken) => {
      const response = await callGateway<{ status: string }>(
        `/admin/eft-pending/${verificationId}/verify`,
        accessToken,
        { method: "POST", body: input }
      );
      if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
      if (!response.payload.success || !response.payload.data) {
        return {
          unauthorized: false,
          data: null,
          error: toGatewayError(
            response.payload.error?.code ?? "EFT_VERIFY_FAILED",
            response.payload.error?.message ?? "Unable to process verification."
          )
        };
      }
      return { unauthorized: false, data: response.payload.data, error: null };
    });
  }
  ```

  > Note: The functions above use `withAuthorizedSession`, `callGateway`, `isUnauthorized`, and `toGatewayError` imported from `./_shared` — the same pattern as every other function in this file.

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/lib/api/admin/projects.ts
  git commit -m "feat(admin-api): add EFT pending loader + verify action"
  ```

---

## Task 8: Success Screen — CSS

**Files:**
- Modify: `apps/web/src/app/style/client/pages-misc.module.css`

- [ ] **Step 1: Add success screen CSS at the end of the file**

  ```css
  /* ── Project Request Success Screen ────────────────────────────────────────── */
  .prqSuccessShell       { display: flex; flex-direction: column; gap: 20px; max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }
  .prqCard               { background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-lg); padding: 32px; }
  .prqHeader             { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding-bottom: 28px; border-bottom: 1px solid var(--b1); margin-bottom: 28px; }
  .prqCheckRing          { width: 60px; height: 60px; border-radius: 50%; background: rgba(200,241,53,0.08); border: 1.5px solid rgba(200,241,53,0.25); display: flex; align-items: center; justify-content: center; color: var(--lime); }
  .prqTitle              { font-size: 22px; font-weight: 600; color: var(--text, #f0f0f0); letter-spacing: -0.3px; }
  .prqSub                { font-size: 13.5px; color: var(--muted, #888); line-height: 1.55; max-width: 420px; }
  .prqRefStrip           { display: flex; align-items: center; justify-content: space-between; background: var(--s2); border: 1px solid var(--b2); border-radius: var(--r-sm); padding: 14px 18px; margin-bottom: 24px; }
  .prqRefLabel           { font-size: 11px; color: var(--muted, #555); text-transform: uppercase; letter-spacing: 0.08em; }
  .prqRefCode            { font-size: 18px; font-weight: 700; color: var(--lime); font-family: var(--font-mono, monospace); letter-spacing: 0.04em; }
  .prqCopyBtn            { font-size: 11px; color: var(--muted, #666); background: var(--s3); border: 1px solid var(--b2); border-radius: 6px; padding: 4px 10px; cursor: pointer; }
  .prqSummaryRow         { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .prqSummaryItem        { background: var(--s2); border: 1px solid var(--b2); border-radius: var(--r-sm); padding: 14px; display: flex; flex-direction: column; gap: 4px; }
  .prqSummaryLabel       { font-size: 10.5px; color: var(--muted, #555); text-transform: uppercase; letter-spacing: 0.07em; }
  .prqSummaryValue       { font-size: 14px; font-weight: 600; color: var(--text, #d4d4d4); }
  .prqSummaryValueAccent { font-size: 14px; font-weight: 600; color: var(--lime); }
  .prqTimelineLabel      { font-size: 11px; color: var(--muted, #555); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .prqTimeline           { display: flex; align-items: flex-start; margin-bottom: 28px; }
  .prqStep               { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; gap: 8px; }
  .prqStep::before       { content: ''; position: absolute; top: 14px; left: calc(50% + 14px); right: calc(-50% + 14px); height: 1px; background: var(--b2); }
  .prqStep:last-child::before { display: none; }
  .prqStepDone::before   { background: rgba(200,241,53,0.25); }
  .prqDot                { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; position: relative; z-index: 1; flex-shrink: 0; }
  .prqDotDone            { background: rgba(200,241,53,0.12); border: 1.5px solid var(--lime); color: var(--lime); }
  .prqDotActive          { background: rgba(200,241,53,0.06); border: 1.5px solid rgba(200,241,53,0.4); color: var(--lime); box-shadow: 0 0 0 4px rgba(200,241,53,0.06); }
  .prqDotPending         { background: var(--s2); border: 1.5px solid var(--b2); color: var(--muted, #444); }
  .prqStepText           { text-align: center; font-size: 10.5px; color: var(--muted, #555); line-height: 1.35; max-width: 72px; }
  .prqStepTextDone       { color: #7a9a30; }
  .prqStepTextActive     { color: var(--lime); }
  .prqEftSection         { border: 1px solid var(--b2); border-radius: var(--r-md); overflow: hidden; }
  .prqEftHeader          { background: rgba(200,241,53,0.04); border-bottom: 1px solid var(--b2); padding: 14px 18px; display: flex; align-items: center; gap: 10px; }
  .prqEftBadge           { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--lime); background: rgba(200,241,53,0.1); border: 1px solid rgba(200,241,53,0.2); border-radius: 4px; padding: 2px 7px; }
  .prqEftBadgeDone       { color: var(--lime); background: rgba(200,241,53,0.15); border-color: rgba(200,241,53,0.3); }
  .prqEftTitle           { font-size: 13px; font-weight: 600; color: var(--text, #d4d4d4); }
  .prqEftBody            { padding: 18px; }
  .prqEftInfo            { font-size: 12.5px; color: var(--muted, #666); line-height: 1.55; margin-bottom: 16px; }
  .prqBankGrid           { background: var(--s2); border: 1px solid var(--b2); border-radius: var(--r-sm); padding: 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .prqBankLabel          { font-size: 10px; color: var(--muted, #555); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 2px; }
  .prqBankVal            { font-size: 13px; font-weight: 600; color: var(--text, #ccc); font-family: var(--font-mono, monospace); }
  .prqUploadZone         { border: 1.5px dashed var(--b2); border-radius: var(--r-sm); padding: 28px 20px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: border-color 0.2s; }
  .prqUploadZone:hover   { border-color: rgba(200,241,53,0.3); background: rgba(200,241,53,0.02); }
  .prqUploadZoneActive   { border-color: rgba(200,241,53,0.4); background: rgba(200,241,53,0.03); }
  .prqUploadIcon         { width: 36px; height: 36px; border-radius: 8px; background: var(--s2); border: 1px solid var(--b2); display: flex; align-items: center; justify-content: center; color: var(--muted, #555); margin-bottom: 4px; }
  .prqUploadBtn          { margin-top: 16px; width: 100%; padding: 12px; background: var(--lime); color: #0c0c0f; border: none; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 700; cursor: pointer; }
  .prqUploadBtnLoading   { opacity: 0.6; cursor: not-allowed; }
  .prqSkipLink           { display: block; text-align: center; margin-top: 10px; font-size: 12px; color: var(--muted, #444); cursor: pointer; }
  .prqFileCard           { border: 1.5px solid rgba(200,241,53,0.2); border-radius: var(--r-sm); background: rgba(200,241,53,0.03); padding: 16px; display: flex; align-items: center; gap: 12px; }
  .prqFileIcon           { width: 40px; height: 40px; background: rgba(200,241,53,0.08); border: 1px solid rgba(200,241,53,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--lime); flex-shrink: 0; }
  .prqFileName           { font-size: 13px; font-weight: 600; color: var(--text, #d4d4d4); }
  .prqFileSize           { font-size: 11.5px; color: var(--muted, #555); margin-top: 2px; }
  .prqNextCard           { background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-lg); padding: 24px; }
  .prqNextTitle          { font-size: 12px; color: var(--muted, #555); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .prqNextList           { display: flex; flex-direction: column; gap: 12px; }
  .prqNextItem           { display: flex; align-items: flex-start; gap: 12px; }
  .prqNextNum            { width: 22px; height: 22px; border-radius: 50%; background: var(--s2); border: 1px solid var(--b2); font-size: 10.5px; font-weight: 700; color: var(--muted, #555); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .prqNextText           { font-size: 13px; color: var(--muted, #777); line-height: 1.5; }
  @media (max-width: 480px) {
    .prqSummaryRow { grid-template-columns: 1fr 1fr; }
    .prqBankGrid   { grid-template-columns: 1fr; }
    .prqTimeline   { gap: 0; }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add apps/web/src/app/style/client/pages-misc.module.css
  git commit -m "feat(css): success screen styles for EFT verification"
  ```

---

## Task 9: Success Screen — React Component

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/project-request-page.tsx`

- [ ] **Step 1: Add `submittedProject` state (replace `submitted` boolean)**

  Find:
  ```ts
  const [submitted,     setSubmitted]     = useState(false);
  ```
  Replace with:
  ```ts
  const [submittedProject, setSubmittedProject] = useState<{
    id: string;
    referenceCode: string;
  } | null>(null);
  ```

- [ ] **Step 2: Add `proofUploaded` state for the upload flow**

  After the new `submittedProject` state line, add:
  ```ts
  const [proofUploaded,    setProofUploaded]    = useState(false);
  const [proofUploading,   setProofUploading]   = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);
  ```

- [ ] **Step 3: Update the submission handler**

  Find the `setSubmitted(true);` line (around line 1221). Replace it with:
  ```ts
  if (reqRes.data) {
    setSubmittedProject({
      id: reqRes.data.id,
      referenceCode: reqRes.data.referenceCode ?? `PRJ-${Date.now().toString().slice(-6)}`
    });
  }
  ```

- [ ] **Step 4: Update the success screen guard**

  Find:
  ```ts
  if (submitted) {
    const refCode = `PRJ-${Date.now().toString().slice(-6)}`;
  ```
  Replace with:
  ```ts
  if (submittedProject) {
    const refCode = submittedProject.referenceCode;
    const projectId = submittedProject.id;
    const isEft = payMethod === "EFT";
  ```

- [ ] **Step 5: Replace the success screen JSX**

  Remove all JSX inside the `if (submittedProject)` block and replace with the new layout. Use the CSS classes added in Task 8. The structure:

  ```tsx
  return (
    <div className={cx("prqSuccessShell")}>
      {/* Main card */}
      <div className={cx("prqCard")}>
        {/* Header */}
        <div className={cx("prqHeader")}>
          <div className={cx("prqCheckRing")}>
            <Ic n="check" sz={24} c="var(--lime)" />
          </div>
          <div className={cx("prqTitle")}>Request submitted!</div>
          <p className={cx("prqSub")}>
            {isEft
              ? "Your project request is in. Upload your proof of payment below to move it to the top of the queue."
              : "Your project request has been submitted. Your dedicated PM will reach out within 24 hours."}
          </p>
        </div>

        {/* Reference strip */}
        <div className={cx("prqRefStrip")}>
          <div>
            <div className={cx("prqRefLabel")}>Reference</div>
            <div className={cx("prqRefCode")}>{refCode}</div>
          </div>
          <button className={cx("prqCopyBtn")} onClick={() => navigator.clipboard.writeText(refCode)}>Copy</button>
        </div>

        {/* Summary row */}
        <div className={cx("prqSummaryRow")}>
          <div className={cx("prqSummaryItem")}>
            <span className={cx("prqSummaryLabel")}>Quote</span>
            <span className={cx("prqSummaryValue")}>{formatMoneyCents(quoteCents)}</span>
          </div>
          <div className={cx("prqSummaryItem")}>
            <span className={cx("prqSummaryLabel")}>Deposit</span>
            <span className={cx("prqSummaryValueAccent")}>{formatMoneyCents(depositCents)}</span>
          </div>
          <div className={cx("prqSummaryItem")}>
            <span className={cx("prqSummaryLabel")}>Method</span>
            <span className={cx("prqSummaryValue")}>{payMethod}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className={cx("prqTimelineLabel")}>Project status</div>
        <div className={cx("prqTimeline")}>
          {(isEft
            ? ["Request submitted", "Deposit verification", "Proposal review", "Project kickoff"]
            : ["Request submitted", "Proposal review", "Project kickoff"]
          ).map((label, i) => {
            const stepNum = i + 1;
            const activeStep = isEft ? (proofUploaded ? 3 : 2) : 2;
            const isDone = stepNum < activeStep;
            const isActive = stepNum === activeStep;
            return (
              <div key={label} className={cx("prqStep", isDone ? "prqStepDone" : "")}>
                <div className={cx("prqDot", isDone ? "prqDotDone" : isActive ? "prqDotActive" : "prqDotPending")}>
                  {isDone ? <Ic n="check" sz={12} c="var(--lime)" /> : stepNum}
                </div>
                <div className={cx("prqStepText", isDone ? "prqStepTextDone" : isActive ? "prqStepTextActive" : "")}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* EFT section — only for EFT payments */}
        {isEft && (
          <div className={cx("prqEftSection")}>
            <div className={cx("prqEftHeader")}>
              <span className={cx(proofUploaded ? "prqEftBadgeDone" : "prqEftBadge")}>
                {proofUploaded ? "✓ Uploaded" : "EFT"}
              </span>
              <span className={cx("prqEftTitle")}>
                {proofUploaded ? "Proof of payment received" : "Upload proof of payment"}
              </span>
            </div>
            <div className={cx("prqEftBody")}>
              {proofUploaded ? (
                <p className={cx("prqEftInfo")}>
                  We've received your proof of payment and notified our team. You'll get an email confirmation once it's verified — usually within 1 business day.
                </p>
              ) : (
                <>
                  <p className={cx("prqEftInfo")}>
                    Transfer your deposit of <strong>{formatMoneyCents(depositCents)}</strong> to the account below, then upload your bank confirmation PDF.
                  </p>
                  <div className={cx("prqBankGrid")}>
                    <div><div className={cx("prqBankLabel")}>Bank</div><div className={cx("prqBankVal")}>FNB</div></div>
                    <div><div className={cx("prqBankLabel")}>Account name</div><div className={cx("prqBankVal")}>Maphari Technologies</div></div>
                    <div><div className={cx("prqBankLabel")}>Account no.</div><div className={cx("prqBankVal")}>6271 004 8341</div></div>
                    <div><div className={cx("prqBankLabel")}>Reference</div><div className={cx("prqBankVal")}>{refCode}</div></div>
                  </div>
                  <label className={cx("prqUploadZone")}>
                    <input
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type !== "application/pdf") { setProofUploadError("Only PDF files are accepted."); return; }
                        if (file.size > 10 * 1024 * 1024) { setProofUploadError("File must be 10 MB or smaller."); return; }
                        setProofUploading(true);
                        setProofUploadError(null);
                        try {
                          const uploaded = await uploadPortalFileWithRefresh(session, file);
                          if (uploaded.nextSession) saveSession(uploaded.nextSession);
                          if (!uploaded.data) { setProofUploadError(uploaded.error?.message ?? "Upload failed."); return; }
                          const submitRes = await submitPortalEftProofWithRefresh(session, projectId, {
                            proofFileId: uploaded.data.id,
                            proofFileName: file.name
                          });
                          if (submitRes.nextSession) saveSession(submitRes.nextSession);
                          if (submitRes.error) { setProofUploadError(submitRes.error.message); return; }
                          setProofUploaded(true);
                        } finally {
                          setProofUploading(false);
                        }
                      }}
                    />
                    <div className={cx("prqUploadIcon")}><Ic n="upload" sz={18} c="var(--muted)" /></div>
                    <div>Drag your PDF here</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>or <span style={{ color: "var(--lime)" }}>browse to upload</span> · PDF only · max 10 MB</div>
                  </label>
                  {proofUploadError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{proofUploadError}</p>}
                  <button
                    className={cx("prqUploadBtn", proofUploading ? "prqUploadBtnLoading" : "")}
                    disabled={proofUploading}
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  >
                    {proofUploading ? "Uploading…" : "Upload proof of payment"}
                  </button>
                  <a className={cx("prqSkipLink")} onClick={() => nav.navigateTo("my-projects")}>
                    I'll upload this later from my dashboard →
                  </a>
                  {/* Note: nav.navigateTo is the same navigation helper used elsewhere in this
                      component. Check the existing nav prop/hook name (likely `useNav` or passed
                      as `nav` prop) and use the correct call to navigate to the projects page. */}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className={cx("prqNextCard")}>
        <div className={cx("prqNextTitle")}>What happens next</div>
        <div className={cx("prqNextList")}>
          {(isEft
            ? [
                "Our team reviews your proof of payment within 1 business day",
                "Once confirmed, your dedicated project lead will schedule a kickoff call",
                `Track your project in your dashboard — reference ${refCode}`
              ]
            : [
                "Your dedicated PM will reach out within 24 hours with a tailored proposal",
                "Once approved, your project kickoff is scheduled",
                `Track your project in your dashboard — reference ${refCode}`
              ]
          ).map((text, i) => (
            <div key={i} className={cx("prqNextItem")}>
              <div className={cx("prqNextNum")}>{i + 1}</div>
              <div className={cx("prqNextText")}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  ```

  Add `submitPortalEftProofWithRefresh` to the existing named import from `"../../../../lib/api/portal/projects"` at the top of the file. `uploadPortalFileWithRefresh` is already exported from the same file — add it to the same import block if not already present.

- [ ] **Step 6: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
  ```

  Fix any type errors. Common issues: `formatMoneyCents` import, `Ic` icon names, `payMethod` state type.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/project-request-page.tsx
  git commit -m "feat(portal): rewrite success screen with real ref code + EFT upload"
  ```

---

## Task 10: Admin — EFT Verification Panel

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/request-inbox-page.tsx`

- [ ] **Step 1: Add import for EFT API functions**

  At the top of `request-inbox-page.tsx`, add:
  ```ts
  import {
    loadAdminEftPendingWithRefresh,
    verifyAdminEftDepositWithRefresh,
    type AdminEftPendingItem
  } from "../../../../lib/api/admin/projects";
  ```

- [ ] **Step 2: Add EFT state to the component**

  Inside the component, add:
  ```ts
  const [eftItems, setEftItems]           = useState<AdminEftPendingItem[]>([]);
  const [eftLoading, setEftLoading]       = useState(true);
  const [expandedEftId, setExpandedEftId] = useState<string | null>(null);
  const [eftNotes, setEftNotes]           = useState<Record<string, string>>({});
  const [eftRejReason, setEftRejReason]   = useState<Record<string, string>>({});
  const [eftFilter, setEftFilter]         = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");
  ```

- [ ] **Step 3: Load EFT items on mount**

  In the existing `useEffect` that loads page data, add a parallel EFT load:
  ```ts
  const eftRes = await loadAdminEftPendingWithRefresh(session);
  if (eftRes.nextSession) saveSession(eftRes.nextSession);
  setEftItems(eftRes.data ?? []);
  setEftLoading(false);
  ```

- [ ] **Step 4: Add `handleEftVerify` function**

  ```ts
  async function handleEftVerify(verificationId: string, action: "VERIFY" | "REJECT") {
    const rejectionReason = eftRejReason[verificationId]?.trim();
    if (action === "REJECT" && !rejectionReason) {
      alert("Please enter a rejection reason.");
      return;
    }
    const res = await verifyAdminEftDepositWithRefresh(session, verificationId, { action, rejectionReason });
    if (res.nextSession) saveSession(res.nextSession);
    if (res.error) { alert(res.error.message); return; }
    setEftItems(prev => prev.map(item =>
      item.id === verificationId
        ? { ...item, status: action === "VERIFY" ? "VERIFIED" : "REJECTED", rejectionReason: rejectionReason ?? null }
        : item
    ));
    setExpandedEftId(null);
  }
  ```

- [ ] **Step 5: Add EFT panel JSX above the existing project requests list**

  Add a new section in the render output. Use existing admin CSS classes (`cx("card")`, `cx("sectionTitle")` etc.) from the page's style imports. The panel:
  - Header: "EFT Deposit Verification" + pending count badge + filter pills (All / Pending / Verified / Rejected)
  - Loading state: simple spinner
  - Empty state: "No EFT submissions yet"
  - List rows: client name + reference pill + deposit amount + filename + age badge + chevron
  - Expanded row: proof file link, request summary (deposit amount + submitted date), notes textarea (internal), reject reason input (only if rejecting), Verify / Reject buttons (disabled for STAFF role)

  ```tsx
  {/* ── EFT Verification Panel ──────────────────────────────────────────────── */}
  <section style={{ marginBottom: 32 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      {/* Use inline style — "sectionTitle" is a client CSS class, not available in admin */}
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>EFT Deposit Verification</h2>
      {eftItems.filter(i => i.status === "PENDING").length > 0 && (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
          {eftItems.filter(i => i.status === "PENDING").length} pending
        </span>
      )}
    </div>
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {(["ALL", "PENDING", "VERIFIED", "REJECTED"] as const).map(f => (
        <button key={f} onClick={() => setEftFilter(f)}
          style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
            background: eftFilter === f ? "var(--accent)" : "var(--surface)",
            color: eftFilter === f ? "#0c0c0f" : "var(--muted)",
            border: eftFilter === f ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
          {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
    <div className={cx("card")} style={{ padding: 0, overflow: "hidden" }}>
      {eftLoading ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
      ) : eftItems.filter(i => eftFilter === "ALL" || i.status === eftFilter).length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
          <div style={{ fontWeight: 600 }}>No {eftFilter === "ALL" ? "" : eftFilter.toLowerCase() + " "}EFT submissions</div>
        </div>
      ) : (
        eftItems
          .filter(i => eftFilter === "ALL" || i.status === eftFilter)
          .map(item => {
            const isExpanded = expandedEftId === item.id;
            const isVerified = item.status === "VERIFIED";
            const isRejected = item.status === "REJECTED";
            const ageMs = Date.now() - new Date(item.createdAt).getTime();
            const ageHrs = Math.floor(ageMs / 3_600_000);
            return (
              <div key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                {/* Row */}
                <div onClick={() => setExpandedEftId(isExpanded ? null : item.id)}
                  style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fbbf24", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.clientName}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#8b6fff", background: "rgba(139,111,255,0.08)", border: "1px solid rgba(139,111,255,0.2)", borderRadius: 4, padding: "2px 7px" }}>
                        {item.referenceCode ?? "—"}
                      </span>
                      {(isVerified || isRejected) && (
                        <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, border: `1px solid ${isVerified ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, color: isVerified ? "#4ade80" : "#f87171", background: isVerified ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
                          {isVerified ? "Verified" : "Rejected"}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Deposit: <span style={{ color: "var(--text)" }}>{formatBudget(item.depositCents)}</span></span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Proof: <span style={{ color: "var(--text)" }}>{item.proofFileName}</span></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ageHrs < 24 && item.status === "PENDING" && (
                      <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 4, padding: "2px 8px" }}>
                        {ageHrs}h ago
                      </span>
                    )}
                    <span style={{ color: "var(--muted)", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--border)" }}>
                    {isVerified && (
                      <div style={{ marginTop: 16, marginBottom: 12, padding: "12px 16px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8, color: "#4ade80", fontSize: 12.5 }}>
                        ✓ Deposit verified — client notified by email
                      </div>
                    )}
                    {isRejected && (
                      <div style={{ marginTop: 16, marginBottom: 12, padding: "12px 16px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, color: "#f87171", fontSize: 12.5 }}>
                        ✕ Rejected — {item.rejectionReason}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: isVerified || isRejected ? 0 : 16, marginBottom: 16 }}>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Proof file</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.proofFileName}</div>
                            <a href={`/api/v1/files/${item.proofFileId}/download-url`} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11.5, color: "#8b6fff", cursor: "pointer" }}>↗ View proof document</a>
                          </div>
                        </div>
                      </div>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Request summary</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>Deposit</span>
                            {/* Admin uses --accent (purple), not --lime */}
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>{formatBudget(item.depositCents)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>Submitted</span>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{formatDate(item.createdAt)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>Status</span>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fbbf24" }}>{item.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isVerified && !isRejected && (
                      <>
                        <textarea
                          placeholder="Optional internal note (not shown to client)"
                          value={eftNotes[item.id] ?? ""}
                          onChange={e => setEftNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                          rows={2}
                          style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text)", resize: "none", fontFamily: "inherit", marginBottom: 8, outline: "none", boxSizing: "border-box" }}
                        />
                        <textarea
                          placeholder="Rejection reason (required if rejecting — shown to client)"
                          value={eftRejReason[item.id] ?? ""}
                          onChange={e => setEftRejReason(prev => ({ ...prev, [item.id]: e.target.value }))}
                          rows={2}
                          style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text)", resize: "none", fontFamily: "inherit", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          {/* STAFF can see but not act — only ADMIN may verify/reject (spec §7) */}
                          <button
                            disabled={session?.user.role !== "ADMIN"}
                            onClick={() => handleEftVerify(item.id, "VERIFY")}
                            style={{ flex: 1, padding: 10, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: session?.user.role !== "ADMIN" ? "not-allowed" : "pointer", opacity: session?.user.role !== "ADMIN" ? 0.4 : 1 }}>
                            ✓ Verify deposit
                          </button>
                          <button
                            disabled={session?.user.role !== "ADMIN"}
                            onClick={() => handleEftVerify(item.id, "REJECT")}
                            style={{ flex: 1, padding: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, fontWeight: 600, cursor: session?.user.role !== "ADMIN" ? "not-allowed" : "pointer", opacity: session?.user.role !== "ADMIN" ? 0.4 : 1 }}>
                            ✕ Reject — request new proof
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
      )}
    </div>
  </section>
  ```

- [ ] **Step 6: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/pages/request-inbox-page.tsx
  git commit -m "feat(admin): EFT deposit verification panel in request inbox"
  ```

---

## Task 11: End-to-End Smoke Test

- [ ] **Step 1: Start all services**

  ```bash
  cd /Users/maphari/Projects/maphari_technologies
  # Terminal 1: core service
  pnpm --filter @maphari/core dev
  # Terminal 2: gateway
  pnpm --filter @maphari/gateway dev
  # Terminal 3: web
  pnpm --filter @maphari/web dev
  ```

- [ ] **Step 2: Submit a test EFT project request**

  1. Log in as a CLIENT
  2. Navigate to project request flow
  3. Complete all steps with EFT as payment method
  4. Submit — confirm `POST /projects/requests` returns 201 with `referenceCode` field
  5. Confirm success screen shows real `PRJ-XXXXXX` (not timestamp-based)
  6. Confirm EFT section appears with bank details and upload zone

- [ ] **Step 3: Upload proof of payment**

  1. Select a PDF file on the success screen
  2. Confirm `POST /files/upload-url` → PUT → `POST /files/confirm-upload` → `PATCH /projects/:id/eft-proof` all return 2xx
  3. Confirm timeline advances to step 3 and file card replaces upload zone

- [ ] **Step 4: Admin verifies**

  1. Log in as ADMIN
  2. Navigate to Request Inbox page
  3. Confirm EFT panel shows the submitted item with amber "pending" badge
  4. Expand row — confirm proof file link, deposit amount, dates visible
  5. Click "Verify deposit" — confirm row updates to green "Verified"
  6. Confirm `POST /admin/eft-pending/:id/verify` returns 200

- [ ] **Step 5: Final TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  pnpm --filter @maphari/core exec tsc --noEmit
  pnpm --filter @maphari/gateway exec tsc --noEmit
  ```

  All must pass with zero errors.

- [ ] **Step 6: Final commit**

  ```bash
  git add -A
  git commit -m "feat: EFT deposit verification + success screen — complete"
  ```
