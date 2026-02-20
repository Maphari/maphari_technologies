import type { ApiResponse } from "@maphari/contracts";
import type { AuthSession } from "../auth/session";
import { refresh } from "./gateway";

const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

export type LeadPipelineStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

export interface AdminClient {
  id: string;
  name: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tier: "STARTER" | "GROWTH" | "ENTERPRISE";
  timezone: string | null;
  billingEmail: string | null;
  ownerName: string | null;
  contractStartAt: string | null;
  contractRenewalAt: string | null;
  slaTier: "STANDARD" | "PRIORITY" | "ENTERPRISE";
  slaResponseHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  type: string;
  message: string;
  actorId: string | null;
  actorRole: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface ClientStatusHistory {
  id: string;
  clientId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  actorId: string | null;
  actorRole: string | null;
  changedAt: string;
}

export interface AdminFileRecord {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDirectoryResult {
  items: AdminClient[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientDetail extends AdminClient {
  contacts: ClientContact[];
  activities: ClientActivity[];
  statusHistory: ClientStatusHistory[];
  projects: AdminProject[];
  leads: AdminLead[];
}

export interface AdminProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  ownerName: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  startAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  budgetCents: number;
  progressPercent: number;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueAt: string | null;
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assigneeName: string | null;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators?: ProjectTaskCollaborator[];
}

export interface ProjectDependency {
  id: string;
  projectId: string;
  blockedByProjectId: string;
  type: "BLOCKS" | "RELATED";
  createdAt: string;
  blockedByProject?: AdminProject;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  clientId: string;
  type: string;
  details: string | null;
  createdAt: string;
}

export interface ProjectPaymentMilestone {
  stage: "MILESTONE_30" | "FINAL_20";
  paid: boolean;
  amountCents: number;
  invoiceId: string | null;
  paymentId: string | null;
  markedAt: string | null;
  note: string | null;
}

export interface ProjectBlocker {
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

export interface TimelineEvent {
  id: string;
  clientId: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
}

export interface ProjectChangeRequest {
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

export interface ProjectRequestQueueItem {
  projectId: string;
  clientId: string;
  name: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  desiredStartAt: string | null;
  desiredDueAt: string | null;
  estimatedBudgetCents: number;
  requestedAt: string;
  requestNote: string | null;
  requestDetails?: {
    serviceType: string;
    buildMode: string;
    complexity: string;
    designPackage: string;
    signedAgreementFileName: string;
    estimatedQuoteCents: number;
    depositAmountCents: number;
    scopePrompt: string | null;
  } | null;
}

export interface ProjectTimeEntry {
  id: string;
  projectId: string;
  clientId: string;
  staffUserId: string | null;
  staffName: string | null;
  taskLabel: string;
  minutes: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskCollaborator {
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

export interface ProjectCollaborationNote {
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

export interface ProjectWorkSession {
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

export interface ProjectCollaborationSnapshot {
  projectId: string;
  contributors: Array<{ name: string; role: string; activeSessions: number; taskCount: number }>;
  sessions: ProjectWorkSession[];
  notes: ProjectCollaborationNote[];
}

export interface ProjectDetail extends AdminProject {
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  dependencies: ProjectDependency[];
  activities: ProjectActivity[];
  collaborators?: ProjectTaskCollaborator[];
  collaborationNotes?: ProjectCollaborationNote[];
  workSessions?: ProjectWorkSession[];
}

export interface ProjectDirectoryResult {
  items: AdminProject[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProjectAnalyticsSummary {
  total: number;
  completed: number;
  atRisk: number;
  overdue: number;
  completionRate: number;
  avgProgress: number;
}

export interface ProjectHandoffSummary {
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
}

export interface ProjectHandoffExportRecord {
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

export interface ProjectHandoffExportPayload {
  record: ProjectHandoffExportRecord;
}

export interface AdminLead {
  id: string;
  clientId: string;
  title: string;
  source: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  company: string | null;
  status: LeadPipelineStatus;
  notes: string | null;
  ownerName: string | null;
  nextFollowUpAt: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  clientId: string;
  type: string;
  details: string | null;
  createdAt: string;
}

export interface LeadPreference {
  id: string;
  userId: string;
  key: "savedView" | "slaConfig";
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadAnalyticsSummary {
  total: number;
  won: number;
  lost: number;
  conversionRate: number;
  avgTimeInStageDays: number;
}

export interface AdminInvoice {
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
}

export interface AdminPayment {
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

export interface AdminConversation {
  id: string;
  clientId: string;
  assigneeUserId: string | null;
  subject: string;
  projectId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMessage {
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

export interface ConversationNote {
  id: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationEscalation {
  id: string;
  conversationId: string;
  messageId: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  reason: string;
  ownerAdminId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneApproval {
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

export interface AdminSnapshot {
  clients: AdminClient[];
  projects: AdminProject[];
  leads: AdminLead[];
  invoices: AdminInvoice[];
  payments: AdminPayment[];
}

export interface NotificationJob {
  id: string;
  clientId: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  recipient: string;
  subject: string | null;
  message: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  metadata: Record<string, string | number | boolean>;
  status: "QUEUED" | "SENT" | "FAILED";
  failureReason: string | null;
  attempts: number;
  maxAttempts: number;
  readAt: string | null;
  readByUserId: string | null;
  readByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationUnreadCount {
  total: number;
  byTab: Record<"dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations", number>;
}

export interface PartnerApiKey {
  id: string;
  clientId: string;
  label: string;
  keyId: string;
  keySecret: string;
  createdAt: string;
}

export interface StaffAccessRequest {
  id: string;
  email: string;
  pin: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string;
  verifiedAt: string | null;
  revokedAt: string | null;
  userId: string | null;
}

export interface StaffAccessUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAccessProvision {
  userId: string;
  email: string;
  role: string;
  clientId: string | null;
  invited: boolean;
}

export interface PartnerProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  createdAt: string;
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

function emptySnapshot(): AdminSnapshot {
  return { clients: [], projects: [], leads: [], invoices: [], payments: [] };
}

async function callGateway<T>(
  path: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {}
): Promise<RawGatewayResponse<T>> {
  const response = await fetch(`${gatewayBaseUrl}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = (await response.json()) as ApiResponse<T>;
  return { status: response.status, payload };
}

function isUnauthorized<T>(response: RawGatewayResponse<T>): boolean {
  return response.status === 401 || response.payload.error?.code === "UPSTREAM_UNAUTHORIZED";
}

function toGatewayError(code: string, message: string): GatewayError {
  const hints: Record<string, string> = {
    VALIDATION_ERROR: "Please review the highlighted fields and try again.",
    UPSTREAM_UNAVAILABLE: "A dependent service is temporarily unavailable. Retry shortly.",
    UPSTREAM_TIMEOUT: "Request timed out. Please retry.",
    FORBIDDEN: "You do not currently have permission for this action.",
    SESSION_EXPIRED: "Your session expired. Sign in again."
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
      error: toGatewayError("SESSION_UNAUTHORIZED", "Session is valid but authorization failed for admin resources.")
    };
  }

  return { data: second.data, nextSession, error: second.error };
}

/**
 * Loads admin datasets from gateway routes; the admin UI relies on this
 * snapshot for KPI, pipeline, and table renderers.
 */
export async function loadAdminSnapshotWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminSnapshot>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const [clients, projects, leads, invoices, payments] = await Promise.all([
      callGateway<AdminClient[]>("/clients", accessToken),
      callGateway<AdminProject[]>("/projects", accessToken),
      callGateway<AdminLead[]>("/leads", accessToken),
      callGateway<AdminInvoice[]>("/invoices", accessToken),
      callGateway<AdminPayment[]>("/payments", accessToken)
    ]);

    if (
      isUnauthorized(clients) ||
      isUnauthorized(projects) ||
      isUnauthorized(leads) ||
      isUnauthorized(invoices) ||
      isUnauthorized(payments)
    ) {
      return { unauthorized: true, data: null, error: null };
    }

    const firstError =
      (!clients.payload.success ? clients.payload.error : null) ||
      (!projects.payload.success ? projects.payload.error : null) ||
      (!leads.payload.success ? leads.payload.error : null) ||
      (!invoices.payload.success ? invoices.payload.error : null) ||
      (!payments.payload.success ? payments.payload.error : null);

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
        clients: clients.payload.data ?? [],
        projects: projects.payload.data ?? [],
        leads: leads.payload.data ?? [],
        invoices: invoices.payload.data ?? [],
        payments: payments.payload.data ?? []
      },
      error: null
    };
  });
}

/**
 * Persists lead stage movement via gateway/core and returns the updated lead.
 */
export async function updateLeadStatusWithRefresh(
  session: AuthSession,
  leadId: string,
  status: LeadPipelineStatus,
  options: { lostReason?: string } = {}
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>(`/leads/${leadId}/status`, accessToken, {
      method: "PATCH",
      body: { status, lostReason: options.lostReason }
    });

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_STATUS_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to move lead status"
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

export async function updateLeadWithRefresh(
  session: AuthSession,
  leadId: string,
  input: {
    title?: string;
    source?: string;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    company?: string;
    ownerName?: string;
    nextFollowUpAt?: string | null;
  }
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>(`/leads/${leadId}`, accessToken, {
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
          response.payload.error?.code ?? "LEAD_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update lead."
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

export async function bulkUpdateLeadStatusWithRefresh(
  session: AuthSession,
  input: { leadIds: string[]; status: LeadPipelineStatus; lostReason?: string }
): Promise<AuthorizedResult<AdminLead[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead[]>("/leads/bulk-status", accessToken, {
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
          response.payload.error?.code ?? "LEAD_BULK_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to bulk update leads."
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

export async function mergeLeadsWithRefresh(
  session: AuthSession,
  input: { primaryLeadId: string; duplicateLeadId: string }
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>("/leads/merge", accessToken, {
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
          response.payload.error?.code ?? "LEAD_MERGE_FAILED",
          response.payload.error?.message ?? "Unable to merge leads."
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

export async function loadLeadActivitiesWithRefresh(
  session: AuthSession,
  leadId: string
): Promise<AuthorizedResult<LeadActivity[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadActivity[]>(`/leads/${leadId}/activities`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_ACTIVITIES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch lead activities."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data ?? [],
      error: null
    };
  });
}

export async function getLeadPreferenceWithRefresh(
  session: AuthSession,
  key: "savedView" | "slaConfig"
): Promise<AuthorizedResult<LeadPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference | null>(`/leads/preferences?key=${key}`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_PREF_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch lead preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setLeadPreferenceWithRefresh(
  session: AuthSession,
  input: { key: "savedView" | "slaConfig"; value: string }
): Promise<AuthorizedResult<LeadPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference>("/leads/preferences", accessToken, {
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
          response.payload.error?.code ?? "LEAD_PREF_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save lead preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadLeadAnalyticsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<LeadAnalyticsSummary | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadAnalyticsSummary>("/leads/analytics", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_ANALYTICS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch lead analytics."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function loadClientDirectoryWithRefresh(
  session: AuthSession,
  query: {
    q?: string;
    status?: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED";
    tier?: "STARTER" | "GROWTH" | "ENTERPRISE";
    sortBy?: "name" | "updatedAt" | "createdAt" | "contractRenewalAt";
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AuthorizedResult<ClientDirectoryResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const response = await callGateway<ClientDirectoryResult>(`/clients/directory?${params.toString()}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_DIRECTORY_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client directory."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadClientDetailWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientDetail>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientDetail>(`/clients/${clientId}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_DETAIL_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client details."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createClientWithRefresh(
  session: AuthSession,
  input: {
    name: string;
    status?: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    tier?: "STARTER" | "GROWTH" | "ENTERPRISE";
    timezone?: string;
    billingEmail?: string;
    ownerName?: string;
    contractStartAt?: string;
    contractRenewalAt?: string;
    slaTier?: "STANDARD" | "PRIORITY" | "ENTERPRISE";
    slaResponseHours?: number;
    notes?: string;
  }
): Promise<AuthorizedResult<AdminClient>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminClient>("/clients", accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create client."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateClientWithRefresh(
  session: AuthSession,
  clientId: string,
  input: {
    name?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    tier?: "STARTER" | "GROWTH" | "ENTERPRISE";
    timezone?: string;
    billingEmail?: string;
    ownerName?: string;
    contractStartAt?: string | null;
    contractRenewalAt?: string | null;
    slaTier?: "STANDARD" | "PRIORITY" | "ENTERPRISE";
    slaResponseHours?: number;
    notes?: string;
  }
): Promise<AuthorizedResult<AdminClient>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminClient>(`/clients/${clientId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateClientStatusWithRefresh(
  session: AuthSession,
  clientId: string,
  status: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED",
  reason?: string
): Promise<AuthorizedResult<AdminClient>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminClient>(`/clients/${clientId}/status`, accessToken, {
      method: "PATCH",
      body: { status, reason }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_STATUS_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client status."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadClientContactsWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientContact[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientContact[]>(`/clients/${clientId}/contacts`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CONTACTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client contacts."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createClientContactWithRefresh(
  session: AuthSession,
  clientId: string,
  input: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  }
): Promise<AuthorizedResult<ClientContact>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientContact>(`/clients/${clientId}/contacts`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CONTACT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create client contact."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateClientContactWithRefresh(
  session: AuthSession,
  clientId: string,
  contactId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  }
): Promise<AuthorizedResult<ClientContact>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientContact>(`/clients/${clientId}/contacts/${contactId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CONTACT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client contact."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadClientActivitiesWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientActivity[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientActivity[]>(`/clients/${clientId}/activities`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_ACTIVITIES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client activities."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadClientStatusHistoryWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientStatusHistory[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientStatusHistory[]>(`/clients/${clientId}/status-history`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_STATUS_HISTORY_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client status history."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function getClientPreferenceWithRefresh(
  session: AuthSession,
  key: "savedView"
): Promise<AuthorizedResult<LeadPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference | null>(`/client-preferences?key=${key}`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_PREF_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch client preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setClientPreferenceWithRefresh(
  session: AuthSession,
  input: { key: "savedView"; value: string }
): Promise<AuthorizedResult<LeadPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference>("/client-preferences", accessToken, {
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
          response.payload.error?.code ?? "CLIENT_PREF_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save client preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createProjectWithRefresh(
  session: AuthSession,
  input: {
    clientId: string;
    name: string;
    description?: string;
    status?: string;
    ownerName?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    startAt?: string;
    dueAt?: string;
    budgetCents?: number;
    slaDueAt?: string;
  }
): Promise<AuthorizedResult<AdminProject>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminProject>("/projects", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create project."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectRequestsQueueWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ProjectRequestQueueItem[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectRequestQueueItem[]>("/projects/requests", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project requests."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function decideProjectRequestWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { decision: "APPROVED" | "REJECTED"; note?: string; ownerName?: string }
): Promise<AuthorizedResult<AdminProject>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminProject>(`/projects/${projectId}/request-decision`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_REQUEST_DECISION_FAILED",
          response.payload.error?.message ?? "Unable to process project request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectDirectoryWithRefresh(
  session: AuthSession,
  query: {
    q?: string;
    status?: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    sortBy?: "name" | "updatedAt" | "createdAt" | "dueAt" | "progressPercent";
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AuthorizedResult<ProjectDirectoryResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const response = await callGateway<ProjectDirectoryResult>(`/projects/directory?${params.toString()}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_DIRECTORY_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project directory."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectDetailWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectDetail>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDetail>(`/projects/${projectId}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_DETAIL_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project detail."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectCollaborationWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectCollaborationSnapshot>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectCollaborationSnapshot>(`/projects/${projectId}/collaboration`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_COLLABORATION_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project collaboration details."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectWithRefresh(
  session: AuthSession,
  projectId: string,
  input: {
    name?: string;
    description?: string;
    ownerName?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    startAt?: string | null;
    dueAt?: string | null;
    budgetCents?: number;
    progressPercent?: number;
    slaDueAt?: string | null;
  }
): Promise<AuthorizedResult<AdminProject>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminProject>(`/projects/${projectId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update project."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectStatusWithRefresh(
  session: AuthSession,
  projectId: string,
  status: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED"
): Promise<AuthorizedResult<AdminProject>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminProject>(`/projects/${projectId}/status`, accessToken, {
      method: "PATCH",
      body: { status }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_STATUS_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update project status."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createProjectMilestoneWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { title: string; dueAt?: string; status?: "PENDING" | "IN_PROGRESS" | "COMPLETED"; fileId?: string }
): Promise<AuthorizedResult<ProjectMilestone>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectMilestone>(`/projects/${projectId}/milestones`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MILESTONE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create milestone."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectMilestoneWithRefresh(
  session: AuthSession,
  projectId: string,
  milestoneId: string,
  input: { title?: string; dueAt?: string | null; status?: "PENDING" | "IN_PROGRESS" | "COMPLETED"; fileId?: string | null }
): Promise<AuthorizedResult<ProjectMilestone>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectMilestone>(`/projects/${projectId}/milestones/${milestoneId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MILESTONE_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update milestone."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadTimeEntriesWithRefresh(
  session: AuthSession,
  query: { projectId?: string; from?: string; to?: string; limit?: number } = {}
): Promise<AuthorizedResult<ProjectTimeEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const response = await callGateway<ProjectTimeEntry[]>(`/time-entries?${params.toString()}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "TIME_ENTRIES_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load time entries."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createTimeEntryWithRefresh(
  session: AuthSession,
  input: {
    projectId: string;
    taskLabel: string;
    minutes: number;
    startedAt?: string;
    endedAt?: string;
    staffName?: string;
  }
): Promise<AuthorizedResult<ProjectTimeEntry>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTimeEntry>("/time-entries", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TIME_ENTRY_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create time entry."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createProjectTaskWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { title: string; assigneeName?: string; status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"; dueAt?: string }
): Promise<AuthorizedResult<ProjectTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTask>(`/projects/${projectId}/tasks`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TASK_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create task."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectTaskWithRefresh(
  session: AuthSession,
  projectId: string,
  taskId: string,
  input: { title?: string; assigneeName?: string; status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"; dueAt?: string | null }
): Promise<AuthorizedResult<ProjectTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TASK_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update task."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function addTaskCollaboratorWithRefresh(
  session: AuthSession,
  projectId: string,
  taskId: string,
  input: {
    staffUserId?: string;
    staffName: string;
    role?: "LEAD" | "CONTRIBUTOR" | "REVIEWER";
    allocationPercent?: number;
  }
): Promise<AuthorizedResult<ProjectTaskCollaborator>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTaskCollaborator>(
      `/projects/${projectId}/tasks/${taskId}/collaborators`,
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TASK_COLLABORATOR_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to add task collaborator."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateTaskCollaboratorWithRefresh(
  session: AuthSession,
  projectId: string,
  taskId: string,
  collaboratorId: string,
  input: {
    role?: "LEAD" | "CONTRIBUTOR" | "REVIEWER";
    allocationPercent?: number;
    active?: boolean;
  }
): Promise<AuthorizedResult<ProjectTaskCollaborator>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTaskCollaborator>(
      `/projects/${projectId}/tasks/${taskId}/collaborators/${collaboratorId}`,
      accessToken,
      { method: "PATCH", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TASK_COLLABORATOR_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update task collaborator."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createProjectCollaborationNoteWithRefresh(
  session: AuthSession,
  projectId: string,
  input: {
    message: string;
    visibility?: "INTERNAL" | "EXTERNAL";
    workstream?: string;
  }
): Promise<AuthorizedResult<ProjectCollaborationNote>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectCollaborationNote>(
      `/projects/${projectId}/collaboration/notes`,
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_COLLABORATION_NOTE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create collaboration note."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createProjectWorkSessionWithRefresh(
  session: AuthSession,
  projectId: string,
  input: {
    taskId?: string;
    memberName: string;
    memberRole: "ADMIN" | "STAFF";
    workstream?: string;
    status?: "ACTIVE" | "PAUSED" | "DONE";
  }
): Promise<AuthorizedResult<ProjectWorkSession>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectWorkSession>(
      `/projects/${projectId}/collaboration/sessions`,
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_WORK_SESSION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create work session."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectWorkSessionWithRefresh(
  session: AuthSession,
  projectId: string,
  sessionId: string,
  input: {
    taskId?: string | null;
    workstream?: string;
    status?: "ACTIVE" | "PAUSED" | "DONE";
    endedAt?: string | null;
  }
): Promise<AuthorizedResult<ProjectWorkSession>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectWorkSession>(
      `/projects/${projectId}/collaboration/sessions/${sessionId}`,
      accessToken,
      { method: "PATCH", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_WORK_SESSION_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update work session."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createProjectDependencyWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { blockedByProjectId: string; type?: "BLOCKS" | "RELATED" }
): Promise<AuthorizedResult<ProjectDependency>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDependency>(`/projects/${projectId}/dependencies`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DEPENDENCY_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create dependency."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectBlockersWithRefresh(
  session: AuthSession,
  options: {
    clientId?: string;
    projectId?: string;
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    limit?: number;
  } = {}
): Promise<AuthorizedResult<ProjectBlocker[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const response = await callGateway<ProjectBlocker[]>(
      `/blockers${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "BLOCKERS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch blockers."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createProjectBlockerWithRefresh(
  session: AuthSession,
  input: {
    projectId: string;
    clientId?: string;
    title: string;
    description?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    ownerRole?: "ADMIN" | "STAFF" | "CLIENT";
    ownerName?: string;
    etaAt?: string;
  }
): Promise<AuthorizedResult<ProjectBlocker>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectBlocker>("/blockers", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BLOCKER_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create blocker."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectBlockerWithRefresh(
  session: AuthSession,
  blockerId: string,
  input: {
    title?: string;
    description?: string | null;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    ownerRole?: "ADMIN" | "STAFF" | "CLIENT" | null;
    ownerName?: string | null;
    etaAt?: string | null;
    resolvedAt?: string | null;
  }
): Promise<AuthorizedResult<ProjectBlocker>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectBlocker>(`/blockers/${blockerId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BLOCKER_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update blocker."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadTimelineWithRefresh(
  session: AuthSession,
  options: { clientId?: string; projectId?: string; limit?: number } = {}
): Promise<AuthorizedResult<TimelineEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const response = await callGateway<TimelineEvent[]>(
      `/timeline${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "TIMELINE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch timeline."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadProjectChangeRequestsWithRefresh(
  session: AuthSession,
  options: {
    clientId?: string;
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
): Promise<AuthorizedResult<ProjectChangeRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const response = await callGateway<ProjectChangeRequest[]>(
      `/change-requests${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CHANGE_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch change requests."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createProjectChangeRequestWithRefresh(
  session: AuthSession,
  input: {
    projectId: string;
    clientId?: string;
    title: string;
    description?: string;
    reason?: string;
    impactSummary?: string;
  }
): Promise<AuthorizedResult<ProjectChangeRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectChangeRequest>("/change-requests", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CHANGE_REQUEST_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create change request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateProjectChangeRequestWithRefresh(
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
    forceOverride?: boolean;
  }
): Promise<AuthorizedResult<ProjectChangeRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectChangeRequest>(`/change-requests/${changeRequestId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CHANGE_REQUEST_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update change request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectPaymentMilestonesWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectPaymentMilestone[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectPaymentMilestone[]>(`/projects/${projectId}/payment-milestones`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_PAYMENT_MILESTONES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch project payment milestones."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function markProjectPaymentMilestoneWithRefresh(
  session: AuthSession,
  projectId: string,
  input: { stage: "MILESTONE_30" | "FINAL_20"; invoiceId: string; paymentId: string }
): Promise<AuthorizedResult<{ stage: "MILESTONE_30" | "FINAL_20"; paymentId: string; invoiceId: string; amountCents: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ stage: "MILESTONE_30" | "FINAL_20"; paymentId: string; invoiceId: string; amountCents: number }>(
      `/projects/${projectId}/payment-milestones`,
      accessToken,
      {
        method: "POST",
        body: input
      }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_PAYMENT_MILESTONE_MARK_FAILED",
          response.payload.error?.message ?? "Unable to mark project payment milestone."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectActivitiesWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectActivity[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectActivity[]>(`/projects/${projectId}/activities`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_ACTIVITIES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch project activities."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadProjectAnalyticsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ProjectAnalyticsSummary | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectAnalyticsSummary>("/projects/analytics", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_ANALYTICS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch project analytics."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function generateProjectHandoffSummaryWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ProjectHandoffSummary>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectHandoffSummary>("/projects/handoff-package", accessToken, {
      method: "POST"
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_PACKAGE_FAILED",
          response.payload.error?.message ?? "Unable to generate handoff package."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadProjectHandoffExportsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ProjectHandoffExportRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectHandoffExportRecord[]>("/projects/handoff-exports", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_EXPORTS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load handoff exports."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createProjectHandoffExportWithRefresh(
  session: AuthSession,
  input: { format?: "json" | "markdown" } = {}
): Promise<AuthorizedResult<ProjectHandoffExportPayload>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectHandoffExportPayload>("/projects/handoff-exports", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_EXPORT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create handoff export."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function downloadProjectHandoffExportWithRefresh(
  session: AuthSession,
  exportId: string
): Promise<AuthorizedResult<{ downloadUrl: string; fileName: string; mimeType: string; expiresAt: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ downloadUrl: string; fileName: string; mimeType: string; expiresAt: string }>(
      `/projects/handoff-exports/${exportId}/download`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "HANDOFF_EXPORT_DOWNLOAD_FAILED",
          response.payload.error?.message ?? "Unable to download handoff export."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function getProjectPreferenceWithRefresh(
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
): Promise<AuthorizedResult<LeadPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference | null>(`/project-preferences?key=${key}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_PREF_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch project preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setProjectPreferenceWithRefresh(
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
): Promise<AuthorizedResult<LeadPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference>("/project-preferences", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROJECT_PREF_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save project preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadFilesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminFileRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminFileRecord[]>("/files", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "FILES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load files."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createInvoiceWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    number: string;
    amountCents: number;
    currency?: string;
    status?: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "VOID";
    issuedAt?: string;
    dueAt?: string;
  }
): Promise<AuthorizedResult<AdminInvoice>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminInvoice>("/invoices", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create invoice."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPaymentWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    invoiceId: string;
    amountCents: number;
    status?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    provider?: string;
    transactionRef?: string;
    paidAt?: string;
  }
): Promise<AuthorizedResult<AdminPayment>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPayment>("/payments", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PAYMENT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create payment."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadConversationsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminConversation[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminConversation[]>("/conversations", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load conversations."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createConversationWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    subject: string;
    projectId?: string;
    assigneeUserId?: string;
  }
): Promise<AuthorizedResult<AdminConversation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminConversation>("/conversations", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create conversation."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateConversationAssigneeWithRefresh(
  session: AuthSession,
  conversationId: string,
  input: { assigneeUserId: string | null }
): Promise<AuthorizedResult<AdminConversation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminConversation>(`/conversations/${conversationId}/assignee`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATION_ASSIGNMENT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update conversation assignment."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadMessagesWithRefresh(
  session: AuthSession,
  conversationId: string
): Promise<AuthorizedResult<AdminMessage[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminMessage[]>(`/conversations/${conversationId}/messages`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "MESSAGES_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load messages."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createMessageWithRefresh(
  session: AuthSession,
  input: {
    conversationId: string;
    content: string;
  }
): Promise<AuthorizedResult<AdminMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminMessage>("/messages", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MESSAGE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to send message."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateMessageDeliveryWithRefresh(
  session: AuthSession,
  messageId: string,
  input: { status: "SENT" | "DELIVERED" | "READ"; deliveredAt?: string; readAt?: string }
): Promise<AuthorizedResult<AdminMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminMessage>(`/messages/${messageId}/delivery`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
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
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadConversationNotesWithRefresh(
  session: AuthSession,
  conversationId: string
): Promise<AuthorizedResult<ConversationNote[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationNote[]>(
      `/conversation-notes?${new URLSearchParams({ conversationId }).toString()}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "NOTES_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load notes."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createConversationNoteWithRefresh(
  session: AuthSession,
  input: { conversationId: string; content: string }
): Promise<AuthorizedResult<ConversationNote>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationNote>("/conversation-notes", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create note."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadConversationEscalationsWithRefresh(
  session: AuthSession,
  options: { conversationId?: string; status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" } = {}
): Promise<AuthorizedResult<ConversationEscalation[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (options.conversationId) params.set("conversationId", options.conversationId);
    if (options.status) params.set("status", options.status);
    const response = await callGateway<ConversationEscalation[]>(
      `/conversation-escalations${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ESCALATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load escalations."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createConversationEscalationWithRefresh(
  session: AuthSession,
  input: {
    conversationId: string;
    messageId?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
  }
): Promise<AuthorizedResult<ConversationEscalation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationEscalation>("/conversation-escalations", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ESCALATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create escalation."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateConversationEscalationWithRefresh(
  session: AuthSession,
  escalationId: string,
  input: {
    status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    ownerAdminId?: string;
    resolvedAt?: string;
  }
): Promise<AuthorizedResult<ConversationEscalation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationEscalation>(`/conversation-escalations/${escalationId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ESCALATION_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update escalation."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadMilestoneApprovalsWithRefresh(
  session: AuthSession,
  options: { projectId?: string; clientId?: string; status?: "PENDING" | "APPROVED" | "REJECTED" } = {}
): Promise<AuthorizedResult<MilestoneApproval[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (options.projectId) params.set("projectId", options.projectId);
    if (options.clientId) params.set("clientId", options.clientId);
    if (options.status) params.set("status", options.status);
    const response = await callGateway<MilestoneApproval[]>(
      `/milestone-approvals${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "APPROVALS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load approvals."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadMilestoneApprovalWithRefresh(
  session: AuthSession,
  milestoneId: string
): Promise<AuthorizedResult<MilestoneApproval>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<MilestoneApproval>(`/milestones/${milestoneId}/approval`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "APPROVAL_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load approval."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateMilestoneApprovalWithRefresh(
  session: AuthSession,
  milestoneId: string,
  input: { status: "PENDING" | "APPROVED" | "REJECTED"; comment?: string }
): Promise<AuthorizedResult<MilestoneApproval>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<MilestoneApproval>(`/milestones/${milestoneId}/approval`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "APPROVAL_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update approval."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createNotificationJobWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    channel: "EMAIL" | "SMS" | "PUSH";
    recipient: string;
    subject?: string;
    message: string;
    metadata?: Record<string, string | number | boolean>;
  }
): Promise<AuthorizedResult<NotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<NotificationJob>("/notifications/jobs", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to queue notification."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadNotificationJobsWithRefresh(
  session: AuthSession,
  options: { unreadOnly?: boolean; tab?: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations" } = {}
): Promise<AuthorizedResult<NotificationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (typeof options.unreadOnly === "boolean") params.set("unreadOnly", String(options.unreadOnly));
    if (options.tab) params.set("tab", options.tab);
    const response = await callGateway<NotificationJob[]>(
      `/notifications/jobs${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load notifications"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadNotificationUnreadCountWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<NotificationUnreadCount>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<NotificationUnreadCount>("/notifications/unread-count", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_UNREAD_COUNT_FAILED",
          response.payload.error?.message ?? "Unable to load unread notification count."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function setNotificationReadStateWithRefresh(
  session: AuthSession,
  id: string,
  read: boolean
): Promise<AuthorizedResult<NotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<NotificationJob>(`/notifications/jobs/${id}/read-state`, accessToken, {
      method: "PATCH",
      body: { read }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_READ_STATE_FAILED",
          response.payload.error?.message ?? "Unable to update notification read state."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function processNotificationQueueWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ processed: boolean; job?: NotificationJob }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ processed: boolean; job?: NotificationJob }>(
      "/notifications/process",
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATIONS_PROCESS_FAILED",
          response.payload.error?.message ?? "Unable to process notification queue"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadPublicApiKeysWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PartnerApiKey[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PartnerApiKey[]>("/public-api/keys", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "PUBLIC_API_KEYS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load public API keys"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPublicApiKeyWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    label: string;
  }
): Promise<AuthorizedResult<PartnerApiKey>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PartnerApiKey>("/public-api/keys", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PUBLIC_API_KEY_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to issue public API key."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadAnalyticsMetricsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<unknown[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<unknown[]>("/analytics/metrics", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ANALYTICS_METRICS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load analytics metrics"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createSecurityIncidentWithRefresh(
  session: AuthSession,
  payload: {
    incidentType: "FAILED_LOGINS_THRESHOLD" | "SUSPICIOUS_LOGIN" | "VULNERABILITY" | "ACCESS_ANOMALY";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
    clientId?: string;
    occurredAt?: string;
  }
): Promise<AuthorizedResult<{ incidentId: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ incidentId: string }>("/ops/security/incidents", accessToken, {
      method: "POST",
      body: payload
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SECURITY_INCIDENT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create security incident"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createMaintenanceCheckWithRefresh(
  session: AuthSession,
  payload: {
    checkType: "BACKUP" | "SECURITY" | "PERFORMANCE" | "UPTIME" | "DEPENDENCY" | "SSL";
    status: "PASS" | "WARN" | "FAIL";
    details?: string;
    clientId?: string;
    checkedAt?: string;
  }
): Promise<AuthorizedResult<{ checkId: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ checkId: string }>("/ops/maintenance/checks", accessToken, {
      method: "POST",
      body: payload
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MAINTENANCE_CHECK_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create maintenance check"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadStaffAccessRequestsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffAccessRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffAccessRequest[]>("/auth/staff/requests", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_REQUESTS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load staff requests"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function approveStaffAccessRequestWithRefresh(
  session: AuthSession,
  requestId: string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string; status: string }>("/auth/staff/requests/approve", accessToken, {
      method: "POST",
      body: { requestId }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_REQUEST_APPROVE_FAILED",
          response.payload.error?.message ?? "Unable to approve staff request"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadStaffUsersWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffAccessUser[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffAccessUser[]>("/auth/staff/users", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_USERS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load staff users"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function revokeStaffUserWithRefresh(
  session: AuthSession,
  userId: string
): Promise<AuthorizedResult<{ userId: string; revoked: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ userId: string; revoked: boolean }>("/auth/staff/users/revoke", accessToken, {
      method: "POST",
      body: { userId }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_USER_REVOKE_FAILED",
          response.payload.error?.message ?? "Unable to revoke staff access"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function provisionClientAccessWithRefresh(
  session: AuthSession,
  payload: { email: string; clientId: string; clientName?: string }
): Promise<AuthorizedResult<ClientAccessProvision>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientAccessProvision>("/auth/client/provision", accessToken, {
      method: "POST",
      body: payload
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_ACCESS_PROVISION_FAILED",
          response.payload.error?.message ?? "Unable to provision client access"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
