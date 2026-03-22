// ════════════════════════════════════════════════════════════════════════════
// project-templates.ts — Admin project template CRUD + apply
// Routes: GET/POST /admin/project-templates
//         DELETE   /admin/project-templates/:id
//         POST     /admin/project-templates/:id/apply
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { randomUUID } from "crypto";

interface TemplatePhase {
  name: string;
  milestones?: Array<{ name: string; days?: number }>;
  tasks?: Array<{ name: string }>;
}

function countPhases(phases: TemplatePhase[]): number {
  return phases.length;
}

function countTasks(phases: TemplatePhase[]): number {
  return phases.reduce((sum, p) => sum + (p.tasks?.length ?? 0), 0);
}

export async function registerProjectTemplateRoutes(app: FastifyInstance): Promise<void> {

  // GET /admin/project-templates
  app.get("/admin/project-templates", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse);
    }
    try {
      const templates = await prisma.projectTemplate.findMany({ orderBy: { createdAt: "desc" } });
      const data = templates.map((t) => {
        const phases = Array.isArray(t.phases) ? (t.phases as TemplatePhase[]) : [];
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          phaseCount: countPhases(phases),
          taskCount: countTasks(phases),
          createdAt: t.createdAt.toISOString(),
        };
      });
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "TEMPLATE_LIST_FAILED", message: "Failed to list templates." } } as ApiResponse);
    }
  });

  // POST /admin/project-templates
  app.post("/admin/project-templates", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse);
    }

    const body = request.body as { name?: unknown; description?: unknown; phases?: unknown; sourceProjectId?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "name is required." } } as ApiResponse);
    }

    let phases: TemplatePhase[] = [];

    // If sourceProjectId provided, extract phases from existing project
    const sourceId = typeof body?.sourceProjectId === "string" ? body.sourceProjectId.trim() : null;
    if (sourceId) {
      const sourcePhases = await prisma.projectPhase.findMany({
        where: { projectId: sourceId },
        orderBy: { sortOrder: "asc" },
      });
      phases = sourcePhases.map((ph) => ({
        name: ph.name,
      }));
    } else {
      const raw = body?.phases;
      if (!Array.isArray(raw)) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "phases must be an array." } } as ApiResponse);
      }
      phases = raw as TemplatePhase[];
    }

    try {
      const template = await prisma.projectTemplate.create({
        data: {
          id: randomUUID(),
          name,
          description: typeof body?.description === "string" ? body.description.trim() || null : null,
          phases,
          createdBy: scope.userId ?? null,
        },
      });
      return {
        success: true,
        data: {
          id: template.id,
          name: template.name,
          description: template.description,
          phaseCount: phases.length,
          createdAt: template.createdAt.toISOString(),
        },
        meta: { requestId: scope.requestId },
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "TEMPLATE_CREATE_FAILED", message: "Failed to create template." } } as ApiResponse);
    }
  });

  // DELETE /admin/project-templates/:id
  app.delete("/admin/project-templates/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    try {
      await prisma.projectTemplate.delete({ where: { id } });
      return { success: true, data: { success: true }, meta: { requestId: scope.requestId } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "TEMPLATE_DELETE_FAILED", message: "Failed to delete template." } } as ApiResponse);
    }
  });

  // POST /admin/project-templates/:id/apply
  app.post("/admin/project-templates/:id/apply", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { projectId?: unknown } | null;
    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
    if (!projectId) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "projectId is required." } } as ApiResponse);
    }

    try {
      const template = await prisma.projectTemplate.findUnique({ where: { id } });
      if (!template) {
        return reply.status(404).send({ success: false, error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found." } } as ApiResponse);
      }

      // Look up the project to get clientId (required for ProjectPhase)
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } });
      if (!project) {
        return reply.status(404).send({ success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found." } } as ApiResponse);
      }

      const phases = Array.isArray(template.phases) ? (template.phases as TemplatePhase[]) : [];
      let phasesCreated = 0;

      for (let i = 0; i < phases.length; i++) {
        const ph = phases[i];
        await prisma.projectPhase.create({
          data: {
            id: randomUUID(),
            projectId,
            clientId: project.clientId,
            name: ph.name,
            sortOrder: i + 1,
          },
        });
        phasesCreated++;
      }

      return {
        success: true,
        data: { phasesCreated, milestonesCreated: 0, tasksCreated: 0 },
        meta: { requestId: scope.requestId },
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "TEMPLATE_APPLY_FAILED", message: "Failed to apply template." } } as ApiResponse);
    }
  });
}
