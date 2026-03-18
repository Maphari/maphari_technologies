// ════════════════════════════════════════════════════════════════════════════
// notification-prefs.ts — Portal API client: notification preferences
// Endpoints : GET   /portal/settings/notifications
//             PATCH /portal/settings/notifications
// Scope     : CLIENT read/write own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface PortalNotificationPrefs {
  clientId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  weeklyDigest: boolean;
  projectUpdates: boolean;
  invoiceAlerts: boolean;
  marketingEmails: boolean;
  updatedAt: string;
}

export async function loadPortalNotificationPrefsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalNotificationPrefs | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalNotificationPrefs>(
      "/portal/settings/notifications",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_PREFS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load notification preferences."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function updatePortalNotificationPrefsWithRefresh(
  session: AuthSession,
  patch: Partial<Omit<PortalNotificationPrefs, "clientId" | "updatedAt">>
): Promise<AuthorizedResult<PortalNotificationPrefs>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalNotificationPrefs>(
      "/portal/settings/notifications",
      accessToken,
      { method: "PATCH", body: patch }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_PREFS_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update notification preferences."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
