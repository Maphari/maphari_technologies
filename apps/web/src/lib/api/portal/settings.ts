import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";
import type { PortalPreference } from "./types";

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
