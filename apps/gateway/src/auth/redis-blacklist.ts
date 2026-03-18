// ════════════════════════════════════════════════════════════════════════════
// redis-blacklist.ts — Access token JTI blacklist
// Used by : RbacGuard (read) · AuthController.logout (write)
// Strategy: When a user logs out the access token's jti is written to Redis
//           with a TTL equal to the token's remaining lifetime.  The guard
//           rejects any request whose jti is in the blacklist, making the
//           short-lived access token immediately invalid after logout.
// ════════════════════════════════════════════════════════════════════════════

import { RedisCache } from "@maphari/platform";

// ── Singleton ─────────────────────────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const _cache   = new RedisCache(redisUrl, console);

const PREFIX      = "blacklist:";
const MIN_TTL_SEC = 10; // never write a key with ≤ 0 TTL

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Blacklist a JWT by its `jti` claim.
 * `expiresAtEpochSeconds` is the JWT `exp` value (seconds since Unix epoch).
 * The Redis key TTL is capped to the remaining token lifetime so it
 * self-cleans the moment the token would have expired anyway.
 */
export async function blacklistJti(
  jti: string,
  expiresAtEpochSeconds: number
): Promise<void> {
  const remaining = expiresAtEpochSeconds - Math.floor(Date.now() / 1000);
  const ttl       = Math.max(MIN_TTL_SEC, remaining);
  await _cache.setJson(`${PREFIX}${jti}`, 1, ttl);
}

/**
 * Returns true if the given `jti` has been blacklisted (i.e. revoked).
 */
export async function isBlacklisted(jti: string): Promise<boolean> {
  const val = await _cache.getJson<number>(`${PREFIX}${jti}`);
  return val !== null;
}
