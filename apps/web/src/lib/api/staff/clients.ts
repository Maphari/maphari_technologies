// ════════════════════════════════════════════════════════════════════════════
// clients.ts — Staff API client: client-related endpoints
// Endpoints : GET   /staff/clients
//             GET   /staff/clients/:id/health
//             GET   /staff/clients/:id/sla
//             GET   /staff/client-budgets
//             GET   /staff/client-sentiments
//             PATCH /staff/client-sentiments/:clientId
//             GET   /staff/retainer-burn
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
export interface StaffClient {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  tier: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffClientHealthScore {
  id: string;
  clientId: string;
  score: number;
  trend: string;
  signals: string[];
  computedAt: string;
}

export interface StaffSlaRecord {
  id: string;
  clientId: string;
  projectId: string | null;
  metric: string;
  targetHours: number;
  actualHours: number | null;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

// ── Aggregated health score type ──────────────────────────────────────────────

export interface StaffHealthScoreEntry {
  id:             string;
  name:           string;
  avatar:         string;
  project:        string;
  score:          number;
  trend:          "up" | "down" | "stable";
  trendVal:       string;
  sentiment:      "positive" | "neutral" | "at_risk";
  lastTouched:    string;
  overdueTasks:   number;
  unreadMessages: number;
  milestoneDelay: number;
  retainerBurn:   number;
  invoiceStatus:  "paid" | "pending" | "overdue";
  signals:        Array<{ type: "positive" | "neutral" | "negative"; text: string }>;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** List all clients visible to the authenticated staff member */
export async function getStaffClients(
  session: AuthSession
): Promise<AuthorizedResult<StaffClient[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffClient[]>("/clients", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_CLIENTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load clients."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get health scores for ALL clients (aggregated) */
export async function getStaffAllHealthScores(
  session: AuthSession
): Promise<AuthorizedResult<StaffHealthScoreEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffHealthScoreEntry[]>(
      "/staff/health-scores",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_HEALTH_SCORES_FAILED",
          response.payload.error?.message ?? "Unable to load health scores."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get health score for a client */
export async function getStaffClientHealth(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<StaffClientHealthScore>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffClientHealthScore>(
      `/clients/${clientId}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_HEALTH_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client health score."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Get SLA records for a client */
export async function getStaffClientSla(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<StaffSlaRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffSlaRecord[]>(
      `/clients/${clientId}/sla`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_SLA_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load SLA records."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Budget & Sentiment types ──────────────────────────────────────────────────

export interface StaffClientBudget {
  clientId:        string;
  clientName:      string;
  retainerBurnPct: number;
  hoursUsed:       number;
  healthScore:     number;
  sentiment:       string;
}

export interface StaffClientSignal {
  type:      "positive" | "neutral" | "negative";
  text:      string;
  createdAt: string;
}

export interface StaffClientSentiment {
  clientId:    string;
  clientName:  string;
  sentiment:   "POSITIVE" | "NEUTRAL" | "AT_RISK";
  score:       number;
  lastUpdated: string;
  signals:     StaffClientSignal[];
}

export interface UpdateClientSentimentInput {
  sentiment: "POSITIVE" | "NEUTRAL" | "AT_RISK";
  note?:     string;
}

export interface StaffRetainerBurnMonth {
  month:    string;
  hoursUsed: number;
  burnPct:  number;
}

export interface StaffRetainerBurnEntry {
  clientId:        string;
  clientName:      string;
  hoursUsed:       number;
  retainerBurnPct: number;
  retainerHours:   number;
  cycleStart:      string;        // ISO
  cycleEnd:        string;         // ISO
  daysLeft:        number;
  overage:         number;        // hours over retainer (0 if not exceeded)
  alert:           string | null; // backend-generated alert message for exceeded clients
  burnHistory:     StaffRetainerBurnMonth[];
}

// ── Budget & Sentiment API functions ─────────────────────────────────────────

/** Get budget overview for all retainer clients */
export async function getStaffClientBudgets(
  session: AuthSession
): Promise<AuthorizedResult<StaffClientBudget[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffClientBudget[]>(
      "/staff/client-budgets",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_CLIENT_BUDGETS_FAILED",
          response.payload.error?.message ?? "Unable to load client budgets."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get sentiment overview for all clients */
export async function getStaffClientSentiments(
  session: AuthSession
): Promise<AuthorizedResult<StaffClientSentiment[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffClientSentiment[]>(
      "/staff/client-sentiments",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_CLIENT_SENTIMENTS_FAILED",
          response.payload.error?.message ?? "Unable to load client sentiments."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Update the sentiment flag for a specific client */
export async function updateStaffClientSentiment(
  session:  AuthSession,
  clientId: string,
  input:    UpdateClientSentimentInput
): Promise<AuthorizedResult<{ clientId: string; sentiment: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ clientId: string; sentiment: string }>(
      `/staff/client-sentiments/${clientId}`,
      accessToken,
      { method: "PATCH", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_SENTIMENT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client sentiment."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Communication Logs ────────────────────────────────────────────────────────

export interface StaffCommLog {
  id:          string;
  clientId:    string;
  type:        string;
  subject:     string;
  fromName:    string | null;
  direction:   string;
  actionLabel: string | null;
  occurredAt:  string;
  clientName:  string;
}

/** Get all communication logs across all clients (STAFF/ADMIN) */
export async function getStaffAllComms(
  session: AuthSession
): Promise<AuthorizedResult<StaffCommLog[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffCommLog[]>("/staff/comms", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_COMMS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load communication logs."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get retainer burn breakdown across all clients */
export async function getStaffRetainerBurn(
  session: AuthSession
): Promise<AuthorizedResult<StaffRetainerBurnEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffRetainerBurnEntry[]>(
      "/staff/retainer-burn",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_RETAINER_BURN_FAILED",
          response.payload.error?.message ?? "Unable to load retainer burn data."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
