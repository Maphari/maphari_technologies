// ════════════════════════════════════════════════════════════════════════════
// prospecting-campaigns.ts — Persisted prospecting campaign history
// Routes : GET    /prospecting/campaigns
//          POST   /prospecting/campaigns
//          DELETE /prospecting/campaigns/:id
// Scope  : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerProspectingCampaignRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /prospecting/campaigns ─────────────────────────────────────────
  app.get("/prospecting/campaigns", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const campaigns = await prisma.prospectingCampaign.findMany({
      where: { workspaceId: "default" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { success: true, data: campaigns } as ApiResponse<typeof campaigns>;
  });

  // ── POST /prospecting/campaigns ────────────────────────────────────────
  app.post("/prospecting/campaigns", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const body = request.body as {
      filters?: Record<string, unknown>;
      resultsCount?: number;
      status?: string;
    };

    const campaign = await prisma.prospectingCampaign.create({
      data: {
        filters: body?.filters ?? {},
        resultsCount: body?.resultsCount ?? 0,
        status: body?.status ?? "completed",
        createdByAdminId: scope.userId ?? null,
      },
    });

    reply.code(201);
    return { success: true, data: campaign } as ApiResponse<typeof campaign>;
  });

  // ── DELETE /prospecting/campaigns/:id ──────────────────────────────────
  app.delete("/prospecting/campaigns/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };

    const existing = await prisma.prospectingCampaign.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Campaign not found" },
      } as ApiResponse);
    }

    await prisma.prospectingCampaign.delete({ where: { id } });

    return { success: true, data: { id } } as ApiResponse<{ id: string }>;
  });
}
