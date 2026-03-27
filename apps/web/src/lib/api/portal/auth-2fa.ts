import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface ClientTotpStatus {
  enabled: boolean;
  enabledAt: string | null;
}

export interface ClientTotpSetupData {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

function client2faError(
  fallbackCode: string,
  fallbackMessage: string,
  response: { status: number; payload: { error?: { code?: string; message?: string } } }
) {
  const code = response.payload.error?.code;
  const message = response.payload.error?.message;
  if (code && message) return toGatewayError(code, message);
  if (response.status === 404) {
    return toGatewayError(
      "CLIENT_2FA_ENDPOINT_MISSING",
      "2FA endpoint is unavailable. Restart or redeploy gateway/auth services with latest routes."
    );
  }
  if (response.status === 403) {
    return toGatewayError(
      "CLIENT_2FA_FORBIDDEN",
      "Your current role is not authorized for client 2FA setup."
    );
  }
  return toGatewayError(fallbackCode, fallbackMessage);
}

export async function getClient2faStatusWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ClientTotpStatus>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientTotpStatus>("/auth/client/2fa/status", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: client2faError("CLIENT_2FA_STATUS_FAILED", "Unable to fetch 2FA status.", response),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setupClient2faWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ClientTotpSetupData>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientTotpSetupData>("/auth/client/2fa/setup", accessToken, {
      method: "POST",
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: client2faError("CLIENT_2FA_SETUP_FAILED", "Unable to start 2FA setup.", response),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function verifyClient2faWithRefresh(
  session: AuthSession,
  code: string
): Promise<AuthorizedResult<{ enabled: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ enabled: boolean }>("/auth/client/2fa/verify", accessToken, {
      method: "POST",
      body: { code },
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: client2faError("CLIENT_2FA_VERIFY_FAILED", "Unable to verify 2FA code.", response),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function disableClient2faWithRefresh(
  session: AuthSession,
  password: string
): Promise<AuthorizedResult<{ disabled: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ disabled: boolean }>("/auth/client/2fa/disable", accessToken, {
      method: "POST",
      body: { password },
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: client2faError("CLIENT_2FA_DISABLE_FAILED", "Unable to disable 2FA.", response),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
