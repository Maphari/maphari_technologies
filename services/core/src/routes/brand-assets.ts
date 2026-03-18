// ════════════════════════════════════════════════════════════════════════════
// brand-assets.ts — Brand asset CRUD routes
// Service : core  |  Scope: CLIENT (own), STAFF/ADMIN (all)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export async function registerBrandAssetRoutes(app: FastifyInstance): Promise<void> {

  /** GET /brand-assets?type=LOGO|COLOR|FONT|GUIDELINE */
  app.get("/brand-assets", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    const { type } = request.query as { type?: string };
    const cacheKey = `core:brand-assets:${scopedClientId}:${type ?? "all"}`;

    try {
      const assets = await withCache(cacheKey, 60, async () => {
        return prisma.brandAsset.findMany({
          where: {
            clientId: scopedClientId,
            ...(type ? { type } : {}),
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });
      });
      return { success: true, data: assets, meta: { requestId: scope.requestId } } as ApiResponse<typeof assets>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRAND_ASSETS_FETCH_FAILED", message: "Unable to fetch brand assets." } } as ApiResponse;
    }
  });

  /** POST /brand-assets */
  app.post("/brand-assets", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    const body = request.body as {
      type:       string;
      name:       string;
      fileId?:    string;
      storageKey?: string;
      mimeType?:  string;
      sizeBytes?: number;
      value?:     string;
      variant?:   string;
      sortOrder?: number;
    };

    if (!body.type || !body.name) {
      reply.status(400);
      return { success: false, error: { code: "INVALID_BODY", message: "type and name are required." } } as ApiResponse;
    }

    try {
      const asset = await prisma.brandAsset.create({
        data: {
          clientId:  scopedClientId,
          type:      body.type,
          name:      body.name,
          fileId:    body.fileId,
          storageKey: body.storageKey,
          mimeType:  body.mimeType,
          sizeBytes: body.sizeBytes,
          value:     body.value,
          variant:   body.variant,
          sortOrder: body.sortOrder ?? 0,
        },
      });

      // Invalidate list caches
      await cache.delete(`core:brand-assets:${scopedClientId}:all`);
      await cache.delete(`core:brand-assets:${scopedClientId}:${body.type}`);

      reply.status(201);
      return { success: true, data: asset, meta: { requestId: scope.requestId } } as ApiResponse<typeof asset>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRAND_ASSET_CREATE_FAILED", message: "Unable to create brand asset." } } as ApiResponse;
    }
  });

  /** DELETE /brand-assets/:id */
  app.delete("/brand-assets/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    try {
      const existing = await prisma.brandAsset.findUnique({ where: { id } });
      if (!existing || existing.clientId !== scopedClientId) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Brand asset not found." } } as ApiResponse;
      }

      await prisma.brandAsset.delete({ where: { id } });

      // Invalidate caches
      await cache.delete(`core:brand-assets:${scopedClientId}:all`);
      await cache.delete(`core:brand-assets:${scopedClientId}:${existing.type}`);

      return { success: true, data: { id }, meta: { requestId: scope.requestId } } as ApiResponse<{ id: string }>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRAND_ASSET_DELETE_FAILED", message: "Unable to delete brand asset." } } as ApiResponse;
    }
  });
}
