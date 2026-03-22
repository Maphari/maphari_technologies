// ════════════════════════════════════════════════════════════════════════════
// projects.ts — Portal API client: project + invoice standalone loaders
// ════════════════════════════════════════════════════════════════════════════
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";
import type {
  PortalSnapshot,
  PortalConversation,
  PortalFile,
  PortalInvoice,
  PortalPayment,
  PortalProject,
  PortalProjectDetail,
  PortalProjectRequestServiceType,
  PortalProjectRequestBuildMode,
  PortalProjectRequestComplexity,
  PortalProjectRequestDesignPackage,
  PortalProjectRequestServiceOption,
  PortalProjectRequestAddonOption,
  PortalProjectCollaboration,
  PortalCollaborationNote,
  PortalHandoffSummary,
  PortalHandoffExportRecord,
  PortalHandoffExportPayload,
  PortalProjectBlocker,
  PortalTimelineEvent,
  PortalProjectChangeRequest,
  PortalProjectPaymentMilestone,
  PortalMilestoneApproval,
  PortalFile as _PortalFile,
  UploadUrlPayload
} from "./types";

function emptySnapshot(): PortalSnapshot {
  return { conversations: [], files: [], invoices: [], payments: [], projects: [] };
}

/**
 * Loads portal-first datasets from gateway endpoints; every call keeps
 * ApiResponse handling explicit so UI logic can be deterministic.
 */
export async function loadPortalSnapshotWithRefresh(session: AuthSession): Promise<AuthorizedResult<PortalSnapshot>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const [conversations, files, invoices, payments, projects] = await Promise.all([
      callGateway<PortalConversation[]>("/conversations", accessToken),
      callGateway<PortalFile[]>("/files", accessToken),
      callGateway<PortalInvoice[]>("/invoices", accessToken),
      callGateway<PortalPayment[]>("/payments", accessToken),
      callGateway<PortalProject[]>("/projects", accessToken)
    ]);

    if (
      isUnauthorized(conversations) ||
      isUnauthorized(files) ||
      isUnauthorized(invoices) ||
      isUnauthorized(payments) ||
      isUnauthorized(projects)
    ) {
      return { unauthorized: true, data: null, error: null };
    }

    const firstError =
      (!conversations.payload.success ? conversations.payload.error : null) ||
      (!files.payload.success ? files.payload.error : null) ||
      (!invoices.payload.success ? invoices.payload.error : null) ||
      (!payments.payload.success ? payments.payload.error : null) ||
      (!projects.payload.success ? projects.payload.error : null);

    if (firstError) {
      return {
        unauthorized: false,
        data: emptySnapshot(),
        error: toGatewayError(firstError.code, firstError.message)
      };
    }

    return {
      unauthorized: false,
      data: {
        conversations: conversations.payload.data ?? [],
        files: files.payload.data ?? [],
        invoices: invoices.payload.data ?? [],
        payments: payments.payload.data ?? [],
        projects: projects.payload.data ?? []
      },
      error: null
    };
  });
}

export async function loadPortalProjectDetailWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalProjectDetail>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProjectDetail>(`/projects/${projectId}`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project"
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data ?? null,
      error: null
    };
  });
}

