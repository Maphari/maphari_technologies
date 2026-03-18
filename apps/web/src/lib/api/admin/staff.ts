import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  StaffAccessRequest,
  StaffAccessUser,
  ClientAccessProvision
} from "./types";

export async function loadStaffAccessRequestsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffAccessRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffAccessRequest[]>("/auth/staff/requests", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_REQUESTS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load staff requests"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function approveStaffAccessRequestWithRefresh(
  session: AuthSession,
  requestId: string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string; status: string }>("/auth/staff/requests/approve", accessToken, {
      method: "POST",
      body: { requestId }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_REQUEST_APPROVE_FAILED",
          response.payload.error?.message ?? "Unable to approve staff request"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadStaffUsersWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffAccessUser[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffAccessUser[]>("/auth/staff/users", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_USERS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load staff users"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function revokeStaffUserWithRefresh(
  session: AuthSession,
  userId: string
): Promise<AuthorizedResult<{ userId: string; revoked: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ userId: string; revoked: boolean }>("/auth/staff/users/revoke", accessToken, {
      method: "POST",
      body: { userId }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_USER_REVOKE_FAILED",
          response.payload.error?.message ?? "Unable to revoke staff access"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function lockdownSessionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ revokedSessions: number; lockedAt: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ revokedSessions: number; lockedAt: string }>(
      "/auth/admin/lockdown",
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LOCKDOWN_FAILED",
          response.payload.error?.message ?? "Emergency lockdown failed."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function provisionClientAccessWithRefresh(
  session: AuthSession,
  payload: { email: string; clientId: string; clientName?: string }
): Promise<AuthorizedResult<ClientAccessProvision>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientAccessProvision>("/auth/client/provision", accessToken, {
      method: "POST",
      body: payload
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_ACCESS_PROVISION_FAILED",
          response.payload.error?.message ?? "Unable to provision client access"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Staff performance metrics (admin view) ────────────────────────────────────

export interface AdminStaffPerformance {
  userId:           string;
  name:             string;
  role:             string;
  avatarInitials:   string;
  avatarColor:      string | null;
  deliveryScore:    number;
  onTimeRate:       number;
  clientSat:        number;
  billableHours:    number;
  totalHours:       number;
  billablePct:      number;
  retainersManaged: number;
  tasksCompleted:   number;
  tasksMissed:      number;
  bonusEligible:    boolean;
  bonusAmount:      number;
  salary:           number;
}

export async function loadAdminStaffPerformanceWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminStaffPerformance[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminStaffPerformance[]>("/admin/staff/performance", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code    ?? "ADMIN_PERF_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load staff performance."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
