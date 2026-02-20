import type { Role } from "@maphari/contracts";
import { isAdminPath, isClientPath, isPortalPath, isStaffPath, roleHomePath, sanitizeNextPath } from "./routing";

interface ResolveAuthRedirectInput {
  pathname: string;
  search: string;
  role: Role | null;
}

export function resolveAuthRedirect(input: ResolveAuthRedirectInput): string | null {
  const { pathname, search, role } = input;
  const authenticated = Boolean(role);

  if (isClientPath(pathname) || isPortalPath(pathname) || isStaffPath(pathname) || isAdminPath(pathname)) {
    if (!authenticated) {
      const loginParams = new URLSearchParams();
      const nextPath = `${pathname}${search}`;
      loginParams.set("next", nextPath);
      if (isStaffPath(pathname) || isAdminPath(pathname)) {
        return `/internal-login?${loginParams.toString()}`;
      }
      return `/login?${loginParams.toString()}`;
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

  if ((pathname === "/login" || pathname === "/internal-login") && role) {
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
