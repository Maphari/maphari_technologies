import type { FastifyInstance } from "fastify";
import {
  createProjectCollaborationNoteSchema,
  createProjectDependencySchema,
  createProjectMilestoneSchema,
  decideProjectRequestSchema,
  createProjectRequestSchema,
  createProjectSchema,
  createProjectWorkSessionSchema,
  createProjectTaskSchema,
  createTaskCollaboratorSchema,
  getProjectPreferencesQuerySchema,
  getProjectQuerySchema,
  markProjectPaymentMilestoneSchema,
  type ApiResponse,
  updateProjectWorkSessionSchema,
  updateTaskCollaboratorSchema,
  updateProjectMilestoneSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  updateProjectTaskSchema,
  upsertProjectPreferencesSchema
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";

function canManageInternalCollaboration(role: string): boolean {
  return role === "ADMIN" || role === "STAFF";
}

/**
 * Converts BigInt fields returned by Prisma to JSON-serializable numbers.
 * Prisma maps `budgetCents BigInt` to a JS BigInt — JSON.stringify throws on
 * BigInt, which would break both cache writes and HTTP response serialization.
 */
function toProjectDto<T extends { budgetCents: bigint }>(p: T): Omit<T, "budgetCents"> & { budgetCents: number } {
  return { ...p, budgetCents: Number(p.budgetCents) };
}

const INTERNAL_NOTIFICATION_RECIPIENT = process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com";

async function publishProjectRequestNotification(input: {
  requestId?: string;
  traceId?: string;
  clientId: string;
  projectName: string;
  requestedByUserId?: string;
  summary?: string;
}): Promise<void> {
  await eventBus.publish({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    requestId: input.requestId,
    traceId: input.traceId,
    topic: EventTopics.notificationRequested,
    payload: {
      clientId: input.clientId,
      channel: "EMAIL",
      recipientEmail: INTERNAL_NOTIFICATION_RECIPIENT,
      subject: `New project request: ${input.projectName}`,
      message: `Client ${input.clientId} requested a new project: "${input.projectName}"${
        input.requestedByUserId ? ` (requested by ${input.requestedByUserId})` : ""
      }.${input.summary ? ` ${input.summary}` : ""} Review and assign staff ownership.`,
      tab: "projects"
    }
  });
}

async function logProjectActivity(input: {
  projectId: string;
  clientId: string;
  type: string;
  details?: string | null;
}): Promise<void> {
  await prisma.projectActivity.create({
    data: {
      projectId: input.projectId,
      clientId: input.clientId,
      type: input.type,
      details: input.details ?? null
    }
  });
}

type HandoffSummary = {
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
};

type HandoffExportFormat = "json" | "markdown";

type HandoffExportRecord = {
  id: string;
  format: HandoffExportFormat;
  fileId?: string;
  fileName: string;
  mimeType: string;
  downloadPath: string;
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
};

type FilesInlineCreateResponse = {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

type FilesDownloadUrlResponse = {
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  expiresAt: string;
};

type BillingInvoiceResponse = {
  id: string;
  clientId: string;
  number: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BillingPaymentResponse = {
  id: string;
  clientId: string;
  invoiceId: string;
  amountCents: number;
  status: string;
  provider: string | null;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectRequestDetailsV2 = {
  version: 2;
  source: "client_portal";
  requestedByUserId: string | null;
  serviceType: "AUTO_RECOMMEND" | "WEBSITE" | "MOBILE_APP" | "AUTOMATION" | "UI_UX_DESIGN" | "OTHER";
  buildMode: "AUTO" | "WORDPRESS" | "CUSTOM_CODE";
  complexity: "SIMPLE" | "STANDARD" | "ADVANCED";
  designPackage: "NONE" | "WIREFRAMES" | "WIREFRAMES_AND_UX";
  websitePageCount: number;
  appScreenCount: number;
  integrationsCount: number;
  targetPlatforms: Array<"WEB" | "IOS" | "ANDROID">;
  requiresContentSupport: boolean;
  requiresDomainAndHosting: boolean;
  selectedServices: string[];
  addonServices: string[];
  scopePrompt: string | null;
  signedAgreementFileId: string;
  signedAgreementFileName: string;
  estimatedQuoteCents: number;
  depositAmountCents: number;
  depositInvoiceId: string;
  depositInvoiceNumber: string;
  depositPaymentId: string;
  depositPaymentStatus: string;
};

function parseProjectRequestDetails(details: string | null | undefined): ProjectRequestDetailsV2 | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details) as Partial<ProjectRequestDetailsV2> | null;
    if (!parsed || parsed.version !== 2 || parsed.source !== "client_portal") return null;
    if (typeof parsed.signedAgreementFileId !== "string") return null;
    if (typeof parsed.estimatedQuoteCents !== "number") return null;
    if (typeof parsed.depositAmountCents !== "number") return null;
    if (typeof parsed.depositPaymentId !== "string") return null;
    return parsed as ProjectRequestDetailsV2;
  } catch {
    return null;
  }
}

type ProjectPaymentMilestoneStatus = {
  stage: "MILESTONE_30" | "FINAL_20";
  paid: boolean;
  amountCents: number;
  invoiceId: string | null;
  paymentId: string | null;
  markedAt: string | null;
  note: string | null;
};

function parsePaymentMilestoneActivity(
  details: string | null | undefined
): { amountCents: number; invoiceId: string; paymentId: string; stage: "MILESTONE_30" | "FINAL_20"; note?: string } | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details) as {
      amountCents?: number;
      invoiceId?: string;
      paymentId?: string;
      stage?: "MILESTONE_30" | "FINAL_20";
      note?: string;
    };
    if (
      !parsed ||
      (parsed.stage !== "MILESTONE_30" && parsed.stage !== "FINAL_20") ||
      typeof parsed.invoiceId !== "string" ||
      typeof parsed.paymentId !== "string" ||
      typeof parsed.amountCents !== "number"
    ) {
      return null;
    }
    return {
      amountCents: parsed.amountCents,
      invoiceId: parsed.invoiceId,
      paymentId: parsed.paymentId,
      stage: parsed.stage,
      note: parsed.note
    };
  } catch {
    return null;
  }
}

async function callFilesService<T>(
  path: string,
  method: "GET" | "POST",
  headers: {
    userId?: string | null;
    role?: string | null;
    clientId?: string | null;
    requestId: string;
    traceId?: string | null;
  },
  body?: unknown
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-user-id": headers.userId ?? "",
        "x-user-role": headers.role ?? "CLIENT",
        "x-client-id": headers.clientId ?? "",
        "x-request-id": headers.requestId,
        "x-trace-id": headers.traceId ?? headers.requestId
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: "FILES_SERVICE_UNREACHABLE",
        message: "Unable to reach files service."
      }
    };
  }
}

async function callBillingService<T>(
  path: string,
  method: "GET" | "POST",
  headers: {
    userId?: string | null;
    role?: string | null;
    clientId?: string | null;
    requestId: string;
    traceId?: string | null;
  },
  body?: unknown
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-user-id": headers.userId ?? "",
        "x-user-role": headers.role ?? "CLIENT",
        "x-client-id": headers.clientId ?? "",
        "x-request-id": headers.requestId,
        "x-trace-id": headers.traceId ?? headers.requestId
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: "BILLING_SERVICE_UNREACHABLE",
        message: "Unable to reach billing service."
      }
    };
  }
}

