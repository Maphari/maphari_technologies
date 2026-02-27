import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";
import type { PortalNotificationJob, PortalNotificationUnreadCount } from "./types";

export async function loadPortalNotificationCountWithRefresh(session: AuthSession): Promise<AuthorizedResult<number>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalNotificationUnreadCount>("/notifications/unread-count", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      const code = response.payload.error?.code ?? "NOTIFICATION_COUNT_FAILED";
      if (code === "FORBIDDEN") {
        return { unauthorized: false, data: 0, error: null };
      }
      return {
        unauthorized: false,
        data: 0,
        error: toGatewayError(code, response.payload.error?.message ?? "Unable to load notifications")
      };
    }

    const count = response.payload.data?.total ?? 0;
    return { unauthorized: false, data: count, error: null };
  });
}

export async function loadPortalNotificationsWithRefresh(
  session: AuthSession,
  options: { unreadOnly?: boolean; tab?: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations" } = {}
): Promise<AuthorizedResult<PortalNotificationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (typeof options.unreadOnly === "boolean") params.set("unreadOnly", String(options.unreadOnly));
    if (options.tab) params.set("tab", options.tab);
    const response = await callGateway<PortalNotificationJob[]>(
      `/notifications/jobs${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load notifications."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function setPortalNotificationReadStateWithRefresh(
  session: AuthSession,
  id: string,
  read: boolean
): Promise<AuthorizedResult<PortalNotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalNotificationJob>(`/notifications/jobs/${id}/read-state`, accessToken, {
      method: "PATCH",
      body: { read }
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_READ_STATE_FAILED",
          response.payload.error?.message ?? "Unable to update read state."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
