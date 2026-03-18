// ════════════════════════════════════════════════════════════════════════════
// proposals-crud.ts — Proposal (client quote) CRUD routes
//
// Admin routes:
//   POST   /admin/proposals           — create a new proposal for a client
//   GET    /admin/proposals           — list all proposals (admin view)
//   DELETE /admin/proposals/:id       — delete a draft proposal
//
// Portal routes (client-scoped):
//   GET    /portal/proposals          — list proposals for authenticated client
//   PATCH  /portal/proposals/:id/accept  — client accepts a proposal
//   PATCH  /portal/proposals/:id/decline — client declines with optional reason
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function serializeProposal(p: {
  id: string;
  clientId: string;
  title: string;
  summary: string | null;
  status: string;
  amountCents: number;
  currency: string;
  preparedBy: string | null;
  preparedByInitials: string | null;
  validUntil: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    description: string;
    icon: string;
    amountCents: number;
    sortOrder: number;
  }>;
}) {
  return {
    id:                 p.id,
    clientId:           p.clientId,
    title:              p.title,
    summary:            p.summary,
    status:             p.status,
    amountCents:        p.amountCents,
    currency:           p.currency,
    preparedBy:         p.preparedBy,
    preparedByInitials: p.preparedByInitials,
    validUntil:         p.validUntil?.toISOString() ?? null,
    declinedAt:         p.declinedAt?.toISOString() ?? null,
    declineReason:      p.declineReason,
    acceptedAt:         p.acceptedAt?.toISOString() ?? null,
    createdAt:          p.createdAt.toISOString(),
    updatedAt:          p.updatedAt.toISOString(),
    items:              p.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id:          item.id,
        description: item.description,
        icon:        item.icon,
        amountCents: item.amountCents,
      })),
  };
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerProposalCrudRoutes(app: FastifyInstance): Promise<void> {

  // ── POST /admin/proposals — create proposal for a client ───────────────────
  app.post("/admin/proposals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin role required." } } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const clientId       = typeof body?.clientId       === "string" ? body.clientId       : null;
    const title          = typeof body?.title          === "string" ? body.title.trim()   : null;
    const summary        = typeof body?.summary        === "string" ? body.summary.trim() : null;
    const amountCents    = typeof body?.amountCents    === "number" ? body.amountCents    : 0;
    const currency       = typeof body?.currency       === "string" ? body.currency.toUpperCase() : "ZAR";
    const preparedBy     = typeof body?.preparedBy     === "string" ? body.preparedBy     : null;
    const preparedByInitials = typeof body?.preparedByInitials === "string" ? body.preparedByInitials : null;
    const validUntil     = typeof body?.validUntil     === "string" ? new Date(body.validUntil) : null;
    const rawItems       = Array.isArray(body?.items) ? body.items as Array<{ description: string; icon?: string; amountCents?: number; sortOrder?: number }> : [];

    if (!clientId || !title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId and title are required." } } as ApiResponse;
    }

    try {
      const proposal = await prisma.proposal.create({
        data: {
          clientId,
          title,
          summary: summary ?? null,
          amountCents,
          currency,
          preparedBy: preparedBy ?? null,
          preparedByInitials: preparedByInitials ?? null,
          validUntil: validUntil && !isNaN(validUntil.getTime()) ? validUntil : null,
          items: {
            create: rawItems.map((it, idx) => ({
              description: String(it.description ?? "").trim(),
              icon:        String(it.icon ?? "star"),
              amountCents: Number(it.amountCents ?? 0),
              sortOrder:   Number(it.sortOrder ?? idx),
            })),
          },
        },
        include: { items: true },
      });

      return { success: true, data: serializeProposal(proposal) } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROPOSAL_CREATE_FAILED", message: "Unable to create proposal." } } as ApiResponse;
    }
  });

  // ── GET /admin/proposals — list all proposals ──────────────────────────────
  app.get("/admin/proposals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Staff or admin role required." } } as ApiResponse;
    }

    const query  = (request.query as Record<string, string>) ?? {};
    const clientId = query.clientId ?? null;
    const status   = query.status   ?? null;

    try {
      const proposals = await prisma.proposal.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          ...(status   ? { status }   : {}),
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      return { success: true, data: proposals.map(serializeProposal) } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROPOSALS_FETCH_FAILED", message: "Unable to fetch proposals." } } as ApiResponse;
    }
  });

  // ── DELETE /admin/proposals/:id — remove a draft proposal ─────────────────
  app.delete("/admin/proposals/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin role required." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    try {
      const existing = await prisma.proposal.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "PROPOSAL_NOT_FOUND", message: "Proposal not found." } } as ApiResponse;
      }
      if (existing.status !== "PENDING") {
        reply.status(409);
        return { success: false, error: { code: "PROPOSAL_NOT_DELETABLE", message: "Only PENDING proposals can be deleted." } } as ApiResponse;
      }
      await prisma.proposal.delete({ where: { id } });
      return { success: true, data: { deleted: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROPOSAL_DELETE_FAILED", message: "Unable to delete proposal." } } as ApiResponse;
    }
  });

  // ── GET /portal/proposals — list proposals for the authenticated client ────
  app.get("/portal/proposals", async (request, reply) => {
    const scope = readScopeHeaders(request);

    // Clients see their own; staff/admin can pass clientId param
    const query = (request.query as Record<string, string>) ?? {};
    let clientId: string | null = null;

    if (scope.role === "CLIENT") {
      clientId = scope.clientId ?? null;
    } else if (scope.role === "ADMIN" || scope.role === "STAFF") {
      clientId = query.clientId ?? scope.clientId ?? null;
    }

    if (!clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required." } } as ApiResponse;
    }

    try {
      // Auto-expire proposals past their validUntil date
      await prisma.proposal.updateMany({
        where: {
          clientId,
          status: "PENDING",
          validUntil: { lt: new Date() },
        },
        data: { status: "EXPIRED" },
      });

      const proposals = await prisma.proposal.findMany({
        where: { clientId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: proposals.map(serializeProposal) } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROPOSALS_FETCH_FAILED", message: "Unable to fetch proposals." } } as ApiResponse;
    }
  });

  // ── PATCH /portal/proposals/:id/accept — client accepts a proposal ─────────
  app.patch("/portal/proposals/:id/accept", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    const clientId = scope.clientId ?? null;
    if (!clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Client scope required." } } as ApiResponse;
    }

    try {
      const existing = await prisma.proposal.findUnique({ where: { id }, include: { items: true } });
      if (!existing || existing.clientId !== clientId) {
        reply.status(404);
        return { success: false, error: { code: "PROPOSAL_NOT_FOUND", message: "Proposal not found." } } as ApiResponse;
      }
      if (existing.status !== "PENDING") {
        reply.status(409);
        return { success: false, error: { code: "PROPOSAL_NOT_ACTIONABLE", message: `Proposal is already ${existing.status.toLowerCase()}.` } } as ApiResponse;
      }

      const updated = await prisma.proposal.update({
        where: { id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
        include: { items: true },
      });

      return { success: true, data: serializeProposal(updated) } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROPOSAL_ACCEPT_FAILED", message: "Unable to accept proposal." } } as ApiResponse;
    }
  });

  // ── PATCH /portal/proposals/:id/decline — client declines a proposal ───────
  app.patch("/portal/proposals/:id/decline", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown> | null;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : null;

    const clientId = scope.clientId ?? null;
    if (!clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Client scope required." } } as ApiResponse;
    }

    try {
      const existing = await prisma.proposal.findUnique({ where: { id }, include: { items: true } });
      if (!existing || existing.clientId !== clientId) {
        reply.status(404);
        return { success: false, error: { code: "PROPOSAL_NOT_FOUND", message: "Proposal not found." } } as ApiResponse;
      }
      if (existing.status !== "PENDING") {
        reply.status(409);
        return { success: false, error: { code: "PROPOSAL_NOT_ACTIONABLE", message: `Proposal is already ${existing.status.toLowerCase()}.` } } as ApiResponse;
      }

      const updated = await prisma.proposal.update({
        where: { id },
        data: {
          status:        "DECLINED",
          declinedAt:    new Date(),
          declineReason: reason ?? null,
        },
        include: { items: true },
      });

      return { success: true, data: serializeProposal(updated) } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROPOSAL_DECLINE_FAILED", message: "Unable to decline proposal." } } as ApiResponse;
    }
  });
}
