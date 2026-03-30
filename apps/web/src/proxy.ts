// ════════════════════════════════════════════════════════════════════════════
// proxy.ts — Next.js 16 edge proxy (replaces middleware.ts convention)
//
// Responsibilities:
//   1. Detect subdomain → set x-app-type header
//   2. Block cross-subdomain route access
//   3. Enforce auth redirects (unauthenticated → login, wrong-role → home)
//
// Subdomain mapping:
//   client.mapharitechnologies.com → x-app-type: client
//   staff.mapharitechnologies.com  → x-app-type: staff
//   admin.mapharitechnologies.com  → x-app-type: admin
//   mapharitechnologies.com        → x-app-type: public
//
// Local dev override: NEXT_PUBLIC_APP_TYPE env var
//   values: 'client' | 'staff' | 'admin' | 'public' | 'both'
//   'both' shows staff + admin tabs simultaneously (development convenience)
// ════════════════════════════════════════════════════════════════════════════

import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveAuthRedirect } from "./lib/auth/route-guard";
import { AUTH_ROLE_COOKIE, isRole } from "./lib/auth/routing";

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev
    ? `'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* https://*.livekit.cloud wss://*.livekit.cloud https://cloud.livekit.io`
    : `'self' https://*.livekit.cloud wss://*.livekit.cloud https://cloud.livekit.io`;
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://sandbox.payfast.co.za https://www.payfast.co.za",
  ].join("; ");
}

export type AppType = "client" | "staff" | "admin" | "public" | "both";

function detectAppType(host: string): AppType {
  const envOverride = process.env.NEXT_PUBLIC_APP_TYPE as AppType | undefined;
  if (
    envOverride === "client" ||
    envOverride === "staff" ||
    envOverride === "admin" ||
    envOverride === "public" ||
    envOverride === "both"
  ) {
    return envOverride;
  }
  if (host.startsWith("client.")) return "client";
  if (host.startsWith("staff.")) return "staff";
  if (host.startsWith("admin.")) return "admin";
  return "public";
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = randomBytes(16).toString("base64");
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;
  const appType = detectAppType(host);

  // ── Cross-subdomain route blocking ──────────────────────────────────────
  // client subdomain: only /client and /portal routes allowed
  if (appType === "client") {
    if (pathname === "/staff" || pathname.startsWith("/staff/")) {
      return NextResponse.redirect(new URL("/client", request.url));
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return NextResponse.redirect(new URL("/client", request.url));
    }
    if (pathname === "/internal" || pathname.startsWith("/internal/")) {
      return NextResponse.redirect(new URL("/client", request.url));
    }
  }

  // staff subdomain: only /staff routes allowed (not /admin, not /client)
  if (appType === "staff") {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
    if (pathname === "/client" || pathname.startsWith("/client/")) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
  }

  // admin subdomain: only /admin routes allowed (not /staff, not /client)
  if (appType === "admin") {
    if (pathname === "/staff" || pathname.startsWith("/staff/")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (pathname === "/client" || pathname.startsWith("/client/")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // ── Redirect /internal-login → /internal/login ───────────────────────────
  if (pathname === "/internal-login") {
    return NextResponse.redirect(new URL(`/internal/login${search}`, request.url));
  }

  // ── Redirect /internal/login to subdomain-specific page on staff/admin subdomains ──
  // On root domain / local dev, keep the combined two-tab page.
  if (pathname === "/internal/login" || pathname.startsWith("/internal/login/")) {
    if (appType === "admin") {
      return NextResponse.redirect(new URL(`/admin/login${search}`, request.url));
    }
    if (appType === "staff") {
      return NextResponse.redirect(new URL(`/staff/login${search}`, request.url));
    }
  }

  // ── Auth redirect logic ──────────────────────────────────────────────────
  const rawRole = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
  const role = isRole(rawRole) ? rawRole : null;
  const redirectPath = resolveAuthRedirect({ pathname, search, role });
  if (redirectPath) return NextResponse.redirect(new URL(redirectPath, request.url));

  // ── Forward x-app-type + nonce headers to page/layout server components ──
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-app-type", appType);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy-Report-Only", buildCsp(nonce));
  return response;
}

export const config = {
  matcher: [
    "/client/:path*",
    "/portal/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/login",
    "/internal/:path*",
    "/internal-login"
  ]
};