async function computeHandoffSummary(clientId?: string): Promise<HandoffSummary> {
  const [docs, decisions, blockers] = await Promise.all([
    prisma.projectMilestone.count({
      where: {
        ...(clientId ? { project: { clientId } } : {}),
        fileId: { not: null }
      }
    }),
    prisma.milestoneApproval.count({
      where: {
        ...(clientId ? { clientId } : {}),
        status: { in: ["APPROVED", "REJECTED"] }
      }
    }),
    prisma.projectBlocker.count({
      where: {
        ...(clientId ? { clientId } : {}),
        status: { not: "RESOLVED" }
      }
    })
  ]);
  return { docs, decisions, blockers, generatedAt: new Date().toISOString() };
}

function formatHandoffExportContent(format: HandoffExportFormat, summary: HandoffSummary): {
  content: string;
  mimeType: string;
  extension: "json" | "md";
} {
  if (format === "json") {
    return {
      content: JSON.stringify(summary, null, 2),
      mimeType: "application/json",
      extension: "json"
    };
  }

  return {
    content: [
      "# Maphari Handoff Package",
      "",
      `Generated: ${summary.generatedAt}`,
      "",
      `- Latest docs bundled: ${summary.docs}`,
      `- Decisions captured: ${summary.decisions}`,
      `- Open blockers: ${summary.blockers}`
    ].join("\n"),
    mimeType: "text/markdown",
    extension: "md"
  };
}

