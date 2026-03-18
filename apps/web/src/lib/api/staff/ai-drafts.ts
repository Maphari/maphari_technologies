// ════════════════════════════════════════════════════════════════════════════
// ai-drafts.ts — Staff API client: AI client-update draft + report generation
// Endpoints : POST /ai/draft-client-update
//             POST /ai/generate-report
// Scope     : STAFF + ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

// ── Client-update draft ───────────────────────────────────────────────────────

export interface ClientUpdateDraftInput {
  projectId: string;
  clientName: string;
  completedTasks: string[];
  period: string;
}

export interface ClientUpdateDraftResult {
  draft: string;
  subject: string;
  jobId: string;
}

/**
 * Generate an AI-drafted client update email.
 * Calls POST /ai/draft-client-update via the gateway.
 * Returns { draft, subject } ready to display in the compose UI.
 */
export async function generateClientUpdateDraftWithRefresh(
  session: AuthSession,
  input: ClientUpdateDraftInput
): Promise<AuthorizedResult<ClientUpdateDraftResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientUpdateDraftResult>(
      "/ai/draft-client-update",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_UPDATE_DRAFT_FAILED",
          response.payload.error?.message ?? "Unable to generate client update draft"
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Automated report generation ───────────────────────────────────────────────

export interface GenerateReportInput {
  reportType: string;
  projectId: string;
  clientName: string;
  period: string;
}

export interface GenerateReportResult {
  markdown: string;
  title: string;
  jobId: string;
}

/**
 * Generate an AI-authored markdown report for a project.
 * Calls POST /ai/generate-report via the gateway.
 * Returns { markdown, title } ready to render in the report modal.
 */
export async function generateReportWithRefresh(
  session: AuthSession,
  input: GenerateReportInput
): Promise<AuthorizedResult<GenerateReportResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<GenerateReportResult>(
      "/ai/generate-report",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GENERATE_REPORT_FAILED",
          response.payload.error?.message ?? "Unable to generate report"
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
