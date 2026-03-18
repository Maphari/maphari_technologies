// ════════════════════════════════════════════════════════════════════════════
// realtime-token.service.ts — Issues short-lived one-time SSE stream tokens
// ════════════════════════════════════════════════════════════════════════════
import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StreamTokenEntry {
  userId: string;
  role: string;
  clientId: string | null;
  expiresAt: number;
}

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable()
export class RealtimeTokenService {
  // In-memory store — tokens are one-time use with 30s TTL; memory footprint minimal
  private readonly tokens = new Map<string, StreamTokenEntry>();
  private readonly TTL_MS = 30_000;

  issue(userId: string, role: string, clientId: string | null): string {
    const token = randomBytes(32).toString("hex");
    this.tokens.set(token, {
      userId,
      role,
      clientId,
      expiresAt: Date.now() + this.TTL_MS,
    });
    // Lazy-cleanup expired tokens on each issue
    this.gc();
    return token;
  }

  /** Validates and immediately deletes the token (one-time use). */
  consume(token: string): StreamTokenEntry | null {
    const entry = this.tokens.get(token);
    if (!entry) return null;
    this.tokens.delete(token);
    if (Date.now() > entry.expiresAt) return null;
    return entry;
  }

  private gc(): void {
    const now = Date.now();
    for (const [key, entry] of this.tokens) {
      if (now > entry.expiresAt) this.tokens.delete(key);
    }
  }
}
