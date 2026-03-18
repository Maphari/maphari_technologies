// ════════════════════════════════════════════════════════════════════════════
// realtime.controller.ts — GET /events/stream (SSE)
// Requires a short-lived stream token from POST /events/stream-token.
// ════════════════════════════════════════════════════════════════════════════
import {
  Controller,
  MessageEvent,
  Query,
  Sse,
  UnauthorizedException
} from "@nestjs/common";
import { Observable, defer, filter, finalize, interval, map, merge, of } from "rxjs";
import type { Role } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { RealtimeEventsService } from "./realtime-events.service.js";
import { MetricsService } from "../observability/metrics.service.js";
import { RealtimeTokenService } from "./realtime-token.service.js";

@Controller()
export class RealtimeController {
  constructor(
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly metricsService: MetricsService,
    private readonly realtimeTokenService: RealtimeTokenService
  ) {}

  @Public()
  @Sse("events/stream")
  stream(@Query("token") streamToken?: string): Observable<MessageEvent> {
    if (!streamToken) {
      throw new UnauthorizedException("Stream token is required. Obtain one from POST /events/stream-token.");
    }

    // Consume (one-time use) — validates + deletes immediately
    const entry = this.realtimeTokenService.consume(streamToken);
    if (!entry) {
      throw new UnauthorizedException("Stream token is invalid or expired.");
    }

    const role = entry.role as Role;
    const scopedClientId = entry.clientId;

    const ready$ = of({
      type: "ready",
      data: { role, clientId: scopedClientId, ts: new Date().toISOString() }
    } satisfies MessageEvent);

    const refresh$ = this.realtimeEvents.events$.pipe(
      map((event) => {
        const allowed =
          role === "ADMIN" || role === "STAFF"
            ? true
            : scopedClientId
            ? event.clientId === scopedClientId
            : false;
        if (!allowed) this.metricsService.incRealtimeEventFiltered(event.topic, role);
        return { event, allowed };
      }),
      filter(({ allowed }) => allowed),
      map(({ event }) => {
        this.metricsService.incRealtimeEventDelivered(event.topic, role);
        return {
          type: "refresh",
          data: {
            role,
            clientId: scopedClientId,
            ts: event.occurredAt,
            topic: event.topic,
            eventId: event.eventId,
          },
        } satisfies MessageEvent;
      })
    );

    const heartbeat$ = interval(25000).pipe(
      map(() => ({
        type: "heartbeat",
        data: { role, clientId: scopedClientId, ts: new Date().toISOString() },
      } satisfies MessageEvent))
    );

    return defer(() => {
      this.metricsService.openRealtimeConnection(role);
      return merge(ready$, refresh$, heartbeat$).pipe(
        finalize(() => this.metricsService.closeRealtimeConnection(role))
      );
    });
  }
}
