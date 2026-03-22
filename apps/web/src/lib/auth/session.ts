// ════════════════════════════════════════════════════════════════════════════
// session.ts — Auth session management
// Storage : Module-scoped variable only (no sessionStorage / localStorage)
//           XSS safety: access token never written to persistent browser
//           storage; it lives only in JS heap and is lost on tab close or
//           page reload (triggering hydrateSession() which uses the
//           HTTP-only refresh token cookie to re-issue a new access token).
// Refresh : hydrateSession() calls POST /auth/refresh via the gateway.
//           The gateway reads the HttpOnly `maphari_refresh_token` cookie
//           automatically — no JS code ever touches the refresh token.
// ════════════════════════════════════════════════════════════════════════════

import type { Role } from "@maphari/contracts";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  clientId: string | null;
}

export interface AuthSession {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

// ── Internal ──────────────────────────────────────────────────────────────────

/** In-memory session — reset on every page load / tab close */
let memorySession: AuthSession | null = null;

// ── Legacy sessionStorage cleanup ────────────────────────────────────────────
// Removes any access token that older versions of the app wrote to
// sessionStorage. Called once on the first saveSession() / clearSession().

const SESSION_KEY = "maphari_session";

function evictLegacyStorage(): void {
  try {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // sessionStorage may be unavailable in some private-browsing configs
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Return the current in-memory session or null if not set.
 * A null result typically means the page was reloaded — call
 * hydrateSession() to restore the session via the refresh cookie.
 */
export function loadSession(): AuthSession | null {
  return memorySession;
}

/**
 * Persist a new session in memory only.
 * Also evicts any legacy sessionStorage entry written by older code.
 */
export function saveSession(session: AuthSession): void {
  memorySession = session;
  evictLegacyStorage();
}

/**
 * Clear the session from all layers (memory + any legacy storage).
 */
export function clearSession(): void {
  memorySession = null;
  evictLegacyStorage();
}

/**
 * Restore session after a page reload using the HTTP-only refresh token
 * cookie.  The gateway reads the cookie automatically; no JS ever touches
 * the raw refresh token value.
 *
 * Returns the new AuthSession on success, or null if the cookie is expired
 * / absent (user must re-login).
 */
export async function hydrateSession(): Promise<AuthSession | null> {
  // Already in memory — nothing to do
  if (memorySession) return memorySession;

  // SSR guard: cookies are not available server-side
  if (typeof window === "undefined") return null;

  try {
    const baseUrl =
      (typeof process !== "undefined" &&
        (process.env as Record<string, string | undefined>)
          .NEXT_PUBLIC_GATEWAY_BASE_URL) ??
      "http://localhost:4000/api/v1";

    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",        // ← sends the HttpOnly refresh cookie
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})        // gateway accepts empty body (uses cookie)
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      success: boolean;
      data?: {
        accessToken: string;
        expiresInSeconds: number;
        user: AuthUser;
      };
    };

    if (!json.success || !json.data) return null;

    const session: AuthSession = {
      accessToken:      json.data.accessToken,
      expiresInSeconds: json.data.expiresInSeconds,
      user:             json.data.user
    };

    saveSession(session);
    return session;
  } catch {
    return null;
  }
}
