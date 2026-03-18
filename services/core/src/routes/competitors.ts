// ════════════════════════════════════════════════════════════════════════════
// competitors.ts — Competitor intelligence routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF read-only; CLIENT forbidden
// Models  : Competitor, WinLossEntry, MarketRate
// ════════════════════════════════════════════════════════════════════════════

import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { withCache, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Cache keys ────────────────────────────────────────────────────────────────
const CK = {
  competitors: () => "core:competitors:all",
  winLoss:     () => "core:win-loss:all",
  marketRates: () => "core:market-rates:all",
};

// ── DTOs ──────────────────────────────────────────────────────────────────────
type CompetitorDto = {
  id: string;
  name: string;
  type: string;
  tier: string;
  color: string;
  services: string[];
  strengths: string[];
  weaknesses: string[];
  pricing: string | null;
  positioning: string | null;
  beatStrategy: string | null;
  avgRetainer: number;
  winsCount: number;
  lossesCount: number;
  lastUpdated: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type WinLossDto = {
  id: string;
  date: string;
  prospect: string;
  outcome: string;
  competitorId: string | null;
  competitorName: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
};

type MarketRateDto = {
  id: string;
  service: string;
  maphari: number;
  marketLow: number;
  marketMid: number;
  marketHigh: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function parseJsonArray(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerCompetitorRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /competitors ────────────────────────────────────────────────────────
  app.get("/competitors", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }
    try {
      const data = await withCache(CK.competitors(), 120, () =>
        prisma.competitor.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        }).then((rows) => rows.map((c): CompetitorDto => ({
          ...c,
          services:    parseJsonArray(c.services),
          strengths:   parseJsonArray(c.strengths),
          weaknesses:  parseJsonArray(c.weaknesses),
          createdAt:   c.createdAt.toISOString(),
          updatedAt:   c.updatedAt.toISOString(),
        })))
      );
      return { success: true, data } as ApiResponse<CompetitorDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "COMPETITORS_FETCH_FAILED", message: "Unable to fetch competitors" } } as ApiResponse;
    }
  });

  // ── POST /competitors ───────────────────────────────────────────────────────
  app.post("/competitors", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }
    const body = request.body as {
      name: string;
      type?: string;
      tier?: string;
      color?: string;
      services?: string[];
      strengths?: string[];
      weaknesses?: string[];
      pricing?: string;
      positioning?: string;
      beatStrategy?: string;
      avgRetainer?: number;
      lastUpdated?: string;
    };
    if (!body.name) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "name is required" } } as ApiResponse;
    }
    try {
      const competitor = await prisma.competitor.create({
        data: {
          name:         body.name,
          type:         body.type         ?? "Direct",
          tier:         body.tier         ?? "Same tier",
          color:        body.color        ?? "var(--red)",
          services:     JSON.stringify(body.services    ?? []),
          strengths:    JSON.stringify(body.strengths   ?? []),
          weaknesses:   JSON.stringify(body.weaknesses  ?? []),
          pricing:      body.pricing      ?? null,
          positioning:  body.positioning  ?? null,
          beatStrategy: body.beatStrategy ?? null,
          avgRetainer:  body.avgRetainer  ?? 0,
          lastUpdated:  body.lastUpdated  ?? null,
        },
      });
      await cache.delete(CK.competitors());
      reply.status(201);
      return { success: true, data: { ...competitor, services: parseJsonArray(competitor.services), strengths: parseJsonArray(competitor.strengths), weaknesses: parseJsonArray(competitor.weaknesses), createdAt: competitor.createdAt.toISOString(), updatedAt: competitor.updatedAt.toISOString() } } as ApiResponse<CompetitorDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "COMPETITOR_CREATE_FAILED", message: "Unable to create competitor" } } as ApiResponse;
    }
  });

  // ── PATCH /competitors/:id ──────────────────────────────────────────────────
  app.patch("/competitors/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      name: string;
      type: string;
      tier: string;
      color: string;
      services: string[];
      strengths: string[];
      weaknesses: string[];
      pricing: string;
      positioning: string;
      beatStrategy: string;
      avgRetainer: number;
      winsCount: number;
      lossesCount: number;
      lastUpdated: string;
      isActive: boolean;
    }>;
    try {
      const data: Record<string, unknown> = {};
      if (body.name         !== undefined) data.name         = body.name;
      if (body.type         !== undefined) data.type         = body.type;
      if (body.tier         !== undefined) data.tier         = body.tier;
      if (body.color        !== undefined) data.color        = body.color;
      if (body.services     !== undefined) data.services     = JSON.stringify(body.services);
      if (body.strengths    !== undefined) data.strengths    = JSON.stringify(body.strengths);
      if (body.weaknesses   !== undefined) data.weaknesses   = JSON.stringify(body.weaknesses);
      if (body.pricing      !== undefined) data.pricing      = body.pricing;
      if (body.positioning  !== undefined) data.positioning  = body.positioning;
      if (body.beatStrategy !== undefined) data.beatStrategy = body.beatStrategy;
      if (body.avgRetainer  !== undefined) data.avgRetainer  = body.avgRetainer;
      if (body.winsCount    !== undefined) data.winsCount    = body.winsCount;
      if (body.lossesCount  !== undefined) data.lossesCount  = body.lossesCount;
      if (body.lastUpdated  !== undefined) data.lastUpdated  = body.lastUpdated;
      if (body.isActive     !== undefined) data.isActive     = body.isActive;

      const competitor = await prisma.competitor.update({ where: { id }, data });
      await cache.delete(CK.competitors());
      return { success: true, data: { ...competitor, services: parseJsonArray(competitor.services), strengths: parseJsonArray(competitor.strengths), weaknesses: parseJsonArray(competitor.weaknesses), createdAt: competitor.createdAt.toISOString(), updatedAt: competitor.updatedAt.toISOString() } } as ApiResponse<CompetitorDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "COMPETITOR_UPDATE_FAILED", message: "Unable to update competitor" } } as ApiResponse;
    }
  });

  // ── GET /win-loss ───────────────────────────────────────────────────────────
  app.get("/win-loss", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }
    try {
      const data = await withCache(CK.winLoss(), 120, () =>
        prisma.winLossEntry.findMany({
          include: { competitor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map((w): WinLossDto => ({
          id:             w.id,
          date:           w.date,
          prospect:       w.prospect,
          outcome:        w.outcome,
          competitorId:   w.competitorId,
          competitorName: w.competitor?.name ?? null,
          reason:         w.reason,
          notes:          w.notes,
          createdAt:      w.createdAt.toISOString(),
        })))
      );
      return { success: true, data } as ApiResponse<WinLossDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "WIN_LOSS_FETCH_FAILED", message: "Unable to fetch win/loss entries" } } as ApiResponse;
    }
  });

  // ── POST /win-loss ──────────────────────────────────────────────────────────
  app.post("/win-loss", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }
    const body = request.body as {
      date: string;
      prospect: string;
      outcome?: string;
      competitorId?: string;
      reason?: string;
      notes?: string;
    };
    if (!body.date || !body.prospect) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "date and prospect are required" } } as ApiResponse;
    }
    try {
      const entry = await prisma.winLossEntry.create({
        data: {
          date:         body.date,
          prospect:     body.prospect,
          outcome:      body.outcome      ?? "pending",
          competitorId: body.competitorId ?? null,
          reason:       body.reason       ?? null,
          notes:        body.notes        ?? null,
        },
        include: { competitor: { select: { name: true } } },
      });
      await cache.delete(CK.winLoss());
      reply.status(201);
      return { success: true, data: { id: entry.id, date: entry.date, prospect: entry.prospect, outcome: entry.outcome, competitorId: entry.competitorId, competitorName: entry.competitor?.name ?? null, reason: entry.reason, notes: entry.notes, createdAt: entry.createdAt.toISOString() } } as ApiResponse<WinLossDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "WIN_LOSS_CREATE_FAILED", message: "Unable to create win/loss entry" } } as ApiResponse;
    }
  });

  // ── GET /market-rates ───────────────────────────────────────────────────────
  app.get("/market-rates", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }
    try {
      const data = await withCache(CK.marketRates(), 120, () =>
        prisma.marketRate.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }).then((rows) => rows.map((r): MarketRateDto => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })))
      );
      return { success: true, data } as ApiResponse<MarketRateDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MARKET_RATES_FETCH_FAILED", message: "Unable to fetch market rates" } } as ApiResponse;
    }
  });

  // ── POST /market-rates ──────────────────────────────────────────────────────
  app.post("/market-rates", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }
    const body = request.body as {
      service: string;
      maphari?: number;
      marketLow?: number;
      marketMid?: number;
      marketHigh?: number;
      sortOrder?: number;
    };
    if (!body.service) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "service is required" } } as ApiResponse;
    }
    try {
      const rate = await prisma.marketRate.create({
        data: {
          service:    body.service,
          maphari:    body.maphari    ?? 0,
          marketLow:  body.marketLow  ?? 0,
          marketMid:  body.marketMid  ?? 0,
          marketHigh: body.marketHigh ?? 0,
          sortOrder:  body.sortOrder  ?? 0,
        },
      });
      await cache.delete(CK.marketRates());
      reply.status(201);
      return { success: true, data: { ...rate, createdAt: rate.createdAt.toISOString(), updatedAt: rate.updatedAt.toISOString() } } as ApiResponse<MarketRateDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MARKET_RATE_CREATE_FAILED", message: "Unable to create market rate" } } as ApiResponse;
    }
  });

  // ── PATCH /market-rates/:id ─────────────────────────────────────────────────
  app.patch("/market-rates/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{ service: string; maphari: number; marketLow: number; marketMid: number; marketHigh: number; isActive: boolean; sortOrder: number }>;
    try {
      const data: Record<string, unknown> = {};
      if (body.service    !== undefined) data.service    = body.service;
      if (body.maphari    !== undefined) data.maphari    = body.maphari;
      if (body.marketLow  !== undefined) data.marketLow  = body.marketLow;
      if (body.marketMid  !== undefined) data.marketMid  = body.marketMid;
      if (body.marketHigh !== undefined) data.marketHigh = body.marketHigh;
      if (body.isActive   !== undefined) data.isActive   = body.isActive;
      if (body.sortOrder  !== undefined) data.sortOrder  = body.sortOrder;

      const rate = await prisma.marketRate.update({ where: { id }, data });
      await cache.delete(CK.marketRates());
      return { success: true, data: { ...rate, createdAt: rate.createdAt.toISOString(), updatedAt: rate.updatedAt.toISOString() } } as ApiResponse<MarketRateDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MARKET_RATE_UPDATE_FAILED", message: "Unable to update market rate" } } as ApiResponse;
    }
  });
}
