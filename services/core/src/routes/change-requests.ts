import type { FastifyInstance } from "fastify";
import {
  createProjectChangeRequestSchema,
  getProjectChangeRequestsQuerySchema,
  type ApiResponse,
  updateProjectChangeRequestSchema
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { eventBus } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

const FINAL_STATES = new Set(["ADMIN_REJECTED", "CLIENT_APPROVED", "CLIENT_REJECTED"]);

function canUpdateStatus(role: "ADMIN" | "STAFF" | "CLIENT", status: string): boolean {
  if (role === "STAFF") return status === "ESTIMATED" || status === "SUBMITTED";
  if (role === "ADMIN") {
    return (
      status === "DRAFT" ||
      status === "SUBMITTED" ||
      status === "ESTIMATED" ||
      status === "ADMIN_APPROVED" ||
      status === "ADMIN_REJECTED" ||
      status === "CLIENT_APPROVED" ||
      status === "CLIENT_REJECTED"
    );
  }
  return status === "CLIENT_APPROVED" || status === "CLIENT_REJECTED";
}

const INTERNAL_NOTIFICATION_RECIPIENT = process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com";

type FilesDownloadUrlResponse = {
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  expiresAt: string;
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

async function callFilesService<T>(
  path: string,
  headers: {
    userId?: string | null;
    role?: string | null;
    clientId?: string | null;
    requestId?: string | null;
    traceId?: string | null;
  }
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "x-user-id": headers.userId ?? "",
        "x-user-role": headers.role ?? "CLIENT",
        "x-client-id": headers.clientId ?? "",
        "x-request-id": headers.requestId ?? "",
        "x-trace-id": headers.traceId ?? headers.requestId ?? ""
      }
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: "FILES_SERVICE_UNREACHABLE", message: "Unable to reach files service." }
    };
  }
}

async function callBillingService<T>(
  path: string,
  headers: {
    userId?: string | null;
    role?: string | null;
    clientId?: string | null;
    requestId?: string | null;
    traceId?: string | null;
  }
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "x-user-id": headers.userId ?? "",
        "x-user-role": headers.role ?? "CLIENT",
        "x-client-id": headers.clientId ?? "",
        "x-request-id": headers.requestId ?? "",
        "x-trace-id": headers.traceId ?? headers.requestId ?? ""
      }
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: "BILLING_SERVICE_UNREACHABLE", message: "Unable to reach billing service." }
    };
  }
}

async function publishWorkflowNotification(input: {
  requestId?: string;
  traceId?: string;
  clientId: string;
  subject: string;
  message: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
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
      subject: input.subject,
      message: input.message,
      tab: input.tab
    }
  });
}

async function createApprovedChangeArtifacts(changeRequest: {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  estimatedHours: number | null;
}): Promise<void> {
  const marker = `[CR:${changeRequest.id.slice(0, 8)}]`;
  const taskTitle = `${marker} ${changeRequest.title}`;
  const milestoneTitle = `${marker} Delivery package`;

  const existingTask = await prisma.projectTask.findFirst({
    where: { projectId: changeRequest.projectId, title: taskTitle },
    select: { id: true }
  });
  const existingMilestone = await prisma.projectMilestone.findFirst({
    where: { projectId: changeRequest.projectId, title: milestoneTitle },
    select: { id: true }
  });

  const now = new Date();
  const taskDueAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const milestoneDueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (!existingTask) {
    await prisma.projectTask.create({
      data: {
        projectId: changeRequest.projectId,
        title: taskTitle,
        assigneeName: "Assigned by workflow",
        status: "TODO",
        dueAt: taskDueAt
      }
    });
    await prisma.projectActivity.create({
      data: {
        projectId: changeRequest.projectId,
        clientId: changeRequest.clientId,
        type: "CHANGE_REQUEST_TASK_CREATED",
        details: taskTitle
      }
    });
  }

  if (!existingMilestone) {
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: changeRequest.projectId,
        title: milestoneTitle,
        status: "PENDING",
        dueAt: milestoneDueAt
      }
    });
    await prisma.milestoneApproval.upsert({
      where: { milestoneId: milestone.id },
      update: {},
      create: {
        milestoneId: milestone.id,
        projectId: changeRequest.projectId,
        clientId: changeRequest.clientId,
        status: "PENDING"
      }
    });
    await prisma.projectActivity.create({
      data: {
        projectId: changeRequest.projectId,
        clientId: changeRequest.clientId,
        type: "CHANGE_REQUEST_MILESTONE_CREATED",
        details: `${milestoneTitle}${changeRequest.estimatedHours ? ` · ${changeRequest.estimatedHours}h` : ""}`
      }
    });
  }
}

