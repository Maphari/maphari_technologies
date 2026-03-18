// ════════════════════════════════════════════════════════════════════════════
// feature-flags.ts — Admin feature flag CRUD
// Service : core  |  Scope: ADMIN only
// Endpoints:
//   GET   /admin/feature-flags              — list all flags
//   POST  /admin/feature-flags              — upsert a flag (create or update)
//   PATCH /admin/feature-flags/:key/toggle  — flip enabled state
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerFeatureFlagRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /admin/feature-flags ───────────────────────────────────────────────
  app.get("/admin/feature-flags", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    try {
      const flags = await prisma.featureFlag.findMany({ orderBy: { name: "asc" } });
      return { success: true, data: flags, meta: { requestId: scope.requestId } } as ApiResponse<typeof flags>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "FLAGS_FETCH_FAILED", message: "Unable to load feature flags" } } as ApiResponse;
    }
  });

  // ── POST /admin/feature-flags ─────────────────────────────────────────────
  // Upsert: creates flag if key is new, updates fields if it already exists.
  app.post("/admin/feature-flags", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const body = request.body as {
      key?: string;
      name?: string;
      description?: string;
      enabled?: boolean;
      scope?: string;
    };

    if (!body.key?.trim() || !body.name?.trim()) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "key and name are required" } } as ApiResponse;
    }

    try {
      const flag = await prisma.featureFlag.upsert({
        where: { key: body.key },
        create: {
          key: body.key,
          name: body.name,
          description: body.description ?? null,
          enabled: body.enabled ?? false,
          scope: body.scope ?? "All users",
          updatedBy: scope.userId ?? null,
        },
        update: {
          name: body.name,
          description: body.description ?? undefined,
          ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
          ...(body.scope !== undefined ? { scope: body.scope } : {}),
          updatedBy: scope.userId ?? null,
        },
      });

      reply.status(201);
      return { success: true, data: flag } as ApiResponse<typeof flag>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "FLAG_UPSERT_FAILED", message: "Unable to save feature flag" } } as ApiResponse;
    }
  });

  // ── PATCH /admin/feature-flags/:key/toggle ────────────────────────────────
  app.patch("/admin/feature-flags/:key/toggle", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const { key } = request.params as { key: string };

    try {
      const existing = await prisma.featureFlag.findUnique({ where: { key } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "FLAG_NOT_FOUND", message: "Feature flag not found" } } as ApiResponse;
      }

      const nextEnabled = !existing.enabled;
      const updated = await prisma.featureFlag.update({
        where: { key },
        data: {
          enabled: nextEnabled,
          scope: nextEnabled
            ? (existing.scope === "Disabled" ? "All users" : existing.scope)
            : "Disabled",
          updatedBy: scope.userId ?? null,
        },
      });

      return { success: true, data: updated } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "FLAG_TOGGLE_FAILED", message: "Unable to toggle feature flag" } } as ApiResponse;
    }
  });
}
