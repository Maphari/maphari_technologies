/**
 * Staff 2FA / TOTP API — wraps /auth/staff/2fa/* gateway endpoints.
 */

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "../admin/_shared";
import type { AuthorizedResult } from "../admin/_shared";

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
 * Get the current TOTP 2FA status for the authenticated staff member.
 */
export async function getStaff2faStatusWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<TotpStatus>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<TotpStatus>("/auth/staff/2fa/status", accessToken);
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
 * The setup is NOT yet active until verifyStaff2faWithRefresh is called.
 */
export async function setupStaff2faWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<TotpSetupData>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<TotpSetupData>("/auth/staff/2fa/setup", accessToken, {
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
 * Verify a 6-digit TOTP code to activate 2FA on this staff account.
 */
export async function verifyStaff2faWithRefresh(
  session: AuthSession,
  code: string
): Promise<AuthorizedResult<{ enabled: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ enabled: boolean }>("/auth/staff/2fa/verify", accessToken, {
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
 * Disable 2FA on this staff account. Requires the current password as confirmation.
 */
export async function disableStaff2faWithRefresh(
  session: AuthSession,
  password: string
): Promise<AuthorizedResult<{ disabled: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ disabled: boolean }>("/auth/staff/2fa/disable", accessToken, {
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
