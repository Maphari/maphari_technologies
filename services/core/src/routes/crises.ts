// ════════════════════════════════════════════════════════════════════════════
// crises.ts — Crisis Command routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN only (full CRUD)
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

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

      const data = await withCache(cacheKey, 60, () =>
        prisma.crisis.findMany({
          where: query.status ? { status: query.status.toUpperCase() } : undefined,
          orderBy: { createdAt: "desc" }
        })
      );
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
      await cache.delete(CacheKeys.crises());
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
          ...(body.resolvedAt  !== undefined && { resolvedAt:  new Date(body.resolvedAt) })
        }
      });
      await cache.delete(CacheKeys.crises());
      return { success: true, data: crisis } as ApiResponse<typeof crisis>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CRISIS_UPDATE_FAILED", message: "Unable to update crisis." } } as ApiResponse;
    }
  });
}
