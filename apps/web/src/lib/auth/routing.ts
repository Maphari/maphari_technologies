import type { Role } from "@maphari/contracts";

export const AUTH_ROLE_COOKIE = "maphari.auth.role";

const PROTECTED_PREFIXES = ["/client", "/portal", "/staff", "/admin"] as const;

export function isRole(value: string | null | undefined): value is Role {
  return value === "CLIENT" || value === "STAFF" || value === "ADMIN";
}

export function roleHomePath(role: Role): "/client" | "/staff" | "/admin" {
  if (role === "CLIENT") return "/client";
  if (role === "STAFF") return "/staff";
  return "/admin";
}

export function isClientPath(pathname: string): boolean {
  return pathname === "/client" || pathname.startsWith("/client/");
}

export function isPortalPath(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

export function isStaffPath(pathname: string): boolean {
  return pathname === "/staff" || pathname.startsWith("/staff/");
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Validates post-login redirect targets so only known internal protected
 * routes are allowed; this prevents open redirect behavior.
 */
export function sanitizeNextPath(nextPath: string | null | undefined): string | null {
  if (!nextPath) return null;
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return null;
  if (isClientPath(nextPath) || isPortalPath(nextPath) || isStaffPath(nextPath) || isAdminPath(nextPath)) return nextPath;
  return null;
}
