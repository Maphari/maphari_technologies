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

  // ────────────────────────────────────────────────────────────────────────────
  // Per-client portal branding configuration
  // ────────────────────────────────────────────────────────────────────────────

  /** GET /admin/clients/:id/branding — admin: fetch branding for a client */
  app.get("/admin/clients/:id/branding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: clientId } = request.params as { id: string };

    try {
      const cacheKey = `core:client-branding:${clientId}`;
      const profile = await withCache(cacheKey, 120, async () =>
        prisma.clientProfile.findUnique({ where: { clientId } })
      );

      const branding = {
        clientId,
        logoUrl: profile?.logoUrl ?? null,
        primaryColor: profile?.primaryColor ?? null,
        companyDisplayName: profile?.companyName ?? null,
        portalTitle: null as string | null,
        accentColor: null as string | null,
        enabled: !!(profile?.primaryColor || profile?.logoUrl || profile?.companyName),
      };

      return { success: true, data: branding, meta: { requestId: scope.requestId } } as ApiResponse<typeof branding>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRANDING_FETCH_FAILED", message: "Unable to fetch client branding." } } as ApiResponse;
    }
  });

  /** PATCH /admin/clients/:id/branding — admin: update branding for a client */
  app.patch("/admin/clients/:id/branding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: clientId } = request.params as { id: string };

    const body = request.body as {
      logoUrl?: string | null;
      primaryColor?: string | null;
      companyDisplayName?: string | null;
      portalTitle?: string | null;
      accentColor?: string | null;
      enabled?: boolean;
    };

    try {
      // Map branding fields to ClientProfile columns
      const updateData: Record<string, unknown> = {};
      if ("logoUrl"             in body) updateData.logoUrl      = body.logoUrl;
      if ("primaryColor"        in body) updateData.primaryColor = body.primaryColor;
      if ("companyDisplayName"  in body) updateData.companyName  = body.companyDisplayName;
      // If enabled is explicitly false, clear the colour
      if (body.enabled === false) {
        updateData.primaryColor = null;
        updateData.logoUrl      = null;
        updateData.companyName  = null;
      }

      const profile = await prisma.clientProfile.upsert({
        where:  { clientId },
        create: { clientId, ...updateData },
        update: updateData,
      });

      await cache.delete(`core:client-branding:${clientId}`);
      await cache.delete(`core:client-profile:${clientId}`);

      const branding = {
        clientId,
        logoUrl: profile.logoUrl ?? null,
        primaryColor: profile.primaryColor ?? null,
        companyDisplayName: profile.companyName ?? null,
        portalTitle: null as string | null,
        accentColor: null as string | null,
        enabled: !!(profile.primaryColor || profile.logoUrl || profile.companyName),
      };

      return { success: true, data: branding, meta: { requestId: scope.requestId } } as ApiResponse<typeof branding>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRANDING_UPDATE_FAILED", message: "Unable to update client branding." } } as ApiResponse;
    }
  });

  /** GET /portal/branding — CLIENT: returns their own portal branding config */
  app.get("/portal/branding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    try {
      const cacheKey = `core:client-branding:${scopedClientId}`;
      const profile = await withCache(cacheKey, 120, async () =>
        prisma.clientProfile.findUnique({ where: { clientId: scopedClientId } })
      );

      const branding = {
        clientId: scopedClientId,
        logoUrl: profile?.logoUrl ?? null,
        primaryColor: profile?.primaryColor ?? null,
        companyDisplayName: profile?.companyName ?? null,
        portalTitle: null as string | null,
        accentColor: null as string | null,
        enabled: !!(profile?.primaryColor || profile?.logoUrl || profile?.companyName),
      };

      return { success: true, data: branding, meta: { requestId: scope.requestId } } as ApiResponse<typeof branding>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRANDING_FETCH_FAILED", message: "Unable to fetch portal branding." } } as ApiResponse;
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
