// ════════════════════════════════════════════════════════════════════════════
// crises.ts — Crisis Command routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN only (full CRUD)
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { Prisma } from "@prisma/client";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const CRISIS_STATUSES = ["ACTIVE", "MONITORING", "RESOLVED"] as const;

async function invalidateCrisisCache(): Promise<void> {
  await cache.delete(CacheKeys.crises());
  for (const s of CRISIS_STATUSES) {
    await cache.delete(`${CacheKeys.crises()}:${s}`);
  }
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerCrisisRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /crises — list all crises (ADMIN only) ────────────────────────────
  app.get("/crises", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can view crises." } } as ApiResponse;
    }

    const query = request.query as { status?: string };

    try {
      const cacheKey = query.status
        ? `${CacheKeys.crises()}:${query.status}`
        : CacheKeys.crises();

      const rawCrises = await withCache(cacheKey, 60, () =>
        prisma.crisis.findMany({
          where: query.status ? { status: query.status.toUpperCase() } : undefined,
          orderBy: { createdAt: "desc" }
        })
      );

      // Fetch client names separately (Crisis has no Prisma relation to Client)
      const clientIds = [...new Set(rawCrises.map((c) => c.clientId).filter((id): id is string => id !== null))];
      const clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const clients = await prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true }
        });
        for (const cl of clients) clientMap.set(cl.id, cl.name);
      }

      const data = rawCrises.map((c) => ({
        ...c,
        clientName: c.clientId ? (clientMap.get(c.clientId) ?? null) : null
      }));

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CRISES_FETCH_FAILED", message: "Unable to fetch crises." } } as ApiResponse;
    }
  });

  // ── POST /crises — create a crisis (ADMIN only) ───────────────────────────
  app.post("/crises", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can create crises." } } as ApiResponse;
    }

    const body = request.body as {
      title: string;
      severity?: string;
      status?: string;
      description?: string;
      ownerId?: string;
      clientId?: string;
    };

    if (!body.title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "title is required." } } as ApiResponse;
    }

    try {
      const crisis = await prisma.crisis.create({
        data: {
          title:       body.title,
          severity:    body.severity?.toUpperCase() ?? "MEDIUM",
          status:      body.status?.toUpperCase()   ?? "ACTIVE",
          description: body.description ?? null,
          ownerId:     body.ownerId     ?? null,
          clientId:    body.clientId    ?? null
        }
      });
      await invalidateCrisisCache();
      reply.status(201);
      return { success: true, data: crisis } as ApiResponse<typeof crisis>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CRISIS_CREATE_FAILED", message: "Unable to create crisis." } } as ApiResponse;
    }
  });

  // ── PATCH /crises/:id — update a crisis (ADMIN only) ─────────────────────
  app.patch("/crises/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can update crises." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      title?:       string;
      severity?:    string;
      status?:      string;
      description?: string;
      ownerId?:     string;
      clientId?:    string;
      resolvedAt?:  string;
    };

    // Issue 4: validate resolvedAt before constructing a Date
    let resolvedAtDate: Date | undefined;
    if (body.resolvedAt !== undefined) {
      const d = new Date(body.resolvedAt);
      if (isNaN(d.getTime())) {
        return reply.status(400).send({ error: "INVALID_DATE_FORMAT" });
      }
      resolvedAtDate = d;
    }

    try {
      const crisis = await prisma.crisis.update({
        where: { id },
        data: {
          ...(body.title       !== undefined && { title:       body.title }),
          ...(body.severity    !== undefined && { severity:    body.severity.toUpperCase() }),
          ...(body.status      !== undefined && { status:      body.status.toUpperCase() }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.ownerId     !== undefined && { ownerId:     body.ownerId }),
          ...(body.clientId    !== undefined && { clientId:    body.clientId }),
          ...(resolvedAtDate   !== undefined && { resolvedAt:  resolvedAtDate })
        }
      });
      await invalidateCrisisCache();
      return { success: true, data: crisis } as ApiResponse<typeof crisis>;
    } catch (error) {
      // Issue 1: return 404 when Prisma can't find the record
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.status(404).send({ error: "CRISIS_NOT_FOUND" });
      }
      request.log.error(error);
      return { success: false, error: { code: "CRISIS_UPDATE_FAILED", message: "Unable to update crisis." } } as ApiResponse;
    }
  });

  // ── GET /crises/escalation-chain ────────────────────────────────────────────
  app.get("/crises/escalation-chain", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can view the escalation chain." } } as ApiResponse);
    }

    await seedEscalationAndPlaybooks();

    const levels = await prisma.crisisEscalationLevel.findMany({
      where: { workspaceId: "default" },
      orderBy: { level: "asc" }
    });

    return { success: true, data: levels, meta: { requestId: scope.requestId } } as ApiResponse<typeof levels>;
  });

  // ── PUT /crises/escalation-chain/:level ────────────────────────────────────
  app.put("/crises/escalation-chain/:level", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update escalation chain." } } as ApiResponse);
    }

    const levelNum = parseInt((request.params as { level: string }).level, 10);
    const body = request.body as { role?: string; personLabel?: string; triggerDesc?: string; colorToken?: string };

    const record = await prisma.crisisEscalationLevel.upsert({
      where: { workspaceId_level: { workspaceId: "default", level: levelNum } },
      update: {
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.personLabel !== undefined ? { personLabel: body.personLabel } : {}),
        ...(body.triggerDesc !== undefined ? { triggerDesc: body.triggerDesc } : {}),
        ...(body.colorToken !== undefined ? { colorToken: body.colorToken } : {}),
      },
      create: {
        workspaceId: "default",
        level: levelNum,
        role: body.role ?? "",
        personLabel: body.personLabel ?? "",
        triggerDesc: body.triggerDesc ?? "",
        colorToken: body.colorToken ?? "var(--accent)",
      }
    });

    return { success: true, data: record, meta: { requestId: scope.requestId } } as ApiResponse<typeof record>;
  });

  // ── GET /crises/playbooks ───────────────────────────────────────────────────
  app.get("/crises/playbooks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can view playbooks." } } as ApiResponse);
    }

    await seedEscalationAndPlaybooks();

    const playbooks = await prisma.crisisPlaybook.findMany({
      where: { workspaceId: "default" },
      include: { steps: { orderBy: { order: "asc" } } },
      orderBy: { name: "asc" }
    });

    return { success: true, data: playbooks, meta: { requestId: scope.requestId } } as ApiResponse<typeof playbooks>;
  });

  // ── POST /crises/playbooks ──────────────────────────────────────────────────
  app.post("/crises/playbooks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can create playbooks." } } as ApiResponse);
    }

    const body = request.body as { name: string; steps?: string[] };
    if (!body.name) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "name is required." } } as ApiResponse);
    }

    const playbook = await prisma.crisisPlaybook.create({
      data: {
        workspaceId: "default",
        name: body.name,
        steps: {
          create: (body.steps ?? []).map((action, i) => ({ order: i, action }))
        }
      },
      include: { steps: { orderBy: { order: "asc" } } }
    });

    return { success: true, data: playbook, meta: { requestId: scope.requestId } } as ApiResponse<typeof playbook>;
  });

  // ── PATCH /crises/playbooks/:id ─────────────────────────────────────────────
  app.patch("/crises/playbooks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update playbooks." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; steps?: string[] };

    try {
      // Replace steps if provided
      if (body.steps !== undefined) {
        await prisma.playbookStep.deleteMany({ where: { playbookId: id } });
        await prisma.playbookStep.createMany({
          data: body.steps.map((action, i) => ({ playbookId: id, order: i, action }))
        });
      }

      const playbook = await prisma.crisisPlaybook.update({
        where: { id },
        data: { ...(body.name !== undefined ? { name: body.name } : {}) },
        include: { steps: { orderBy: { order: "asc" } } }
      });

      return { success: true, data: playbook, meta: { requestId: scope.requestId } } as ApiResponse<typeof playbook>;
    } catch {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Playbook not found." } } as ApiResponse);
    }
  });
}

