import type { ApiResponse } from "@maphari/contracts";
import type { AuthSession } from "../auth/session";
import type { Role } from "@maphari/contracts";

const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";
let pendingRefreshPromise: Promise<ApiResponse<AuthSession>> | null = null;

export interface Snapshot {
  clients: Array<{ id: string; name: string; status: string }>;
  projects: Array<{ id: string; name: string; status: string; clientId: string }>;
  leads: Array<{ id: string; title: string; status: string; clientId: string }>;
}

interface RawGatewayResponse<T> {
  status: number;
  payload: ApiResponse<T>;
}

async function callGateway<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; accessToken?: string } = {}
): Promise<RawGatewayResponse<T>> {
  try {
    const response = await fetch(`${gatewayBaseUrl}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(options.accessToken ? { authorization: `Bearer ${options.accessToken}` } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = (await response.json()) as ApiResponse<T>;
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

export async function login(
  email: string,
  options?: { role?: Role; password?: string; rememberMe?: boolean }
): Promise<ApiResponse<AuthSession>> {
  const { payload } = await callGateway<AuthSession>("/auth/login", {
    method: "POST",
    body: {
      email,
      ...(options?.role ? { role: options.role } : {}),
      ...(options?.password ? { password: options.password } : {}),
      ...(typeof options?.rememberMe === "boolean" ? { rememberMe: options.rememberMe } : {})
    }
  });
  return payload;
}

export async function registerAdmin(
  email: string,
  password: string
): Promise<ApiResponse<{ userId: string; email: string; role: string; otpRequired: boolean; otpExpiresAt: string; debugOtp?: string }>> {
  const { payload } = await callGateway<{ userId: string; email: string; role: string; otpRequired: boolean; otpExpiresAt: string; debugOtp?: string }>("/auth/admin/register", {
    method: "POST",
    body: { email, password }
  });
  return payload;
}

export async function verifyAdminOtp(
  email: string,
  otp: string
): Promise<ApiResponse<{ userId: string; email: string; role: string }>> {
  const { payload } = await callGateway<{ userId: string; email: string; role: string }>("/auth/admin/verify", {
    method: "POST",
    body: { email, otp }
  });
  return payload;
}

export async function resendAdminOtp(
  email: string
): Promise<ApiResponse<{ email: string; otpRequired: boolean; otpExpiresAt: string; debugOtp?: string }>> {
  const { payload } = await callGateway<{ email: string; otpRequired: boolean; otpExpiresAt: string; debugOtp?: string }>("/auth/admin/resend-otp", {
    method: "POST",
    body: { email }
  });
  return payload;
}

export async function registerStaff(
  email: string,
  password: string
): Promise<ApiResponse<{ requestId: string; status: string; expiresAt: string }>> {
  const { payload } = await callGateway<{ requestId: string; status: string; expiresAt: string }>("/auth/staff/register", {
    method: "POST",
    body: { email, password }
  });
  return payload;
}

export async function verifyStaffPin(
  email: string,
  pin: string
): Promise<ApiResponse<{ userId: string; email: string; role: string }>> {
  const { payload } = await callGateway<{ userId: string; email: string; role: string }>("/auth/staff/verify", {
    method: "POST",
    body: { email, pin }
  });
  return payload;
}

export async function refresh(): Promise<ApiResponse<AuthSession>> {
  if (pendingRefreshPromise) return pendingRefreshPromise;

  pendingRefreshPromise = (async () => {
    const { payload } = await callGateway<AuthSession>("/auth/refresh", {
      method: "POST",
      body: {}
    });
    return payload;
  })();

  try {
    return await pendingRefreshPromise;
  } finally {
    pendingRefreshPromise = null;
  }
}

async function refreshSessionWithRetry(): Promise<AuthSession | null> {
  const first = await refresh();
  if (first.success && first.data) return first.data;

  const second = await refresh();
  if (second.success && second.data) return second.data;

  return null;
}

export async function logout(): Promise<ApiResponse<{ loggedOut: boolean }>> {
  const { payload } = await callGateway<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    body: {}
  });
  return payload;
}

/**
 * Fetches protected resources with auto-refresh and token retry.
 */
export async function loadSnapshotWithRefresh(session: AuthSession): Promise<{
  snapshot: Snapshot | null;
  nextSession: AuthSession | null;
  error?: string;
}> {
  const tryLoad = async (accessToken: string): Promise<{ data: Snapshot; unauthorized: boolean; error?: string }> => {
    const [clients, projects, leads] = await Promise.all([
      callGateway<Snapshot["clients"]>("/clients", { accessToken }),
      callGateway<Snapshot["projects"]>("/projects", { accessToken }),
      callGateway<Snapshot["leads"]>("/leads", { accessToken })
    ]);

    const unauthorized =
      clients.status === 401 ||
      projects.status === 401 ||
      leads.status === 401 ||
      clients.payload.error?.code === "UPSTREAM_UNAUTHORIZED" ||
      projects.payload.error?.code === "UPSTREAM_UNAUTHORIZED" ||
      leads.payload.error?.code === "UPSTREAM_UNAUTHORIZED";

    if (unauthorized) {
      return {
        data: { clients: [], projects: [], leads: [] },
        unauthorized: true
      };
    }

    if (!clients.payload.success || !projects.payload.success || !leads.payload.success) {
      return {
        data: { clients: [], projects: [], leads: [] },
        unauthorized: false,
        error: "Failed to load dashboard data"
      };
    }

    return {
      data: {
        clients: clients.payload.data ?? [],
        projects: projects.payload.data ?? [],
        leads: leads.payload.data ?? []
      },
      unauthorized: false
    };
  };

  const first = await tryLoad(session.accessToken);
  if (!first.unauthorized) {
    return { snapshot: first.data, nextSession: session, error: first.error };
  }

  const refreshedSession = await refreshSessionWithRetry();
  if (!refreshedSession) {
    return { snapshot: null, nextSession: null, error: "Session expired. Please sign in again." };
  }

  const nextSession: AuthSession = refreshedSession;

  const second = await tryLoad(nextSession.accessToken);
  if (second.unauthorized) {
    return {
      snapshot: null,
      nextSession,
      error: "Session is valid but authorization failed for dashboard resources."
    };
  }

  return { snapshot: second.data, nextSession, error: second.error };
}