export async function createPortalProjectRequestWithRefresh(
  session: AuthSession,
  input: {
    name: string;
    description?: string;
    desiredStartAt?: string;
    desiredDueAt?: string;
    estimatedBudgetCents?: number;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    serviceType?: PortalProjectRequestServiceType;
    buildMode?: PortalProjectRequestBuildMode;
    complexity?: PortalProjectRequestComplexity;
    designPackage?: PortalProjectRequestDesignPackage;
    websitePageCount?: number;
    appScreenCount?: number;
    integrationsCount?: number;
    targetPlatforms?: Array<"WEB" | "IOS" | "ANDROID">;
    requiresContentSupport?: boolean;
    requiresDomainAndHosting?: boolean;
    scopePrompt?: string;
    selectedServices?: PortalProjectRequestServiceOption[];
    addonServices?: PortalProjectRequestAddonOption[];
    signedAgreementFileId: string;
    estimatedQuoteCents: number;
    depositInvoiceId: string;
    depositPaymentId: string;
  }
): Promise<AuthorizedResult<PortalProject>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProject>("/projects/requests", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_REQUEST_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to submit project request"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPortalInvoiceWithRefresh(
  session: AuthSession,
  input: {
    number: string;
    amountCents: number;
    currency?: string;
    status?: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "VOID";
    issuedAt?: string;
    dueAt?: string;
  }
): Promise<AuthorizedResult<PortalInvoice>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalInvoice>("/invoices", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create invoice"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPortalPaymentWithRefresh(
  session: AuthSession,
  input: {
    invoiceId: string;
    amountCents: number;
    status?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    provider?: string;
    transactionRef?: string;
    paidAt?: string;
  }
): Promise<AuthorizedResult<PortalPayment>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalPayment>("/payments", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PAYMENT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create payment"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadPortalProjectCollaborationWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalProjectCollaboration>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProjectCollaboration>(`/projects/${projectId}/collaboration`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_COLLABORATION_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load collaboration details"
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function createPortalCollaborationNoteWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { message: string; visibility?: "INTERNAL" | "EXTERNAL"; workstream?: string }
): Promise<AuthorizedResult<PortalCollaborationNote>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalCollaborationNote>(
      `/projects/${projectId}/collaboration/notes`,
      accessToken,
      {
        method: "POST",
        body: input
      }
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_COLLABORATION_NOTE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create collaboration note"
        )
      };
    }
    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function generatePortalHandoffSummaryWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalHandoffSummary>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalHandoffSummary>("/projects/handoff-package", accessToken, {
      method: "POST"
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_PACKAGE_FAILED",
          response.payload.error?.message ?? "Unable to generate handoff package"
        )
      };
    }

    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function loadPortalHandoffExportsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalHandoffExportRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalHandoffExportRecord[]>("/projects/handoff-exports", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_EXPORTS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load handoff exports"
        )
      };
    }

    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPortalHandoffExportWithRefresh(
  session: AuthSession,
  input: { format?: "json" | "markdown" } = {}
): Promise<AuthorizedResult<PortalHandoffExportPayload>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalHandoffExportPayload>("/projects/handoff-exports", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_EXPORT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create handoff export"
        )
      };
    }

    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function downloadPortalHandoffExportWithRefresh(
  session: AuthSession,
  exportId: string
): Promise<AuthorizedResult<{ downloadUrl: string; fileName: string; mimeType: string; expiresAt: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ downloadUrl: string; fileName: string; mimeType: string; expiresAt: string }>(
      `/projects/handoff-exports/${exportId}/download`,
      accessToken
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_EXPORT_DOWNLOAD_FAILED",
          response.payload.error?.message ?? "Unable to download handoff export"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadPortalBlockersWithRefresh(
  session: AuthSession,
  options: {
    projectId?: string;
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    limit?: number;
  } = {}
): Promise<AuthorizedResult<PortalProjectBlocker[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const response = await callGateway<PortalProjectBlocker[]>(
      `/blockers${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "BLOCKERS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load blockers"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadPortalTimelineWithRefresh(
  session: AuthSession,
  options: { projectId?: string; limit?: number } = {}
): Promise<AuthorizedResult<PortalTimelineEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const response = await callGateway<PortalTimelineEvent[]>(
      `/timeline${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "TIMELINE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load timeline"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadPortalChangeRequestsWithRefresh(
  session: AuthSession,
  options: {
    projectId?: string;
    status?:
      | "DRAFT"
      | "SUBMITTED"
      | "ESTIMATED"
      | "ADMIN_APPROVED"
      | "ADMIN_REJECTED"
      | "CLIENT_APPROVED"
      | "CLIENT_REJECTED";
    limit?: number;
  } = {}
): Promise<AuthorizedResult<PortalProjectChangeRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const response = await callGateway<PortalProjectChangeRequest[]>(
      `/change-requests${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CHANGE_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load change requests"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPortalChangeRequestWithRefresh(
  session: AuthSession,
  input: {
    projectId: string;
    title: string;
    description?: string;
    reason?: string;
    impactSummary?: string;
  }
): Promise<AuthorizedResult<PortalProjectChangeRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProjectChangeRequest>("/change-requests", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CHANGE_REQUEST_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create change request"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updatePortalChangeRequestWithRefresh(
  session: AuthSession,
  changeRequestId: string,
  input: {
    status?:
      | "DRAFT"
      | "SUBMITTED"
      | "ESTIMATED"
      | "ADMIN_APPROVED"
      | "ADMIN_REJECTED"
      | "CLIENT_APPROVED"
      | "CLIENT_REJECTED"
      | "DEFERRED";
    estimatedHours?: number;
    estimatedCostCents?: number;
    staffAssessment?: string;
    adminDecisionNote?: string;
    clientDecisionNote?: string;
    addendumFileId?: string;
    additionalPaymentInvoiceId?: string;
    additionalPaymentId?: string;
  }
): Promise<AuthorizedResult<PortalProjectChangeRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProjectChangeRequest>(
      `/change-requests/${changeRequestId}`,
      accessToken,
      { method: "PATCH", body: input }
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CHANGE_REQUEST_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update change request"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadPortalProjectPaymentMilestonesWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalProjectPaymentMilestone[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProjectPaymentMilestone[]>(`/projects/${projectId}/payment-milestones`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_PAYMENT_MILESTONES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load payment milestones"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function markPortalProjectPaymentMilestoneWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { stage: "MILESTONE_30" | "FINAL_20"; invoiceId: string; paymentId: string }
): Promise<AuthorizedResult<{ stage: "MILESTONE_30" | "FINAL_20"; paymentId: string; invoiceId: string; amountCents: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ stage: "MILESTONE_30" | "FINAL_20"; paymentId: string; invoiceId: string; amountCents: number }>(
      `/projects/${projectId}/payment-milestones`,
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_PAYMENT_MILESTONE_MARK_FAILED",
          response.payload.error?.message ?? "Unable to mark payment milestone"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadPortalMilestoneApprovalsWithRefresh(
  session: AuthSession,
  options: { projectId?: string; status?: "PENDING" | "APPROVED" | "REJECTED" } = {}
): Promise<AuthorizedResult<PortalMilestoneApproval[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (options.projectId) params.set("projectId", options.projectId);
    if (options.status) params.set("status", options.status);
    const response = await callGateway<PortalMilestoneApproval[]>(
      `/milestone-approvals${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "APPROVALS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load approvals"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function updatePortalMilestoneApprovalWithRefresh(
  session: AuthSession,
  milestoneId: string,
  input: { status: "PENDING" | "APPROVED" | "REJECTED"; comment?: string }
): Promise<AuthorizedResult<PortalMilestoneApproval>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMilestoneApproval>(
      `/milestones/${milestoneId}/approval`,
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "APPROVAL_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update approval"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function uploadPortalFileWithRefresh(
  session: AuthSession,
  file: File
): Promise<AuthorizedResult<PortalFile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const issueUpload = await callGateway<UploadUrlPayload>("/files/upload-url", accessToken, {
      method: "POST",
      body: {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size
      }
    });

    if (isUnauthorized(issueUpload)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!issueUpload.payload.success || !issueUpload.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          issueUpload.payload.error?.code ?? "UPLOAD_URL_ISSUE_FAILED",
          issueUpload.payload.error?.message ?? "Unable to issue upload URL"
        )
      };
    }

    let uploadResult: Response;
    try {
      uploadResult = await fetch(issueUpload.payload.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "content-type": file.type || "application/octet-stream"
        }
      });
    } catch {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError("UPLOAD_TRANSFER_FAILED", "Direct upload failed. Please retry.")
      };
    }
    if (!uploadResult.ok) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError("UPLOAD_TRANSFER_FAILED", "Direct upload failed. Please retry.")
      };
    }

    const confirmUpload = await callGateway<PortalFile>("/files/confirm-upload", accessToken, {
      method: "POST",
      body: {
        fileName: file.name,
        storageKey: issueUpload.payload.data.storageKey,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        uploadToken: issueUpload.payload.data.uploadToken
      }
    });

    if (isUnauthorized(confirmUpload)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!confirmUpload.payload.success || !confirmUpload.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          confirmUpload.payload.error?.code ?? "UPLOAD_CONFIRM_FAILED",
          confirmUpload.payload.error?.message ?? "Unable to confirm file upload"
        )
      };
    }

    return {
      unauthorized: false,
      data: confirmUpload.payload.data,
      error: null
    };
  });
}

