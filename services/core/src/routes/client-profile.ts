// ════════════════════════════════════════════════════════════════════════════
// client-profile.ts — Company profile routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : CLIENT read/write own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerClientProfileRoutes(app: FastifyInstance): Promise<void> {

  /** GET /portal/profile — fetch the client's company profile */
  app.get("/portal/profile", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    try {
      const cacheKey = `core:client-profile:${scopedClientId}`;
      const profile = await withCache(cacheKey, 120, async () => {
        const [client, profile] = await Promise.all([
          prisma.client.findUnique({
            where: { id: scopedClientId },
            select: {
              id: true, name: true, billingEmail: true, ownerName: true,
              timezone: true, tier: true, slaTier: true,
              contractStartAt: true, contractRenewalAt: true,
            }
          }),
          prisma.clientProfile.findUnique({ where: { clientId: scopedClientId } }),
        ]);
        if (!client) return null;
        return { ...client, ...profile };
      });

      if (!profile) {
        reply.status(404);
        return { success: false, error: { code: "CLIENT_NOT_FOUND", message: "Client not found." } } as ApiResponse;
      }

      return { success: true, data: profile, meta: { requestId: scope.requestId } } as ApiResponse<typeof profile>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROFILE_FETCH_FAILED", message: "Unable to fetch company profile." } } as ApiResponse;
    }
  });

  /** PATCH /portal/profile — upsert the client's company profile */
  app.patch("/portal/profile", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    const body = request.body as {
      companyName?:   string;
      tagline?:       string;
      mission?:       string;
      vision?:        string;
      description?:   string;
      industry?:      string;
      website?:       string;
      logoUrl?:       string;
      primaryColor?:  string;
      socialLinks?:   Record<string, string>;
      yearFounded?:   number;
      teamSize?:      string;
      hqLocation?:    string;
      coverImageUrl?: string;
    };

    try {
      const profile = await prisma.clientProfile.upsert({
        where: { clientId: scopedClientId },
        create: { clientId: scopedClientId, ...body },
        update: body,
      });

      await cache.delete(`core:client-profile:${scopedClientId}`);

      return { success: true, data: profile, meta: { requestId: scope.requestId } } as ApiResponse<typeof profile>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROFILE_UPDATE_FAILED", message: "Unable to update company profile." } } as ApiResponse;
    }
  });
}
