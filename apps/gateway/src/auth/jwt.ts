import jwt from "jsonwebtoken";
import type { Role } from "@maphari/contracts";

export interface JwtScope {
  /** User ID (JWT `sub` claim) */
  userId: string;
  role: Role;
  clientId?: string;
  /** JWT ID — unique per-token, used for blacklist-based revocation */
  jti?: string;
}

export function readBearerToken(authHeader?: string): string | undefined {
  if (!authHeader) return undefined;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function verifyAccessToken(token: string, secret: string): JwtScope | null {
  try {
    const payload = jwt.verify(token, secret, {
      issuer: "maphari-auth",
      audience: "maphari-api"
    }) as {
      sub?: string;
      role?: Role;
      clientId?: string | null;
      jti?: string;
    };

    if (!payload.sub || !payload.role) {
      return null;
    }

    return {
      userId:   payload.sub,
      role:     payload.role,
      clientId: payload.clientId ?? undefined,
      jti:      payload.jti      ?? undefined
    };
  } catch {
    return null;
  }
}
