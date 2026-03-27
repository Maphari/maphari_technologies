// ════════════════════════════════════════════════════════════════════════════
// hr.ts — Staff API client: HR domain (payslips, leave, training, standup,
//          peer reviews, onboarding)
// Endpoints : GET  /payslips/me
//             GET  /leave-requests          POST /leave-requests
//             GET  /training
//             POST /standup
//             GET  /peer-reviews            PATCH /peer-reviews/:id/submit
//             GET  /staff/:staffId/onboarding
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

export interface StaffPayslipRecord {
  id: string;
  staffId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  grossPayCents: number;
  taxCents: number;
  uifCents: number;
  medicalCents: number;
  totalDeductionsCents: number;
  netPayCents: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffLeaveRecord {
  id: string;
  staffId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  approverId: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTrainingRecord {
  id: string;
  staffId: string;
  courseName: string;
  category: string | null;
  provider: string | null;
  status: string;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffStandupEntry {
  id:        string;
  staffId:   string;
  date:      string;
  yesterday: string;
  today:     string;
  blockers:  string | null;
  projectId: string | null;
  mood:      number | null;   // 1-5; null = not provided
  hours:     number | null;   // hours logged; null = not provided
  flagAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  staff?: { name: string; avatarInitials: string | null; avatarColor: string | null; role: string };
}

export interface StaffPeerReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  projectId: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffOnboardingRecord {
  id: string;
  staffId: string;
  stageLabel: string;
  status: string;
  sortOrder: number;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Payslips ──────────────────────────────────────────────────────────────────

export async function loadMyPayslipsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffPayslipRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPayslipRecord[]>("/payslips/me", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PAYSLIPS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load payslips.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Leave Requests ────────────────────────────────────────────────────────────

export async function loadMyLeaveRequestsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffLeaveRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffLeaveRecord[]>("/leave-requests", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "LEAVE_FETCH_FAILED", response.payload.error?.message ?? "Unable to load leave requests.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function submitLeaveRequestWithRefresh(
  session: AuthSession,
  body: { type: string; startDate: string; endDate: string; days: number; notes?: string }
): Promise<AuthorizedResult<StaffLeaveRecord>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffLeaveRecord>("/leave-requests", accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LEAVE_SUBMIT_FAILED", response.payload.error?.message ?? "Unable to submit leave request.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Training ──────────────────────────────────────────────────────────────────

export async function loadMyTrainingWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffTrainingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTrainingRecord[]>("/training", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "TRAINING_FETCH_FAILED", response.payload.error?.message ?? "Unable to load training records.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Standup ───────────────────────────────────────────────────────────────────

export async function loadMyStandupsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffStandupEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffStandupEntry[]>("/standup/me", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "STANDUP_FETCH_FAILED", response.payload.error?.message ?? "Unable to load standups.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function postStandupWithRefresh(
  session: AuthSession,
  body: {
    yesterday:  string;
    today:      string;
    blockers?:  string;
    projectId?: string;
    date?:      string;
    mood?:      number;
    hours?:     number;
    flagAdmin?: boolean;
  }
): Promise<AuthorizedResult<StaffStandupEntry>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffStandupEntry>("/standup", accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "STANDUP_POST_FAILED", response.payload.error?.message ?? "Unable to post standup.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Peer Reviews ──────────────────────────────────────────────────────────────

export async function loadMyPeerReviewsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffPeerReview[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPeerReview[]>("/peer-reviews", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PEER_REVIEWS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load peer reviews.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function submitPeerReviewWithRefresh(
  session: AuthSession,
  reviewId: string,
  body: { score?: number; feedback?: string }
): Promise<AuthorizedResult<StaffPeerReview>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPeerReview>(`/peer-reviews/${reviewId}/submit`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "PEER_REVIEW_SUBMIT_FAILED", response.payload.error?.message ?? "Unable to submit peer review.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Staff Onboarding ──────────────────────────────────────────────────────────

export async function loadMyStaffOnboardingWithRefresh(
  session: AuthSession,
  staffId: string
): Promise<AuthorizedResult<StaffOnboardingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffOnboardingRecord[]>(`/staff/${staffId}/onboarding`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "STAFF_ONBOARDING_FETCH_FAILED", response.payload.error?.message ?? "Unable to load onboarding.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