export async function registerChangeRequestRoutes(app: FastifyInstance): Promise<void> {
  app.get("/change-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getProjectChangeRequestsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid change request query payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsed.data.clientId);
    const rows = await prisma.projectChangeRequest.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {})
      },
      orderBy: { createdAt: "desc" },
      take: parsed.data.limit ?? 100
    });

    return {
      success: true,
      data: rows,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof rows>;
  });

  app.post("/change-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createProjectChangeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid change request payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { id: true, clientId: true }
    });
    if (!project) {
      reply.status(404);
      return {
        success: false,
        error: { code: "PROJECT_NOT_FOUND", message: "Project not found" }
      } as ApiResponse;
    }

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId, parsed.data.clientId ?? project.clientId);
    if (!scopedClientId || scopedClientId !== project.clientId) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Change request does not belong to scoped client" }
      } as ApiResponse;
    }

    const requestedByName = scope.userId?.slice(0, 8) ?? `${scope.role.toLowerCase()}-user`;
    const status = scope.role === "CLIENT" ? "SUBMITTED" : "DRAFT";

    const created = await prisma.projectChangeRequest.create({
      data: {
        projectId: project.id,
        clientId: project.clientId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        reason: parsed.data.reason ?? null,
        impactSummary: parsed.data.impactSummary ?? null,
        status,
        requestedByRole: scope.role,
        requestedByName
      }
    });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        clientId: project.clientId,
        type: "CHANGE_REQUEST_CREATED",
        details: created.title
      }
    });

    return {
      success: true,
      data: created,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof created>;
  });

  app.patch<{ Params: { changeRequestId: string } }>("/change-requests/:changeRequestId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = updateProjectChangeRequestSchema.safeParse({
      changeRequestId: request.params.changeRequestId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid change request update payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const existing = await prisma.projectChangeRequest.findUnique({
      where: { id: parsed.data.changeRequestId }
    });
    if (!existing) {
      reply.status(404);
      return {
        success: false,
        error: { code: "CHANGE_REQUEST_NOT_FOUND", message: "Change request not found" }
      } as ApiResponse;
    }

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId, existing.clientId);
    if (!scopedClientId || scopedClientId !== existing.clientId) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Change request does not belong to scoped client" }
      } as ApiResponse;
    }

    const adminOverride = scope.role === "ADMIN" && parsed.data.forceOverride === true;
    if (
      existing.status &&
      FINAL_STATES.has(existing.status) &&
      parsed.data.status &&
      parsed.data.status !== existing.status &&
      !adminOverride
    ) {
      reply.status(409);
      return {
        success: false,
        error: { code: "CHANGE_REQUEST_FINALIZED", message: "Change request is already finalized" }
      } as ApiResponse;
    }

    if (parsed.data.status && !canUpdateStatus(scope.role, parsed.data.status)) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN_STATUS_TRANSITION", message: "Role is not allowed to set this status" }
      } as ApiResponse;
    }

    const actorName = scope.userId?.slice(0, 8) ?? `${scope.role.toLowerCase()}-user`;
    const now = new Date();
    const isStaffEstimate = scope.role === "STAFF" && parsed.data.status === "ESTIMATED";
    const isAdminDecision =
      scope.role === "ADMIN" &&
      (parsed.data.status === "ADMIN_APPROVED" || parsed.data.status === "ADMIN_REJECTED");
    const isClientDecision =
      scope.role === "CLIENT" &&
      (parsed.data.status === "CLIENT_APPROVED" || parsed.data.status === "CLIENT_REJECTED");

    if (
      scope.role === "CLIENT" &&
      parsed.data.status === "CLIENT_APPROVED" &&
      (existing.estimatedCostCents ?? 0n) > 0n
    ) {
      if (!parsed.data.addendumFileId || !parsed.data.additionalPaymentInvoiceId || !parsed.data.additionalPaymentId) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "CHANGE_REQUEST_ADDENDUM_REQUIRED",
            message: "Addendum file and additional payment confirmation are required for priced scope changes."
          }
        } as ApiResponse;
      }

      const traceId = (request.headers["x-trace-id"] as string | undefined) ?? undefined;
      const [fileResult, paymentsResult] = await Promise.all([
        callFilesService<FilesDownloadUrlResponse>(`/files/${parsed.data.addendumFileId}/download-url`, {
          userId: scope.userId,
          role: scope.role,
          clientId: existing.clientId,
          requestId: scope.requestId,
          traceId
        }),
        callBillingService<BillingPaymentResponse[]>("/payments", {
          userId: scope.userId,
          role: scope.role,
          clientId: existing.clientId,
          requestId: scope.requestId,
          traceId
        })
      ]);
      if (!fileResult.success) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "CHANGE_REQUEST_ADDENDUM_INVALID",
            message: "Unable to validate addendum file for this change request."
          }
        } as ApiResponse;
      }
      if (!paymentsResult.success) {
        reply.status(502);
        return {
          success: false,
          error: {
            code: "CHANGE_REQUEST_PAYMENT_VERIFY_FAILED",
            message: "Unable to verify change-request payment right now."
          }
        } as ApiResponse;
      }
      const payment = (paymentsResult.data ?? []).find(
        (item) =>
          item.id === parsed.data.additionalPaymentId &&
          item.invoiceId === parsed.data.additionalPaymentInvoiceId &&
          item.clientId === existing.clientId
      );
      if (!payment || payment.status !== "COMPLETED") {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "CHANGE_REQUEST_PAYMENT_REQUIRED",
            message: "Additional payment must be completed before approving this scope change."
          }
        } as ApiResponse;
      }
    }

    const updated = await prisma.projectChangeRequest.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.estimatedHours !== undefined ? { estimatedHours: parsed.data.estimatedHours } : {}),
        ...(parsed.data.estimatedCostCents !== undefined
          ? { estimatedCostCents: BigInt(parsed.data.estimatedCostCents) }
          : {}),
        ...(parsed.data.staffAssessment !== undefined ? { staffAssessment: parsed.data.staffAssessment } : {}),
        ...(parsed.data.adminDecisionNote !== undefined ? { adminDecisionNote: parsed.data.adminDecisionNote } : {}),
        ...(parsed.data.clientDecisionNote !== undefined ? { clientDecisionNote: parsed.data.clientDecisionNote } : {}),
        ...(isStaffEstimate
          ? {
              estimatedAt: now,
              estimatedByRole: scope.role,
              estimatedByName: actorName
            }
          : {}),
        ...(isAdminDecision
          ? {
              adminDecidedAt: now,
              adminDecidedByRole: scope.role,
              adminDecidedByName: actorName
            }
          : {}),
        ...(isClientDecision
          ? {
              clientDecidedAt: now,
              clientDecidedByRole: scope.role,
              clientDecidedByName: actorName
            }
          : {})
      }
    });

    await prisma.projectActivity.create({
      data: {
        projectId: updated.projectId,
        clientId: updated.clientId,
        type: "CHANGE_REQUEST_UPDATED",
        details: `${updated.title} · ${updated.status}`
      }
    });
    if (adminOverride && parsed.data.status && parsed.data.status !== existing.status) {
      await prisma.projectActivity.create({
        data: {
          projectId: updated.projectId,
          clientId: updated.clientId,
          type: "CHANGE_REQUEST_OVERRIDE",
          details: `${existing.status} -> ${parsed.data.status}`
        }
      });
    }

    const traceId = (request.headers["x-trace-id"] as string | undefined) ?? undefined;
    if (isStaffEstimate) {
      await publishWorkflowNotification({
        requestId: scope.requestId,
        traceId,
        clientId: updated.clientId,
        subject: "Change request estimated",
        message: `Estimate ready for admin review: ${updated.title}.`,
        tab: "projects"
      });
    }

    if (isAdminDecision) {
      await publishWorkflowNotification({
        requestId: scope.requestId,
        traceId,
        clientId: updated.clientId,
        subject: updated.status === "ADMIN_APPROVED" ? "Change request approved by admin" : "Change request rejected by admin",
        message: `${updated.title} is now ${updated.status}.`,
        tab: "projects"
      });
    }

    if (parsed.data.status === "CLIENT_APPROVED") {
      if (parsed.data.addendumFileId) {
        await prisma.projectActivity.create({
          data: {
            projectId: updated.projectId,
            clientId: updated.clientId,
            type: "CHANGE_REQUEST_ADDENDUM_ATTACHED",
            details: JSON.stringify({
              addendumFileId: parsed.data.addendumFileId,
              additionalPaymentInvoiceId: parsed.data.additionalPaymentInvoiceId ?? null,
              additionalPaymentId: parsed.data.additionalPaymentId ?? null
            })
          }
        });
      }
      await createApprovedChangeArtifacts({
        id: updated.id,
        projectId: updated.projectId,
        clientId: updated.clientId,
        title: updated.title,
        estimatedHours: updated.estimatedHours
      });
      await publishWorkflowNotification({
        requestId: scope.requestId,
        traceId,
        clientId: updated.clientId,
        subject: "Change request accepted by client",
        message: `Client approved change request ${updated.title}. Delivery artifacts were generated automatically.`,
        tab: "projects"
      });
    }

    return {
      success: true,
      data: updated,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof updated>;
  });
}
