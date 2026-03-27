import type { Role } from "@maphari/contracts";
import { isAdminPath, isClientPath, isPortalPath, isStaffPath, roleHomePath, sanitizeNextPath } from "./routing";

interface ResolveAuthRedirectInput {
  pathname: string;
  search: string;
  role: Role | null;
}

// Login/register pages nested inside protected directories — must be treated as public.
const NESTED_LOGIN_PATHS = [
  "/admin/login",
  "/staff/login",
  "/client/login",
  "/internal/login",
  "/internal/register"
];

export function resolveAuthRedirect(input: ResolveAuthRedirectInput): string | null {
  const { pathname, search, role } = input;
  const authenticated = Boolean(role);

  // Allow the dedicated login pages even though they live under /admin/ or /staff/
  if (NESTED_LOGIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    // The role cookie alone is not enough to prove the user still has a valid
    // in-memory session, so let the dedicated login pages render and perform
    // the real auth handshake client-side.
    return null;
  }

  if (isClientPath(pathname) || isPortalPath(pathname) || isStaffPath(pathname) || isAdminPath(pathname)) {
    if (!authenticated) {
      const loginParams = new URLSearchParams();
      const nextPath = `${pathname}${search}`;
      loginParams.set("next", nextPath);
      if (isStaffPath(pathname) || isAdminPath(pathname)) {
        return `/internal/login?${loginParams.toString()}`;
      }
      return `/client/login?${loginParams.toString()}`;
    }

    if (isAdminPath(pathname)) {
      if (role === "CLIENT") return "/client";
      if (role === "STAFF") return "/staff";
    }

    if (isStaffPath(pathname)) {
      if (role === "CLIENT") return "/client";
      if (role === "ADMIN") return "/admin";
    }

    if (isClientPath(pathname) || isPortalPath(pathname)) {
      if (role === "STAFF") return "/staff";
      if (role === "ADMIN") return "/admin";
      if (isPortalPath(pathname) && role === "CLIENT") return "/client";
    }
  }

  if ((pathname === "/login" || pathname === "/client/login" || pathname === "/internal/login" || pathname === "/internal-login") && role) {
    const query = new URLSearchParams(search);
    const nextPath = sanitizeNextPath(query.get("next"));
    if (nextPath) {
      // Avoid redirect loops when role cookie is present but session is stale.
      // Let the login page perform the real session handshake.
      return null;
    }
    return roleHomePath(role);
  }

  return null;
}
