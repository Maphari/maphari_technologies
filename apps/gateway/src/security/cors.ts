export interface CorsPolicy {
  credentials: boolean;
  origin: (origin: string | undefined, callback: (error: Error | null, allowed: boolean) => void) => void;
}

function normalizeOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

/**
 * In local development we allow localhost tooling origins; non-local envs
 * require explicit allow-list configuration.
 */
export function createCorsPolicy(env: NodeJS.ProcessEnv = process.env): CorsPolicy {
  const nodeEnv = env.NODE_ENV ?? "development";
  const isLocalEnv = nodeEnv === "development" || nodeEnv === "test" || env.APP_ENV === "local";
  const allowList = normalizeOrigins(env.CORS_ALLOWED_ORIGINS);

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowList.includes(origin)) {
        callback(null, true);
        return;
      }

      if (isLocalEnv && isLocalOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  };
}
