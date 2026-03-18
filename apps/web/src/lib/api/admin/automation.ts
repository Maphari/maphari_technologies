// ════════════════════════════════════════════════════════════════════════════
// automation.ts — Admin API client: automation simulation dry-run
// Endpoint : POST /automation/simulate
// Scope    : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./_shared";

export interface SimulateInput {
  topic: string;
  payload: Record<string, unknown>;
}

export interface SimulateResult {
  topic: string;
  workflow: string;
  wouldTrigger: boolean;
  estimatedActions: string[];
  payloadKeys: string[];
}

export interface AutomationJobInput {
  type: string;
  clientId?: string;
  projectId?: string;
  invoiceIds?: string[];
  leadIds?: string[];
  payload?: Record<string, unknown>;
}

export interface AutomationJobResult {
  jobId: string;
  topic: string;
  workflow: string;
  status: string;
  createdAt: string;
}

export async function queueAutomationJobWithRefresh(
  session: AuthSession,
  input: AutomationJobInput
): Promise<AuthorizedResult<AutomationJobResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AutomationJobResult>(
      "/automation/jobs",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "JOB_QUEUE_FAILED",
          response.payload.error?.message ?? "Failed to queue automation job."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function simulateAutomation(
  session: AuthSession,
  input: SimulateInput
): Promise<AuthorizedResult<SimulateResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<SimulateResult>(
      "/automation/simulate",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SIMULATE_FAILED",
          response.payload.error?.message ?? "Simulation failed."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
