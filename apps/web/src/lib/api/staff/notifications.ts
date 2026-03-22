// ════════════════════════════════════════════════════════════════════════════
// notifications.ts — Staff API client: notification endpoints
// Endpoints : GET   /notifications/jobs
//             PATCH /notifications/jobs/:id/read-state
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StaffNotificationJob {
  id: string;
  clientId: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  recipient: string;
  subject: string | null;
  message: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  metadata: Record<string, string | number | boolean>;
  status: "QUEUED" | "SENT" | "FAILED";
  failureReason: string | null;
  attempts: number;
  maxAttempts: number;
  readAt: string | null;
  readByUserId: string | null;
  readByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  createdAt: string;
  updatedAt: string;
}

// ── Functions ─────────────────────────────────────────────────────────────────
export async function loadStaffNotificationsWithRefresh(
  session: AuthSession,
  options: { unreadOnly?: boolean } = {}
): Promise<AuthorizedResult<StaffNotificationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (typeof options.unreadOnly === "boolean") params.set("unreadOnly", String(options.unreadOnly));
    const response = await callGateway<StaffNotificationJob[]>(
      `/notifications/jobs${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
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

export async function markAllStaffNotificationsReadWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ count: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ count: number }>(
      "/notifications/mark-all-read",
      accessToken,
      { method: "PATCH" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MARK_ALL_READ_FAILED",
          response.payload.error?.message ?? "Unable to mark all notifications as read."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { count: 0 }, error: null };
  });
}

export async function setStaffNotificationReadStateWithRefresh(
  session: AuthSession,
  id: string,
  read: boolean
): Promise<AuthorizedResult<StaffNotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffNotificationJob>(
      `/notifications/jobs/${id}/read-state`,
      accessToken,
      { method: "PATCH", body: { read } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_READ_STATE_FAILED",
          response.payload.error?.message ?? "Unable to update notification read state."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
