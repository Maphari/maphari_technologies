import type { AuthSession } from "../../auth/session";
import type { ProjectTask } from "./types";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./_shared";

export interface AdminIntegrationProvider {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  kind: "oauth" | "assisted" | "coming_soon";
  availabilityStatus: "active" | "beta" | "hidden" | "coming_soon" | "deprecated";
  iconKey: string;
  isClientVisible: boolean;
  isRequestEnabled: boolean;
  supportsDisconnect: boolean;
  supportsReconnect: boolean;
  supportsHealthChecks: boolean;
  sortOrder: number;
  launchStage: string | null;
  helpUrl: string | null;
  setupGuideUrl: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIntegrationRequestItem {
  id: string;
  clientId: string;
  clientName: string;
  providerKey: string;
  providerLabel: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
  requestedByUserId: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  notes: string | null;
  rejectedReason: string | null;
  requestedAt: string;
  completedAt: string | null;
  completedByUserId: string | null;
  priority: string | null;
}

export interface AdminTaskIntegrationSyncEvent {
  id: string;
  taskId: string | null;
  providerKey: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  summary: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim().length > 0) q.set(key, value.trim());
  });
  return q.size > 0 ? `?${q.toString()}` : "";
}

export async function loadAdminIntegrationProvidersWithRefresh(
  session: AuthSession,
  filters: {
    availabilityStatus?: string;
    kind?: string;
    isClientVisible?: "true" | "false";
    isRequestEnabled?: "true" | "false";
  } = {}
): Promise<AuthorizedResult<AdminIntegrationProvider[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminIntegrationProvider[]>(
      `/admin/integrations/providers${buildQuery(filters)}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ADMIN_INTEGRATION_PROVIDERS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load integration providers."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function updateAdminIntegrationProviderWithRefresh(
  session: AuthSession,
  providerId: string,
  payload: Partial<Pick<
    AdminIntegrationProvider,
    | "label"
    | "description"
    | "category"
    | "availabilityStatus"
    | "iconKey"
    | "isClientVisible"
    | "isRequestEnabled"
    | "supportsDisconnect"
    | "supportsReconnect"
    | "supportsHealthChecks"
    | "sortOrder"
    | "launchStage"
    | "helpUrl"
    | "setupGuideUrl"
    | "metadata"
  >>
): Promise<AuthorizedResult<AdminIntegrationProvider>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminIntegrationProvider>(
      `/admin/integrations/providers/${encodeURIComponent(providerId)}`,
      accessToken,
      { method: "PATCH", body: payload }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ADMIN_INTEGRATION_PROVIDER_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update integration provider."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadAdminIntegrationRequestsWithRefresh(
  session: AuthSession,
  filters: {
    status?: string;
    providerKey?: string;
    clientId?: string;
    assignedToUserId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {}
): Promise<AuthorizedResult<AdminIntegrationRequestItem[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminIntegrationRequestItem[]>(
      `/admin/integration-requests${buildQuery(filters)}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ADMIN_INTEGRATION_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load integration requests."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function updateAdminIntegrationRequestWithRefresh(
  session: AuthSession,
  requestId: string,
  payload: {
    status?: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
    assignedToUserId?: string | null;
    notes?: string | null;
    rejectedReason?: string | null;
    priority?: string | null;
  }
): Promise<AuthorizedResult<{ id: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string }>(
      `/admin/integration-requests/${encodeURIComponent(requestId)}`,
      accessToken,
      { method: "PATCH", body: payload }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ADMIN_INTEGRATION_REQUEST_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update integration request."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createAdminExternalTaskLinkWithRefresh(
  session: AuthSession,
  taskId: string,
  payload: {
    providerKey: string;
    title?: string;
    description?: string;
    idempotencyKey?: string;
  }
): Promise<AuthorizedResult<{ task: ProjectTask; createdLink: { providerKey: string; externalId: string; externalUrl: string; title?: string } }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ task: ProjectTask; createdLink: { providerKey: string; externalId: string; externalUrl: string; title?: string } }>(
      `/admin/integrations/tasks/${encodeURIComponent(taskId)}/create-external-link`,
      accessToken,
      { method: "POST", body: payload }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ADMIN_EXTERNAL_TASK_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create external task link."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadAdminTaskIntegrationSyncEventsWithRefresh(
  session: AuthSession,
  taskId: string
): Promise<AuthorizedResult<AdminTaskIntegrationSyncEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminTaskIntegrationSyncEvent[]>(
      `/admin/tasks/${encodeURIComponent(taskId)}/integration-sync-events`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ADMIN_TASK_SYNC_EVENTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load task integration sync events."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
