// ════════════════════════════════════════════════════════════════════════════
// loyalty.ts — LoyaltyAccount & CreditTransaction routes
// Service : billing  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN sees all; CLIENT scoped to own account
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { LoyaltyAccount, CreditTransaction } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
type CreditTransactionDto = {
  id: string;
  loyaltyAccountId: string;
  type: string;
  points: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
};

type LoyaltyAccountDto = {
  id: string;
  clientId: string;
  tier: string;
  balancePoints: number;
  totalEarned: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: CreditTransactionDto[];
};

function toTransactionDto(t: CreditTransaction): CreditTransactionDto {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
  };
}

function toLoyaltyDto(a: LoyaltyAccount & { transactions?: CreditTransaction[] }): LoyaltyAccountDto {
  return {
    id: a.id,
    clientId: a.clientId,
    tier: a.tier,
    balancePoints: a.balancePoints,
    totalEarned: a.totalEarned,
    lastActivityAt: a.lastActivityAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    transactions: (a.transactions ?? []).map(toTransactionDto),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
export async function registerLoyaltyRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /loyalty — list all (ADMIN) ───────────────────────────────────────
  app.get("/loyalty", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const cacheKey = CacheKeys.loyaltyAll();

    try {
      const cached = await cache.getJson<LoyaltyAccountDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<LoyaltyAccountDto[]>;
      }

      const accounts = await prisma.loyaltyAccount.findMany({
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
        orderBy: { totalEarned: "desc" },
      });
      const data = accounts.map(toLoyaltyDto);

      await cache.setJson(cacheKey, data, 60);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<LoyaltyAccountDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "LOYALTY_FETCH_FAILED", message: "Unable to fetch loyalty accounts" } } as ApiResponse;
    }
  });

  // ── GET /loyalty/:clientId — one account (CLIENT scoped / ADMIN) ───────────
  app.get("/loyalty/:clientId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    // CLIENT role must match their scoped clientId
    if (scope.role === "CLIENT" && scope.clientId !== clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Cannot access another client's loyalty account" } } as ApiResponse;
    }

    const cacheKey = CacheKeys.loyalty(clientId);

    try {
      const cached = await cache.getJson<LoyaltyAccountDto>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<LoyaltyAccountDto>;
      }

      const account = await prisma.loyaltyAccount.findUnique({
        where: { clientId },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
      });

      if (!account) {
        return { success: true, data: null, meta: { requestId: scope.requestId } } as ApiResponse<null>;
      }

      const data = toLoyaltyDto(account);
      await cache.setJson(cacheKey, data, 60);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<LoyaltyAccountDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "LOYALTY_FETCH_FAILED", message: "Unable to fetch loyalty account" } } as ApiResponse;
    }
  });

  // ── POST /loyalty/redeem — client redeems their own credits ──────────────
  app.post("/loyalty/redeem", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId scope is required" } } as ApiResponse;
    }

    const body = request.body as { points: number; description?: string };
    if (!body.points || body.points <= 0) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "points must be a positive number" } } as ApiResponse;
    }

    const clientId = scope.clientId;

    try {
      const account = await prisma.loyaltyAccount.findUnique({ where: { clientId } });
      if (!account) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Loyalty account not found" } } as ApiResponse;
      }
      if (account.balancePoints < body.points) {
        reply.status(400);
        return { success: false, error: { code: "INSUFFICIENT_CREDITS", message: "Insufficient credit balance" } } as ApiResponse;
      }

      const [tx] = await prisma.$transaction([
        prisma.creditTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            type: "REDEEMED",
            points: body.points,
            description: body.description ?? "Credit redemption",
            referenceId: null,
          },
        }),
        prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            balancePoints: Math.max(0, account.balancePoints - body.points),
            lastActivityAt: new Date(),
          },
        }),
      ]);

      await cache.setJson(CacheKeys.loyalty(clientId), null as unknown as LoyaltyAccountDto, 0);
      await cache.setJson(CacheKeys.loyaltyAll(), null as unknown as LoyaltyAccountDto[], 0);

      reply.status(201);
      return { success: true, data: toTransactionDto(tx) } as ApiResponse<CreditTransactionDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REDEEM_FAILED", message: "Unable to redeem credits" } } as ApiResponse;
    }
  });

  // ── POST /loyalty/:clientId/transactions — issue credits (ADMIN) ──────────
  app.post("/loyalty/:clientId/transactions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { clientId } = request.params as { clientId: string };
    const body = request.body as {
      type?: "EARNED" | "REDEEMED" | "ADJUSTED";
      points: number;
      description?: string;
      referenceId?: string;
    };

    if (!body.points) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "points is required" } } as ApiResponse;
    }

    try {
      // Upsert loyalty account if needed
      const account = await prisma.loyaltyAccount.upsert({
        where: { clientId },
        create: { clientId, balancePoints: 0, totalEarned: 0 },
        update: {},
      });

      const txType = body.type ?? "EARNED";
      const delta = txType === "REDEEMED" ? -Math.abs(body.points) : Math.abs(body.points);
      const newBalance = account.balancePoints + delta;
      const newEarned = txType === "EARNED" ? account.totalEarned + Math.abs(body.points) : account.totalEarned;

      const [tx] = await prisma.$transaction([
        prisma.creditTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            type: txType,
            points: Math.abs(body.points),
            description: body.description ?? null,
            referenceId: body.referenceId ?? null,
          },
        }),
        prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            balancePoints: Math.max(0, newBalance),
            totalEarned: newEarned,
            lastActivityAt: new Date(),
          },
        }),
      ]);

      // Invalidate caches
      await cache.setJson(CacheKeys.loyalty(clientId), null as unknown as LoyaltyAccountDto, 0);
      await cache.setJson(CacheKeys.loyaltyAll(), null as unknown as LoyaltyAccountDto[], 0);

      reply.status(201);
      return { success: true, data: toTransactionDto(tx) } as ApiResponse<CreditTransactionDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "LOYALTY_TRANSACTION_FAILED", message: "Unable to issue credits" } } as ApiResponse;
    }
  });
}
