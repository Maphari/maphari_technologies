// ════════════════════════════════════════════════════════════════════════════
// recurring-tasks.ts — Recurring Task routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : STAFF read/write-own; ADMIN full access; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";
import { prisma } from "../lib/prisma.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDto(t: {
  id: string;
  staffId: string;
  clientId: string | null;
  title: string;
  frequency: string;
  dayOfWeek: string | null;
  estimateHours: number;
  category: string;
  isActive: boolean;
  lastDoneAt: Date | null;
  nextDueAt: Date | null;
  streak: number;
  totalDone: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:            t.id,
    staffId:       t.staffId,
    clientId:      t.clientId,
    title:         t.title,
    frequency:     t.frequency,
    dayOfWeek:     t.dayOfWeek,
    estimateHours: t.estimateHours,
    category:      t.category,
    isActive:      t.isActive,
    lastDoneAt:    t.lastDoneAt?.toISOString() ?? null,
    nextDueAt:     t.nextDueAt?.toISOString() ?? null,
    streak:        t.streak,
    totalDone:     t.totalDone,
    createdAt:     t.createdAt.toISOString(),
    updatedAt:     t.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerRecurringTaskRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /recurring-tasks ──────────────────────────────────────────────────
  // STAFF: own tasks only. ADMIN: all tasks (optionally filter by ?staffId=)
  app.get("/recurring-tasks", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const query = request.query as { staffId?: string };

    const isAdminAll = scope.role === "ADMIN" && !query.staffId;
    const effectiveStaffId = scope.role === "ADMIN"
      ? (query.staffId ?? "")
      : (scope.userId ?? "");

    const cacheKey = isAdminAll
      ? CacheKeys.recurringTaskAll()
      : CacheKeys.recurringTasks(effectiveStaffId);

    const data = await withCache(cacheKey, 60, async () => {
      const rows = await prisma.recurringTask.findMany({
        where: isAdminAll ? undefined : { staffId: effectiveStaffId },
        orderBy: [{ nextDueAt: "asc" }, { createdAt: "desc" }],
      });
      return rows.map(toDto);
    });

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /recurring-tasks ─────────────────────────────────────────────────
  app.post("/recurring-tasks", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const body = request.body as {
      title?: string;
      clientId?: string | null;
      frequency?: string;
      dayOfWeek?: string | null;
      estimateHours?: number;
      category?: string;
      isActive?: boolean;
    };

    if (!body.title?.trim()) {
      return reply.code(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "title is required." }
      } as ApiResponse);
    }

    const staffId = scope.userId ?? "";

    const created = await prisma.recurringTask.create({
      data: {
        staffId,
        clientId:      body.clientId ?? null,
        title:         body.title.trim(),
        frequency:     body.frequency ?? "Weekly",
        dayOfWeek:     body.dayOfWeek ?? null,
        estimateHours: body.estimateHours ?? 0.5,
        category:      body.category ?? "Admin",
        isActive:      body.isActive !== undefined ? body.isActive : true,
        nextDueAt:     new Date(Date.now() + 7 * 86_400_000),
      },
    });

    await cache.delete(CacheKeys.recurringTasks(staffId));
    await cache.delete(CacheKeys.recurringTaskAll());

    return reply.code(201).send({
      success: true,
      data: toDto(created),
      meta: { requestId: scope.requestId }
    } as ApiResponse<ReturnType<typeof toDto>>);
  });

  // ── PATCH /recurring-tasks/:id ────────────────────────────────────────────
  app.patch("/recurring-tasks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      title?: string;
      clientId?: string | null;
      frequency?: string;
      dayOfWeek?: string | null;
      estimateHours?: number;
      category?: string;
      isActive?: boolean;
      lastDoneAt?: string | null;
      nextDueAt?: string | null;
      streak?: number;
      totalDone?: number;
    };

    const staffId = scope.userId ?? "";

    // Verify ownership for STAFF; ADMIN can touch any
    const existing = await prisma.recurringTask.findFirst({
      where: scope.role === "ADMIN" ? { id } : { id, staffId },
    });

    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Recurring task not found." }
      } as ApiResponse);
    }

    const updated = await prisma.recurringTask.update({
      where: { id },
      data: {
        ...(body.title         !== undefined && { title:         body.title.trim() }),
        ...(body.clientId      !== undefined && { clientId:      body.clientId }),
        ...(body.frequency     !== undefined && { frequency:     body.frequency }),
        ...(body.dayOfWeek     !== undefined && { dayOfWeek:     body.dayOfWeek }),
        ...(body.estimateHours !== undefined && { estimateHours: body.estimateHours }),
        ...(body.category      !== undefined && { category:      body.category }),
        ...(body.isActive      !== undefined && { isActive:      body.isActive }),
        ...(body.lastDoneAt    !== undefined && { lastDoneAt:    body.lastDoneAt ? new Date(body.lastDoneAt) : null }),
        ...(body.nextDueAt     !== undefined && { nextDueAt:     body.nextDueAt  ? new Date(body.nextDueAt)  : null }),
        ...(body.streak        !== undefined && { streak:        body.streak }),
        ...(body.totalDone     !== undefined && { totalDone:     body.totalDone }),
      },
    });

    await cache.delete(CacheKeys.recurringTasks(existing.staffId));
    await cache.delete(CacheKeys.recurringTaskAll());

    return {
      success: true,
      data: toDto(updated),
      meta: { requestId: scope.requestId }
    } as ApiResponse<ReturnType<typeof toDto>>;
  });

  // ── DELETE /recurring-tasks/:id ───────────────────────────────────────────
  app.delete("/recurring-tasks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const staffId = scope.userId ?? "";

    const existing = await prisma.recurringTask.findFirst({
      where: scope.role === "ADMIN" ? { id } : { id, staffId },
    });

    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Recurring task not found." }
      } as ApiResponse);
    }

    await prisma.recurringTask.delete({ where: { id } });

    await cache.delete(CacheKeys.recurringTasks(existing.staffId));
    await cache.delete(CacheKeys.recurringTaskAll());

    return {
      success: true,
      data: { id },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ id: string }>;
  });
}
