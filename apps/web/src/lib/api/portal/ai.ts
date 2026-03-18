// ════════════════════════════════════════════════════════════════════════════
// ai.ts — Portal API client: AI generate endpoint
// Endpoint : POST /ai/generate
// Scope    : CLIENT (own clientId enforced server-side)
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface AiGenerateInput {
  type: "general" | "proposal" | "estimate" | "summary";
  prompt: string;
  context?: string;
}

export interface AiGenerateResult {
  output: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export async function callPortalAiGenerateWithRefresh(
  session: AuthSession,
  input: AiGenerateInput
): Promise<AuthorizedResult<AiGenerateResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AiGenerateResult>("/ai/generate", accessToken, {
      method: "POST",
      body: input,
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "AI_GENERATE_FAILED",
          response.payload.error?.message ?? "AI generation failed"
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
