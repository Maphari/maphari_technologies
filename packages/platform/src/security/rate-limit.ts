interface RateLimitRequest {
  method: string;
  url: string;
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}

interface RateLimitReply {
  header: (key: string, value: string) => unknown;
  status: (statusCode: number) => RateLimitReply;
  send: (payload: unknown) => unknown;
}

interface HookableApp {
  addHook: (
    name: "onRequest",
    hook: (request: RateLimitRequest, reply: RateLimitReply) => Promise<unknown> | unknown
  ) => void;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

export interface RateLimitStore {
  evaluate: (bucketKey: string, policy: RateLimitPolicy) => RateLimitDecision;
}

export interface ServiceRateLimitOptions {
  service: string;
  publicPolicy: RateLimitPolicy;
  protectedPolicy: RateLimitPolicy;
  isPublicRoute: (url: string, method: string) => boolean;
}

function nowMs(): number {
  return Date.now();
}

/**
 * Lightweight in-memory token bucket store for local/dev and single-instance use.
 */
export function createInMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    evaluate(bucketKey, policy) {
      const now = nowMs();
      const current = buckets.get(bucketKey);
      if (!current || current.resetAt <= now) {
        const resetAt = now + policy.windowMs;
        buckets.set(bucketKey, { count: 1, resetAt });
        return {
          allowed: true,
          remaining: Math.max(policy.limit - 1, 0),
          resetAt,
          limit: policy.limit
        };
      }

      if (current.count >= policy.limit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: current.resetAt,
          limit: policy.limit
        };
      }

      current.count += 1;
      return {
        allowed: true,
        remaining: Math.max(policy.limit - current.count, 0),
        resetAt: current.resetAt,
        limit: policy.limit
      };
    }
  };
}

/**
 * Applies a simple service-level limiter; public and scoped routes can use
 * different limits while sharing a common implementation.
 */
export function registerServiceRateLimit(
  app: HookableApp,
  options: ServiceRateLimitOptions,
  store: RateLimitStore = createInMemoryRateLimitStore()
): void {
  app.addHook("onRequest", async (request: RateLimitRequest, reply: RateLimitReply) => {
    const routeUrl = request.url.split("?")[0] ?? request.url;
    const policy = options.isPublicRoute(routeUrl, request.method) ? options.publicPolicy : options.protectedPolicy;
    const scopeKey = (request.headers["x-client-id"] as string | undefined) ?? request.ip;
    const bucketKey = `${options.service}:${request.method}:${routeUrl}:${scopeKey}`;
    const decision = store.evaluate(bucketKey, policy);

    reply.header("x-ratelimit-limit", String(decision.limit));
    reply.header("x-ratelimit-remaining", String(decision.remaining));
    reply.header("x-ratelimit-reset", String(Math.ceil(decision.resetAt / 1000)));

    if (!decision.allowed) {
      reply.status(429);
      return reply.send({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please retry later."
        }
      });
    }
  });
}
