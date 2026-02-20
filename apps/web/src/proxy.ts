import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveAuthRedirect } from "./lib/auth/route-guard";
import { AUTH_ROLE_COOKIE, isRole } from "./lib/auth/routing";

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const rawRole = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
  const role = isRole(rawRole) ? rawRole : null;
  const redirectPath = resolveAuthRedirect({ pathname, search, role });
  if (redirectPath) return NextResponse.redirect(new URL(redirectPath, request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/portal/:path*", "/admin/:path*", "/staff/:path*", "/login", "/internal-login"],
};
