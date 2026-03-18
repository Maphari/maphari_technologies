// ════════════════════════════════════════════════════════════════════════════
// stream-token.controller.ts — POST /events/stream-token
// Issues a 30-second one-time SSE token. Requires valid JWT in Authorization.
// ════════════════════════════════════════════════════════════════════════════
import { Controller, Post, UnauthorizedException, Req } from "@nestjs/common";
import { RealtimeTokenService } from "./realtime-token.service.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller("events")
export class StreamTokenController {
  constructor(private readonly realtimeTokenService: RealtimeTokenService) {}

  @Post("stream-token")
  @Roles("ADMIN", "STAFF", "CLIENT")
  issueStreamToken(@Req() req: { user?: { sub?: string; role?: string; clientId?: string | null } }): { token: string; expiresInMs: number } {
    const user = req.user;
    if (!user?.sub || !user?.role) {
      throw new UnauthorizedException("Valid authentication required.");
    }
    const token = this.realtimeTokenService.issue(
      user.sub,
      user.role,
      user.clientId ?? null
    );
    return { token, expiresInMs: 30_000 };
  }
}
