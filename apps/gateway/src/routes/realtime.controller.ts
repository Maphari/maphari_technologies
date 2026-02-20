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
import { verifyAccessToken } from "../auth/jwt.js";
import { RealtimeEventsService } from "./realtime-events.service.js";
import { MetricsService } from "../observability/metrics.service.js";

@Controller()
export class RealtimeController {
  constructor(
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly metricsService: MetricsService
  ) {}

  @Public()
  @Sse("events/stream")
  stream(@Query("accessToken") accessToken?: string): Observable<MessageEvent> {
    if (!accessToken) {
      throw new UnauthorizedException("Access token is required for realtime stream.");
    }
    const scope = verifyAccessToken(accessToken, process.env.JWT_SECRET ?? "dev-secret");
    if (!scope) {
      throw new UnauthorizedException("Invalid realtime access token.");
    }

    const role = scope.role as Role;
    const scopedClientId = scope.clientId ?? null;

    const ready$ = of({
      type: "ready",
      data: {
        role,
        clientId: scopedClientId,
        ts: new Date().toISOString()
      }
    } satisfies MessageEvent);

    const refresh$ = this.realtimeEvents.events$.pipe(
      map((event) => {
        const allowed =
          role === "ADMIN" || role === "STAFF"
            ? true
            : scopedClientId
            ? event.clientId === scopedClientId
            : false;
        if (!allowed) {
          this.metricsService.incRealtimeEventFiltered(event.topic, role);
        }
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
          eventId: event.eventId
        }
      } satisfies MessageEvent;
      })
    );

    const heartbeat$ = interval(25000).pipe(
      map(() => ({
        type: "heartbeat",
        data: {
          role,
          clientId: scopedClientId,
          ts: new Date().toISOString()
        }
      } satisfies MessageEvent))
    );

    return defer(() => {
      this.metricsService.openRealtimeConnection(role);
      return merge(ready$, refresh$, heartbeat$).pipe(
        finalize(() => {
          this.metricsService.closeRealtimeConnection(role);
        })
      );
    });
  }
}
