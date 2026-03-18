// ════════════════════════════════════════════════════════════════════════════
// handovers.ts — Handover record routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF own-project scope; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { HandoverRecord } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type HandoverDto = {
  id: string;
  fromStaffName: string | null;
  toStaffName: string | null;
  projectId: string | null;
  clientId: string | null;
  status: string;
  notes: string | null;
  transferDate: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDto(h: HandoverRecord): HandoverDto {
  return {
    ...h,
    transferDate: h.transferDate?.toISOString() ?? null,
    createdAt:    h.createdAt.toISOString(),
    updatedAt:    h.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerHandoverRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /handovers ──────────────────────────────────────────────────────────
  app.get("/handovers", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const cacheScope = scope.role === "ADMIN" ? "admin" : `staff:${scope.userId ?? "unknown"}`;
    const query = request.query as { projectId?: string; clientId?: string };

    try {
      const data = await withCache(CacheKeys.handovers(cacheScope), 60, () =>
        prisma.handoverRecord.findMany({
          where: {
            ...(query.projectId ? { projectId: query.projectId } : {}),
            ...(query.clientId  ? { clientId:  query.clientId  } : {}),
          },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<HandoverDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "HANDOVERS_FETCH_FAILED", message: "Unable to fetch handovers" } } as ApiResponse;
    }
  });

  // ── POST /handovers ─────────────────────────────────────────────────────────
  app.post("/handovers", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const body = request.body as {
      fromStaffName?: string;
      toStaffName?: string;
      projectId?: string;
      clientId?: string;
      notes?: string;
      transferDate?: string;
    };

    try {
      const handover = await prisma.handoverRecord.create({
        data: {
          fromStaffName: body.fromStaffName ?? null,
          toStaffName:   body.toStaffName   ?? null,
          projectId:     body.projectId     ?? null,
          clientId:      body.clientId      ?? null,
          notes:         body.notes         ?? null,
          transferDate:  body.transferDate ? new Date(body.transferDate) : null,
          status:        "PENDING",
        },
      });

      // Invalidate caches
      await Promise.all([
        cache.delete(CacheKeys.handovers("admin")),
        cache.delete(CacheKeys.handovers(`staff:${scope.userId ?? "unknown"}`)),
      ]);

      reply.status(201);
      return { success: true, data: toDto(handover) } as ApiResponse<HandoverDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "HANDOVER_CREATE_FAILED", message: "Unable to create handover" } } as ApiResponse;
    }
  });

  // ── PATCH /handovers/:id ────────────────────────────────────────────────────
  app.patch("/handovers/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      status: string;
      notes: string;
      toStaffName: string;
      transferDate: string;
    }>;

    try {
      const data: Record<string, unknown> = {};
      if (body.status)       data.status       = body.status;
      if (body.notes)        data.notes        = body.notes;
      if (body.toStaffName)  data.toStaffName  = body.toStaffName;
      if (body.transferDate) data.transferDate = new Date(body.transferDate);

      const handover = await prisma.handoverRecord.update({ where: { id }, data });

      await Promise.all([
        cache.delete(CacheKeys.handovers("admin")),
        cache.delete(CacheKeys.handovers(`staff:${scope.userId ?? "unknown"}`)),
      ]);

      return { success: true, data: toDto(handover) } as ApiResponse<HandoverDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "HANDOVER_UPDATE_FAILED", message: "Unable to update handover" } } as ApiResponse;
    }
  });
}
