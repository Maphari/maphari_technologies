// ════════════════════════════════════════════════════════════════════════════
// rbac.guard.ts — JWT authentication + role-based access control guard
// Applied globally via APP_GUARD; skipped for @Public() routes.
// Also checks the Redis JTI blacklist to block revoked access tokens.
// ════════════════════════════════════════════════════════════════════════════

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role, ScopedRequest } from "@maphari/contracts";
import { IS_PUBLIC_KEY } from "./public.decorator.js";
import { ROLES_KEY }     from "./roles.decorator.js";
import { readBearerToken, verifyAccessToken } from "./jwt.js";
import { isBlacklisted } from "./redis-blacklist.js";

// ── Types ─────────────────────────────────────────────────────────────────────

type HeaderValue = string | string[] | undefined;

function extractHeaderValue(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// ── Guard ─────────────────────────────────────────────────────────────────────

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── Public routes bypass auth entirely ──────────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, HeaderValue>;
      scopedRequest?: ScopedRequest;
    }>();

    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    // ── Verify JWT ──────────────────────────────────────────────────────────
    const authHeader  = extractHeaderValue(request.headers.authorization);
    const bearerToken = readBearerToken(authHeader);
    const jwtScope    = bearerToken
      ? verifyAccessToken(bearerToken, process.env.JWT_ACCESS_SECRET ?? "dev-access-secret")
      : null;

    // ── JTI blacklist check (revoked tokens) ────────────────────────────────
    if (jwtScope?.jti) {
      const revoked = await isBlacklisted(jwtScope.jti);
      if (revoked) {
        throw new UnauthorizedException("Token has been revoked");
      }
    }

    // ── Resolve role + userId (JWT claims only) ─────────────────────────────
    // Role and userId MUST come from a verified JWT. We do not fall back to
    // raw request headers because that would allow any caller to spoof their
    // role simply by setting x-user-role without a valid token.
    const role     = jwtScope?.role;
    const userId   = jwtScope?.userId;
    const clientId = jwtScope?.clientId;

    if (!role || !userId) {
      throw new UnauthorizedException("Missing or invalid authentication");
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      throw new ForbiddenException("Insufficient role for this route");
    }

    if (role === "CLIENT" && !clientId) {
      throw new BadRequestException("CLIENT requests must include x-client-id");
    }

    // ── Attach scoped context to request ────────────────────────────────────
    request.scopedRequest = { userId, role, clientId };

    // Normalise headers so downstream controllers forward a consistent scope.
    request.headers["x-user-id"]   = userId;
    request.headers["x-user-role"] = role;
    if (clientId) request.headers["x-client-id"] = clientId;

    return true;
  }
}
