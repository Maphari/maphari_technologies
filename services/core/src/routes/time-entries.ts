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
}
