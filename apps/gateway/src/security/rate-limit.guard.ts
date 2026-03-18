import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createInMemoryRateLimitStore, RedisCache } from "@maphari/platform";
import type { RateLimitStore, RateLimitPolicy } from "@maphari/platform";
import { IS_PUBLIC_KEY } from "../auth/public.decorator.js";

interface Policy {
  limit: number;
  windowMs: number;
}

function readPolicy(env: NodeJS.ProcessEnv, prefix: "PUBLIC" | "PROTECTED"): Policy {
  const defaultLimit = prefix === "PUBLIC" ? 120 : 240;
  const defaultWindow = 60_000;

  const limit = Number(env[`GATEWAY_RATE_LIMIT_${prefix}_MAX`] ?? defaultLimit);
  const windowMs = Number(env[`GATEWAY_RATE_LIMIT_${prefix}_WINDOW_MS`] ?? defaultWindow);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : defaultLimit,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : defaultWindow
  };
}

// ── Redis-backed store ────────────────────────────────────────────────────────
// Uses a fixed-window counter stored as JSON in Redis.
// Key pattern: gateway:rl:{scope}:{method}:{route}:{userId_or_ip}
// On first increment within a window, TTL is set to windowMs/1000 seconds.
// Falls through to null on any Redis error, triggering in-memory fallback.

interface RedisBucket {
  count: number;
  resetAt: number;
}

function createRedisRateLimitStore(cache: RedisCache): RateLimitStore {
  return {
    evaluate(bucketKey: string, policy: RateLimitPolicy) {
      // Return a synchronous-looking object; NestJS guards support async via Promise
      // but RateLimitStore.evaluate must be sync per the platform interface.
      // We return a "pending" decision and rely on the async wrapper in the guard.
      // To bridge sync interface → async Redis, we embed a thenable trick:
      // Actually the guard below calls evaluateAsync instead; this sync path is
      // kept as a no-op satisfier of the interface and should not be invoked.
      void bucketKey; void policy;
      return { allowed: true, remaining: 0, resetAt: Date.now(), limit: 0 };
    },

    // Extension used by RateLimitGuard below
    async evaluateAsync(bucketKey: string, policy: RateLimitPolicy) {
      try {
        const now = Date.now();
        const ttlSeconds = Math.ceil(policy.windowMs / 1000);
        const existing = await cache.getJson<RedisBucket>(bucketKey);

        if (!existing || existing.resetAt <= now) {
          // Start a new window
          const resetAt = now + policy.windowMs;
          await cache.setJson<RedisBucket>(bucketKey, { count: 1, resetAt }, ttlSeconds);
          return {
            allowed: true,
            remaining: Math.max(policy.limit - 1, 0),
            resetAt,
            limit: policy.limit,
          };
        }

        if (existing.count >= policy.limit) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: existing.resetAt,
            limit: policy.limit,
          };
        }

        const newCount = existing.count + 1;
        // Preserve remaining TTL: recalculate seconds from resetAt
        const remainingTtl = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        await cache.setJson<RedisBucket>(bucketKey, { count: newCount, resetAt: existing.resetAt }, remainingTtl);
        return {
          allowed: true,
          remaining: Math.max(policy.limit - newCount, 0),
          resetAt: existing.resetAt,
          limit: policy.limit,
        };
      } catch {
        // Redis unavailable — fail open (allow) and let in-memory take over next time
        return null;
      }
    },
  } as RateLimitStore & { evaluateAsync: (key: string, policy: RateLimitPolicy) => Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number } | null> };
}

// ── Guard ─────────────────────────────────────────────────────────────────────

type RedisStore = RateLimitStore & {
  evaluateAsync: (key: string, policy: RateLimitPolicy) => Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number } | null>;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly memoryStore = createInMemoryRateLimitStore();
  private readonly redisStore: RedisStore | null;

  constructor(private readonly reflector: Reflector = new Reflector()) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const cache = new RedisCache(redisUrl, console);
      this.redisStore = createRedisRateLimitStore(cache) as RedisStore;
    } else {
      this.redisStore = null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const request = context.switchToHttp().getRequest<{
      method: string;
      ip: string;
      url: string;
      headers: Record<string, string | string[] | undefined>;
      route?: { path?: string };
    }>();
    const reply = context.switchToHttp().getResponse<{
      header: (key: string, value: string) => void;
    }>();

    const policy = readPolicy(process.env, isPublic ? "PUBLIC" : "PROTECTED");
    const routePath = request.route?.path ?? request.url.split("?")[0] ?? request.url;
    const scopeId = this.readHeader(request.headers, "x-user-id") ?? request.ip;
    const scope = isPublic ? "public" : "protected";
    const key = `gateway:rl:${scope}:${request.method}:${routePath}:${scopeId}`;

    let decision: { allowed: boolean; remaining: number; resetAt: number; limit: number } | null = null;

    // Try Redis first if configured
    if (this.redisStore) {
      decision = await this.redisStore.evaluateAsync(key, policy);
    }

    // Fall back to in-memory if Redis is unavailable or not configured
    if (decision === null) {
      decision = this.memoryStore.evaluate(key, policy);
    }

    reply.header("x-ratelimit-limit", String(decision.limit));
    reply.header("x-ratelimit-remaining", String(decision.remaining));
    reply.header("x-ratelimit-reset", String(Math.ceil(decision.resetAt / 1000)));

    if (!decision.allowed) {
      throw new HttpException("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string
  ): string | undefined {
    const value = headers[key];
    return Array.isArray(value) ? value[0] : value;
  }
}
