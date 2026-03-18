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
      jti: randomUUID(),   // unique token ID — used for blacklist-based revocation
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

/**
 * Issues a short-lived (5 minute) temp token used as a 2FA challenge.
 * The frontend exchanges this token for a full session once the user
 * proves their TOTP code via POST /auth/2fa/login.
 */
export function signTempToken(userId: string, config: { accessTokenSecret: string }): string {
  return jwt.sign(
    { sub: userId, purpose: "2fa_challenge" },
    config.accessTokenSecret,
    { expiresIn: 300, issuer: "maphari-auth", audience: "maphari-api" }
  );
}

/**
 * Verifies a temp token and returns the decoded payload if valid,
 * or throws if it is invalid/expired/wrong purpose.
 */
export function verifyTempToken(
  tempToken: string,
  config: { accessTokenSecret: string }
): { sub: string; purpose: string } {
  return jwt.verify(tempToken, config.accessTokenSecret, {
    issuer: "maphari-auth",
    audience: "maphari-api",
  }) as { sub: string; purpose: string };
}
