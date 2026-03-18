// ════════════════════════════════════════════════════════════════════════════
// client-cx.ts — Portal API client: Client CX domain endpoints
// Endpoints : GET  /clients/:id/onboarding    PATCH /:rid
//             GET  /clients/:id/offboarding   PATCH /:tid
//             GET  /clients/:id/surveys       POST  /:sid/responses
//             GET  /clients/:id/comms
//             GET  /clients/:id/sla
//             GET  /appointments              POST
//             GET  /referrals                 POST
//             GET  /support-tickets           POST  PATCH /:tid
// Scope     : CLIENT read/write own; STAFF/ADMIN full access (enforced server-side)
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

export interface PortalOnboardingRecord {
  id: string;
  clientId: string;
  stageLabel: string;
  status: string;
  sortOrder: number;
  estimatedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalOffboardingTask {
  id: string;
  clientId: string;
  groupName: string;
  label: string;
  status: string;
  actionLabel: string | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSurvey {
  id: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  npsScore: number | null;
  csatScore: number | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSurveyResponse {
  question: string;
  answer: string;
}

export interface PortalCommLog {
  id: string;
  clientId: string;
  type: string;
  subject: string;
  fromName: string | null;
  direction: string;
  relatedFileId: string | null;
  actionLabel: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface PortalSlaRecord {
  id: string;
  clientId: string;
  tier: string;
  metric: string;
  target: string;
  targetHrs: number | null;
  actual: string;
  actualHrs: number | null;
  variance: string | null;
  status: string;
  periodStart: string;
  periodEnd: string | null;
  createdAt: string;
}

export interface PortalAppointment {
  id: string;
  clientId: string;
  type: string;
  scheduledAt: string;
  durationMins: number;
  ownerName: string | null;
  status: string;
  notes: string | null;
  videoRoomUrl: string | null;
  videoProvider: string | null;
  videoCallStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalReferral {
  id: string;
  referredByName: string;
  referredByEmail: string | null;
  referredClientId: string | null;
  status: string;
  rewardAmountCents: number | null;
  rewardedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSupportTicket {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function loadPortalOnboardingWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<PortalOnboardingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalOnboardingRecord[]>(`/clients/${clientId}/onboarding`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "ONBOARDING_FETCH_FAILED", response.payload.error?.message ?? "Unable to load onboarding data.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function patchPortalOnboardingRecordWithRefresh(
  session: AuthSession,
  clientId: string,
  recordId: string,
  patch: { status?: string; notes?: string }
): Promise<AuthorizedResult<PortalOnboardingRecord>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalOnboardingRecord>(
      `/clients/${clientId}/onboarding/${recordId}`,
      accessToken,
      { method: "PATCH", body: patch }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "ONBOARDING_PATCH_FAILED", response.payload.error?.message ?? "Unable to update onboarding record.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Offboarding ───────────────────────────────────────────────────────────────

export async function loadPortalOffboardingWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<PortalOffboardingTask[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalOffboardingTask[]>(`/clients/${clientId}/offboarding`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "OFFBOARDING_FETCH_FAILED", response.payload.error?.message ?? "Unable to load offboarding data.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function patchPortalOffboardingTaskWithRefresh(
  session: AuthSession,
  clientId: string,
  taskId: string,
  patch: { status?: string; completedAt?: string }
): Promise<AuthorizedResult<PortalOffboardingTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalOffboardingTask>(
      `/clients/${clientId}/offboarding/${taskId}`,
      accessToken,
      { method: "PATCH", body: patch }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "OFFBOARDING_PATCH_FAILED", response.payload.error?.message ?? "Unable to update offboarding task.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Satisfaction Surveys ───────────────────────────────────────────────────────

export async function loadPortalSurveysWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<PortalSurvey[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSurvey[]>(`/clients/${clientId}/surveys`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SURVEYS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load surveys.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function submitPortalSurveyResponsesWithRefresh(
  session: AuthSession,
  clientId: string,
  surveyId: string,
  body: { responses: PortalSurveyResponse[]; npsScore?: number; csatScore?: number }
): Promise<AuthorizedResult<{ count: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ count: number }>(
      `/clients/${clientId}/surveys/${surveyId}/responses`,
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "SURVEY_SUBMIT_FAILED", response.payload.error?.message ?? "Unable to submit survey responses.") };
    }
    return { unauthorized: false, data: response.payload.data ?? { count: 0 }, error: null };
  });
}

// ── Communication History ─────────────────────────────────────────────────────

export async function loadPortalCommLogsWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<PortalCommLog[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalCommLog[]>(`/clients/${clientId}/comms`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "COMMS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load communication history.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── SLA Records ───────────────────────────────────────────────────────────────

export async function loadPortalSlaWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<PortalSlaRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSlaRecord[]>(`/clients/${clientId}/sla`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SLA_FETCH_FAILED", response.payload.error?.message ?? "Unable to load SLA records.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function loadPortalAppointmentsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalAppointment[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAppointment[]>(`/appointments`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "APPOINTMENTS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load appointments.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPortalAppointmentWithRefresh(
  session: AuthSession,
  body: { clientId: string; type: string; scheduledAt: string; durationMins: number; notes?: string }
): Promise<AuthorizedResult<PortalAppointment>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAppointment>(`/appointments`, accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "APPOINTMENT_CREATE_FAILED", response.payload.error?.message ?? "Unable to book appointment.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updatePortalAppointmentWithRefresh(
  session: AuthSession,
  appointmentId: string,
  body: { status?: string; notes?: string }
): Promise<AuthorizedResult<PortalAppointment>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAppointment>(`/appointments/${appointmentId}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "APPOINTMENT_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update appointment.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Referrals ─────────────────────────────────────────────────────────────────

export async function loadPortalReferralsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalReferral[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalReferral[]>(`/referrals`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "REFERRALS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load referrals.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPortalReferralWithRefresh(
  session: AuthSession,
  body: { referredByName: string; referredByEmail?: string; notes?: string }
): Promise<AuthorizedResult<PortalReferral>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalReferral>(`/referrals`, accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "REFERRAL_CREATE_FAILED", response.payload.error?.message ?? "Unable to submit referral.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export async function loadPortalSupportTicketsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalSupportTicket[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSupportTicket[]>(`/support-tickets`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SUPPORT_TICKETS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load support tickets.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPortalSupportTicketWithRefresh(
  session: AuthSession,
  body: { clientId: string; title: string; description?: string; category?: string; priority?: string }
): Promise<AuthorizedResult<PortalSupportTicket>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSupportTicket>(`/support-tickets`, accessToken, { method: "POST", body });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "SUPPORT_TICKET_CREATE_FAILED", response.payload.error?.message ?? "Unable to create support ticket.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export interface PortalTicketComment {
  id:          string;
  clientId:    string;
  type:        string;
  subject:     string;
  fromName:    string | null;
  direction:   string;
  actionLabel: string | null;
  occurredAt:  string;
  createdAt:   string;
}

/** Post a comment on a support ticket */
export async function postSupportTicketCommentWithRefresh(
  session: AuthSession,
  ticketId: string,
  body: { message: string; authorName?: string }
): Promise<AuthorizedResult<PortalTicketComment>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalTicketComment>(
      `/support-tickets/${ticketId}/comments`,
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TICKET_COMMENT_FAILED",
          response.payload.error?.message ?? "Unable to post comment."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
