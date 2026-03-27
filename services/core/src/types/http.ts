import type { Role } from "@maphari/contracts";

export interface ScopeHeaders {
  role: Role;
  userId?: string;
  clientId?: string;
  email?: string;
  requestId?: string;
}
