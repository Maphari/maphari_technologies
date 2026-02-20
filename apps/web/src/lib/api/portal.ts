import type { ApiResponse } from "@maphari/contracts";
import type { AuthSession } from "../auth/session";
import { refresh } from "./gateway";

const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

export interface PortalConversation {
  id: string;
  clientId: string;
  assigneeUserId: string | null;
  subject: string;
  projectId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalMessage {
  id: string;
  clientId: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  deliveryStatus: "SENT" | "DELIVERED" | "READ";
  deliveredAt: string | null;
  readAt: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalFile {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortalPayment {
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
}

export interface PortalInvoice {
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
  payments: PortalPayment[];
}

export interface PortalProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  ownerName: string | null;
  priority: string;
  riskLevel: string;
  startAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  budgetCents: number;
  progressPercent: number;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PortalProjectRequestServiceType =
  | "AUTO_RECOMMEND"
  | "WEBSITE"
  | "MOBILE_APP"
  | "AUTOMATION"
  | "UI_UX_DESIGN"
  | "OTHER";

export type PortalProjectRequestBuildMode = "AUTO" | "WORDPRESS" | "CUSTOM_CODE";
export type PortalProjectRequestComplexity = "SIMPLE" | "STANDARD" | "ADVANCED";
export type PortalProjectRequestDesignPackage = "NONE" | "WIREFRAMES" | "WIREFRAMES_AND_UX";
export type PortalProjectRequestServiceOption =
  | "WEB_DEVELOPMENT"
  | "WORDPRESS_DEVELOPMENT"
  | "CUSTOM_WEB_APP_DEVELOPMENT"
  | "ECOMMERCE_DEVELOPMENT"
  | "CMS_IMPLEMENTATION"
  | "UI_UX_DESIGN"
  | "UX_RESEARCH_TESTING"
  | "WIREFRAMING_PROTOTYPING"
  | "BRANDING_VISUAL_IDENTITY"
  | "MOBILE_APP_IOS"
  | "MOBILE_APP_ANDROID"
  | "MOBILE_APP_CROSS_PLATFORM"
  | "API_DEVELOPMENT"
  | "THIRD_PARTY_INTEGRATIONS"
  | "AUTOMATION_WORKFLOWS"
  | "RPA_LEGACY_AUTOMATION"
  | "AI_LLM_AUTOMATIONS"
  | "QA_TESTING"
  | "SECURITY_COMPLIANCE"
  | "DEVOPS_CI_CD_CLOUD"
  | "ANALYTICS_TRACKING"
  | "SEO_TECHNICAL"
  | "CONTENT_MIGRATION"
  | "MAINTENANCE_SUPPORT"
  | "DEDICATED_TEAM"
  | "DISCOVERY_CONSULTING";
export type PortalProjectRequestAddonOption =
  | "COPYWRITING_CONTENT"
  | "ADVANCED_SEO"
  | "PERFORMANCE_OPTIMIZATION"
  | "TRAINING_HANDOFF"
  | "PRIORITY_SUPPORT"
  | "ADDITIONAL_QA_CYCLE"
  | "SECURITY_REVIEW"
  | "ANALYTICS_DASHBOARD";

export interface PortalProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  status: string;
  dueAt: string | null;
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalProjectTask {
  id: string;
  projectId: string;
  title: string;
  assigneeName: string | null;
  status: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators?: PortalTaskCollaborator[];
}

export interface PortalTaskCollaborator {
  id: string;
  projectId: string;
  taskId: string;
  clientId: string;
  staffUserId: string | null;
  staffName: string;
  role: "LEAD" | "CONTRIBUTOR" | "REVIEWER";
  allocationPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalProjectDependency {
  id: string;
  projectId: string;
  blockedByProjectId: string;
  type: string;
  createdAt: string;
  blockedByProject?: PortalProject | null;
}

export interface PortalProjectActivity {
  id: string;
  projectId: string;
  clientId: string;
  type: string;
  details: string | null;
  createdAt: string;
}

export interface PortalProjectPaymentMilestone {
  stage: "MILESTONE_30" | "FINAL_20";
  paid: boolean;
  amountCents: number;
  invoiceId: string | null;
  paymentId: string | null;
  markedAt: string | null;
  note: string | null;
}

export interface PortalProjectBlocker {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  ownerRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  ownerName: string | null;
  etaAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalTimelineEvent {
  id: string;
  clientId: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
}

export interface PortalProjectChangeRequest {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string | null;
  reason: string | null;
  impactSummary: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "ESTIMATED"
    | "ADMIN_APPROVED"
    | "ADMIN_REJECTED"
    | "CLIENT_APPROVED"
    | "CLIENT_REJECTED";
  requestedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  requestedByName: string | null;
  requestedAt: string;
  estimatedHours: number | null;
  estimatedCostCents: number | null;
  staffAssessment: string | null;
  estimatedAt: string | null;
  estimatedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  estimatedByName: string | null;
  adminDecisionNote: string | null;
  adminDecidedAt: string | null;
  adminDecidedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  adminDecidedByName: string | null;
  clientDecisionNote: string | null;
  clientDecidedAt: string | null;
  clientDecidedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  clientDecidedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PortalProjectDetail = PortalProject & {
  milestones: PortalProjectMilestone[];
  tasks: PortalProjectTask[];
  dependencies: PortalProjectDependency[];
  activities: PortalProjectActivity[];
  collaborators?: PortalTaskCollaborator[];
  collaborationNotes?: PortalCollaborationNote[];
  workSessions?: PortalWorkSession[];
};

export interface PortalCollaborationNote {
  id: string;
  projectId: string;
  clientId: string;
  authorId: string | null;
  authorRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  authorName: string;
  visibility: "INTERNAL" | "EXTERNAL";
  workstream: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalWorkSession {
  id: string;
  projectId: string;
  taskId: string | null;
  clientId: string;
  memberId: string | null;
  memberName: string;
  memberRole: "ADMIN" | "STAFF";
  workstream: string | null;
  status: "ACTIVE" | "PAUSED" | "DONE";
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalProjectCollaboration {
  projectId: string;
  contributors: Array<{ name: string; role: string; activeSessions: number; taskCount: number }>;
  sessions: PortalWorkSession[];
  notes: PortalCollaborationNote[];
}

export interface PortalMilestoneApproval {
  id: string;
  milestoneId: string;
  projectId: string;
  clientId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comment: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSnapshot {
  conversations: PortalConversation[];
  files: PortalFile[];
  invoices: PortalInvoice[];
  payments: PortalPayment[];
  projects: PortalProject[];
}

interface PortalNotificationJob {
  id: string;
  status: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  readAt: string | null;
}

export interface PortalNotificationUnreadCount {
  total: number;
  byTab: Record<"dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations", number>;
}

export interface PortalPreference {
  id: string;
  userId: string;
  key:
    | "savedView"
    | "layout"
    | "settingsProfile"
    | "settingsWorkspace"
    | "settingsSecurity"
    | "settingsNotifications"
    | "settingsApiAccess"
    | "settingsAutomationPhase2"
    | "dashboardLastSeenAt"
    | "kanbanBoardPrefs";
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalHandoffSummary {
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
}

export interface PortalHandoffExportRecord {
  id: string;
  format: "json" | "markdown";
  fileId?: string;
  fileName: string;
  mimeType: string;
  downloadPath: string;
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
}

export interface PortalHandoffExportPayload {
  record: PortalHandoffExportRecord;
}

export interface UploadUrlPayload {
  uploadUrl: string;
  uploadToken: string;
  storageKey: string;
  expiresAt: string;
}

interface RawGatewayResponse<T> {
  status: number;
  payload: ApiResponse<T>;
}

interface GatewayError {
  code: string;
  message: string;
}

interface AuthorizedResult<T> {
  data: T | null;
  nextSession: AuthSession | null;
  error: GatewayError | null;
}

function emptySnapshot(): PortalSnapshot {
  return { conversations: [], files: [], invoices: [], payments: [], projects: [] };
}

async function callGateway<T>(
  path: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {}
): Promise<RawGatewayResponse<T>> {
  try {
    const response = await fetch(`${gatewayBaseUrl}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let payload: ApiResponse<T>;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      payload = {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "Gateway returned an invalid response format."
        }
      };
    }
    return { status: response.status, payload };
  } catch {
    return {
      status: 0,
      payload: {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Unable to reach the API. Confirm the gateway is running and NEXT_PUBLIC_GATEWAY_BASE_URL is correct."
        }
      }
    };
  }
}

function isUnauthorized<T>(response: RawGatewayResponse<T>): boolean {
  return response.status === 401 || response.payload.error?.code === "UPSTREAM_UNAUTHORIZED";
}

function toGatewayError(code: string, message: string): GatewayError {
  const hints: Record<string, string> = {
    VALIDATION_ERROR: "Please review required fields and try again.",
    SIGNED_AGREEMENT_REQUIRED: "Upload and select a signed agreement before submitting.",
    DEPOSIT_PAYMENT_REQUIRED: "A valid 50% deposit payment record is required.",
    DEPOSIT_NOT_COMPLETED: "Deposit payment must be completed before submission.",
    DEPOSIT_UNDERPAID: "Deposit amount must be at least 50% of the estimate.",
    DEPOSIT_GATE_UNAVAILABLE: "Billing verification is temporarily unavailable. Please retry shortly.",
    UPLOAD_TRANSFER_FAILED: "File upload transfer failed. Please retry in a moment.",
    PROJECT_REQUEST_CREATE_FAILED: "Request submission failed. Your payment may be saved; retry submit once."
  };
  const hint = hints[code];
  const base = message?.trim().length > 0 ? message.trim() : "Request failed.";
  const detail = hint && !base.includes(hint) ? ` ${hint}` : "";
  return { code, message: `${base}${detail} [${code}]` };
}

async function refreshSessionWithRetry(): Promise<AuthSession | null> {
  const first = await refresh();
  if (first.success && first.data) return first.data;

  const second = await refresh();
  if (second.success && second.data) return second.data;

  return null;
}

async function withAuthorizedSession<T>(
  session: AuthSession,
  runner: (accessToken: string) => Promise<{ unauthorized: boolean; data: T | null; error: GatewayError | null }>
): Promise<AuthorizedResult<T>> {
  const first = await runner(session.accessToken);
  if (!first.unauthorized) {
    return { data: first.data, nextSession: session, error: first.error };
  }

  const refreshedSession = await refreshSessionWithRetry();
  if (!refreshedSession) {
    return {
      data: null,
      nextSession: null,
      error: toGatewayError("SESSION_EXPIRED", "Session expired. Please sign in again.")
    };
  }

  const nextSession: AuthSession = refreshedSession;

  const second = await runner(nextSession.accessToken);
  if (second.unauthorized) {
    return {
      data: null,
      nextSession,
      error: toGatewayError("SESSION_UNAUTHORIZED", "Session is valid but authorization failed for portal resources.")
    };
  }

  return { data: second.data, nextSession, error: second.error };
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

export async function loadPortalNotificationCountWithRefresh(session: AuthSession): Promise<AuthorizedResult<number>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalNotificationUnreadCount>("/notifications/unread-count", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      const code = response.payload.error?.code ?? "NOTIFICATION_COUNT_FAILED";
      if (code === "FORBIDDEN") {
        return { unauthorized: false, data: 0, error: null };
      }
      return {
        unauthorized: false,
        data: 0,
        error: toGatewayError(code, response.payload.error?.message ?? "Unable to load notifications")
      };
    }

    const count = response.payload.data?.total ?? 0;
    return { unauthorized: false, data: count, error: null };
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
      | "CLIENT_REJECTED";
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

export async function loadConversationMessagesWithRefresh(
  session: AuthSession,
  conversationId: string
): Promise<AuthorizedResult<PortalMessage[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const messages = await callGateway<PortalMessage[]>(`/conversations/${conversationId}/messages`, accessToken);
    if (isUnauthorized(messages)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!messages.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          messages.payload.error?.code ?? "MESSAGES_LOAD_FAILED",
          messages.payload.error?.message ?? "Unable to load messages"
        )
      };
    }

    return {
      unauthorized: false,
      data: messages.payload.data ?? [],
      error: null
    };
  });
}

export async function createPortalConversationWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    subject: string;
    projectId?: string;
    assigneeUserId?: string;
  }
): Promise<AuthorizedResult<PortalConversation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalConversation>("/conversations", accessToken, {
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
          response.payload.error?.code ?? "CONVERSATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create conversation"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPortalMessageWithRefresh(
  session: AuthSession,
  input: {
    conversationId: string;
    content: string;
  }
): Promise<AuthorizedResult<PortalMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMessage>("/messages", accessToken, {
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
          response.payload.error?.code ?? "MESSAGE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to send message"
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

export async function updatePortalMessageDeliveryWithRefresh(
  session: AuthSession,
  messageId: string,
  input: { status: "SENT" | "DELIVERED" | "READ"; deliveredAt?: string; readAt?: string }
): Promise<AuthorizedResult<PortalMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMessage>(`/messages/${messageId}/delivery`, accessToken, {
      method: "PATCH",
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
          response.payload.error?.code ?? "MESSAGE_DELIVERY_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update message delivery."
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

export async function getPortalPreferenceWithRefresh(
  session: AuthSession,
  key:
    | "savedView"
    | "layout"
    | "settingsProfile"
    | "settingsWorkspace"
    | "settingsSecurity"
    | "settingsNotifications"
    | "settingsApiAccess"
    | "settingsAutomationPhase2"
    | "dashboardLastSeenAt"
    | "kanbanBoardPrefs"
    | "documentCenterAdminTemplates"
    | "documentCenterClientAgreements"
): Promise<AuthorizedResult<PortalPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalPreference | null>(`/project-preferences?key=${key}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PREFERENCE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load preference"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setPortalPreferenceWithRefresh(
  session: AuthSession,
  input: {
    key:
      | "savedView"
      | "layout"
      | "settingsProfile"
      | "settingsWorkspace"
      | "settingsSecurity"
      | "settingsNotifications"
      | "settingsApiAccess"
      | "settingsAutomationPhase2"
      | "dashboardLastSeenAt"
      | "kanbanBoardPrefs"
      | "documentCenterAdminTemplates"
      | "documentCenterClientAgreements";
    value: string;
  }
): Promise<AuthorizedResult<PortalPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalPreference>("/project-preferences", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PREFERENCE_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save preference"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadPortalNotificationsWithRefresh(
  session: AuthSession,
  options: { unreadOnly?: boolean; tab?: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations" } = {}
): Promise<AuthorizedResult<PortalNotificationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (typeof options.unreadOnly === "boolean") params.set("unreadOnly", String(options.unreadOnly));
    if (options.tab) params.set("tab", options.tab);
    const response = await callGateway<PortalNotificationJob[]>(
      `/notifications/jobs${params.size > 0 ? `?${params.toString()}` : ""}`,
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
          response.payload.error?.code ?? "NOTIFICATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load notifications."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function setPortalNotificationReadStateWithRefresh(
  session: AuthSession,
  id: string,
  read: boolean
): Promise<AuthorizedResult<PortalNotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalNotificationJob>(`/notifications/jobs/${id}/read-state`, accessToken, {
      method: "PATCH",
      body: { read }
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_READ_STATE_FAILED",
          response.payload.error?.message ?? "Unable to update read state."
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