// ── Seed default escalation chain and playbooks if tables are empty ───────────
async function seedEscalationAndPlaybooks(): Promise<void> {
  const existingLevels = await prisma.crisisEscalationLevel.count({ where: { workspaceId: "default" } });
  if (existingLevels === 0) {
    const defaults = [
      { level: 1, role: "Account Manager", personLabel: "Assigned AM", triggerDesc: "Client unresponsive 3+ days", colorToken: "var(--accent)" },
      { level: 2, role: "Operations Admin", personLabel: "Operations Admin", triggerDesc: "AM escalation or invoice 7+ days overdue", colorToken: "var(--blue)" },
      { level: 3, role: "Super Admin / Owner", personLabel: "Owner / Founder", triggerDesc: "Churn risk confirmed or legal threat", colorToken: "var(--red)" },
    ];
    for (const d of defaults) {
      await prisma.crisisEscalationLevel.create({ data: { workspaceId: "default", ...d } });
    }
  }

  const existingPlaybooks = await prisma.crisisPlaybook.count({ where: { workspaceId: "default" } });
  if (existingPlaybooks === 0) {
    const defaults = [
      { name: "Silent Client", steps: ["Send personal message from AM", "Follow-up with value recap", "Offer check-in call", "Escalate if 5 days silent"] },
      { name: "Invoice Dispute", steps: ["Send itemised breakdown", "Offer to schedule review call", "Offer flexible payment plan", "Escalate to admin if unresolved in 7 days"] },
      { name: "Scope Conflict", steps: ["Acknowledge the issue directly", "Share original scope document", "Propose change order", "Offer project reset session"] },
      { name: "Quality Complaint", steps: ["Apologise without admitting full fault", "Schedule quality review", "Offer revision at no cost", "Send satisfaction check 72h later"] },
    ];
    for (const pb of defaults) {
      await prisma.crisisPlaybook.create({
        data: {
          workspaceId: "default",
          name: pb.name,
          steps: { create: pb.steps.map((action, i) => ({ order: i, action })) }
        }
      });
    }
  }
}
