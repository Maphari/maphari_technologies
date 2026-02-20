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
import { ROLES_KEY } from "./roles.decorator.js";
import { readBearerToken, verifyAccessToken } from "./jwt.js";

type HeaderValue = string | string[] | undefined;

function extractHeaderValue(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, HeaderValue>;
      scopedRequest?: ScopedRequest;
    }>();

    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];

    const authHeader = extractHeaderValue(request.headers.authorization);
    const bearerToken = readBearerToken(authHeader);
    const jwtScope = bearerToken
      ? verifyAccessToken(bearerToken, process.env.JWT_ACCESS_SECRET ?? "dev-access-secret")
      : null;

    // JWT claims are primary; manual headers remain as fallback for bootstrap/admin tooling.
    const role = jwtScope?.role ?? (extractHeaderValue(request.headers["x-user-role"]) as Role | undefined);
    const userId = jwtScope?.userId ?? extractHeaderValue(request.headers["x-user-id"]);
    const clientId = jwtScope?.clientId ?? extractHeaderValue(request.headers["x-client-id"]);

    if (!role || !userId) {
      throw new UnauthorizedException("Missing x-user-id or x-user-role header");
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      throw new ForbiddenException("Insufficient role for this route");
    }

    if (role === "CLIENT" && !clientId) {
      throw new BadRequestException("CLIENT requests must include x-client-id");
    }

    request.scopedRequest = {
      userId,
      role,
      clientId
    };

    // Normalize headers so downstream controllers can forward consistent scope.
    request.headers["x-user-id"] = userId;
    request.headers["x-user-role"] = role;
    if (clientId) {
      request.headers["x-client-id"] = clientId;
    }

    return true;
  }
}
