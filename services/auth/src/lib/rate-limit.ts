// rate-limit.ts — Redis-backed rate limiting for login and TOTP attempts
// Replaces in-memory Maps that were per-instance and reset on restart.

import { RedisCache } from "@maphari/platform";

const LOGIN_MAX = 5;
const LOGIN_WINDOW_S = 60 * 15; // 15 minutes
const TOTP_MAX = 5;
const TOTP_WINDOW_S = 60 * 5; // 5 minutes

interface AttemptBucket {
  count: number;
  resetAt: number;
}

function loginKey(email: string, ip: string): string {
  return `rl:login:${email}:${ip}`;
}

function totpKey(userId: string): string {
  return `rl:totp:${userId}`;
}

export async function checkLoginRateLimit(
  redis: RedisCache,
  email: string,
  ip: string
): Promise<{ allowed: boolean; resetAt: number }> {
  const key = loginKey(email, ip);
  const now = Date.now();
  const raw = await redis.getJson<AttemptBucket>(key);
  if (!raw || raw.resetAt <= now) {
    return { allowed: true, resetAt: now + LOGIN_WINDOW_S * 1000 };
  }
  if (raw.count >= LOGIN_MAX) {
    return { allowed: false, resetAt: raw.resetAt };
  }
  return { allowed: true, resetAt: raw.resetAt };
}

export async function recordLoginFailure(
  redis: RedisCache,
  email: string,
  ip: string
): Promise<void> {
  const key = loginKey(email, ip);
  const raw = await redis.getJson<AttemptBucket>(key);
  const now = Date.now();
  if (!raw || raw.resetAt <= now) {
    await redis.setJson<AttemptBucket>(key, { count: 1, resetAt: now + LOGIN_WINDOW_S * 1000 }, LOGIN_WINDOW_S);
  } else {
    await redis.setJson<AttemptBucket>(key, { count: raw.count + 1, resetAt: raw.resetAt }, LOGIN_WINDOW_S);
  }
}

export async function resetLoginRateLimit(
  redis: RedisCache,
  email: string,
  ip: string
): Promise<void> {
  await redis.delete(loginKey(email, ip));
}

export async function checkTotpRateLimit(
  redis: RedisCache,
  userId: string
): Promise<{ allowed: boolean; resetAt: number }> {
  const key = totpKey(userId);
  const now = Date.now();
  const raw = await redis.getJson<AttemptBucket>(key);
  if (!raw || raw.resetAt <= now) {
    // First attempt or window expired — record count: 1 and allow
    const resetAt = now + TOTP_WINDOW_S * 1000;
    await redis.setJson<AttemptBucket>(key, { count: 1, resetAt }, TOTP_WINDOW_S);
    return { allowed: true, resetAt };
  }
  if (raw.count >= TOTP_MAX) {
    return { allowed: false, resetAt: raw.resetAt };
  }
  await redis.setJson<AttemptBucket>(key, { count: raw.count + 1, resetAt: raw.resetAt }, TOTP_WINDOW_S);
  return { allowed: true, resetAt: raw.resetAt };
}

export async function resetTotpRateLimit(
  redis: RedisCache,
  userId: string
): Promise<void> {
  await redis.delete(totpKey(userId));
}
