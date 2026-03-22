// ════════════════════════════════════════════════════════════════════════════
// satisfaction.ts — Satisfaction Survey routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : CLIENT read-own + respond; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { randomUUID } from "crypto";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerSatisfactionRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /satisfaction — Admin/Staff: all surveys across all clients ─────────
  app.get("/satisfaction", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Use /clients/:id/surveys to view your surveys." } } as ApiResponse);
    }
    const data = await withCache("satisfaction:all", 120, () =>
      prisma.satisfactionSurvey.findMany({ orderBy: { createdAt: "desc" } })
    );
    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /clients/:clientId/surveys ────────────────────────────────────────
  app.get("/clients/:clientId/surveys", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.surveys(clientId), 120, () =>
      prisma.satisfactionSurvey.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /clients/:clientId/surveys ───────────────────────────────────────
  app.post("/clients/:clientId/surveys", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot create surveys." } } as ApiResponse);
    }

    const { clientId } = request.params as { clientId: string };
    const body = request.body as {
      periodStart: string;
      periodEnd: string;
    };

    const survey = await prisma.satisfactionSurvey.create({
      data: {
        clientId,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        status: "PENDING"
      }
    });

    await cache.delete(CacheKeys.surveys(clientId));

    return reply.code(201).send({ success: true, data: survey, meta: { requestId: scope.requestId } } as ApiResponse<typeof survey>);
  });

  // ── GET /clients/:clientId/surveys/:surveyId/responses ────────────────────
  app.get("/clients/:clientId/surveys/:surveyId/responses", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId, surveyId } = request.params as { clientId: string; surveyId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.surveyResponses(surveyId), 120, () =>
      prisma.satisfactionResponse.findMany({
        where: { surveyId },
        orderBy: { createdAt: "asc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /portal/nps-pending — milestones completed in last 7d without NPS ──
  app.get("/portal/nps-pending", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.clientId) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "clientId scope is required" } } as ApiResponse);
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find milestones completed in last 7 days for this client's projects
    const milestones = await prisma.projectMilestone.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: since },
        project: { clientId: scope.clientId },
      },
      include: { project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Find milestones that already have an NPS comm log for this client
    const answeredIds = await prisma.communicationLog.findMany({
      where: {
        clientId: scope.clientId,
        type: "NPS_RESPONSE",
      },
      select: { subject: true },
    }).then((rows) => new Set(rows.map((r) => r.subject)));

    const pending = milestones
      .filter((m) => !answeredIds.has(m.id))
      .map((m) => ({
        milestoneId:    m.id,
        milestoneTitle: m.title,
        projectName:    m.project.name,
        completedAt:    m.updatedAt.toISOString(),
      }));

    return { success: true, data: pending, meta: { requestId: scope.requestId } } as ApiResponse<typeof pending>;
  });

  // ── POST /portal/nps-response — submit NPS score for a milestone ──────────
  app.post("/portal/nps-response", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.clientId) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "clientId scope is required" } } as ApiResponse);
    }

    const body = request.body as {
      milestoneId: string;
      score: number;
      comment?: string;
    };

    if (body.score === undefined || body.score < 0 || body.score > 10) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "score must be 0–10" } } as ApiResponse);
    }
    if (!body.milestoneId) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "milestoneId is required" } } as ApiResponse);
    }

    // Store as a CommunicationLog with type NPS_RESPONSE
    const log = await prisma.communicationLog.create({
      data: {
        clientId:   scope.clientId,
        type:       "NPS_RESPONSE",
        subject:    body.milestoneId,
        direction:  "INBOUND",
        fromName:   scope.userId ?? null,
        actionLabel: JSON.stringify({ score: body.score, comment: body.comment ?? null }),
        occurredAt: new Date(),
      },
    });

    await cache.delete(CacheKeys.commLogs(scope.clientId));

    return reply.code(201).send({ success: true, data: { id: log.id, success: true } } as ApiResponse<{ id: string; success: boolean }>);
  });

  // ── POST /clients/:clientId/surveys/:surveyId/responses ───────────────────
  app.post("/clients/:clientId/surveys/:surveyId/responses", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { clientId, surveyId } = request.params as { clientId: string; surveyId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    // Verify survey belongs to this client
    const survey = await prisma.satisfactionSurvey.findFirst({ where: { id: surveyId, clientId } });
    if (!survey) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Survey not found." } } as ApiResponse);
    }

    const body = request.body as {
      responses: Array<{ question: string; answer: string }>;
      npsScore?: number;
      csatScore?: number;
    };

    const created = await prisma.$transaction(async (tx) => {
      const rows = await tx.satisfactionResponse.createMany({
        data: body.responses.map((r) => ({
          surveyId,
          question: r.question,
          answer: r.answer
        }))
      });

      const updatedSurvey = await tx.satisfactionSurvey.update({
        where: { id: surveyId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          npsScore: body.npsScore ?? null,
          csatScore: body.csatScore ?? null
        }
      });

      return { survey: updatedSurvey, count: rows.count };
    });

    await cache.delete(CacheKeys.surveys(clientId));
    await cache.delete(CacheKeys.surveyResponses(surveyId));

    return reply.code(201).send({ success: true, data: created, meta: { requestId: scope.requestId } } as ApiResponse<typeof created>);
  });

  // ── POST /clients/:clientId/surveys/:surveyId/tokens ─────────────────────
  // Admin/Staff only — generates a share token for the specified survey
  app.post("/clients/:clientId/surveys/:surveyId/tokens", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot generate survey tokens." } } as ApiResponse);
    }

    const { clientId, surveyId } = request.params as { clientId: string; surveyId: string };

    const survey = await prisma.satisfactionSurvey.findFirst({ where: { id: surveyId, clientId } });
    if (!survey) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Survey not found." } } as ApiResponse);
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.surveyToken.create({
      data: { token, surveyId, clientId, expiresAt }
    });

    const portalBase = process.env.PORTAL_BASE_URL ?? "http://localhost:3000";
    const surveyUrl = `${portalBase}/survey/${token}`;

    return reply.code(201).send({
      success: true,
      data: { token, expiresAt: expiresAt.toISOString(), surveyUrl },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ token: string; expiresAt: string; surveyUrl: string }>);
  });

  // ── GET /public/survey/:token ────────────────────────────────────────────
  // Public — no auth required
  app.get("/public/survey/:token", async (request, reply) => {
    const { token } = request.params as { token: string };

    const tokenRecord = await prisma.surveyToken.findUnique({
      where: { token },
      include: { survey: true, client: true }
    });

    if (!tokenRecord) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Survey not found." } } as ApiResponse);
    }

    if (tokenRecord.usedAt !== null) {
      return reply.code(410).send({ success: false, error: { code: "GONE", message: "This survey has already been completed." } } as ApiResponse);
    }

    if (tokenRecord.expiresAt < new Date()) {
      return reply.code(410).send({ success: false, error: { code: "GONE", message: "This survey link has expired." } } as ApiResponse);
    }

    const data = {
      surveyId: tokenRecord.surveyId,
      clientId: tokenRecord.clientId,
      companyName: tokenRecord.client.name,
      periodStart: tokenRecord.survey.periodStart.toISOString(),
      periodEnd: tokenRecord.survey.periodEnd.toISOString()
    };

    return { success: true, data } as ApiResponse<typeof data>;
  });

  // ── POST /public/survey/:token/respond ───────────────────────────────────
  // Public — no auth required
  app.post("/public/survey/:token/respond", async (request, reply) => {
    const { token } = request.params as { token: string };
    const body = request.body as { npsScore: number; comment?: string };

    if (body.npsScore === undefined || body.npsScore === null || body.npsScore < 0 || body.npsScore > 10) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "npsScore must be an integer from 0 to 10." } } as ApiResponse);
    }

    const tokenRecord = await prisma.surveyToken.findUnique({
      where: { token },
      include: { survey: true, client: true }
    });

    if (!tokenRecord) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Survey not found." } } as ApiResponse);
    }

    if (tokenRecord.usedAt !== null) {
      return reply.code(410).send({ success: false, error: { code: "GONE", message: "This survey has already been completed." } } as ApiResponse);
    }

    if (tokenRecord.expiresAt < new Date()) {
      return reply.code(410).send({ success: false, error: { code: "GONE", message: "This survey link has expired." } } as ApiResponse);
    }

    const npsScore = Math.round(body.npsScore);
    const comment = body.comment?.trim();

    await prisma.satisfactionResponse.create({
      data: {
        surveyId: tokenRecord.surveyId,
        question: "NPS",
        answer: String(npsScore),
        ...(comment ? { comment } : {})
      }
    });

    await prisma.satisfactionSurvey.update({
      where: { id: tokenRecord.surveyId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        npsScore
      }
    });

    await prisma.surveyToken.update({
      where: { token },
      data: { usedAt: new Date() }
    });

    await cache.delete(CacheKeys.surveys(tokenRecord.clientId));
    await cache.delete(CacheKeys.surveyResponses(tokenRecord.surveyId));

    return { success: true, data: { success: true } } as ApiResponse<{ success: boolean }>;
  });
}
