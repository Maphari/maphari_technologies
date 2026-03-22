import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export interface SearchHit {
  id: string;
  type: "client" | "project" | "lead" | "task" | "ticket" | "proposal" | "deliverable" | "article";
  title: string;
  subtitle?: string;
  status?: string;
  clientId?: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchHit[];
}

const PER_TYPE_LIMIT = 5;

/**
 * GET /search?q=<query>
 *
 * Cross-entity full-text search with fine-grained role-based scoping:
 *
 * - ADMIN: clients, projects, leads, tasks, tickets, proposals, knowledge articles
 * - STAFF: clients (own), projects (all), tasks (all), tickets (all),
 *           deliverables, knowledge articles
 * - CLIENT: own projects, own tickets, own proposals, knowledge articles (published)
 *
 * Results are capped at PER_TYPE_LIMIT per entity type, deduped and sorted by title.
 */
export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/search", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const q = ((request.query as Record<string, string>).q ?? "").trim();

    if (q.length < 2) {
      reply.status(400);
      return {
        success: false,
        error: { code: "QUERY_TOO_SHORT", message: "Search query must be at least 2 characters" }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const clientFilter = clientId ? { clientId } : {};
    const mode = "insensitive" as const;

    const isAdmin  = scope.role === "ADMIN";
    const isStaff  = scope.role === "STAFF";
    const isClient = scope.role === "CLIENT";

    try {
      const [clients, projects, leads, tasks, tickets, proposals, deliverables, articles] = await Promise.all([

        // ── Clients: ADMIN sees all, STAFF sees matched, CLIENT skips ────────
        !isClient
          ? prisma.client.findMany({
              where: {
                ...(isStaff && clientId ? { id: clientId } : {}),
                OR: [
                  { name: { contains: q, mode } },
                  { billingEmail: { contains: q, mode } },
                  { ownerName: { contains: q, mode } }
                ]
              },
              select: { id: true, name: true, status: true, billingEmail: true },
              take: PER_TYPE_LIMIT
            })
          : ([] as Awaited<ReturnType<typeof prisma.client.findMany>>),

        // ── Projects: all roles see projects, scoped by client for CLIENT ────
        prisma.project.findMany({
          where: {
            ...clientFilter,
            OR: [
              { name: { contains: q, mode } },
              { description: { contains: q, mode } }
            ]
          },
          select: { id: true, name: true, status: true, clientId: true },
          take: PER_TYPE_LIMIT
        }),

        // ── Leads: ADMIN only ────────────────────────────────────────────────
        isAdmin
          ? prisma.lead.findMany({
              where: {
                OR: [
                  { title: { contains: q, mode } },
                  { contactName: { contains: q, mode } },
                  { contactEmail: { contains: q, mode } },
                  { company: { contains: q, mode } }
                ]
              },
              select: { id: true, title: true, status: true, clientId: true, contactName: true, company: true },
              take: PER_TYPE_LIMIT
            })
          : ([] as Awaited<ReturnType<typeof prisma.lead.findMany>>),

        // ── Project Tasks: ADMIN + STAFF all; CLIENT skips ───────────────────
        !isClient
          ? prisma.projectTask.findMany({
              where: {
                OR: [
                  { title: { contains: q, mode } },
                  { assigneeName: { contains: q, mode } }
                ]
              },
              select: { id: true, title: true, status: true, project: { select: { clientId: true } } },
              take: PER_TYPE_LIMIT
            })
          : ([] as Array<{ id: string; title: string; status: string; project: { clientId: string } }>),

        // ── Support Tickets: all roles, scoped by client for CLIENT ──────────
        prisma.supportTicket.findMany({
          where: {
            ...clientFilter,
            OR: [
              { title: { contains: q, mode } },
              { description: { contains: q, mode } }
            ]
          },
          select: { id: true, title: true, status: true, clientId: true, category: true },
          take: PER_TYPE_LIMIT
        }),

        // ── Proposals: ADMIN all; CLIENT own ─────────────────────────────────
        (isAdmin || isClient)
          ? prisma.proposal.findMany({
              where: {
                ...clientFilter,
                OR: [
                  { title: { contains: q, mode } },
                  { summary: { contains: q, mode } }
                ]
              },
              select: { id: true, title: true, status: true, clientId: true },
              take: PER_TYPE_LIMIT
            })
          : ([] as Awaited<ReturnType<typeof prisma.proposal.findMany>>),

        // ── Deliverables: ADMIN + STAFF ───────────────────────────────────────
        !isClient
          ? prisma.projectDeliverable.findMany({
              where: {
                OR: [
                  { name: { contains: q, mode } },
                  { ownerName: { contains: q, mode } }
                ]
              },
              select: { id: true, name: true, status: true, projectId: true, project: { select: { clientId: true } } },
              take: PER_TYPE_LIMIT
            })
          : ([] as Array<{ id: string; name: string; status: string; projectId: string; project: { clientId: string } }>),

        // ── Knowledge Articles: all roles (CLIENT sees published only) ────────
        prisma.knowledgeArticle.findMany({
          where: {
            ...(isClient ? { status: "PUBLISHED" } : {}),
            OR: [
              { title: { contains: q, mode } },
              { content: { contains: q, mode } },
              { category: { contains: q, mode } }
            ]
          },
          select: { id: true, title: true, status: true, category: true },
          take: PER_TYPE_LIMIT
        }),
      ]);

      const results: SearchHit[] = [
        ...clients.map((c) => ({
          id: c.id,
          type: "client" as const,
          title: c.name,
          subtitle: c.billingEmail ?? undefined,
          status: c.status
        })),
        ...projects.map((p) => ({
          id: p.id,
          type: "project" as const,
          title: p.name,
          status: p.status,
          clientId: p.clientId
        })),
        ...leads.map((l) => ({
          id: l.id,
          type: "lead" as const,
          title: l.title,
          subtitle: l.company ?? l.contactName ?? undefined,
          status: l.status,
          clientId: l.clientId ?? undefined
        })),
        ...tasks.map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          status: t.status,
          clientId: t.project.clientId
        })),
        ...tickets.map((t) => ({
          id: t.id,
          type: "ticket" as const,
          title: t.title,
          subtitle: t.category ?? undefined,
          status: t.status,
          clientId: t.clientId
        })),
        ...proposals.map((p) => ({
          id: p.id,
          type: "proposal" as const,
          title: p.title,
          status: p.status,
          clientId: p.clientId
        })),
        ...deliverables.map((d) => ({
          id: d.id,
          type: "deliverable" as const,
          title: d.name,
          status: d.status,
          clientId: d.project.clientId
        })),
        ...articles.map((a) => ({
          id: a.id,
          type: "article" as const,
          title: a.title,
          subtitle: a.category ?? undefined,
          status: a.status
        })),
      ];

      return {
        success: true,
        data: { query: q, total: results.length, results },
        meta: { requestId: scope.requestId }
      } as ApiResponse<SearchResponse>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "SEARCH_FAILED", message: "Search query failed" }
      } as ApiResponse;
    }
  });
}
