import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";

export interface AccessTokenUser {
  id: string;
  email: string;
  role: string;
  clientId: string | null;
}

export function signAccessToken(
  user: AccessTokenUser,
  config: { accessTokenSecret: string; accessTokenTtlSeconds: number }
): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId
    },
    config.accessTokenSecret,
    {
      expiresIn: config.accessTokenTtlSeconds,
      issuer: "maphari-auth",
      audience: "maphari-api"
    }
  );
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildRefreshToken(refreshTokenTtlDays: number): { token: string; tokenHash: string; expiresAt: Date } {
  const token = `refresh-${randomUUID()}`;
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function buildRefreshTokenWithHours(refreshTokenTtlHours: number): { token: string; tokenHash: string; expiresAt: Date } {
  const token = `refresh-${randomUUID()}`;
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + refreshTokenTtlHours * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}
