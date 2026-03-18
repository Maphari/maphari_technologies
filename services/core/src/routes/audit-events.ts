// ════════════════════════════════════════════════════════════════════════════
// audit-events.ts — Audit event routes (read-only, no cache, ADMIN only)
// Service : core  |  Cache TTL: none (always fresh)
// Scope   : ADMIN only; immutable — no POST/PATCH/DELETE
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { AuditEvent } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type AuditEventDto = {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

function toDto(e: AuditEvent): AuditEventDto {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerAuditEventRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /audit-events ───────────────────────────────────────────────────────
  // ADMIN only. Supports optional filters: actorId, resourceType, resourceId.
  // No caching — audit log must always be real-time.
  app.get("/audit-events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const query = request.query as {
      actorId?:      string;
      resourceType?: string;
      resourceId?:   string;
      limit?:        string;
    };

    const take = Math.min(parseInt(query.limit ?? "100", 10), 500);

    try {
      const events = await prisma.auditEvent.findMany({
        where: {
          ...(query.actorId      ? { actorId:      query.actorId      } : {}),
          ...(query.resourceType ? { resourceType: query.resourceType } : {}),
          ...(query.resourceId   ? { resourceId:   query.resourceId   } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
      });

      return {
        success: true,
        data:    events.map(toDto),
        meta:    { requestId: scope.requestId, count: events.length, limit: take },
      } as ApiResponse<AuditEventDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "AUDIT_FETCH_FAILED", message: "Unable to fetch audit events" } } as ApiResponse;
    }
  });
}
