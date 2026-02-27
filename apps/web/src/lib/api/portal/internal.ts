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
}

export async function callGateway<T>(
  path: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {}
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

export function isUnauthorized<T>(response: RawGatewayResponse<T>): boolean {
  return response.status === 401 || response.payload.error?.code === "UPSTREAM_UNAUTHORIZED";
}

export function toGatewayError(code: string, message: string): GatewayError {
  const hints: Record<string, string> = {
    VALIDATION_ERROR: "Please review required fields and try again.",
    SIGNED_AGREEMENT_REQUIRED: "Upload and select a signed agreement before submitting.",
    DEPOSIT_PAYMENT_REQUIRED: "A valid 50% deposit payment record is required.",
    DEPOSIT_NOT_COMPLETED: "Deposit payment must be completed before submission.",
    DEPOSIT_UNDERPAID: "Deposit amount must be at least 50% of the estimate.",
    DEPOSIT_GATE_UNAVAILABLE: "Billing verification is temporarily unavailable. Please retry shortly.",
    UPLOAD_TRANSFER_FAILED: "File upload transfer failed. Please retry in a moment.",
    PROJECT_REQUEST_CREATE_FAILED: "Request submission failed. Your payment may be saved; retry submit once."
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
      error: toGatewayError("SESSION_EXPIRED", "Session expired. Please sign in again.")
    };
  }

  const nextSession: AuthSession = refreshedSession;

  const second = await runner(nextSession.accessToken);
  if (second.unauthorized) {
    return {
      data: null,
      nextSession,
      error: toGatewayError("SESSION_UNAUTHORIZED", "Session is valid but authorization failed for portal resources.")
    };
  }

  return { data: second.data, nextSession, error: second.error };
}
