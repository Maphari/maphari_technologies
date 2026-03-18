// ════════════════════════════════════════════════════════════════════════════
// apps/web/src/lib/api/admin/ai.ts
// Frontend API client for the AI service endpoints
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AiRecommendation {
  id: string;
  type: "Risk" | "Revenue" | "Efficiency";
  title: string;
  confidence: number;
  estimatedValue: string;
  reasoning: string;
  action: string;
}

export interface AiJobResult {
  id: string;
  task: string;
  model: string;
  response: string;
  status: string;
  latencyMs: number;
  createdAt: string;
}

// ── AI Recommendations ────────────────────────────────────────────────────────

/**
 * Fetch org-wide AI action recommendations.
 * Analyses health scores, overdue invoices, and idle leads to surface
 * prioritised actions for admin review.
 * Gateway route: GET /ai/recommendations (ADMIN only)
 */
export async function fetchAiRecommendations(
  session: AuthSession
): Promise<AuthorizedResult<AiRecommendation[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AiRecommendation[]>("/ai/recommendations", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "AI_FETCH_FAILED",
          res.payload.error?.message ?? "Failed to load AI recommendations."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── AI Lead Qualification ─────────────────────────────────────────────────────

export interface AiQualifyLeadInput {
  leadId: string;
  clientId?: string;
  /** Descriptive context about the lead to pass to the LLM */
  prompt: string;
  model?: string;
}

/**
 * Qualify a lead using OpenAI GPT-4o-mini.
 * Returns structured qualification analysis (fit score, tier, next action).
 * Gateway route: POST /ai/lead-qualify (ADMIN / STAFF)
 */
export async function qualifyLeadWithAI(
  session: AuthSession,
  input: AiQualifyLeadInput
): Promise<AuthorizedResult<AiJobResult>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AiJobResult>("/ai/lead-qualify", token, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "AI_QUALIFY_FAILED",
          res.payload.error?.message ?? "Failed to qualify lead with AI."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── AI Proposal Draft ─────────────────────────────────────────────────────────

export interface AiProposalDraftInput {
  clientId?: string;
  leadId?: string;
  projectId?: string;
  /** Full briefing prompt — include service type, scope, budget range */
  prompt: string;
  model?: string;
}

/**
 * Draft a project proposal using Anthropic claude-sonnet-4-5.
 * Returns a long-form markdown proposal ready for editing.
 * Gateway route: POST /ai/proposal-draft (ADMIN / STAFF)
 */
export async function draftProposalWithAI(
  session: AuthSession,
  input: AiProposalDraftInput
): Promise<AuthorizedResult<AiJobResult>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AiJobResult>("/ai/proposal-draft", token, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "AI_DRAFT_FAILED",
          res.payload.error?.message ?? "Failed to draft proposal with AI."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Automation Simulation ─────────────────────────────────────────────────────

export interface AutomationSimulateInput {
  topic: string;
  payload?: Record<string, unknown>;
}

export interface AutomationSimulateResult {
  topic: string;
  workflow: string;
  wouldTrigger: boolean;
  estimatedActions: string[];
  payloadKeys: string[];
}

/**
 * Dry-run an automation event: returns which workflow would fire
 * and the estimated actions — without executing anything.
 */
export async function simulateAutomationWithRefresh(
  session: AuthSession,
  input: AutomationSimulateInput
): Promise<AuthorizedResult<AutomationSimulateResult>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AutomationSimulateResult>("/automation/simulate", token, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "SIMULATE_FAILED",
          res.payload.error?.message ?? "Simulation failed."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
