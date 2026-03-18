// ════════════════════════════════════════════════════════════════════════════
// webhooks.ts — Admin API client: Webhook & Integration Hub
// Endpoints : /admin/webhooks (CRUD + test)
// Scope     : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./_shared";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  createdAt: string;
  lastFiredAt: string | null;
  failCount: number;
}

export interface WebhookTestResult {
  statusCode: number;
  ok: boolean;
  latencyMs: number;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active?: boolean;
}

// ── loadWebhooksWithRefresh ────────────────────────────────────────────────

export async function loadWebhooksWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<WebhookConfig[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<WebhookConfig[]>(
      "/admin/webhooks",
      accessToken,
      { method: "GET" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WEBHOOKS_FETCH_FAILED",
          response.payload.error?.message ?? "Failed to load webhooks."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── createWebhookWithRefresh ───────────────────────────────────────────────

export async function createWebhookWithRefresh(
  session: AuthSession,
  input: CreateWebhookInput
): Promise<AuthorizedResult<WebhookConfig>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<WebhookConfig>(
      "/admin/webhooks",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WEBHOOK_CREATE_FAILED",
          response.payload.error?.message ?? "Failed to create webhook."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── updateWebhookWithRefresh ───────────────────────────────────────────────

export async function updateWebhookWithRefresh(
  session: AuthSession,
  id: string,
  patch: Partial<WebhookConfig>
): Promise<AuthorizedResult<WebhookConfig>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<WebhookConfig>(
      `/admin/webhooks/${id}`,
      accessToken,
      { method: "PATCH", body: patch }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WEBHOOK_UPDATE_FAILED",
          response.payload.error?.message ?? "Failed to update webhook."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── deleteWebhookWithRefresh ───────────────────────────────────────────────

export async function deleteWebhookWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<{ deleted: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ deleted: string }>(
      `/admin/webhooks/${id}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WEBHOOK_DELETE_FAILED",
          response.payload.error?.message ?? "Failed to delete webhook."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

// ── testWebhookWithRefresh ─────────────────────────────────────────────────

export async function testWebhookWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<WebhookTestResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<WebhookTestResult>(
      `/admin/webhooks/${id}/test`,
      accessToken,
      { method: "POST", body: {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WEBHOOK_TEST_FAILED",
          response.payload.error?.message ?? "Failed to send test delivery."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
