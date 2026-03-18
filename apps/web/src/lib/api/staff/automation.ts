// ════════════════════════════════════════════════════════════════════════════
// automation.ts — Staff API client: automation service endpoints
// Endpoints : GET /automation/jobs
//             GET /automation/jobs/:jobId
//             GET /automation/dead-letters
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

export type AutomationJobStatus =
  | "received"
  | "processing"
  | "succeeded"
  | "failed"
  | "dead-lettered"
  | "skipped-duplicate";

export interface AutomationJob {
  jobId: string;
  eventId: string;
  topic: string;
  workflow: string;
  status: AutomationJobStatus;
  attempts: number;
  maxAttempts: number;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** List automation jobs from the automation service audit log */
export async function getAutomationJobs(
  session: AuthSession,
  limit?: number
): Promise<AuthorizedResult<AutomationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const query = limit != null ? `?limit=${limit}` : "";
    const response = await callGateway<AutomationJob[]>(
      `/automation/jobs${query}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "AUTOMATION_JOBS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load automation jobs."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Acknowledge all dead-lettered automation jobs (marks them as acknowledged) */
export async function acknowledgeAutomationFailures(
  session: AuthSession
): Promise<AuthorizedResult<{ acknowledged: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ acknowledged: number }>(
      "/automation/jobs/acknowledge",
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: { acknowledged: 0 },
        error: toGatewayError(
          response.payload.error?.code ?? "AUTOMATION_ACK_FAILED",
          response.payload.error?.message ?? "Unable to acknowledge failures."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { acknowledged: 0 }, error: null };
  });
}

/** Re-queue all failed/dead-lettered jobs (marks them as acknowledged for UI clearing) */
export async function retryAutomationFailed(
  session: AuthSession
): Promise<AuthorizedResult<{ requeued: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ requeued: number }>(
      "/automation/jobs/retry-failed",
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: { requeued: 0 },
        error: toGatewayError(
          response.payload.error?.code ?? "AUTOMATION_RETRY_FAILED",
          response.payload.error?.message ?? "Unable to process queue."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { requeued: 0 }, error: null };
  });
}

/** List dead-lettered automation jobs */
export async function getAutomationDeadLetters(
  session: AuthSession,
  limit?: number
): Promise<AuthorizedResult<AutomationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const query = limit != null ? `?limit=${limit}` : "";
    const response = await callGateway<AutomationJob[]>(
      `/automation/dead-letters${query}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "AUTOMATION_DEAD_LETTERS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load dead-letter queue."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
