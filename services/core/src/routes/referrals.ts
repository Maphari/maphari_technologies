// ════════════════════════════════════════════════════════════════════════════
// referrals.ts — Client Referral routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : All roles can list + create; only STAFF/ADMIN can update status
// Note    : Referral has no clientId FK — no per-tenant scope filtering
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerReferralRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/referrals/summary ────────────────────────────────────────
  // CLIENT: summary of referrals submitted by this client's email
  // Static route registered BEFORE :id parameterized routes to avoid shadowing
  app.get("/portal/referrals/summary", async (request) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return { success: false, error: { code: "FORBIDDEN", message: "Client access required" } } as ApiResponse;
    }

    // Referral has no clientId FK — match by email via primary ClientContact
    const primaryContact = scope.clientId
      ? await prisma.clientContact.findFirst({
          where: { clientId: scope.clientId, isPrimary: true },
          select: { email: true },
        })
      : null;
    // Fall back to any contact if no primary is set
    const fallbackContact = (!primaryContact && scope.clientId)
      ? await prisma.clientContact.findFirst({
          where: { clientId: scope.clientId },
          select: { email: true },
          orderBy: { createdAt: "asc" },
        })
      : null;
    const clientEmail = (primaryContact ?? fallbackContact)?.email ?? null;

    const referrals = clientEmail
      ? await prisma.referral.findMany({
          where: { referredByEmail: clientEmail },
          select: { id: true, referredByName: true, status: true, rewardAmountCents: true, creditApplied: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const totalRewardCents = referrals.reduce((sum, r) => sum + (r.rewardAmountCents ?? 0), 0);
    const availableCents   = referrals
      .filter((r) => r.rewardAmountCents && !r.creditApplied)
      .reduce((sum, r) => sum + (r.rewardAmountCents ?? 0), 0);

    return {
      success: true,
      data: {
        totalRewardRand:  totalRewardCents / 100,
        availableRand:    availableCents / 100,
        referralCount:    referrals.length,
        referrals,
      },
      meta: { requestId: scope.requestId },
    } as ApiResponse;
  });

  // ── GET /referrals ────────────────────────────────────────────────────────
  app.get("/referrals", async (request) => {
    const scope = readScopeHeaders(request);

    const data = await withCache(CacheKeys.referrals(), 120, () =>
      prisma.referral.findMany({
        orderBy: { createdAt: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /referrals ───────────────────────────────────────────────────────
  app.post("/referrals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      referredByName: string;
      referredByEmail?: string;
      referredClientId?: string;
      notes?: string;
    };

    const referral = await prisma.referral.create({
      data: {
        referredByName: body.referredByName,
        referredByEmail: body.referredByEmail ?? null,
        referredClientId: body.referredClientId ?? null,
        status: "PENDING",
        notes: body.notes ?? null
      }
    });

    await cache.delete(CacheKeys.referrals());

    return reply.code(201).send({ success: true, data: referral, meta: { requestId: scope.requestId } } as ApiResponse<typeof referral>);
  });

  // ── PATCH /referrals/:id ──────────────────────────────────────────────────
  app.patch("/referrals/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot update referral status." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      status?: string;
      rewardAmountCents?: number;
      rewardedAt?: string;
      notes?: string;
    };

    const existing = await prisma.referral.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Referral not found." } } as ApiResponse);
    }

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        rewardAmountCents: body.rewardAmountCents !== undefined ? body.rewardAmountCents : existing.rewardAmountCents,
        rewardedAt: body.rewardedAt ? new Date(body.rewardedAt) : existing.rewardedAt,
        notes: body.notes !== undefined ? body.notes : existing.notes
      }
    });

    await cache.delete(CacheKeys.referrals());

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
