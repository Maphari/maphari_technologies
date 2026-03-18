// ════════════════════════════════════════════════════════════════════════════
// client-ops.ts — Admin API client: Client Operations domain
// Endpoints : GET  /satisfaction        (all surveys, admin/staff)
//             GET  /sla                 (all SLA records, admin/staff)
//             GET  /comms               (all comm logs, admin/staff)
//             GET  /interventions       (all interventions, admin/staff)
//             GET  /health-scores       (all health scores, admin/staff)
//             GET  /appointments        (all appointments, admin = all, client = own)
//             GET  /referrals           (all referrals, all roles)
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
// AdminAppointment already defined in types.ts — import and re-export so pages
// that import from this module can continue to use `type AdminAppointment`.
import type { AdminAppointment } from "./types";
export type { AdminAppointment };

// ── Types — Satisfaction Surveys ──────────────────────────────────────────────

export interface AdminSatisfactionSurvey {
  id: string;
  clientId: string;
  periodStart: string;
  periodEnd: string | null;
  status: string;
  completedAt: string | null;
  npsScore: number | null;
  csatScore: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Types — SLA Records ───────────────────────────────────────────────────────

export interface AdminSlaRecord {
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
  updatedAt: string;
}

// ── Types — Communication Logs ────────────────────────────────────────────────

export interface AdminCommunicationLog {
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

// ── Types — Interventions ─────────────────────────────────────────────────────

export interface AdminIntervention {
  id: string;
  clientId: string;
  type: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Types — Health Scores ─────────────────────────────────────────────────────

export interface AdminHealthScore {
  id: string;
  clientId: string;
  score: number;
  trend: string;
  trendValue: number;
  sentiment: string;
  lastTouched: string | null;
  overdueTasks: number;
  unreadMessages: number;
  milestoneDelayDays: number;
  retainerBurnPct: number;
  invoiceStatus: string;
  recordedAt: string;
}

// ── Types — Referrals ─────────────────────────────────────────────────────────

export interface AdminReferral {
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

// ── API Functions — Satisfaction ──────────────────────────────────────────────

export async function loadAllSatisfactionSurveysWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminSatisfactionSurvey[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminSatisfactionSurvey[]>("/satisfaction", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "SATISFACTION_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch surveys.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── API Functions — SLA ───────────────────────────────────────────────────────

export async function loadAllSlaRecordsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminSlaRecord[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminSlaRecord[]>("/sla", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "SLA_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch SLA records.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── API Functions — Communication Logs ───────────────────────────────────────

export async function loadAllCommLogsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminCommunicationLog[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCommunicationLog[]>("/comms", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "COMMS_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch communication logs.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── API Functions — Interventions ─────────────────────────────────────────────

export async function loadAllInterventionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminIntervention[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminIntervention[]>("/interventions", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "INTERVENTIONS_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch interventions.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── API Functions — Health Scores ──────────────────────────────────────────────

export async function loadAllHealthScoresWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminHealthScore[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminHealthScore[]>("/health-scores", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "HEALTH_SCORES_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch health scores.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── API Functions — Appointments ───────────────────────────────────────────────

export async function loadAllAppointmentsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminAppointment[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminAppointment[]>("/appointments", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "APPOINTMENTS_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch appointments.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── API Functions — Referrals ──────────────────────────────────────────────────

export async function loadAllReferralsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminReferral[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminReferral[]>("/referrals", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "REFERRALS_FETCH_FAILED", res.payload.error?.message ?? "Unable to fetch referrals.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
