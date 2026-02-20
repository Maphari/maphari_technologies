import type { Role } from "@maphari/contracts";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  clientId: string | null;
}

export interface AuthSession {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

let memorySession: AuthSession | null = null;

export function loadSession(): AuthSession | null {
  return memorySession;
}

export function saveSession(session: AuthSession): void {
  memorySession = session;
}

export function clearSession(): void {
  memorySession = null;
}
