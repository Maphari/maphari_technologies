import type { Role } from "@maphari/contracts";

export function hasRequiredRole(role: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(role);
}
