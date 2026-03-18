// ════════════════════════════════════════════════════════════════════════════
// profile.ts — Staff API client: personal profile, payslips, leave
// Endpoints : GET   /staff/me
//             PATCH /staff/me
//             GET   /staff/me/payslips
//             GET   /staff/me/leave
//             POST  /staff/me/leave
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
export interface StaffProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  department: string | null;
  startDate: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStaffProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface StaffPayslip {
  id: string;
  staffId: string;
  periodStart: string;
  periodEnd: string;
  grossCents: number;
  netCents: number;
  deductionsCents: number;
  currency: string;
  issuedAt: string;
  fileUrl: string | null;
}

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  type: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestInput {
  type: string;
  startAt: string;
  endAt: string;
  reason?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Get the authenticated staff member's profile */
export async function getMyProfile(
  session: AuthSession
): Promise<AuthorizedResult<StaffProfile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffProfile>("/staff/me", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PROFILE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load staff profile."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Update the authenticated staff member's profile */
export async function updateMyProfile(
  session: AuthSession,
  input: UpdateStaffProfileInput
): Promise<AuthorizedResult<StaffProfile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffProfile>("/staff/me", accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PROFILE_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update staff profile."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Get payslips for the authenticated staff member */
export async function getMyPayslips(
  session: AuthSession
): Promise<AuthorizedResult<StaffPayslip[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPayslip[]>(
      "/payslips/me",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PAYSLIPS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load payslips."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get leave requests for the authenticated staff member */
export async function getMyLeave(
  session: AuthSession
): Promise<AuthorizedResult<StaffLeaveRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffLeaveRequest[]>(
      "/leave-requests",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_LEAVE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load leave requests."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Analytics & Capacity types ────────────────────────────────────────────────

export interface StaffAnalytics {
  hoursLogged:     number;
  hoursLastMonth:  number;
  hoursChange:     number;
  tasksCompleted:  number;
  tasksLastMonth:  number;
  tasksChange:     number;
  utilizationRate: number;
  weeklyBreakdown: Array<{
    week:           string;
    hoursLogged:    number;
    tasksCompleted: number;
    utilization:    number;
  }>;
}

export interface StaffCapacityProject {
  projectId:     string;
  name:          string;
  clientName:    string;
  loggedMinutes: number;
  loggedHours:   number;
}

export interface StaffCapacity {
  weeklyHours:         number;
  loggedThisWeekHours: number;
  projects:            StaffCapacityProject[];
  weekHistory:         Array<{
    week:          string;
    loggedMinutes: number;
    loggedHours:   number;
  }>;
}

/** Get personal analytics for the authenticated staff member */
export async function getStaffAnalytics(
  session: AuthSession
): Promise<AuthorizedResult<StaffAnalytics>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffAnalytics>("/staff/me/analytics", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_ANALYTICS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load analytics."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Get personal capacity for the authenticated staff member */
export async function getStaffCapacity(
  session: AuthSession
): Promise<AuthorizedResult<StaffCapacity>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffCapacity>("/staff/me/capacity", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_CAPACITY_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load capacity."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Submit a leave request */
export async function submitLeaveRequest(
  session: AuthSession,
  input: CreateLeaveRequestInput
): Promise<AuthorizedResult<StaffLeaveRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffLeaveRequest>(
      "/leave-requests",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_LEAVE_SUBMIT_FAILED",
          response.payload.error?.message ?? "Unable to submit leave request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