export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
  app.get("/projects", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { clientId } : {};
    const cacheKey = CacheKeys.projects(clientId);

    try {
      const cached = await cache.getJson<Awaited<ReturnType<typeof prisma.project.findMany>>>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const projects = await prisma.project.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });

      const dtos = projects.map(toProjectDto);
      await cache.setJson(cacheKey, dtos, 30);
      return {
        success: true,
        data: dtos,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof dtos>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "PROJECTS_FETCH_FAILED",
          message: "Unable to fetch projects"
        }
      } as ApiResponse;
    }
  });

  app.get("/projects/directory", async (request) => {
    const scope = readScopeHeaders(request);
    const parsed = getProjectQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project query payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const page = parsed.data.page ?? 1;
    const pageSize = parsed.data.pageSize ?? 20;
    const sortBy = parsed.data.sortBy ?? "updatedAt";
    const sortDir = parsed.data.sortDir ?? "desc";
    const whereClause = {
      ...(clientId ? { clientId } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.riskLevel ? { riskLevel: parsed.data.riskLevel } : {}),
      ...(parsed.data.q
        ? {
            OR: [
              { name: { contains: parsed.data.q, mode: "insensitive" as const } },
              { description: { contains: parsed.data.q, mode: "insensitive" as const } },
              { ownerName: { contains: parsed.data.q, mode: "insensitive" as const } }
            ]
          }
        : {})
    };
    try {
      const [items, total] = await Promise.all([
        prisma.project.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        prisma.project.count({ where: whereClause })
      ]);
      return {
        success: true,
        data: { items: items.map(toProjectDto), total, page, pageSize },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "PROJECTS_DIRECTORY_FETCH_FAILED", message: "Unable to fetch project directory" }
      } as ApiResponse;
    }
  });

  app.get("/projects/requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Role not allowed to view project requests." }
      } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const projects = await prisma.project.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          status: "PLANNING",
          activities: {
            some: { type: "PROJECT_REQUESTED" }
          },
          NOT: {
            activities: {
              some: { type: { in: ["PROJECT_REQUEST_APPROVED", "PROJECT_REQUEST_REJECTED"] } }
            }
          }
        },
        include: {
          activities: {
            where: { type: { in: ["PROJECT_REQUESTED", "PROJECT_REQUEST_APPROVED", "PROJECT_REQUEST_REJECTED"] } },
            orderBy: { createdAt: "desc" },
            take: 12
          }
        },
        orderBy: { createdAt: "desc" },
        take: 120
      });

      const queue = projects.map((project) => {
        const requested = project.activities.find((activity) => activity.type === "PROJECT_REQUESTED");
        const requestDetails = parseProjectRequestDetails(requested?.details);
        return {
          projectId: project.id,
          clientId: project.clientId,
          name: project.name,
          description: project.description,
          priority: project.priority,
          desiredStartAt: project.startAt ? project.startAt.toISOString() : null,
          desiredDueAt: project.dueAt ? project.dueAt.toISOString() : null,
          estimatedBudgetCents: Number(project.budgetCents ?? 0n),
          requestedAt: requested?.createdAt.toISOString() ?? project.createdAt.toISOString(),
          requestNote: requested?.details ?? null,
          requestDetails
        };
      });

      return {
        success: true,
        data: queue,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof queue>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PROJECT_REQUESTS_FETCH_FAILED", message: "Unable to load project requests." }
      } as ApiResponse;
    }
  });

  app.get<{ Params: { projectId: string } }>("/projects/:projectId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: request.params.projectId,
          ...(clientId ? { clientId } : {})
        },
        include: {
          milestones: { include: { approval: true }, orderBy: { createdAt: "asc" } },
          tasks: {
            include: {
              collaborators: {
                orderBy: { createdAt: "asc" }
              }
            },
            orderBy: { createdAt: "asc" }
          },
          dependencies: { include: { blockedByProject: true } },
          activities: { orderBy: { createdAt: "desc" }, take: 80 },
          collaborators: { where: { active: true }, orderBy: { createdAt: "desc" }, take: 120 },
          workSessions: {
            where: {
              ...(scope.role === "CLIENT" ? { status: { not: "DONE" } } : {})
            },
            orderBy: { startedAt: "desc" },
            take: 80
          }
        }
      });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      return { success: true, data: toProjectDto(project), meta: { requestId: scope.requestId } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_FETCH_FAILED", message: "Unable to fetch project detail" } } as ApiResponse;
    }
  });

  app.post("/projects", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Clients cannot create projects directly. Use /projects/requests."
        }
      } as ApiResponse;
    }
    const parsedBody = createProjectSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "client scope is required" }
      } as ApiResponse;
    }

    try {
      const project = await prisma.project.create({
        data: {
          clientId,
          name: parsedBody.data.name,
          description: parsedBody.data.description ?? null,
          status: parsedBody.data.status ?? "PLANNING",
          ownerName: parsedBody.data.ownerName ?? null,
          priority: parsedBody.data.priority ?? "MEDIUM",
          startAt: parsedBody.data.startAt ? new Date(parsedBody.data.startAt) : null,
          dueAt: parsedBody.data.dueAt ? new Date(parsedBody.data.dueAt) : null,
          budgetCents: BigInt(parsedBody.data.budgetCents ?? 0),
          slaDueAt: parsedBody.data.slaDueAt ? new Date(parsedBody.data.slaDueAt) : null
        }
      });

      await Promise.all([
        cache.delete(CacheKeys.projects(clientId)),
        cache.delete(CacheKeys.projects()),
        logProjectActivity({
          projectId: project.id,
          clientId: project.clientId,
          type: "PROJECT_CREATED",
          details: `Project created with status ${project.status}`
        })
      ]);

      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.projectCreated,
        payload: {
          projectId: project.id,
          clientId: project.clientId,
          status: project.status
        }
      });

      return {
        success: true,
        data: toProjectDto(project),
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PROJECT_CREATE_FAILED", message: "Unable to create project" }
      } as ApiResponse;
    }
  });

  app.post("/projects/requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only client users can submit project requests." }
      } as ApiResponse;
    }
    const parsedBody = createProjectRequestSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project request payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "client scope is required" }
      } as ApiResponse;
    }

    try {
      const traceId = (request.headers["x-trace-id"] as string | undefined) ?? undefined;
      const requestId = scope.requestId ?? randomUUID();
      const fileCheck = await callFilesService<FilesDownloadUrlResponse>(
        `/files/${parsedBody.data.signedAgreementFileId}/download-url`,
        "GET",
        {
          userId: scope.userId,
          role: scope.role,
          clientId,
          requestId,
          traceId
        }
      );
      if (!fileCheck.success || !fileCheck.data) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "SIGNED_AGREEMENT_REQUIRED",
            message: "A valid signed agreement file is required before submitting a project request."
          }
        } as ApiResponse;
      }

      const [invoicesResult, paymentsResult] = await Promise.all([
        callBillingService<BillingInvoiceResponse[]>("/invoices", "GET", {
          userId: scope.userId,
          role: scope.role,
          clientId,
          requestId,
          traceId
        }),
        callBillingService<BillingPaymentResponse[]>("/payments", "GET", {
          userId: scope.userId,
          role: scope.role,
          clientId,
          requestId,
          traceId
        })
      ]);

      if (!invoicesResult.success || !paymentsResult.success) {
        reply.status(502);
        return {
          success: false,
          error: {
            code: "DEPOSIT_GATE_UNAVAILABLE",
            message: "Unable to verify deposit payment right now. Please retry."
          }
        } as ApiResponse;
      }

      const depositInvoice = (invoicesResult.data ?? []).find(
        (invoice) => invoice.id === parsedBody.data.depositInvoiceId && invoice.clientId === clientId
      );
      const depositPayment = (paymentsResult.data ?? []).find(
        (payment) =>
          payment.id === parsedBody.data.depositPaymentId &&
          payment.clientId === clientId &&
          payment.invoiceId === parsedBody.data.depositInvoiceId
      );
      if (!depositInvoice || !depositPayment) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "DEPOSIT_PAYMENT_REQUIRED",
            message: "A valid 50% deposit is required before submission."
          }
        } as ApiResponse;
      }
      if (depositPayment.status !== "COMPLETED") {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "DEPOSIT_NOT_COMPLETED",
            message: "Deposit payment must be completed before submission."
          }
        } as ApiResponse;
      }

      const expectedDepositAmount = Math.ceil(parsedBody.data.estimatedQuoteCents * 0.5);
      if (depositPayment.amountCents < expectedDepositAmount) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "DEPOSIT_UNDERPAID",
            message: "Deposit amount is below the required 50% threshold."
          }
        } as ApiResponse;
      }

      const serviceType = parsedBody.data.serviceType ?? "AUTO_RECOMMEND";
      const buildMode = parsedBody.data.buildMode ?? "AUTO";
      const complexity = parsedBody.data.complexity ?? "STANDARD";
      const designPackage = parsedBody.data.designPackage ?? "NONE";
      const requestDetails: ProjectRequestDetailsV2 = {
        version: 2,
        source: "client_portal",
        requestedByUserId: scope.userId ?? null,
        serviceType,
        buildMode,
        complexity,
        designPackage,
        websitePageCount: parsedBody.data.websitePageCount ?? 0,
        appScreenCount: parsedBody.data.appScreenCount ?? 0,
        integrationsCount: parsedBody.data.integrationsCount ?? 0,
        targetPlatforms: parsedBody.data.targetPlatforms ?? [],
        requiresContentSupport: parsedBody.data.requiresContentSupport ?? false,
        requiresDomainAndHosting: parsedBody.data.requiresDomainAndHosting ?? true,
        selectedServices: parsedBody.data.selectedServices ?? [],
        addonServices: parsedBody.data.addonServices ?? [],
        scopePrompt: parsedBody.data.scopePrompt ?? null,
        signedAgreementFileId: parsedBody.data.signedAgreementFileId,
        signedAgreementFileName: fileCheck.data.fileName,
        estimatedQuoteCents: parsedBody.data.estimatedQuoteCents,
        depositAmountCents: depositPayment.amountCents,
        depositInvoiceId: depositInvoice.id,
        depositInvoiceNumber: depositInvoice.number,
        depositPaymentId: depositPayment.id,
        depositPaymentStatus: depositPayment.status
      };

      const project = await prisma.project.create({
        data: {
          clientId,
          name: parsedBody.data.name,
          description: parsedBody.data.description ?? "Requested by client through portal intake.",
          status: "PLANNING",
          ownerName: null,
          priority: parsedBody.data.priority ?? "MEDIUM",
          riskLevel: "LOW",
          startAt: parsedBody.data.desiredStartAt ? new Date(parsedBody.data.desiredStartAt) : null,
          dueAt: parsedBody.data.desiredDueAt ? new Date(parsedBody.data.desiredDueAt) : null,
          budgetCents: BigInt(parsedBody.data.estimatedQuoteCents)
        }
      });

      await Promise.all([
        cache.delete(CacheKeys.projects(clientId)),
        cache.delete(CacheKeys.projects()),
        logProjectActivity({
          projectId: project.id,
          clientId: project.clientId,
          type: "PROJECT_REQUESTED",
          details: JSON.stringify(requestDetails)
        })
      ]);
      try {
        await publishProjectRequestNotification({
          requestId: scope.requestId,
          traceId,
          clientId: project.clientId,
          projectName: project.name,
          requestedByUserId: scope.userId,
          summary: `Service ${serviceType}; estimate $${(parsedBody.data.estimatedQuoteCents / 100).toFixed(2)}; deposit $${(
            depositPayment.amountCents / 100
          ).toFixed(2)}; agreement file ${fileCheck.data.fileName}.`
        });
      } catch (notifyError) {
        // Request submission must succeed even if async notifications are unavailable.
        request.log.warn(
          { error: notifyError, projectId: project.id, clientId: project.clientId },
          "Project request notification publish failed"
        );
      }

      return {
        success: true,
        data: toProjectDto(project),
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PROJECT_REQUEST_CREATE_FAILED", message: "Unable to submit project request" }
      } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/request-decision", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Role not allowed to decide project requests." }
      } as ApiResponse;
    }
    const parsedBody = decideProjectRequestSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project request decision payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: request.params.projectId,
          ...(clientId ? { clientId } : {})
        }
      });
      if (!project) {
        reply.status(404);
        return {
          success: false,
          error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" }
        } as ApiResponse;
      }

      const requested = await prisma.projectActivity.findFirst({
        where: { projectId: project.id, type: "PROJECT_REQUESTED" },
        orderBy: { createdAt: "desc" }
      });
      if (!requested) {
        reply.status(409);
        return {
          success: false,
          error: { code: "PROJECT_REQUEST_NOT_FOUND", message: "No pending project request for this project." }
        } as ApiResponse;
      }

      const status = parsedBody.data.decision === "APPROVED" ? "IN_PROGRESS" : "CANCELLED";
      const updated = await prisma.project.update({
        where: { id: project.id },
        data: {
          status,
          ownerName:
            parsedBody.data.decision === "APPROVED"
              ? parsedBody.data.ownerName ?? project.ownerName
              : project.ownerName
        }
      });

      await Promise.all([
        cache.delete(CacheKeys.projects(project.clientId)),
        cache.delete(CacheKeys.projects()),
        logProjectActivity({
          projectId: project.id,
          clientId: project.clientId,
          type: parsedBody.data.decision === "APPROVED" ? "PROJECT_REQUEST_APPROVED" : "PROJECT_REQUEST_REJECTED",
          details: parsedBody.data.note ?? `Request ${parsedBody.data.decision.toLowerCase()} by ${scope.role}`
        })
      ]);

      if (parsedBody.data.decision === "APPROVED") {
        // Auto-generate 30% milestone invoice
        const milestoneAmountCents = Math.round(Number(project.budgetCents) * 0.30);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from approval
        const decisionTraceId = (request.headers["x-trace-id"] as string | undefined) ?? undefined;
        try {
          await callBillingService("/invoices", "POST", {
            userId: scope.userId,
            role: scope.role,
            clientId: project.clientId,
            requestId: scope.requestId ?? randomUUID(),
            traceId: decisionTraceId
          }, {
            clientId: project.clientId,
            number: `INV-${project.id.slice(0, 6).toUpperCase()}-MILESTONE-30`,
            amountCents: milestoneAmountCents,
            status: "ISSUED",
            dueAt: dueDate.toISOString()
          });
        } catch (invoiceError) {
          request.log.warn({ error: invoiceError, projectId: project.id }, "30% milestone invoice creation failed — non-fatal");
        }

        // Auto-generate NDA + SOW for new project approval
        try {
          const effectiveDate = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
          const startDate = project.startAt ? project.startAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "To be confirmed";
          const dueDate = project.dueAt ? project.dueAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "To be confirmed";
          const budgetFormatted = `R ${(Number(project.budgetCents) / 100).toLocaleString("en-ZA")}`;

          // Check if NDA already exists for this client
          const existingNda = await prisma.clientContract.findFirst({
            where: { clientId: project.clientId, type: "NDA", status: { not: "VOID" } },
          });

          const contractsToCreate: Array<{
            clientId: string;
            title: string;
            type: string;
            status: string;
            signed: boolean;
            notes: string;
          }> = [];

          if (!existingNda) {
            contractsToCreate.push({
              clientId: project.clientId,
              title: "Non-Disclosure Agreement",
              type: "NDA",
              status: "PENDING",
              signed: false,
              notes: JSON.stringify({
                templateId: "nda-standard-za",
                projectId: project.id,
                variables: {
                  PROJECT_NAME: project.name,
                  EFFECTIVE_DATE: effectiveDate,
                },
              }),
            });
          }

          // Always create a fresh SOW per project
          contractsToCreate.push({
            clientId: project.clientId,
            title: `Statement of Work — ${project.name}`,
            type: "SOW",
            status: "PENDING",
            signed: false,
            notes: JSON.stringify({
              templateId: "sow-standard",
              projectId: project.id,
              variables: {
                PROJECT_NAME: project.name,
                PROJECT_DESCRIPTION: project.description ?? "As discussed and agreed between the parties.",
                BUDGET_TOTAL: budgetFormatted,
                START_DATE: startDate,
                DUE_DATE: dueDate,
                EFFECTIVE_DATE: effectiveDate,
              },
            }),
          });

          if (contractsToCreate.length > 0) {
            await prisma.clientContract.createMany({ data: contractsToCreate });
            await cache.delete(CacheKeys.contracts(project.clientId));
            request.log.info(
              { projectId: project.id, contractCount: contractsToCreate.length },
              "Auto-generated contracts for project approval"
            );
          }
        } catch (contractError) {
          request.log.warn({ error: contractError, projectId: project.id }, "Auto-contract generation failed — non-fatal");
        }
      }

      return {
        success: true,
        data: updated,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PROJECT_REQUEST_DECISION_FAILED", message: "Unable to process project request decision." }
      } as ApiResponse;
    }
  });

  app.patch<{ Params: { projectId: string } }>("/projects/:projectId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = updateProjectSchema.safeParse({ projectId: request.params.projectId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid project update payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const existing = await prisma.project.findFirst({
        where: {
          id: parsed.data.projectId,
          ...(clientId ? { clientId } : {})
        }
      });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const project = await prisma.project.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name ?? existing.name,
          description: parsed.data.description ?? existing.description,
          ownerName: parsed.data.ownerName ?? existing.ownerName,
          priority: parsed.data.priority ?? existing.priority,
          riskLevel: parsed.data.riskLevel ?? existing.riskLevel,
          startAt:
            parsed.data.startAt !== undefined
              ? parsed.data.startAt
                ? new Date(parsed.data.startAt)
                : null
              : existing.startAt,
          dueAt:
            parsed.data.dueAt !== undefined
              ? parsed.data.dueAt
                ? new Date(parsed.data.dueAt)
                : null
              : existing.dueAt,
          budgetCents: parsed.data.budgetCents !== undefined ? BigInt(parsed.data.budgetCents) : existing.budgetCents,
          progressPercent: parsed.data.progressPercent ?? existing.progressPercent,
          slaDueAt:
            parsed.data.slaDueAt !== undefined
              ? parsed.data.slaDueAt
                ? new Date(parsed.data.slaDueAt)
                : null
              : existing.slaDueAt
        }
      });

      await Promise.all([
        cache.delete(CacheKeys.projects(project.clientId)),
        cache.delete(CacheKeys.projects()),
        logProjectActivity({
          projectId: project.id,
          clientId: project.clientId,
          type: "PROJECT_UPDATED",
          details: "Project profile updated"
        })
      ]);

      return { success: true, data: toProjectDto(project), meta: { requestId: scope.requestId } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_UPDATE_FAILED", message: "Unable to update project" } } as ApiResponse;
    }
  });

  app.patch<{ Params: { projectId: string } }>("/projects/:projectId/status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = updateProjectStatusSchema.safeParse({
      projectId: request.params.projectId,
      ...(request.body as object)
    });
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project status payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    const projectScope = effectiveClientId
      ? { id: parsedBody.data.projectId, clientId: effectiveClientId }
      : { id: parsedBody.data.projectId };

    try {
      const existingProject = await prisma.project.findFirst({ where: projectScope });
      if (!existingProject) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project not found in current scope"
          }
        } as ApiResponse;
      }

      if (parsedBody.data.status === "COMPLETED") {
        const finalPaymentLog = await prisma.projectActivity.findFirst({
          where: {
            projectId: existingProject.id,
            type: "PAYMENT_FINAL_20_CONFIRMED"
          },
          orderBy: { createdAt: "desc" }
        });
        if (!finalPaymentLog) {
          reply.status(409);
          return {
            success: false,
            error: {
              code: "FINAL_PAYMENT_REQUIRED",
              message: "Final 20% payment must be confirmed before project handoff/completion."
            }
          } as ApiResponse;
        }
      }

      const project = await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          status: parsedBody.data.status,
          completedAt: parsedBody.data.status === "COMPLETED" ? new Date() : existingProject.completedAt
        }
      });

      await Promise.all([
        cache.delete(CacheKeys.projects(project.clientId)),
        cache.delete(CacheKeys.projects()),
        logProjectActivity({
          projectId: project.id,
          clientId: project.clientId,
          type: "PROJECT_STATUS_UPDATED",
          details: `${existingProject.status} -> ${project.status}`
        })
      ]);

      const traceId = (request.headers["x-trace-id"] as string | undefined) ?? undefined;
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId,
        topic: EventTopics.projectStatusUpdated,
        payload: {
          projectId: project.id,
          clientId: project.clientId,
          previousStatus: existingProject.status,
          status: project.status
        }
      });

      if (project.status === "COMPLETED" && existingProject.status !== "COMPLETED") {
        await eventBus.publish({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          requestId: scope.requestId,
          traceId,
          topic: EventTopics.projectCompleted,
          payload: {
            projectId: project.id,
            clientId: project.clientId,
            completedAt: project.updatedAt.toISOString()
          }
        });

        // Auto-generate 20% final invoice when project is marked complete
        const finalAmountCents = Math.round(Number(existingProject.budgetCents) * 0.20);
        const finalDueDate = new Date();
        finalDueDate.setDate(finalDueDate.getDate() + 14); // 14 days to pay final invoice
        try {
          await callBillingService("/invoices", "POST", {
            userId: scope.userId,
            role: scope.role,
            clientId: existingProject.clientId,
            requestId: scope.requestId ?? randomUUID(),
            traceId
          }, {
            clientId: existingProject.clientId,
            number: `INV-${existingProject.id.slice(0, 6).toUpperCase()}-FINAL-20`,
            amountCents: finalAmountCents,
            status: "ISSUED",
            dueAt: finalDueDate.toISOString()
          });
        } catch (invoiceError) {
          request.log.warn({ error: invoiceError, projectId: existingProject.id }, "20% final invoice creation failed — non-fatal");
        }
      }

      return {
        success: true,
        data: toProjectDto(project),
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "PROJECT_STATUS_UPDATE_FAILED",
          message: "Unable to update project status"
        }
      } as ApiResponse;
    }
  });

  app.get<{ Params: { projectId: string } }>("/projects/:projectId/payment-milestones", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({
        where: { id: request.params.projectId, ...(clientId ? { clientId } : {}) }
      });
      if (!project) {
        reply.status(404);
        return {
          success: false,
          error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" }
        } as ApiResponse;
      }
      const [milestone30Activity, final20Activity] = await Promise.all([
        prisma.projectActivity.findFirst({
          where: { projectId: project.id, type: "PAYMENT_MILESTONE_30_CONFIRMED" },
          orderBy: { createdAt: "desc" }
        }),
        prisma.projectActivity.findFirst({
          where: { projectId: project.id, type: "PAYMENT_FINAL_20_CONFIRMED" },
          orderBy: { createdAt: "desc" }
        })
      ]);

      const milestone30 = parsePaymentMilestoneActivity(milestone30Activity?.details);
      const final20 = parsePaymentMilestoneActivity(final20Activity?.details);
      const data: ProjectPaymentMilestoneStatus[] = [
        {
          stage: "MILESTONE_30",
          paid: Boolean(milestone30),
          amountCents: milestone30?.amountCents ?? 0,
          invoiceId: milestone30?.invoiceId ?? null,
          paymentId: milestone30?.paymentId ?? null,
          markedAt: milestone30Activity?.createdAt.toISOString() ?? null,
          note: milestone30?.note ?? null
        },
        {
          stage: "FINAL_20",
          paid: Boolean(final20),
          amountCents: final20?.amountCents ?? 0,
          invoiceId: final20?.invoiceId ?? null,
          paymentId: final20?.paymentId ?? null,
          markedAt: final20Activity?.createdAt.toISOString() ?? null,
          note: final20?.note ?? null
        }
      ];

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PROJECT_PAYMENT_MILESTONES_FETCH_FAILED", message: "Unable to fetch payment milestones." }
      } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/payment-milestones", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canManageInternalCollaboration(scope.role)) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Role not allowed to mark project payment milestones." }
      } as ApiResponse;
    }
    const parsed = markProjectPaymentMilestoneSchema.safeParse({
      projectId: request.params.projectId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project payment milestone payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({
        where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) }
      });
      if (!project) {
        reply.status(404);
        return {
          success: false,
          error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" }
        } as ApiResponse;
      }

      const paymentsResult = await callBillingService<BillingPaymentResponse[]>("/payments", "GET", {
        userId: scope.userId,
        role: scope.role,
        clientId: project.clientId,
        requestId: scope.requestId ?? randomUUID(),
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined
      });
      if (!paymentsResult.success) {
        reply.status(502);
        return {
          success: false,
          error: {
            code: paymentsResult.error?.code ?? "PAYMENT_MILESTONE_VERIFY_FAILED",
            message: paymentsResult.error?.message ?? "Unable to verify payment milestone."
          }
        } as ApiResponse;
      }

      const payment = (paymentsResult.data ?? []).find(
        (item) =>
          item.id === parsed.data.paymentId &&
          item.invoiceId === parsed.data.invoiceId &&
          item.clientId === project.clientId
      );
      if (!payment || payment.status !== "COMPLETED") {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "PAYMENT_NOT_COMPLETED",
            message: "Selected payment is missing or not completed."
          }
        } as ApiResponse;
      }

      const activityType =
        parsed.data.stage === "MILESTONE_30" ? "PAYMENT_MILESTONE_30_CONFIRMED" : "PAYMENT_FINAL_20_CONFIRMED";
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: activityType,
        details: JSON.stringify({
          stage: parsed.data.stage,
          invoiceId: parsed.data.invoiceId,
          paymentId: parsed.data.paymentId,
          amountCents: payment.amountCents
        })
      });

      return {
        success: true,
        data: {
          stage: parsed.data.stage,
          paymentId: parsed.data.paymentId,
          invoiceId: parsed.data.invoiceId,
          amountCents: payment.amountCents
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PROJECT_PAYMENT_MILESTONE_MARK_FAILED", message: "Unable to mark payment milestone." }
      } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/milestones", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createProjectMilestoneSchema.safeParse({ projectId: request.params.projectId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid milestone payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const milestone = await prisma.$transaction(async (tx) => {
        const created = await tx.projectMilestone.create({
          data: {
            projectId: project.id,
            title: parsed.data.title,
            status: parsed.data.status ?? "PENDING",
            dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
            fileId: parsed.data.fileId ?? null
          }
        });
        await tx.milestoneApproval.upsert({
          where: { milestoneId: created.id },
          update: {},
          create: {
            milestoneId: created.id,
            projectId: project.id,
            clientId: project.clientId,
            status: "PENDING"
          }
        });
        return created;
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "MILESTONE_CREATED",
        details: parsed.data.title
      });
      return { success: true, data: milestone, meta: { requestId: scope.requestId } } as ApiResponse<typeof milestone>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "MILESTONE_CREATE_FAILED", message: "Unable to create milestone" } } as ApiResponse;
    }
  });

  app.patch<{ Params: { projectId: string; milestoneId: string } }>("/projects/:projectId/milestones/:milestoneId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = updateProjectMilestoneSchema.safeParse({
      projectId: request.params.projectId,
      milestoneId: request.params.milestoneId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid milestone update payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const milestone = await prisma.projectMilestone.findUnique({ where: { id: parsed.data.milestoneId } });
      if (!milestone) {
        reply.status(404);
        return { success: false, error: { code: "MILESTONE_NOT_FOUND", message: "Milestone not found" } } as ApiResponse;
      }
      const project = await prisma.project.findFirst({
        where: { id: milestone.projectId, ...(clientId ? { clientId } : {}) }
      });
      if (!project || project.id !== parsed.data.projectId) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const updated = await prisma.projectMilestone.update({
        where: { id: milestone.id },
        data: {
          title: parsed.data.title ?? milestone.title,
          status: parsed.data.status ?? milestone.status,
          dueAt:
            parsed.data.dueAt !== undefined
              ? parsed.data.dueAt
                ? new Date(parsed.data.dueAt)
                : null
              : milestone.dueAt,
          fileId: parsed.data.fileId !== undefined ? parsed.data.fileId : milestone.fileId
        }
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "MILESTONE_UPDATED",
        details: updated.title
      });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "MILESTONE_UPDATE_FAILED", message: "Unable to update milestone" } } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/tasks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createProjectTaskSchema.safeParse({ projectId: request.params.projectId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid task payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const task = await prisma.projectTask.create({
        data: {
          projectId: project.id,
          title: parsed.data.title,
          assigneeName: parsed.data.assigneeName ?? null,
          status: parsed.data.status ?? "TODO",
          dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
        }
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "TASK_CREATED",
        details: parsed.data.title
      });
      return { success: true, data: task, meta: { requestId: scope.requestId } } as ApiResponse<typeof task>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TASK_CREATE_FAILED", message: "Unable to create task" } } as ApiResponse;
    }
  });

  app.patch<{ Params: { projectId: string; taskId: string } }>("/projects/:projectId/tasks/:taskId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = updateProjectTaskSchema.safeParse({
      projectId: request.params.projectId,
      taskId: request.params.taskId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid task update payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const task = await prisma.projectTask.findUnique({ where: { id: parsed.data.taskId } });
      if (!task) {
        reply.status(404);
        return { success: false, error: { code: "TASK_NOT_FOUND", message: "Task not found" } } as ApiResponse;
      }
      const project = await prisma.project.findFirst({
        where: { id: task.projectId, ...(clientId ? { clientId } : {}) }
      });
      if (!project || project.id !== parsed.data.projectId) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const updated = await prisma.projectTask.update({
        where: { id: task.id },
        data: {
          title: parsed.data.title ?? task.title,
          assigneeName: parsed.data.assigneeName ?? task.assigneeName,
          status: parsed.data.status ?? task.status,
          dueAt:
            parsed.data.dueAt !== undefined
              ? parsed.data.dueAt
                ? new Date(parsed.data.dueAt)
                : null
              : task.dueAt
        }
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "TASK_UPDATED",
        details: updated.title
      });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TASK_UPDATE_FAILED", message: "Unable to update task" } } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string; taskId: string } }>("/projects/:projectId/tasks/:taskId/collaborators", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canManageInternalCollaboration(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Role not allowed to manage collaborators." } } as ApiResponse;
    }
    const parsed = createTaskCollaboratorSchema.safeParse({
      projectId: request.params.projectId,
      taskId: request.params.taskId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid collaborator payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const [project, task] = await Promise.all([
        prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } }),
        prisma.projectTask.findFirst({ where: { id: parsed.data.taskId, projectId: parsed.data.projectId } })
      ]);
      if (!project || !task) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_OR_TASK_NOT_FOUND", message: "Project or task not found in current scope" } } as ApiResponse;
      }
      const collaborator = await prisma.projectTaskCollaborator.create({
        data: {
          projectId: project.id,
          taskId: task.id,
          clientId: project.clientId,
          staffUserId: parsed.data.staffUserId ?? null,
          staffName: parsed.data.staffName,
          role: parsed.data.role ?? "CONTRIBUTOR",
          allocationPercent: parsed.data.allocationPercent ?? 0
        }
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "TASK_COLLABORATOR_ADDED",
        details: `${collaborator.staffName} assigned to ${task.title}`
      });
      // Notify staff of their new task assignment (best-effort)
      try {
        await eventBus.publish({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          requestId: scope.requestId,
          topic: EventTopics.taskAssigned,
          payload: {
            collaboratorId: collaborator.id,
            projectId: project.id,
            taskId: task.id,
            taskTitle: task.title,
            clientId: project.clientId,
            staffUserId: collaborator.staffUserId ?? null,
            staffName: collaborator.staffName,
            role: collaborator.role,
          },
        });
      } catch (_) { /* best-effort */ }
      return { success: true, data: collaborator, meta: { requestId: scope.requestId } } as ApiResponse<typeof collaborator>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TASK_COLLABORATOR_CREATE_FAILED", message: "Unable to add task collaborator" } } as ApiResponse;
    }
  });

  app.patch<{ Params: { projectId: string; taskId: string; collaboratorId: string } }>("/projects/:projectId/tasks/:taskId/collaborators/:collaboratorId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canManageInternalCollaboration(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Role not allowed to manage collaborators." } } as ApiResponse;
    }
    const parsed = updateTaskCollaboratorSchema.safeParse({
      projectId: request.params.projectId,
      taskId: request.params.taskId,
      collaboratorId: request.params.collaboratorId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid collaborator update payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const collaborator = await prisma.projectTaskCollaborator.findFirst({
        where: {
          id: parsed.data.collaboratorId,
          projectId: parsed.data.projectId,
          taskId: parsed.data.taskId
        }
      });
      if (!collaborator) {
        reply.status(404);
        return { success: false, error: { code: "COLLABORATOR_NOT_FOUND", message: "Collaborator not found for task" } } as ApiResponse;
      }
      const updated = await prisma.projectTaskCollaborator.update({
        where: { id: collaborator.id },
        data: {
          role: parsed.data.role ?? collaborator.role,
          allocationPercent: parsed.data.allocationPercent ?? collaborator.allocationPercent,
          active: parsed.data.active ?? collaborator.active
        }
      });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TASK_COLLABORATOR_UPDATE_FAILED", message: "Unable to update task collaborator" } } as ApiResponse;
    }
  });

  app.get<{ Params: { projectId: string } }>("/projects/:projectId/collaboration", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({
        where: { id: request.params.projectId, ...(clientId ? { clientId } : {}) },
        include: {
          tasks: {
            include: {
              collaborators: {
                where: { active: true },
                orderBy: { createdAt: "asc" }
              }
            },
            orderBy: { createdAt: "asc" }
          }
        }
      });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }

      const [notes, sessions] = await Promise.all([
        prisma.projectCollaborationNote.findMany({
          where: {
            projectId: project.id,
            ...(scope.role === "CLIENT" ? { visibility: "EXTERNAL" } : {})
          },
          orderBy: { createdAt: "desc" },
          take: 100
        }),
        prisma.projectWorkSession.findMany({
          where: {
            projectId: project.id,
            ...(scope.role === "CLIENT" ? { status: { not: "DONE" } } : {})
          },
          orderBy: { startedAt: "desc" },
          take: 100
        })
      ]);

      const contributorMap = new Map<string, { name: string; role: string; activeSessions: number; taskCount: number }>();
      if (project.ownerName) {
        contributorMap.set(project.ownerName.toLowerCase(), {
          name: project.ownerName,
          role: "OWNER",
          activeSessions: 0,
          taskCount: 0
        });
      }
      project.tasks.forEach((task) => {
        if (task.assigneeName) {
          const key = task.assigneeName.toLowerCase();
          const existing = contributorMap.get(key);
          contributorMap.set(key, {
            name: task.assigneeName,
            role: existing?.role ?? "ASSIGNEE",
            activeSessions: existing?.activeSessions ?? 0,
            taskCount: (existing?.taskCount ?? 0) + 1
          });
        }
        task.collaborators.forEach((collaborator) => {
          const key = collaborator.staffName.toLowerCase();
          const existing = contributorMap.get(key);
          contributorMap.set(key, {
            name: collaborator.staffName,
            role: collaborator.role ?? existing?.role ?? "CONTRIBUTOR",
            activeSessions: existing?.activeSessions ?? 0,
            taskCount: (existing?.taskCount ?? 0) + 1
          });
        });
      });
      sessions.filter((session) => session.status === "ACTIVE").forEach((session) => {
        const key = session.memberName.toLowerCase();
        const existing = contributorMap.get(key);
        contributorMap.set(key, {
          name: session.memberName,
          role: session.memberRole,
          activeSessions: (existing?.activeSessions ?? 0) + 1,
          taskCount: existing?.taskCount ?? 0
        });
      });

      return {
        success: true,
        data: {
          projectId: project.id,
          contributors: Array.from(contributorMap.values()).sort((a, b) => b.activeSessions - a.activeSessions || b.taskCount - a.taskCount),
          sessions,
          notes
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_COLLABORATION_FETCH_FAILED", message: "Unable to fetch collaboration data" } } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/collaboration/notes", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createProjectCollaborationNoteSchema.safeParse({
      projectId: request.params.projectId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid collaboration note payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const requestedVisibility = parsed.data.visibility ?? "INTERNAL";
      const visibility = scope.role === "CLIENT" ? "EXTERNAL" : requestedVisibility;
      const note = await prisma.projectCollaborationNote.create({
        data: {
          projectId: project.id,
          clientId: project.clientId,
          authorId: scope.userId,
          authorRole: scope.role,
          authorName: scope.role === "CLIENT" ? "Client" : scope.userId ? `User ${scope.userId.slice(0, 8)}` : scope.role,
          visibility,
          workstream: parsed.data.workstream ?? null,
          message: parsed.data.message
        }
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "COLLABORATION_NOTE",
        details: `${visibility} note added`
      });
      return { success: true, data: note, meta: { requestId: scope.requestId } } as ApiResponse<typeof note>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_COLLABORATION_NOTE_CREATE_FAILED", message: "Unable to create collaboration note" } } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/collaboration/sessions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canManageInternalCollaboration(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Role not allowed to manage collaboration sessions." } } as ApiResponse;
    }
    const parsed = createProjectWorkSessionSchema.safeParse({
      projectId: request.params.projectId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid work session payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const activeExisting = await prisma.projectWorkSession.findFirst({
        where: {
          projectId: project.id,
          memberName: parsed.data.memberName,
          status: "ACTIVE"
        }
      });
      if (activeExisting) {
        const updated = await prisma.projectWorkSession.update({
          where: { id: activeExisting.id },
          data: {
            taskId: parsed.data.taskId ?? activeExisting.taskId,
            workstream: parsed.data.workstream ?? activeExisting.workstream,
            status: parsed.data.status ?? activeExisting.status
          }
        });
        return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
      }
      const session = await prisma.projectWorkSession.create({
        data: {
          projectId: project.id,
          clientId: project.clientId,
          taskId: parsed.data.taskId ?? null,
          memberId: scope.userId,
          memberName: parsed.data.memberName,
          memberRole: parsed.data.memberRole,
          workstream: parsed.data.workstream ?? null,
          status: parsed.data.status ?? "ACTIVE",
          startedAt: new Date()
        }
      });
      return { success: true, data: session, meta: { requestId: scope.requestId } } as ApiResponse<typeof session>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_WORK_SESSION_CREATE_FAILED", message: "Unable to create work session" } } as ApiResponse;
    }
  });

  app.patch<{ Params: { projectId: string; sessionId: string } }>("/projects/:projectId/collaboration/sessions/:sessionId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canManageInternalCollaboration(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Role not allowed to manage collaboration sessions." } } as ApiResponse;
    }
    const parsed = updateProjectWorkSessionSchema.safeParse({
      projectId: request.params.projectId,
      sessionId: request.params.sessionId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid work session update payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const existing = await prisma.projectWorkSession.findFirst({
        where: {
          id: parsed.data.sessionId,
          projectId: parsed.data.projectId
        }
      });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_WORK_SESSION_NOT_FOUND", message: "Work session not found" } } as ApiResponse;
      }
      const updated = await prisma.projectWorkSession.update({
        where: { id: existing.id },
        data: {
          status: parsed.data.status ?? existing.status,
          workstream: parsed.data.workstream ?? existing.workstream,
          taskId: parsed.data.taskId !== undefined ? parsed.data.taskId : existing.taskId,
          endedAt:
            parsed.data.endedAt !== undefined
              ? parsed.data.endedAt
                ? new Date(parsed.data.endedAt)
                : null
              : parsed.data.status === "DONE"
              ? new Date()
              : existing.endedAt
        }
      });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_WORK_SESSION_UPDATE_FAILED", message: "Unable to update work session" } } as ApiResponse;
    }
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/dependencies", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createProjectDependencySchema.safeParse({ projectId: request.params.projectId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid dependency payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const [project, blockedByProject] = await Promise.all([
        prisma.project.findFirst({ where: { id: parsed.data.projectId, ...(clientId ? { clientId } : {}) } }),
        prisma.project.findFirst({ where: { id: parsed.data.blockedByProjectId, ...(clientId ? { clientId } : {}) } })
      ]);
      if (!project || !blockedByProject) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project dependency not found in current scope" } } as ApiResponse;
      }
      const dependency = await prisma.projectDependency.create({
        data: {
          projectId: project.id,
          blockedByProjectId: blockedByProject.id,
          type: parsed.data.type ?? "BLOCKS"
        },
        include: { blockedByProject: true }
      });
      await logProjectActivity({
        projectId: project.id,
        clientId: project.clientId,
        type: "DEPENDENCY_CREATED",
        details: `Depends on ${blockedByProject.name}`
      });
      return { success: true, data: dependency, meta: { requestId: scope.requestId } } as ApiResponse<typeof dependency>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "DEPENDENCY_CREATE_FAILED", message: "Unable to create dependency" } } as ApiResponse;
    }
  });

  app.get<{ Params: { projectId: string } }>("/projects/:projectId/activities", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const project = await prisma.project.findFirst({
        where: { id: request.params.projectId, ...(clientId ? { clientId } : {}) }
      });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found in current scope" } } as ApiResponse;
      }
      const activities = await prisma.projectActivity.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      return { success: true, data: activities, meta: { requestId: scope.requestId } } as ApiResponse<typeof activities>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROJECT_ACTIVITIES_FETCH_FAILED", message: "Unable to fetch project activities" } } as ApiResponse;
    }
  });

  app.get("/projects/analytics", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const projects = await prisma.project.findMany({
        where: clientId ? { clientId } : {},
        select: {
          id: true,
          status: true,
          riskLevel: true,
          dueAt: true,
          progressPercent: true,
          clientId: true
        }
      });
      const total = projects.length;
      const completed = projects.filter((p) => p.status === "COMPLETED").length;
      const atRisk = projects.filter((p) => p.riskLevel === "HIGH").length;
      const overdue = projects.filter((p) => p.dueAt && p.status !== "COMPLETED" && p.dueAt.getTime() < Date.now()).length;
      const avgProgress = total === 0 ? 0 : projects.reduce((sum, p) => sum + p.progressPercent, 0) / total;
      return {
        success: true,
        data: { total, completed, atRisk, overdue, completionRate: total === 0 ? 0 : completed / total, avgProgress },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PROJECT_ANALYTICS_FETCH_FAILED", message: "Unable to fetch project analytics" } } as ApiResponse;
    }
  });

  app.post("/projects/handoff-package", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      if (clientId) {
        const projectsWithoutFinalPayment = await prisma.project.findMany({
          where: {
            clientId,
            status: { in: ["IN_PROGRESS", "REVIEW", "COMPLETED"] },
            NOT: {
              activities: { some: { type: "PAYMENT_FINAL_20_CONFIRMED" } }
            }
          },
          select: { id: true, name: true },
          take: 10
        });
        if (projectsWithoutFinalPayment.length > 0) {
          reply.status(409);
          return {
            success: false,
            error: {
              code: "FINAL_PAYMENT_REQUIRED",
              message: "Final 20% payment must be confirmed before generating handoff package."
            }
          } as ApiResponse;
        }
      }
      const summary = await computeHandoffSummary(clientId);

      return {
        success: true,
        data: summary,
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "HANDOFF_PACKAGE_FAILED", message: "Unable to generate handoff package." }
      } as ApiResponse;
    }
  });

  app.get("/projects/handoff-exports", async (request) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }
    try {
      const pref = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: scope.userId,
            key: "projects.handoffExports"
          }
        }
      });

      let records: HandoffExportRecord[] = [];
      if (pref?.value) {
        try {
          const parsed = JSON.parse(pref.value);
          if (Array.isArray(parsed)) {
            records = parsed as HandoffExportRecord[];
          }
        } catch {
          records = [];
        }
      }

      return {
        success: true,
        data: records,
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "HANDOFF_EXPORTS_LOAD_FAILED", message: "Unable to load handoff exports." }
      } as ApiResponse;
    }
  });

  app.post("/projects/handoff-exports", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scope.userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }

    const rawBody = (request.body as { format?: string } | undefined) ?? {};
    const format: HandoffExportFormat = rawBody.format === "markdown" ? "markdown" : "json";

    try {
      if (clientId) {
        const projectsWithoutFinalPayment = await prisma.project.findMany({
          where: {
            clientId,
            status: { in: ["IN_PROGRESS", "REVIEW", "COMPLETED"] },
            NOT: {
              activities: { some: { type: "PAYMENT_FINAL_20_CONFIRMED" } }
            }
          },
          select: { id: true, name: true },
          take: 10
        });
        if (projectsWithoutFinalPayment.length > 0) {
          reply.status(409);
          return {
            success: false,
            error: {
              code: "FINAL_PAYMENT_REQUIRED",
              message: "Final 20% payment must be confirmed before exporting handoff package."
            }
          } as ApiResponse;
        }
      }
      const summary = await computeHandoffSummary(clientId);
      const formatted = formatHandoffExportContent(format, summary);
      const timestamp = new Date(summary.generatedAt)
        .toISOString()
        .replace(/[:.]/g, "-");
      const fileName = `maphari-handoff-${timestamp}.${formatted.extension}`;
      const fileResult = await callFilesService<FilesInlineCreateResponse>(
        "/files/inline",
        "POST",
        {
          userId: scope.userId,
          role: scope.role,
          clientId,
          requestId: scope.requestId ?? randomUUID(),
          traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined
        },
        {
          clientId,
          fileName,
          mimeType: formatted.mimeType,
          contentBase64: Buffer.from(formatted.content, "utf8").toString("base64")
        }
      );
      if (!fileResult.success || !fileResult.data) {
        reply.status(502);
        return {
          success: false,
          error: {
            code: fileResult.error?.code ?? "HANDOFF_EXPORT_FILE_CREATE_FAILED",
            message: fileResult.error?.message ?? "Unable to persist handoff file."
          }
        } as ApiResponse;
      }
      const record: HandoffExportRecord = {
        id: randomUUID(),
        format,
        fileId: fileResult.data.id,
        fileName,
        mimeType: formatted.mimeType,
        downloadPath: "",
        docs: summary.docs,
        decisions: summary.decisions,
        blockers: summary.blockers,
        generatedAt: summary.generatedAt
      };
      record.downloadPath = `/projects/handoff-exports/${record.id}/download`;

      const pref = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: scope.userId,
            key: "projects.handoffExports"
          }
        }
      });
      let history: HandoffExportRecord[] = [];
      if (pref?.value) {
        try {
          const parsed = JSON.parse(pref.value);
          if (Array.isArray(parsed)) {
            history = parsed as HandoffExportRecord[];
          }
        } catch {
          history = [];
        }
      }
      const updatedHistory = [record, ...history].slice(0, 25);
      await prisma.userPreference.upsert({
        where: {
          userId_key: {
            userId: scope.userId,
            key: "projects.handoffExports"
          }
        },
        update: { value: JSON.stringify(updatedHistory) },
        create: {
          userId: scope.userId,
          key: "projects.handoffExports",
          value: JSON.stringify(updatedHistory)
        }
      });

      return {
        success: true,
        data: {
          record
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "HANDOFF_EXPORT_CREATE_FAILED", message: "Unable to create handoff export." }
      } as ApiResponse;
    }
  });

  app.get<{ Params: { exportId: string } }>("/projects/handoff-exports/:exportId/download", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }

    try {
      const pref = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: scope.userId,
            key: `projects.handoffExportContent.${request.params.exportId}`
          }
        }
      });
      if (!pref?.value) {
        reply.status(404);
        return {
          success: false,
          error: { code: "HANDOFF_EXPORT_NOT_FOUND", message: "Handoff export not found." }
        } as ApiResponse;
      }

      let exportHistory: HandoffExportRecord[] = [];
      try {
        const parsed = JSON.parse(pref.value);
        if (Array.isArray(parsed)) {
          exportHistory = parsed as HandoffExportRecord[];
        }
      } catch {
        exportHistory = [];
      }

      const target = exportHistory.find((entry) => entry.id === request.params.exportId);
      if (!target?.fileId) {
        reply.status(404);
        return {
          success: false,
          error: { code: "HANDOFF_EXPORT_NOT_FOUND", message: "Handoff export file is missing. Regenerate export." }
        } as ApiResponse;
      }

      const downloadResult = await callFilesService<FilesDownloadUrlResponse>(
        `/files/${target.fileId}/download-url`,
        "GET",
        {
          userId: scope.userId,
          role: scope.role,
          clientId: scope.clientId,
          requestId: scope.requestId ?? randomUUID(),
          traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined
        }
      );
      if (!downloadResult.success || !downloadResult.data) {
        reply.status(502);
        return {
          success: false,
          error: {
            code: downloadResult.error?.code ?? "HANDOFF_EXPORT_DOWNLOAD_URL_FAILED",
            message: downloadResult.error?.message ?? "Unable to resolve handoff export download URL."
          }
        } as ApiResponse;
      }

      return {
        success: true,
        data: downloadResult.data,
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "HANDOFF_EXPORT_DOWNLOAD_FAILED", message: "Unable to download handoff export." }
      } as ApiResponse;
    }
  });

  app.get("/project-preferences", async (request) => {
    const scope = readScopeHeaders(request);
    const parsed = getProjectPreferencesQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid project preference query", details: parsed.error.flatten() }
      } as ApiResponse;
    }
    if (!scope.userId) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }
    try {
      const pref = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: scope.userId,
            key: `projects.${parsed.data.key}`
          }
        }
      });
      return { success: true, data: pref, meta: { requestId: scope.requestId } } as ApiResponse<typeof pref>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PROJECT_PREF_FETCH_FAILED", message: "Unable to fetch project preference" } } as ApiResponse;
    }
  });

  app.post("/project-preferences", async (request) => {
    const scope = readScopeHeaders(request);
    const parsed = upsertProjectPreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid project preference payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }
    if (!scope.userId) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }
    try {
      const pref = await prisma.userPreference.upsert({
        where: {
          userId_key: {
            userId: scope.userId,
            key: `projects.${parsed.data.key}`
          }
        },
        update: { value: parsed.data.value },
        create: {
          userId: scope.userId,
          key: `projects.${parsed.data.key}`,
          value: parsed.data.value
        }
      });
      return { success: true, data: pref, meta: { requestId: scope.requestId } } as ApiResponse<typeof pref>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PROJECT_PREF_SAVE_FAILED", message: "Unable to save project preference" } } as ApiResponse;
    }
  });

  // ── Portal Project Roadmap ─────────────────────────────────────────────────
  app.get("/portal/project-roadmap", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const projects = await prisma.project.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          status: { not: "ARCHIVED" },
        },
        include: { milestones: { orderBy: { dueAt: "asc" } } },
        orderBy: { startAt: "asc" },
      });

      const data = projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        startAt: p.startAt?.toISOString() ?? null,
        endAt: p.dueAt?.toISOString() ?? null,
        milestones: p.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          dueAt: m.dueAt?.toISOString() ?? null,
          completedAt: null as string | null,
          paymentStage: null as string | null,
        })),
      }));

      return { success: true, data: { projects: data }, meta: { requestId: scope.requestId } } as ApiResponse<{ projects: typeof data }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "ROADMAP_FETCH_FAILED", message: "Unable to load project roadmap." } } as ApiResponse;
    }
  });
}
