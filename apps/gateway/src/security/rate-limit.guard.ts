import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createInMemoryRateLimitStore } from "@maphari/platform";
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

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = createInMemoryRateLimitStore();

  constructor(private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
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
    const key = `gateway:${isPublic ? "public" : "protected"}:${request.method}:${routePath}:${scopeId}`;
    const decision = this.store.evaluate(key, policy);

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
