import type { FastifyInstance } from "fastify";
import {
  createProjectBlockerSchema,
  getProjectBlockersQuerySchema,
  getTimelineQuerySchema,
  type ApiResponse,
  updateProjectBlockerSchema
} from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

type TimelineRow = {
  id: string;
  clientId: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
};

export async function registerBlockerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/blockers", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getProjectBlockersQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blocker query payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId, parsed.data.clientId);
    const where = {
      ...(effectiveClientId ? { clientId: effectiveClientId } : {}),
      ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.severity ? { severity: parsed.data.severity } : {})
    };

    const blockers = await prisma.projectBlocker.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: parsed.data.limit ?? 100
    });

    return {
      success: true,
      data: blockers,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof blockers>;
  });

  app.post("/blockers", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createProjectBlockerSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blocker payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { clientId: true }
    });
    if (!project) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId, parsed.data.clientId ?? project.clientId);
    if (!effectiveClientId || effectiveClientId !== project.clientId) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Blocker does not belong to scoped client"
        }
      } as ApiResponse;
    }

    const blocker = await prisma.projectBlocker.create({
      data: {
        clientId: project.clientId,
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        severity: parsed.data.severity ?? "MEDIUM",
        status: parsed.data.status ?? "OPEN",
        ownerRole: parsed.data.ownerRole ?? null,
        ownerName: parsed.data.ownerName ?? null,
        etaAt: parsed.data.etaAt ? new Date(parsed.data.etaAt) : null
      }
    });

    await prisma.projectActivity.create({
      data: {
        projectId: blocker.projectId,
        clientId: blocker.clientId,
        type: "BLOCKER_CREATED",
        details: blocker.title
      }
    });

    return {
      success: true,
      data: blocker,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof blocker>;
  });

  app.patch<{ Params: { blockerId: string } }>("/blockers/:blockerId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = updateProjectBlockerSchema.safeParse({
      blockerId: request.params.blockerId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blocker update payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const existing = await prisma.projectBlocker.findUnique({
      where: { id: parsed.data.blockerId }
    });
    if (!existing) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "BLOCKER_NOT_FOUND",
          message: "Blocker not found"
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId, existing.clientId);
    if (!effectiveClientId || effectiveClientId !== existing.clientId) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Blocker does not belong to scoped client"
        }
      } as ApiResponse;
    }

    const blocker = await prisma.projectBlocker.update({
      where: { id: parsed.data.blockerId },
      data: {
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description ?? null } : {}),
        ...(parsed.data.severity ? { severity: parsed.data.severity } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.ownerRole !== undefined ? { ownerRole: parsed.data.ownerRole ?? null } : {}),
        ...(parsed.data.ownerName !== undefined ? { ownerName: parsed.data.ownerName ?? null } : {}),
        ...(parsed.data.etaAt !== undefined ? { etaAt: parsed.data.etaAt ? new Date(parsed.data.etaAt) : null } : {}),
        ...(parsed.data.resolvedAt !== undefined ? { resolvedAt: parsed.data.resolvedAt ? new Date(parsed.data.resolvedAt) : null } : {})
      }
    });

    await prisma.projectActivity.create({
      data: {
        projectId: blocker.projectId,
        clientId: blocker.clientId,
        type: "BLOCKER_UPDATED",
        details: `${blocker.title} · ${blocker.status}`
      }
    });

    return {
      success: true,
      data: blocker,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof blocker>;
  });

  app.get("/timeline", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getTimelineQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid timeline query payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }
    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId, parsed.data.clientId);
    const whereProject = {
      ...(effectiveClientId ? { clientId: effectiveClientId } : {}),
      ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {})
    };

    const [projectActivities, leadActivities, blockers] = await Promise.all([
      prisma.projectActivity.findMany({
        where: whereProject,
        orderBy: { createdAt: "desc" },
        take: parsed.data.limit ?? 60
      }),
      prisma.leadActivity.findMany({
        where: {
          ...(effectiveClientId ? { clientId: effectiveClientId } : {})
        },
        orderBy: { createdAt: "desc" },
        take: parsed.data.limit ?? 60
      }),
      prisma.projectBlocker.findMany({
        where: {
          ...(effectiveClientId ? { clientId: effectiveClientId } : {}),
          ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {})
        },
        orderBy: { updatedAt: "desc" },
        take: parsed.data.limit ?? 60
      })
    ]);

    const rows: TimelineRow[] = [
      ...projectActivities.map((activity) => ({
        id: `project-${activity.id}`,
        clientId: activity.clientId,
        projectId: activity.projectId,
        category: "PROJECT" as const,
        title: activity.type,
        detail: activity.details,
        createdAt: activity.createdAt.toISOString()
      })),
      ...leadActivities.map((activity) => ({
        id: `lead-${activity.id}`,
        clientId: activity.clientId,
        projectId: null,
        category: "LEAD" as const,
        title: activity.type,
        detail: activity.details,
        createdAt: activity.createdAt.toISOString()
      })),
      ...blockers.map((blocker) => ({
        id: `blocker-${blocker.id}`,
        clientId: blocker.clientId,
        projectId: blocker.projectId,
        category: "BLOCKER" as const,
        title: `${blocker.status} blocker: ${blocker.title}`,
        detail: blocker.ownerName ? `Owner: ${blocker.ownerName}` : blocker.description,
        createdAt: blocker.updatedAt.toISOString()
      }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, parsed.data.limit ?? 80);

    return {
      success: true,
      data: rows,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof rows>;
  });
}

