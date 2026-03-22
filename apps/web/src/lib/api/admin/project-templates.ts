import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

export interface ProjectTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  phaseCount: number;
  createdAt: string;
}

export interface ProjectTemplatePhase {
  name: string;
  color?: string;
}

export async function loadAdminProjectTemplatesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ProjectTemplateSummary[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTemplateSummary[]>("/admin/project-templates", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TEMPLATE_LIST_FAILED",
          response.payload.error?.message ?? "Failed to load templates."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createAdminProjectTemplateWithRefresh(
  session: AuthSession,
  payload: { name: string; description?: string; phases: ProjectTemplatePhase[]; sourceProjectId?: string }
): Promise<AuthorizedResult<ProjectTemplateSummary>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTemplateSummary>("/admin/project-templates", accessToken, {
      method: "POST",
      body: payload,
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TEMPLATE_CREATE_FAILED",
          response.payload.error?.message ?? "Failed to create template."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function deleteAdminProjectTemplateWithRefresh(
  session: AuthSession,
  templateId: string
): Promise<AuthorizedResult<{ success: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ success: boolean }>(
      `/admin/project-templates/${templateId}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TEMPLATE_DELETE_FAILED",
          response.payload.error?.message ?? "Failed to delete template."
        ),
      };
    }
    return { unauthorized: false, data: { success: true }, error: null };
  });
}

export async function applyAdminProjectTemplateWithRefresh(
  session: AuthSession,
  templateId: string,
  projectId: string
): Promise<AuthorizedResult<{ phasesCreated: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ phasesCreated: number }>(
      `/admin/project-templates/${templateId}/apply`,
      accessToken,
      { method: "POST", body: { projectId } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TEMPLATE_APPLY_FAILED",
          response.payload.error?.message ?? "Failed to apply template."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
