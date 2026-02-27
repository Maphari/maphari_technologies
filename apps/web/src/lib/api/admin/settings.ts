import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type { PartnerApiKey } from "./types";

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
