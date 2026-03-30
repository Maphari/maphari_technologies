export interface AuthConfig {
  port: number;
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  refreshTokenSessionTtlHours: number;
  idleTimeoutHours: number;
  natsUrl: string;
  redisUrl: string;
  adminEmails: string[];
  staffEmails: string[];
  adminPassword: string;
  staffPassword: string;
  authBootstrapLogs: boolean;
}

function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function readAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  return {
    port: Number(env.PORT ?? 4001),
    accessTokenSecret: env.JWT_ACCESS_SECRET!,
    accessTokenTtlSeconds: Number(env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
    refreshTokenTtlDays: Number(env.REFRESH_TOKEN_TTL_DAYS ?? 7),
    refreshTokenSessionTtlHours: Number(env.REFRESH_TOKEN_SESSION_TTL_HOURS ?? 24),
    idleTimeoutHours: Number(env.REFRESH_IDLE_TIMEOUT_HOURS ?? 2),
    natsUrl: env.NATS_URL ?? "nats://localhost:4222",
    redisUrl: env.REDIS_URL!,
    adminEmails: parseEmailList(env.ADMIN_EMAILS),
    staffEmails: parseEmailList(env.STAFF_EMAILS),
    adminPassword: env.ADMIN_LOGIN_PASSWORD!,
    staffPassword: env.STAFF_LOGIN_PASSWORD!,
    authBootstrapLogs: env.AUTH_BOOTSTRAP_LOGS === "true"
  };
}
