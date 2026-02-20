import type { Role } from "@maphari/contracts";
import type { FastifyRequest } from "fastify";

export interface ScopeHeaders {
  role: Role;
  userId?: string;
  clientId?: string;
  requestId?: string;
}

export function readScopeHeaders(request: FastifyRequest): ScopeHeaders {
  return {
    userId: request.headers["x-user-id"] as string | undefined,
    role: ((request.headers["x-user-role"] as Role | undefined) ?? "CLIENT") as Role,
    clientId: request.headers["x-client-id"] as string | undefined,
    requestId: request.headers["x-request-id"] as string | undefined
  };
}

export function resolveClientFilter(role: Role, scopedClientId?: string, inputClientId?: string): string | undefined {
  if (role === "CLIENT") {
    return scopedClientId;
  }

  return inputClientId;
}
