// ════════════════════════════════════════════════════════════════════════════
// hr.ts — Learning & Development: budget and skill proficiency routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF read-own; CLIENT forbidden
//
// Endpoints:
//   GET  /hr/learning-budgets               → list all for current fiscal year
//   PUT  /hr/learning-budgets/:staffId       → upsert budget
//   GET  /hr/skill-proficiency              → list all
//   PUT  /hr/skill-proficiency/:staffId/:skill → upsert
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerHrRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /hr/learning-budgets ───────────────────────────────────────────────
  app.get("/hr/learning-budgets", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const year = new Date().getFullYear();
    const budgets = await prisma.staffLearningBudget.findMany({
      where: { fiscalYear: year },
      include: { staff: { select: { name: true } } },
      orderBy: { createdAt: "asc" }
    });

    return { success: true, data: budgets, meta: { requestId: scope.requestId } } as ApiResponse<typeof budgets>;
  });

  // ── PUT /hr/learning-budgets/:staffId ──────────────────────────────────────
  app.put("/hr/learning-budgets/:staffId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update learning budgets." } } as ApiResponse);
    }

    const { staffId } = request.params as { staffId: string };
    const body = request.body as { budgetZAR?: number; spentZAR?: number; fiscalYear?: number };
    const fiscalYear = body.fiscalYear ?? new Date().getFullYear();
    const budgetZAR = body.budgetZAR ?? 0;
    const spentZAR = body.spentZAR ?? 0;

    const budget = await prisma.staffLearningBudget.upsert({
      where: { staffId_fiscalYear: { staffId, fiscalYear } },
      update: { budgetZAR, spentZAR },
      create: { staffId, fiscalYear, budgetZAR, spentZAR },
    });

    return { success: true, data: budget, meta: { requestId: scope.requestId } } as ApiResponse<typeof budget>;
  });

  // ── GET /hr/skill-proficiency ──────────────────────────────────────────────
  app.get("/hr/skill-proficiency", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const skills = await prisma.staffSkillProficiency.findMany({
      include: { staff: { select: { name: true } } },
      orderBy: [{ staffId: "asc" }, { skill: "asc" }]
    });

    return { success: true, data: skills, meta: { requestId: scope.requestId } } as ApiResponse<typeof skills>;
  });

  // ── PUT /hr/skill-proficiency/:staffId/:skill ──────────────────────────────
  app.put("/hr/skill-proficiency/:staffId/:skill", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update skill proficiency." } } as ApiResponse);
    }

    const { staffId, skill } = request.params as { staffId: string; skill: string };
    const body = request.body as { level?: number; certifiedAt?: string | null };
    const level = body.level ?? 0;
    const certifiedAt = body.certifiedAt ? new Date(body.certifiedAt) : null;

    const record = await prisma.staffSkillProficiency.upsert({
      where: { staffId_skill: { staffId, skill } },
      update: { level, certifiedAt },
      create: { staffId, skill, level, certifiedAt },
    });

    return { success: true, data: record, meta: { requestId: scope.requestId } } as ApiResponse<typeof record>;
  });
}