// ── Standalone project list loader ────────────────────────────────────────────

export async function loadPortalProjectsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalProject[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProject[]>("/projects", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load projects."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export interface PayfastInitiateResult {
  url: string;
  fields: Record<string, string>;
}

export async function initiatePortalPayfastWithRefresh(
  session: AuthSession,
  input: { invoiceId: string; returnUrl: string; cancelUrl: string }
): Promise<AuthorizedResult<PayfastInitiateResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PayfastInitiateResult>("/payfast/initiate", accessToken, {
      method: "POST",
      body: input,
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PAYFAST_INITIATE_FAILED",
          response.payload.error?.message ?? "Unable to initiate PayFast payment."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Weekly Spend ──────────────────────────────────────────────────────────────

export interface PortalWeeklySpendWeek {
  week: string;
  amountCents: number;
  forecast: boolean;
}

export interface PortalWeeklySpend {
  weeks: PortalWeeklySpendWeek[];
  weeklyBudgetCapCents: number;
  currentWeekLabel: string;
}

export async function loadPortalWeeklySpendWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalWeeklySpend>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalWeeklySpend>(
      `/portal/projects/${projectId}/weekly-spend`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WEEKLY_SPEND_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load weekly spend."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Standalone invoice list loader ────────────────────────────────────────────

export async function loadPortalInvoicesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalInvoice[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalInvoice[]>("/invoices", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load invoices."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
