import type { ApiResponse } from "@maphari/contracts";
import type { AuthSession } from "../../auth/session";
import { refresh } from "../gateway";

export const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

export interface RawGatewayResponse<T> {
  status: number;
  payload: ApiResponse<T>;
}

export interface GatewayError {
  code: string;
  message: string;
}

export interface AuthorizedResult<T> {
  data: T | null;
  nextSession: AuthSession | null;
  error: GatewayError | null;
  unauthorized?: boolean;
}

async function attemptGateway<T>(
  path: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown }
): Promise<RawGatewayResponse<T>> {
  try {
    const response = await fetch(`${gatewayBaseUrl}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let payload: ApiResponse<T>;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      payload = {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "Gateway returned an invalid response format."
        }
      };
    }

    return { status: response.status, payload };
  } catch {
    return {
      status: 0,
      payload: {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Unable to reach the API. Confirm the gateway is running and NEXT_PUBLIC_GATEWAY_BASE_URL is correct."
        }
      }
    };
  }
}

function isTransient<T>(res: RawGatewayResponse<T>): boolean {
  return res.status === 0 || res.status === 502 || res.status === 503 || res.status === 504;
}

export async function callGateway<T>(
  path: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown } = {}
): Promise<RawGatewayResponse<T>> {
  const result = await attemptGateway<T>(path, accessToken, options);
  if (!isTransient(result)) return result;

  // First retry after 250 ms
  await new Promise<void>((resolve) => setTimeout(resolve, 250));
  const retry1 = await attemptGateway<T>(path, accessToken, options);
  if (!isTransient(retry1)) return retry1;

  // Second retry after 500 ms
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return attemptGateway<T>(path, accessToken, options);
}

export function isUnauthorized<T>(response: RawGatewayResponse<T>): boolean {
  return response.status === 401 || response.payload.error?.code === "UPSTREAM_UNAUTHORIZED";
}

export function toGatewayError(code: string, message: string): GatewayError {
  const hints: Record<string, string> = {
    VALIDATION_ERROR: "Please review the highlighted fields and try again.",
    UPSTREAM_UNAVAILABLE: "A dependent service is temporarily unavailable. Retry shortly.",
    UPSTREAM_TIMEOUT: "Request timed out. Please retry.",
    FORBIDDEN: "You do not currently have permission for this action.",
    SESSION_EXPIRED: "Your session expired. Sign in again."
  };
  const hint = hints[code];
  const base = message?.trim().length > 0 ? message.trim() : "Request failed.";
  const detail = hint && !base.includes(hint) ? ` ${hint}` : "";
  return { code, message: `${base}${detail} [${code}]` };
}

async function refreshSessionWithRetry(): Promise<AuthSession | null> {
  const first = await refresh();
  if (first.success && first.data) return first.data;

  const second = await refresh();
  if (second.success && second.data) return second.data;

  return null;
}

export async function withAuthorizedSession<T>(
  session: AuthSession,
  runner: (accessToken: string) => Promise<{ unauthorized: boolean; data: T | null; error: GatewayError | null }>
): Promise<AuthorizedResult<T>> {
  const first = await runner(session.accessToken);
  if (!first.unauthorized) {
    return { data: first.data, nextSession: session, error: first.error };
  }

  const refreshedSession = await refreshSessionWithRetry();
  if (!refreshedSession) {
    return {
      data: null,
      nextSession: null,
      unauthorized: true,
      error: toGatewayError("SESSION_EXPIRED", "Session expired. Please sign in again.")
    };
  }

  const nextSession: AuthSession = refreshedSession;

  const second = await runner(nextSession.accessToken);
  if (second.unauthorized) {
    return {
      data: null,
      nextSession,
      unauthorized: true,
      error: toGatewayError("SESSION_UNAUTHORIZED", "Session is valid but authorization failed for admin resources.")
    };
  }

  return { data: second.data, nextSession, error: second.error };
}
