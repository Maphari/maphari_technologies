import type { Role } from "@maphari/contracts";
import type { FastifyRequest } from "fastify";
import type { ScopeHeaders } from "../types/http.js";

/**
 * Normalizes common scope headers once per request so handlers can
 * consistently enforce RBAC/tenant rules.
 */
export function readScopeHeaders(request: FastifyRequest): ScopeHeaders {
  return {
    userId: request.headers["x-user-id"] as string | undefined,
    role: ((request.headers["x-user-role"] as Role | undefined) ?? "CLIENT") as Role,
    clientId: request.headers["x-client-id"] as string | undefined,
    email: request.headers["x-user-email"] as string | undefined,
    requestId: request.headers["x-request-id"] as string | undefined
  };
}

/**
 * Returns the effective client scope. CLIENT users are forced to their scoped
 * tenant; STAFF/ADMIN can query all tenants unless an explicit clientId filter
 * is provided.
 */
export function resolveClientFilter(role: Role, scopedClientId?: string, inputClientId?: string): string | undefined {
  if (role === "CLIENT") {
    return scopedClientId;
  }

  return inputClientId;
}
