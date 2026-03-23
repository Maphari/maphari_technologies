// ════════════════════════════════════════════════════════════════════════════
// standup.ts — Daily Standup Entry routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN/STAFF full access; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerStandupRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /standup — list by date ────────────────────────────────────────────
  app.get("/standup", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const query = request.query as { date?: string };
    const date  = query.date ?? new Date().toISOString().split("T")[0]!;

    const data = await withCache(CacheKeys.standup(date), 60, () =>
      prisma.standupEntry.findMany({
        where: { date },
        orderBy: { createdAt: "asc" },
        include: { staff: { select: { name: true, avatarInitials: true, avatarColor: true, role: true } } }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /standup/feed — recent entries across all staff ───────────────────
  app.get("/standup/feed", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const data = await withCache(CacheKeys.standupFeed(), 60, () =>
      prisma.standupEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { staff: { select: { name: true, avatarInitials: true, avatarColor: true, role: true } } }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /standup/missing-today — who hasn't submitted today ───────────────
  app.get("/standup/missing-today", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const today = new Date().toISOString().split("T")[0]!;
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay   = new Date(today + "T23:59:59.999Z");

    const [submitted, activeStaff] = await Promise.all([
      prisma.standupEntry.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        select: { staffId: true },
      }),
      prisma.staffProfile.findMany({
        where: { isActive: true },
        select: { id: true, name: true, avatarInitials: true, avatarColor: true },
      }),
    ]);

    const submittedIds = new Set(submitted.map((s) => s.staffId));
    const missing = activeStaff.filter((s) => !submittedIds.has(s.id));

    const result = {
      today,
      submittedCount: submitted.length,
      missingCount: missing.length,
      missing,
    };
    return { success: true, data: result, meta: { requestId: scope.requestId } } as ApiResponse<typeof result>;
  });

  // ── POST /standup ──────────────────────────────────────────────────────────
  app.post("/standup", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot post standup entries." } } as ApiResponse);
    }

    const body = request.body as {
      staffId?: string;
      date?: string;
      yesterday: string;
      today: string;
      blockers?: string;
      projectId?: string;
    };

    // Resolve staffId
    let staffId = body.staffId;
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile) {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found." } } as ApiResponse);
      }
      staffId = ownProfile.id;
    }

    if (!staffId) {
      return reply.code(400).send({ success: false, error: { code: "BAD_REQUEST", message: "staffId is required." } } as ApiResponse);
    }

    const date = body.date ?? new Date().toISOString().split("T")[0]!;

    const entry = await prisma.standupEntry.create({
      data: {
        staffId,
        date,
        yesterday: body.yesterday,
        today:     body.today,
        blockers:  body.blockers  ?? null,
        projectId: body.projectId ?? null,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.standup(date)),
      cache.delete(CacheKeys.standupFeed()),
    ]);

    return reply.code(201).send({ success: true, data: entry, meta: { requestId: scope.requestId } } as ApiResponse<typeof entry>);
  });
}
