/**
 * Admin 2FA / TOTP API — wraps /auth/admin/2fa/* gateway endpoints.
 */

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TotpStatus {
  enabled:   boolean;
  enabledAt: string | null;
}

export interface TotpSetupData {
  secret:        string;
  qrCodeDataUrl: string;
  backupCodes:   string[];
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Get the current TOTP 2FA status for the authenticated admin.
 */
export async function get2faStatusWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<TotpStatus>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<TotpStatus>("/auth/admin/2fa/status", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TOTP_STATUS_FAILED",
          response.payload.error?.message ?? "Failed to fetch 2FA status."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Initiate 2FA setup — generates a TOTP secret + QR code data URL.
 * The setup is NOT yet active until verify2faWithRefresh is called.
 */
export async function setup2faWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<TotpSetupData>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<TotpSetupData>("/auth/admin/2fa/setup", accessToken, {
      method: "POST",
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TOTP_SETUP_FAILED",
          response.payload.error?.message ?? "Failed to initiate 2FA setup."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Verify a 6-digit TOTP code to activate 2FA on this account.
 */
export async function verify2faWithRefresh(
  session: AuthSession,
  code: string
): Promise<AuthorizedResult<{ enabled: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ enabled: boolean }>("/auth/admin/2fa/verify", accessToken, {
      method: "POST",
      body: { code },
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TOTP_VERIFY_FAILED",
          response.payload.error?.message ?? "Invalid or expired code. Please try again."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Disable 2FA on this account. Requires the current password as confirmation.
 */
export async function disable2faWithRefresh(
  session: AuthSession,
  password: string
): Promise<AuthorizedResult<{ disabled: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ disabled: boolean }>("/auth/admin/2fa/disable", accessToken, {
      method: "POST",
      body: { password },
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TOTP_DISABLE_FAILED",
          response.payload.error?.message ?? "Failed to disable 2FA."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

// ── Session management ─────────────────────────────────────────────────────

export interface LoginSessionEvent {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/**
 * Fetch the 10 most recent login events for the authenticated user.
 */
export async function getMySessionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<LoginSessionEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LoginSessionEvent[]>("/auth/me/sessions", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SESSIONS_FETCH_FAILED",
          response.payload.error?.message ?? "Failed to fetch session history."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Revoke all active refresh tokens for the current user (sign out all devices).
 */
export async function signOutAllSessionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ revokedCount: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ revokedCount: number }>("/auth/me/sessions", accessToken, {
      method: "DELETE",
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SESSIONS_REVOKE_FAILED",
          response.payload.error?.message ?? "Failed to sign out all devices."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
