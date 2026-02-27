import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  AdminProject,
  AdminFileRecord,
  ProjectMilestone,
  ProjectActivity,
  ProjectCollaborationSnapshot,
  ProjectDetail,
  ProjectDirectoryResult,
  ProjectAnalyticsSummary,
  ProjectHandoffSummary,
  ProjectHandoffExportRecord,
  ProjectHandoffExportPayload,
  MilestoneApproval,
  LeadPreference
} from "./types";

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
): Promise<AuthorizedResult<import("./types").ProjectRequestQueueItem[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<import("./types").ProjectRequestQueueItem[]>("/projects/requests", accessToken);
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
