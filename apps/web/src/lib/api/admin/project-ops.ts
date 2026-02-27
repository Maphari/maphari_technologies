import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  ProjectBlocker,
  TimelineEvent,
  ProjectChangeRequest,
  ProjectPaymentMilestone
} from "./types";

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
