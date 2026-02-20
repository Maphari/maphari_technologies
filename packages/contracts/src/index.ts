export type Role = "ADMIN" | "STAFF" | "CLIENT";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: ApiError;
}

export interface ScopedRequest {
  userId: string;
  role: Role;
  clientId?: string;
}

export * from "./schemas.js";
