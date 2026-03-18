// ════════════════════════════════════════════════════════════════════════════
// onboarding.ts — Frontend API client for client + staff onboarding
// Endpoint : GET  /clients/:id/onboarding
//            PATCH /clients/:id/onboarding/:rid
//            GET  /staff/:id/onboarding
//            PATCH /staff/:id/onboarding/:rid
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientOnboardingRecord {
  id: string;
  clientId: string;
  category: string;
  task: string;
  status: "pending" | "complete" | "blocked";
  notes: string | null;
  owner: string | null;
  sortOrder: number;
  estimatedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffOnboardingRecord {
  id: string;
  staffId: string;
  category: string;
  task: string;
  status: "pending" | "complete";
  notes: string | null;
  owner: string | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Client Onboarding ─────────────────────────────────────────────────────────

export async function loadClientOnboardingWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientOnboardingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientOnboardingRecord[]>(
      `/clients/${clientId}/onboarding`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_ONBOARDING_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client onboarding records."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function patchClientOnboardingRecordWithRefresh(
  session: AuthSession,
  clientId: string,
  recordId: string,
  body: { status?: string; notes?: string; completedAt?: string }
): Promise<AuthorizedResult<ClientOnboardingRecord>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientOnboardingRecord>(
      `/clients/${clientId}/onboarding/${recordId}`,
      accessToken,
      { method: "PATCH", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_ONBOARDING_PATCH_FAILED",
          response.payload.error?.message ?? "Unable to update client onboarding record."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Staff Onboarding ──────────────────────────────────────────────────────────

export async function loadStaffOnboardingWithRefresh(
  session: AuthSession,
  staffId: string
): Promise<AuthorizedResult<StaffOnboardingRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffOnboardingRecord[]>(
      `/staff/${staffId}/onboarding`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_ONBOARDING_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load staff onboarding records."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function patchStaffOnboardingRecordWithRefresh(
  session: AuthSession,
  staffId: string,
  recordId: string,
  body: { status?: string; notes?: string; completedAt?: string }
): Promise<AuthorizedResult<StaffOnboardingRecord>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffOnboardingRecord>(
      `/staff/${staffId}/onboarding/${recordId}`,
      accessToken,
      { method: "PATCH", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_ONBOARDING_PATCH_FAILED",
          response.payload.error?.message ?? "Unable to update staff onboarding record."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
