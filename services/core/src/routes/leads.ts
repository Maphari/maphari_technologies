import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import {
  bulkUpdateLeadStatusSchema,
  createLeadSchema,
  getLeadPreferencesQuerySchema,
  mergeLeadsSchema,
  upsertLeadPreferencesSchema,
  updateLeadSchema,
  updateLeadStatusSchema
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";

export async function registerLeadRoutes(app: FastifyInstance): Promise<void> {
  async function logLeadActivity(input: { leadId: string; clientId: string | null; type: string; details?: string | null }): Promise<void> {
    if (!input.clientId) return; // Auto-prospect leads have no clientId — skip activity log
    await prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        clientId: input.clientId,  // TypeScript now knows this is string (non-null, guarded above)
        type: input.type,
        details: input.details ?? null
      }
    });
  }

  app.get("/leads", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { clientId } : {};
    const cacheKey = CacheKeys.leads(clientId);

    try {
      const cached = await cache.getJson<Awaited<ReturnType<typeof prisma.lead.findMany>>>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const leads = await prisma.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });

      await cache.setJson(cacheKey, leads, 30);

      return {
        success: true,
        data: leads,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof leads>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "LEADS_FETCH_FAILED",
          message: "Unable to fetch leads"
        }
      } as ApiResponse;
    }
  });

  app.post("/leads", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createLeadSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const resolvedClientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);

    // Auto-prospect leads (source: "auto-prospect") may have no associated client yet.
    const isAutoProspect = parsedBody.data.source === "auto-prospect" && scope.role === "ADMIN";

    if (!resolvedClientId && !isAutoProspect) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    const clientId: string | null = resolvedClientId ?? null;

    try {
      const lead = await prisma.lead.create({
        data: {
          clientId,
          title: parsedBody.data.title,
          source: parsedBody.data.source ?? null,
          status: parsedBody.data.status ?? "NEW",
          notes: parsedBody.data.notes ?? null,
          contactName: parsedBody.data.contactName ?? null,
          contactEmail: parsedBody.data.contactEmail ?? null,
          contactPhone: parsedBody.data.contactPhone ?? null,
          company: parsedBody.data.company ?? null,
          ownerName: null,
          nextFollowUpAt: null,
          lostReason: null
        }
      });

      await logLeadActivity({
        leadId: lead.id,
        clientId: lead.clientId,
        type: "CREATED",
        details: `Lead created in ${lead.status} stage`
      });

      await Promise.all([
        cache.delete(CacheKeys.leads(clientId ?? undefined)),
        cache.delete(CacheKeys.leads())
      ]);

      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.leadCreated,
        payload: {
          leadId: lead.id,
          clientId: lead.clientId ?? undefined,
          status: lead.status,
          contactName: lead.contactName ?? undefined,
          contactEmail: lead.contactEmail ?? undefined
        }
      });

      return {
        success: true,
        data: lead,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof lead>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_CREATE_FAILED",
          message: "Unable to create lead"
        }
      } as ApiResponse;
    }
  });

  app.patch<{ Params: { leadId: string } }>("/leads/:leadId/status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = updateLeadStatusSchema.safeParse({
      leadId: request.params.leadId,
      ...(request.body as object)
    });

    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead status payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    const leadScope = effectiveClientId
      ? { id: parsedBody.data.leadId, clientId: effectiveClientId }
      : { id: parsedBody.data.leadId };

    try {
      const existingLead = await prisma.lead.findFirst({
        where: leadScope
      });

      if (!existingLead) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "LEAD_NOT_FOUND",
            message: "Lead not found in current scope"
          }
        } as ApiResponse;
      }

      const lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          status: parsedBody.data.status,
          lostReason: parsedBody.data.status === "LOST" ? parsedBody.data.lostReason ?? existingLead.lostReason : null
        }
      });

      await logLeadActivity({
        leadId: lead.id,
        clientId: lead.clientId,
        type: "STATUS_CHANGED",
        details:
          parsedBody.data.status === "LOST" && parsedBody.data.lostReason
            ? `Moved ${existingLead.status} → ${lead.status}. Reason: ${parsedBody.data.lostReason}`
            : `Moved ${existingLead.status} → ${lead.status}`
      });

      await Promise.all([
        cache.delete(CacheKeys.leads(lead.clientId ?? undefined)),
        cache.delete(CacheKeys.leads())
      ]);

      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.leadStatusUpdated,
        payload: {
          leadId: lead.id,
          clientId: lead.clientId ?? undefined,
          previousStatus: existingLead.status,
          status: lead.status
        }
      });

      return {
        success: true,
        data: lead,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof lead>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_STATUS_UPDATE_FAILED",
          message: "Unable to update lead status"
        }
      } as ApiResponse;
    }
  });

  app.patch<{ Params: { leadId: string } }>("/leads/:leadId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = updateLeadSchema.safeParse({
      leadId: request.params.leadId,
      ...(request.body as object)
    });

    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead update payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    if (scope.role === "CLIENT" && parsedBody.data.ownerName !== undefined) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "CLIENT cannot reassign lead ownership"
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    const leadScope = effectiveClientId
      ? { id: parsedBody.data.leadId, clientId: effectiveClientId }
      : { id: parsedBody.data.leadId };

    try {
      const existingLead = await prisma.lead.findFirst({ where: leadScope });
      if (!existingLead) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "LEAD_NOT_FOUND",
            message: "Lead not found in current scope"
          }
        } as ApiResponse;
      }

      const lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          title: parsedBody.data.title ?? existingLead.title,
          source: parsedBody.data.source ?? existingLead.source,
          notes: parsedBody.data.notes ?? existingLead.notes,
          contactName: parsedBody.data.contactName ?? existingLead.contactName,
          contactEmail: parsedBody.data.contactEmail ?? existingLead.contactEmail,
          contactPhone: parsedBody.data.contactPhone ?? existingLead.contactPhone,
          company: parsedBody.data.company ?? existingLead.company,
          ownerName: parsedBody.data.ownerName ?? existingLead.ownerName,
          nextFollowUpAt:
            parsedBody.data.nextFollowUpAt !== undefined
              ? parsedBody.data.nextFollowUpAt ? new Date(parsedBody.data.nextFollowUpAt) : null
              : existingLead.nextFollowUpAt
        }
      });

      await logLeadActivity({
        leadId: lead.id,
        clientId: lead.clientId,
        type: "UPDATED",
        details: "Lead details updated"
      });

      if (lead.nextFollowUpAt && lead.nextFollowUpAt.getTime() <= Date.now()) {
        await eventBus.publish({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          requestId: scope.requestId,
          traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
          topic: EventTopics.leadFollowUpDue,
          payload: {
            leadId: lead.id,
            clientId: lead.clientId ?? undefined,
            nextFollowUpAt: lead.nextFollowUpAt.toISOString(),
            ownerName: lead.ownerName ?? null
          }
        });
      }

      await Promise.all([
        cache.delete(CacheKeys.leads(lead.clientId ?? undefined)),
        cache.delete(CacheKeys.leads())
      ]);

      return {
        success: true,
        data: lead,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof lead>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_UPDATE_FAILED",
          message: "Unable to update lead"
        }
      } as ApiResponse;
    }
  });

  app.post("/leads/bulk-status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "CLIENT cannot bulk update leads" }
      } as ApiResponse;
    }
    const parsedBody = bulkUpdateLeadStatusSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid bulk lead status payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const leads = await prisma.lead.findMany({
        where: {
          id: { in: parsedBody.data.leadIds },
          ...(effectiveClientId ? { clientId: effectiveClientId } : {})
        }
      });

      const updated: typeof leads = [];
      for (const lead of leads) {
        const next = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: parsedBody.data.status,
            lostReason: parsedBody.data.status === "LOST" ? parsedBody.data.lostReason ?? lead.lostReason : null
          }
        });
        updated.push(next);
        await logLeadActivity({
          leadId: next.id,
          clientId: next.clientId,
          type: "STATUS_CHANGED_BULK",
          details: `Bulk moved ${lead.status} → ${next.status}`
        });
      }

      const touchedClientIds = Array.from(new Set(updated.map((lead) => lead.clientId ?? undefined)));
      await Promise.all([
        cache.delete(CacheKeys.leads()),
        ...touchedClientIds.map((clientId) => cache.delete(CacheKeys.leads(clientId)))
      ]);

      return {
        success: true,
        data: updated,
        meta: { requestId: scope.requestId, count: updated.length }
      } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_BULK_UPDATE_FAILED",
          message: "Unable to bulk update leads"
        }
      } as ApiResponse;
    }
  });

  app.post("/leads/merge", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only ADMIN can merge leads" }
      } as ApiResponse;
    }
    const parsedBody = mergeLeadsSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid merge payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const [primary, duplicate] = await Promise.all([
        prisma.lead.findFirst({
          where: {
            id: parsedBody.data.primaryLeadId,
            ...(effectiveClientId ? { clientId: effectiveClientId } : {})
          }
        }),
        prisma.lead.findFirst({
          where: {
            id: parsedBody.data.duplicateLeadId,
            ...(effectiveClientId ? { clientId: effectiveClientId } : {})
          }
        })
      ]);

      if (!primary || !duplicate) {
        reply.status(404);
        return {
          success: false,
          error: { code: "LEAD_NOT_FOUND", message: "Lead not found for merge" }
        } as ApiResponse;
      }

      if (primary.id === duplicate.id) {
        reply.status(400);
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Cannot merge the same lead" }
        } as ApiResponse;
      }

      await prisma.$transaction(async (tx) => {
        await tx.leadActivity.updateMany({
          where: { leadId: duplicate.id },
          data: { leadId: primary.id }
        });

        await tx.lead.update({
          where: { id: primary.id },
          data: {
            notes: [primary.notes, duplicate.notes].filter(Boolean).join("\n\n").trim() || null,
            source: primary.source ?? duplicate.source,
            contactName: primary.contactName ?? duplicate.contactName,
            contactEmail: primary.contactEmail ?? duplicate.contactEmail,
            contactPhone: primary.contactPhone ?? duplicate.contactPhone,
            company: primary.company ?? duplicate.company,
            ownerName: primary.ownerName ?? duplicate.ownerName,
            nextFollowUpAt: primary.nextFollowUpAt ?? duplicate.nextFollowUpAt,
            status: primary.status === "LOST" && duplicate.status !== "LOST" ? duplicate.status : primary.status
          }
        });

        await tx.lead.delete({ where: { id: duplicate.id } });
      });

      await logLeadActivity({
        leadId: primary.id,
        clientId: primary.clientId,
        type: "MERGED",
        details: `Merged duplicate lead ${duplicate.id}`
      });

      await Promise.all([
        cache.delete(CacheKeys.leads(primary.clientId ?? undefined)),
        cache.delete(CacheKeys.leads(duplicate.clientId ?? undefined)),
        cache.delete(CacheKeys.leads())
      ]);

      const mergedLead = await prisma.lead.findUnique({ where: { id: primary.id } });

      return {
        success: true,
        data: mergedLead,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof mergedLead>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_MERGE_FAILED",
          message: "Unable to merge leads"
        }
      } as ApiResponse;
    }
  });

  app.get<{ Params: { leadId: string } }>("/leads/:leadId/activities", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const lead = await prisma.lead.findFirst({
        where: {
          id: request.params.leadId,
          ...(effectiveClientId ? { clientId: effectiveClientId } : {})
        }
      });

      if (!lead) {
        reply.status(404);
        return {
          success: false,
          error: { code: "LEAD_NOT_FOUND", message: "Lead not found in current scope" }
        } as ApiResponse;
      }

      const activities = await prisma.leadActivity.findMany({
        where: { leadId: lead.id },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      return {
        success: true,
        data: activities,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof activities>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_ACTIVITIES_FETCH_FAILED",
          message: "Unable to fetch lead activities"
        }
      } as ApiResponse;
    }
  });

  app.get("/leads/analytics", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const leads = await prisma.lead.findMany({
        where: effectiveClientId ? { clientId: effectiveClientId } : {}
      });

      const leadIds = leads.map((lead) => lead.id);
      const activities = leadIds.length
        ? await prisma.leadActivity.findMany({
            where: { leadId: { in: leadIds } },
            orderBy: { createdAt: "asc" }
          })
        : [];

      const latestTransitionAt = new Map<string, Date>();
      for (const activity of activities) {
        if (activity.type === "STATUS_CHANGED" || activity.type === "STATUS_CHANGED_BULK") {
          latestTransitionAt.set(activity.leadId, activity.createdAt);
        }
      }

      const now = Date.now();
      const avgTimeInStageDays = leads.length
        ? leads.reduce((sum, lead) => {
            const at = latestTransitionAt.get(lead.id) ?? lead.createdAt;
            return sum + Math.max(0, now - at.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / leads.length
        : 0;

      const total = leads.length;
      const won = leads.filter((lead) => lead.status === "WON").length;
      const lost = leads.filter((lead) => lead.status === "LOST").length;
      const conversionRate = total > 0 ? (won / total) * 100 : 0;

      return {
        success: true,
        data: {
          total,
          won,
          lost,
          conversionRate,
          avgTimeInStageDays
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse<{
        total: number;
        won: number;
        lost: number;
        conversionRate: number;
        avgTimeInStageDays: number;
      }>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "LEAD_ANALYTICS_FETCH_FAILED",
          message: "Unable to fetch lead analytics"
        }
      } as ApiResponse;
    }
  });

  // ─── Pipeline Conversion Analytics ──────────────────────────────────────
  app.get("/pipeline/conversion-analytics", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "CLIENT cannot access pipeline analytics" }
      } as ApiResponse;
    }

    try {
      const leads = await prisma.lead.findMany({
        orderBy: { createdAt: "asc" }
      });

      // Stage order for funnel
      const FUNNEL_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
      type LeadStatus = typeof FUNNEL_STAGES[number];

      // Count and estimated value per stage
      const stageCounts: Record<string, number> = {};
      const stageValues: Record<string, number> = {};
      for (const stage of FUNNEL_STAGES) {
        stageCounts[stage] = 0;
        stageValues[stage] = 0;
      }
      for (const lead of leads) {
        const s = lead.status as string;
        if (s in stageCounts) {
          stageCounts[s]++;
          // estimatedValue field may not exist on all leads — default 0
          stageValues[s] += (lead as unknown as { estimatedValue?: number }).estimatedValue ?? 0;
        }
      }

      // Build funnel stages with conversion rates
      const funnel = FUNNEL_STAGES.map((stage, i) => {
        const count = stageCounts[stage];
        const value = stageValues[stage];
        let conversionRate = 0;
        if (i > 0) {
          const prevCount = stageCounts[FUNNEL_STAGES[i - 1]];
          conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
        } else {
          conversionRate = 100;
        }
        return { stage, count, value, conversionRate };
      });

      // Average deal size (won leads only)
      const wonLeads = leads.filter((l) => l.status === "WON");
      const wonValues = wonLeads.map((l) => (l as unknown as { estimatedValue?: number }).estimatedValue ?? 0);
      const avgDealSizeZAR = wonLeads.length > 0
        ? Math.round(wonValues.reduce((a, b) => a + b, 0) / wonLeads.length)
        : 0;

      // Average sales cycle (days from created to won)
      const activities = leads.length
        ? await prisma.leadActivity.findMany({
            where: { leadId: { in: leads.map((l) => l.id) }, type: "STATUS_CHANGED" },
            orderBy: { createdAt: "asc" }
          })
        : [];

      // Build map: leadId → date when it reached WON
      const wonDateMap = new Map<string, Date>();
      for (const act of activities) {
        if (act.details?.includes("→ WON")) {
          wonDateMap.set(act.leadId, act.createdAt);
        }
      }
      let avgSalesCycleDays = 0;
      if (wonLeads.length > 0) {
        const cycleDays = wonLeads.map((l) => {
          const wonAt = wonDateMap.get(l.id) ?? l.updatedAt;
          return Math.max(0, Math.round((wonAt.getTime() - l.createdAt.getTime()) / 86400000));
        });
        avgSalesCycleDays = Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length);
      }

      // Won / lost this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const wonThisMonth = leads.filter((l) => l.status === "WON" && l.updatedAt >= monthStart).length;
      const lostThisMonth = leads.filter((l) => l.status === "LOST" && l.updatedAt >= monthStart).length;

      // Forecast: PROPOSAL + QUALIFIED leads × avg deal size
      const pipelineCount = stageCounts["PROPOSAL"] + stageCounts["QUALIFIED"];
      const forecastNextMonth = pipelineCount * avgDealSizeZAR;

      // Top loss reasons
      const lostLeads = leads.filter((l) => l.status === "LOST" && l.lostReason);
      const reasonCounts: Record<string, number> = {};
      for (const lead of lostLeads) {
        const r = lead.lostReason?.trim() ?? "Unknown";
        reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
      }
      const topLossReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly trend: last 6 months
      const months: { month: string; won: number; lost: number; revenue: number }[] = [];
      for (let offset = 5; offset >= 0; offset--) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const mWon = leads.filter((l) => l.status === "WON" && l.updatedAt >= mStart && l.updatedAt < mEnd);
        const mLost = leads.filter((l) => l.status === "LOST" && l.updatedAt >= mStart && l.updatedAt < mEnd);
        const revenue = mWon.reduce((s, l) => s + ((l as unknown as { estimatedValue?: number }).estimatedValue ?? 0), 0);
        months.push({ month: label, won: mWon.length, lost: mLost.length, revenue });
      }

      return {
        success: true,
        data: {
          funnel,
          avgDealSizeZAR,
          avgSalesCycleDays,
          wonThisMonth,
          lostThisMonth,
          forecastNextMonth,
          topLossReasons,
          monthlyTrend: months
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse<{
        funnel: { stage: string; count: number; value: number; conversionRate: number }[];
        avgDealSizeZAR: number;
        avgSalesCycleDays: number;
        wonThisMonth: number;
        lostThisMonth: number;
        forecastNextMonth: number;
        topLossReasons: { reason: string; count: number }[];
        monthlyTrend: { month: string; won: number; lost: number; revenue: number }[];
      }>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "PIPELINE_ANALYTICS_FETCH_FAILED",
          message: "Unable to fetch pipeline analytics"
        }
      } as ApiResponse;
    }
  });

  app.get("/leads/preferences", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getLeadPreferencesQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid preference query",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }
    if (!scope.userId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "x-user-id is required" }
      } as ApiResponse;
    }
    try {
      const preference = await prisma.userPreference.findUnique({
        where: { userId_key: { userId: scope.userId, key: parsed.data.key } }
      });
      return {
        success: true,
        data: preference,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof preference>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PREFERENCE_FETCH_FAILED", message: "Unable to fetch lead preferences" }
      } as ApiResponse;
    }
  });

  app.post("/leads/preferences", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = upsertLeadPreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid preference payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }
    if (!scope.userId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "x-user-id is required" }
      } as ApiResponse;
    }
    try {
      const preference = await prisma.userPreference.upsert({
        where: { userId_key: { userId: scope.userId, key: parsed.data.key } },
        update: { value: parsed.data.value },
        create: { userId: scope.userId, key: parsed.data.key, value: parsed.data.value }
      });
      return {
        success: true,
        data: preference,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof preference>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PREFERENCE_SAVE_FAILED", message: "Unable to save lead preferences" }
      } as ApiResponse;
    }
  });
}
