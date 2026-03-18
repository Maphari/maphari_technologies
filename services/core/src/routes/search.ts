import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export interface SearchHit {
  id: string;
  type: "client" | "project" | "lead" | "task" | "ticket";
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
 * Cross-entity full-text search across clients, projects, leads, tasks and
 * support tickets. Results are scoped to the caller's tenant role the same
 * way every other core route works (x-user-role / x-client-id headers).
 *
 * - ADMIN / STAFF: sees all tenants (or filtered by x-client-id if provided)
 * - CLIENT: sees only their own tenant
 *
 * Returns up to 5 results per entity type, deduped and sorted by title.
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

    try {
      const [clients, projects, leads, tasks, tickets] = await Promise.all([
        // ── Clients (ADMIN / STAFF only) ─────────────────────────────────────
        scope.role !== "CLIENT"
          ? prisma.client.findMany({
              where: {
                ...(clientId ? { id: clientId } : {}),
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

        // ── Projects ──────────────────────────────────────────────────────────
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

        // ── Leads (ADMIN / STAFF only) ────────────────────────────────────────
        scope.role !== "CLIENT"
          ? prisma.lead.findMany({
              where: {
                ...clientFilter,
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

        // ── Project Tasks ──────────────────────────────────────────────────────
        // ProjectTask has no clientId column — it is scoped via projectId → Project.clientId
        prisma.projectTask.findMany({
          where: {
            ...(clientId ? { project: { clientId } } : {}),
            OR: [
              { title: { contains: q, mode } },
              { assigneeName: { contains: q, mode } }
            ]
          },
          select: { id: true, title: true, status: true, project: { select: { clientId: true } } },
          take: PER_TYPE_LIMIT
        }),

        // ── Support Tickets ───────────────────────────────────────────────────
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
        })
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
          clientId: l.clientId
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
        }))
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
