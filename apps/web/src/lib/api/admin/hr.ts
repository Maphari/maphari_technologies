// ════════════════════════════════════════════════════════════════════════════
// hr.ts — Admin API client: Staff & HR domain
// Endpoints : GET  /staff
//             GET  /leave-requests     PATCH /:id/approve   PATCH /:id/decline
//             GET  /job-postings       POST                 PATCH /:id
//             GET  /job-postings/:id/applications
//             POST /job-postings/:id/applications
//             PATCH /job-applications/:aid
//             GET  /training           POST                 PATCH /:id
//             GET  /standup/feed
//             GET  /peer-reviews       POST
//             GET  /staff/:id/onboarding
//             GET  /time-entries/pending
//             PATCH /time-entries/:id/approve
//             PATCH /time-entries/:id/reject
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminStaffProfile {
  id: string;
  userId: string;
  name: string;
  role: string;
  department: string | null;
  avatarInitials: string | null;
  avatarColor: string | null;
  hireDate: string | null;
  contractType: string | null;
  grossSalaryCents: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLeaveRequest {
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

export interface AdminJobPosting {
  id: string;
  title: string;
  department: string | null;
  priority: string;
  status: string;
  hiringManager: string | null;
  salaryBand: string | null;
  postedAt: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJobApplication {
  id: string;
  jobPostingId: string;
  candidateName: string;
  stage: string;
  score: number | null;
  source: string | null;
  flag: string | null;
  appliedAt: string;
  updatedAt: string;
}

export interface AdminTrainingRecord {
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

export interface AdminStandupEntry {
  id: string;
  staffId: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string | null;
  projectId: string | null;
  createdAt: string;
  staff?: { name: string; avatarInitials: string | null; avatarColor: string | null; role: string };
}

export interface AdminPeerReview {
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

export interface AdminStaffOnboardingRecord {
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

export interface AdminPendingTimeEntry {
  id: string;
  projectId: string;
  clientId: string;
  phaseId: string | null;
  staffUserId: string | null;
  staffName: string | null;
  taskLabel: string;
  minutes: number;
  startedAt: string | null;
  endedAt: string | null;
  status: string;
  submittedAt: string | null;
  submittedWeek: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Staff Profiles ────────────────────────────────────────────────────────────

export async function loadAllStaffWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminStaffProfile[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminStaffProfile[]>("/staff", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "STAFF_FETCH_FAILED", response.payload.error?.message ?? "Unable to load staff.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Leave Requests ────────────────────────────────────────────────────────────

export async function loadLeaveRequestsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminLeaveRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLeaveRequest[]>("/leave-requests", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "LEAVE_FETCH_FAILED", response.payload.error?.message ?? "Unable to load leave requests.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function approveLeaveRequestWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<AdminLeaveRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLeaveRequest>(`/leave-requests/${id}/approve`, accessToken, { method: "PATCH", body: {} });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LEAVE_APPROVE_FAILED", response.payload.error?.message ?? "Unable to approve leave request.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function declineLeaveRequestWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<AdminLeaveRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLeaveRequest>(`/leave-requests/${id}/decline`, accessToken, { method: "PATCH", body: {} });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LEAVE_DECLINE_FAILED", response.payload.error?.message ?? "Unable to decline leave request.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Job Postings ──────────────────────────────────────────────────────────────

export async function loadJobPostingsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminJobPosting[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminJobPosting[]>("/job-postings", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "JOB_POSTINGS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load job postings.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createJobPostingWithRefresh(
  session: AuthSession,
  body: { title: string; department?: string; priority?: string; hiringManager?: string; salaryBand?: string; targetDate?: string }
): Promise<AuthorizedResult<AdminJobPosting>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminJobPosting>("/job-postings", accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "JOB_POSTING_CREATE_FAILED", response.payload.error?.message ?? "Unable to create job posting.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateJobPostingWithRefresh(
  session: AuthSession,
  id: string,
  body: { title?: string; status?: string; priority?: string; department?: string; hiringManager?: string; salaryBand?: string; targetDate?: string }
): Promise<AuthorizedResult<AdminJobPosting>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminJobPosting>(`/job-postings/${id}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "JOB_POSTING_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update job posting.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Job Applications ──────────────────────────────────────────────────────────

export async function loadJobApplicationsWithRefresh(
  session: AuthSession,
  postingId: string
): Promise<AuthorizedResult<AdminJobApplication[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminJobApplication[]>(`/job-postings/${postingId}/applications`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "JOB_APPS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load applications.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function addJobApplicationWithRefresh(
  session: AuthSession,
  postingId: string,
  body: { candidateName: string; stage?: string; score?: number; source?: string; flag?: string }
): Promise<AuthorizedResult<AdminJobApplication>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminJobApplication>(`/job-postings/${postingId}/applications`, accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "JOB_APP_CREATE_FAILED", response.payload.error?.message ?? "Unable to add application.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateJobApplicationWithRefresh(
  session: AuthSession,
  appId: string,
  body: { stage?: string; score?: number; flag?: string }
): Promise<AuthorizedResult<AdminJobApplication>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminJobApplication>(`/job-applications/${appId}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "JOB_APP_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update application.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Training ──────────────────────────────────────────────────────────────────

export async function loadAllTrainingWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminTrainingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminTrainingRecord[]>("/training", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "TRAINING_FETCH_FAILED", response.payload.error?.message ?? "Unable to load training records.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Standup Feed ──────────────────────────────────────────────────────────────

export async function loadStandupFeedWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminStandupEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminStandupEntry[]>("/standup/feed", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "STANDUP_FETCH_FAILED", response.payload.error?.message ?? "Unable to load standup feed.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Peer Reviews ──────────────────────────────────────────────────────────────

export async function loadAdminPeerReviewsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminPeerReview[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPeerReview[]>("/peer-reviews", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PEER_REVIEWS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load peer reviews.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Staff Onboarding ──────────────────────────────────────────────────────────

export async function loadAdminStaffOnboardingWithRefresh(
  session: AuthSession,
  staffId: string
): Promise<AuthorizedResult<AdminStaffOnboardingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminStaffOnboardingRecord[]>(`/staff/${staffId}/onboarding`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "STAFF_ONBOARDING_FETCH_FAILED", response.payload.error?.message ?? "Unable to load staff onboarding.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Timesheet Approval ────────────────────────────────────────────────────────

export async function loadPendingTimesheetsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminPendingTimeEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPendingTimeEntry[]>("/time-entries/pending", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PENDING_TIMESHEETS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load pending timesheets.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function approveTimesheetEntryWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<AdminPendingTimeEntry>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPendingTimeEntry>(`/time-entries/${id}/approve`, accessToken, { method: "PATCH", body: {} });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "TIMESHEET_APPROVE_FAILED", response.payload.error?.message ?? "Unable to approve time entry.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function rejectTimesheetEntryWithRefresh(
  session: AuthSession,
  id: string,
  reason?: string
): Promise<AuthorizedResult<AdminPendingTimeEntry>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPendingTimeEntry>(`/time-entries/${id}/reject`, accessToken, { method: "PATCH", body: { reason } });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "TIMESHEET_REJECT_FAILED", response.payload.error?.message ?? "Unable to reject time entry.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── L&D Budget ────────────────────────────────────────────────────────────────

export interface AdminLearningBudget {
  id: string;
  staffId: string;
  fiscalYear: number;
  budgetZAR: number;
  spentZAR: number;
  staff: { name: string };
  createdAt: string;
  updatedAt: string;
}

export async function loadLearningBudgetsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminLearningBudget[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLearningBudget[]>("/hr/learning-budgets", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "LEARNING_BUDGETS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load learning budgets.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function updateLearningBudgetWithRefresh(
  session: AuthSession,
  staffId: string,
  data: { budgetZAR: number; spentZAR: number; fiscalYear?: number }
): Promise<AuthorizedResult<AdminLearningBudget>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLearningBudget>(`/hr/learning-budgets/${staffId}`, accessToken, { method: "PUT", body: data });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LEARNING_BUDGET_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update learning budget.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Skill Proficiency ─────────────────────────────────────────────────────────

export interface AdminSkillProficiency {
  id: string;
  staffId: string;
  skill: string;
  level: number;
  certifiedAt: string | null;
  staff: { name: string };
  updatedAt: string;
}

export async function loadSkillProficiencyWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminSkillProficiency[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminSkillProficiency[]>("/hr/skill-proficiency", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SKILL_PROFICIENCY_FETCH_FAILED", response.payload.error?.message ?? "Unable to load skill proficiency.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function updateSkillProficiencyWithRefresh(
  session: AuthSession,
  staffId: string,
  skill: string,
  level: number,
  certifiedAt?: string | null
): Promise<AuthorizedResult<AdminSkillProficiency>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminSkillProficiency>(`/hr/skill-proficiency/${staffId}/${encodeURIComponent(skill)}`, accessToken, { method: "PUT", body: { level, certifiedAt } });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "SKILL_PROFICIENCY_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update skill proficiency.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
