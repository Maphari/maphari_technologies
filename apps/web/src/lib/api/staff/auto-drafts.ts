// ════════════════════════════════════════════════════════════════════════════
// auto-drafts.ts — Staff API client: AI auto-draft endpoints
// Endpoints : GET  /staff/auto-drafts?clientId=
//             POST /staff/auto-drafts
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

export interface AutoDraftRecord {
  id: string;
  clientId: string;
  type: string;
  subject: string;
  fromName: string | null;
  direction: string;
  actionLabel: string | null; // draft content stored here
  occurredAt: string;
  createdAt: string;
}

export interface CreateAutoDraftInput {
  clientId: string;
  subject: string;   // e.g. "Week 12 update — Acme Corp"
  content: string;   // full draft body
}

export async function loadAutoDraftsWithRefresh(
  session: AuthSession,
  clientId?: string
): Promise<AuthorizedResult<AutoDraftRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
    const response = await callGateway<AutoDraftRecord[]>(
      `/staff/auto-drafts${qs}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "AUTO_DRAFTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load drafts"
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── AI draft generation ───────────────────────────────────────────────────────

export interface AutoDraftAiInput {
  clientName: string;
  projectName: string;
  milestones: string[];
  tasks: string[];
  tone: string;
  focus: string;
  customNote?: string;
}

export interface AutoDraftAiResult {
  draft: string;
  wordCount: number;
  jobId: string;
}

export async function generateAutoDraftWithRefresh(
  session: AuthSession,
  input: AutoDraftAiInput
): Promise<AuthorizedResult<AutoDraftAiResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AutoDraftAiResult>(
      "/ai/auto-draft",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "AUTO_DRAFT_AI_FAILED",
          response.payload.error?.message ?? "Unable to generate AI draft"
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function saveAutoDraftWithRefresh(
  session: AuthSession,
  input: CreateAutoDraftInput
): Promise<AuthorizedResult<AutoDraftRecord>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AutoDraftRecord>(
      "/staff/auto-drafts",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "AUTO_DRAFT_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save draft"
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
