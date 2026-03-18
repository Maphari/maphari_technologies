// ════════════════════════════════════════════════════════════════════════════
// market-intel.ts — Market intelligence routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF read + create; CLIENT forbidden
// Model   : MarketIntelEntry (@@map "market_intel_entries")
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { MarketIntelEntry } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type MarketIntelDto = {
  id: string;
  type: string;
  title: string;
  source: string | null;
  summary: string | null;
  relevance: string;
  tags: string | null;
  enteredByName: string | null;
  enteredAt: string;
  createdAt: string;
  updatedAt: string;
};

function toDto(m: MarketIntelEntry): MarketIntelDto {
  return {
    ...m,
    enteredAt: m.enteredAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerMarketIntelRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /market-intel ───────────────────────────────────────────────────────
  app.get("/market-intel", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const query = request.query as { type?: string; relevance?: string };

    try {
      const data = await withCache(CacheKeys.marketIntel(), 120, () =>
        prisma.marketIntelEntry.findMany({
          where: {
            ...(query.type      ? { type:      query.type      } : {}),
            ...(query.relevance ? { relevance: query.relevance } : {}),
          },
          orderBy: { enteredAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<MarketIntelDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MARKET_INTEL_FETCH_FAILED", message: "Unable to fetch market intel" } } as ApiResponse;
    }
  });

  // ── POST /market-intel ──────────────────────────────────────────────────────
  app.post("/market-intel", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const body = request.body as {
      title: string;
      type?: string;
      source?: string;
      summary?: string;
      relevance?: string;
      tags?: string;
      enteredByName?: string;
      enteredAt?: string;
    };

    if (!body.title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "title is required" } } as ApiResponse;
    }

    try {
      const entry = await prisma.marketIntelEntry.create({
        data: {
          title:         body.title,
          type:          body.type          ?? "TREND",
          source:        body.source        ?? null,
          summary:       body.summary       ?? null,
          relevance:     body.relevance     ?? "MEDIUM",
          tags:          body.tags          ?? null,
          enteredByName: body.enteredByName ?? null,
          enteredAt:     body.enteredAt ? new Date(body.enteredAt) : new Date(),
        },
      });

      await cache.delete(CacheKeys.marketIntel());

      reply.status(201);
      return { success: true, data: toDto(entry) } as ApiResponse<MarketIntelDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MARKET_INTEL_CREATE_FAILED", message: "Unable to create market intel entry" } } as ApiResponse;
    }
  });

  // ── PATCH /market-intel/:id ─────────────────────────────────────────────────
  app.patch("/market-intel/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      title: string;
      type: string;
      source: string;
      summary: string;
      relevance: string;
      tags: string;
    }>;

    try {
      const data: Record<string, unknown> = {};
      if (body.title)     data.title     = body.title;
      if (body.type)      data.type      = body.type;
      if (body.source)    data.source    = body.source;
      if (body.summary)   data.summary   = body.summary;
      if (body.relevance) data.relevance = body.relevance;
      if (body.tags)      data.tags      = body.tags;

      const entry = await prisma.marketIntelEntry.update({ where: { id }, data });

      await cache.delete(CacheKeys.marketIntel());

      return { success: true, data: toDto(entry) } as ApiResponse<MarketIntelDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MARKET_INTEL_UPDATE_FAILED", message: "Unable to update market intel" } } as ApiResponse;
    }
  });
}
