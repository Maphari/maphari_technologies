export interface CorsPolicy {
  credentials: boolean;
  methods: string[];
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
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      // ── Missing Origin header ──────────────────────────────────────────────
      // In production environments, every browser request carries an Origin.
      // We only allow origin-less requests for internal monitoring paths;
      // all other origin-less requests are rejected to prevent CSRF via
      // non-browser clients (e.g. curl, Postman) from inheriting CORS trust.
      if (!origin) {
        // The CORS middleware doesn't have access to the request path directly,
        // so we allow all no-origin requests in local dev (where server-to-
        // server calls are common) and block them in production.
        if (isLocalEnv) {
          callback(null, true);
        } else {
          callback(null, false);
        }
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
