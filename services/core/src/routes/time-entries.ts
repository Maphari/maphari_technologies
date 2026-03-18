import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { createTimeEntrySchema, getTimeEntryQuerySchema } from "@maphari/contracts";
import { randomUUID } from "node:crypto";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { prisma } from "../lib/prisma.js";

export async function registerTimeEntryRoutes(app: FastifyInstance): Promise<void> {
  app.get("/time-entries", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getTimeEntryQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid time entry query", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const entries = await prisma.projectTimeEntry.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
          ...(parsed.data.from || parsed.data.to
            ? {
                createdAt: {
                  ...(parsed.data.from ? { gte: new Date(parsed.data.from) } : {}),
                  ...(parsed.data.to ? { lte: new Date(parsed.data.to) } : {})
                }
              }
            : {})
        },
        orderBy: { createdAt: "desc" },
        take: parsed.data.limit ?? 200
      });
      return { success: true, data: entries, meta: { requestId: scope.requestId } } as ApiResponse<typeof entries>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIME_ENTRIES_FETCH_FAILED", message: "Unable to load time entries" } } as ApiResponse;
    }
  });

  app.post("/time-entries", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createTimeEntrySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid time entry payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    if (!clientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_SCOPE_REQUIRED", message: "Client scope required" } } as ApiResponse;
    }

    try {
      const entry = await prisma.projectTimeEntry.create({
        data: {
          id: randomUUID(),
          projectId: parsed.data.projectId,
          clientId,
          staffUserId: scope.userId ?? null,
          staffName: parsed.data.staffName ?? null,
          taskLabel: parsed.data.taskLabel,
          minutes: parsed.data.minutes,
          startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : null,
          endedAt: parsed.data.endedAt ? new Date(parsed.data.endedAt) : null
        }
      });
      return { success: true, data: entry, meta: { requestId: scope.requestId } } as ApiResponse<typeof entry>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIME_ENTRY_CREATE_FAILED", message: "Unable to create time entry" } } as ApiResponse;
    }
  });

  // ── PATCH /time-entries/:id/stop ─────────────────────────────────────────────
  app.patch<{ Params: { id: string } }>("/time-entries/:id/stop", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params;
    const body = (request.body ?? {}) as { taskLabel?: string };

    try {
      const existing = await prisma.projectTimeEntry.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Time entry not found" } } as ApiResponse;
      }

      const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
      if (scopedClientId && existing.clientId !== scopedClientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }

      const now = new Date();
      const startedAt = existing.startedAt ?? existing.createdAt;
      const elapsedMinutes = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60_000));

      const updated = await prisma.projectTimeEntry.update({
        where: { id },
        data: {
          endedAt: now,
          minutes: elapsedMinutes,
          ...(body.taskLabel ? { taskLabel: body.taskLabel } : {})
        }
      });

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIME_ENTRY_STOP_FAILED", message: "Unable to stop time entry" } } as ApiResponse;
    }
  });
}
