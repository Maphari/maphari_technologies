import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  ProjectTask,
  ProjectTaskExternalLink,
  ProjectDependency,
  ProjectTimeEntry,
  ProjectTaskCollaborator,
  ProjectCollaborationNote,
  ProjectWorkSession
} from "./types";

export async function createProjectTaskWithRefresh(
  session: AuthSession,
  projectId: string,
  input: {
    title: string;
    assigneeName?: string;
    status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
    dueAt?: string;
    externalLinks?: ProjectTaskExternalLink[];
  }
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
  input: {
    title?: string;
    assigneeName?: string;
    status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
    dueAt?: string | null;
    externalLinks?: ProjectTaskExternalLink[];
  }
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
