import type { Role } from "@maphari/contracts";

export const REFRESH_TOKEN_COOKIE = "maphari_refresh_token";
export const ROLE_COOKIE = "maphari.auth.role";
export const REMEMBER_ME_COOKIE = "maphari.auth.remember";

function readNodeEnv(env: NodeJS.ProcessEnv): string {
  return env.NODE_ENV ?? "development";
}

function isSecureCookieEnv(env: NodeJS.ProcessEnv): boolean {
  return readNodeEnv(env) === "production";
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAgeSeconds?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
  }
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${options.path ?? "/"}`);
  segments.push(`SameSite=${options.sameSite ?? "Lax"}`);
  if (typeof options.maxAgeSeconds === "number") {
    segments.push(`Max-Age=${options.maxAgeSeconds}`);
  }
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");
  return segments.join("; ");
}

export function setAuthCookies(
  reply: { header: (name: string, value: unknown) => unknown },
  input: { refreshToken: string; role: Role; rememberMe?: boolean },
  env: NodeJS.ProcessEnv = process.env
): void {
  const secure = isSecureCookieEnv(env);
  const rememberMe = input.rememberMe ?? true;
  const refreshTtlDays = Number(env.REFRESH_TOKEN_TTL_DAYS ?? 7);
  const refreshMaxAge = Number.isFinite(refreshTtlDays) ? Math.max(1, Math.trunc(refreshTtlDays)) * 24 * 60 * 60 : 7 * 24 * 60 * 60;

  reply.header("set-cookie", [
    serializeCookie(REFRESH_TOKEN_COOKIE, input.refreshToken, {
      maxAgeSeconds: rememberMe ? refreshMaxAge : undefined,
      httpOnly: true,
      secure,
      sameSite: "Strict",
      path: "/"
    }),
    serializeCookie(ROLE_COOKIE, input.role, {
      maxAgeSeconds: rememberMe ? refreshMaxAge : undefined,
      httpOnly: false,
      secure,
      sameSite: "Strict",
      path: "/"
    }),
    serializeCookie(REMEMBER_ME_COOKIE, rememberMe ? "1" : "0", {
      maxAgeSeconds: rememberMe ? refreshMaxAge : undefined,
      httpOnly: false,
      secure,
      sameSite: "Strict",
      path: "/"
    })
  ]);
}

export function clearAuthCookies(
  reply: { header: (name: string, value: unknown) => unknown },
  env: NodeJS.ProcessEnv = process.env
): void {
  const secure = isSecureCookieEnv(env);
  reply.header("set-cookie", [
    serializeCookie(REFRESH_TOKEN_COOKIE, "", {
      maxAgeSeconds: 0,
      httpOnly: true,
      secure,
      sameSite: "Strict",
      path: "/"
    }),
    serializeCookie(ROLE_COOKIE, "", {
      maxAgeSeconds: 0,
      httpOnly: false,
      secure,
      sameSite: "Strict",
      path: "/"
    }),
    serializeCookie(REMEMBER_ME_COOKIE, "", {
      maxAgeSeconds: 0,
      httpOnly: false,
      secure,
      sameSite: "Strict",
      path: "/"
    })
  ]);
}

export function readCookie(headerValue: string | undefined, key: string): string | null {
  if (!headerValue) return null;
  const pairs = headerValue.split(";").map((item) => item.trim());
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.split("=");
    if (name !== key) continue;
    return decodeURIComponent(valueParts.join("="));
  }
  return null;
}
