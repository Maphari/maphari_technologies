// ════════════════════════════════════════════════════════════════════════════
// integrations.ts — Portal API client: integration options + Google Calendar
// Endpoints : GET    /portal/settings/integrations
//             GET    /integrations/google-calendar/auth-url
//             POST   /integrations/google-calendar/callback
//             GET    /integrations/google-calendar/status
//             DELETE /integrations/google-calendar/disconnect
//             POST   /integrations/google-calendar/sync-meeting
// Scope     : CLIENT read own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface PortalIntegration {
  provider: string;
  label: string;
  category: string;
  status: "connected" | "not_connected";
  connectedAt: string | null;
}

export interface GcalStatus {
  connected:  boolean;
  email:      string | null;
  expiresAt:  string | null;
}

export interface GcalSyncResult {
  synced:          boolean;
  googleEventId:   string | null;
  googleEventLink: string | null;
}

export async function loadPortalIntegrationsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalIntegration[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalIntegration[]>(
      "/portal/settings/integrations",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "INTEGRATIONS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load integrations."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Google Calendar ───────────────────────────────────────────────────────────

export async function getGoogleCalendarAuthUrlWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ authUrl: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ authUrl: string }>(
      "/integrations/google-calendar/auth-url",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GCAL_AUTH_URL_FAILED",
          response.payload.error?.message ?? "Unable to get Google Calendar auth URL."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function getGoogleCalendarStatusWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<GcalStatus>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<GcalStatus>(
      "/integrations/google-calendar/status",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GCAL_STATUS_FAILED",
          response.payload.error?.message ?? "Unable to get Google Calendar status."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function disconnectGoogleCalendarWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ disconnected: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ disconnected: boolean }>(
      "/integrations/google-calendar/disconnect",
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GCAL_DISCONNECT_FAILED",
          response.payload.error?.message ?? "Unable to disconnect Google Calendar."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function syncMeetingToGoogleWithRefresh(
  session: AuthSession,
  meetingId: string
): Promise<AuthorizedResult<GcalSyncResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<GcalSyncResult>(
      "/integrations/google-calendar/sync-meeting",
      accessToken,
      { method: "POST", body: { meetingId } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GCAL_SYNC_FAILED",
          response.payload.error?.message ?? "Unable to sync meeting to Google Calendar."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
