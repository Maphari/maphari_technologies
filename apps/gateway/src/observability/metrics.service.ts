import { Injectable } from "@nestjs/common";
import { ServiceMetrics } from "@maphari/platform";
import type { Role } from "@maphari/contracts";

@Injectable()
export class MetricsService {
  private readonly metrics = new ServiceMetrics();
  private readonly realtimeConnectionsByRole = new Map<string, number>();

  constructor() {
    this.metrics.registerCounter("http_requests_total", "Total HTTP requests");
    this.metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
      5, 10, 25, 50, 100, 250, 500, 1000, 2500
    ]);
    this.metrics.registerGauge("realtime_sse_connections_active", "Active SSE realtime connections");
    this.metrics.registerCounter("realtime_sse_connections_opened_total", "Total opened SSE realtime connections");
    this.metrics.registerCounter("realtime_sse_connections_closed_total", "Total closed SSE realtime connections");
    this.metrics.registerCounter("realtime_events_received_total", "Total realtime events received from upstream bus");
    this.metrics.registerCounter("realtime_events_delivered_total", "Total realtime events delivered to SSE clients");
    this.metrics.registerCounter("realtime_events_filtered_total", "Total realtime events filtered by scope");
    this.metrics.registerCounter("realtime_events_dropped_total", "Total realtime events dropped before broadcast");
  }

  incRequest(labels: Record<string, string | number>): void {
    this.metrics.inc("http_requests_total", { service: "gateway", ...labels });
  }

  observeDuration(durationMs: number, labels: Record<string, string | number>): void {
    this.metrics.observe("http_request_duration_ms", durationMs, { service: "gateway", ...labels });
  }

  openRealtimeConnection(role: Role): void {
    this.metrics.inc("realtime_sse_connections_opened_total", { service: "gateway", role });
    const next = (this.realtimeConnectionsByRole.get(role) ?? 0) + 1;
    this.realtimeConnectionsByRole.set(role, next);
    this.metrics.set("realtime_sse_connections_active", next, { service: "gateway", role });
  }

  closeRealtimeConnection(role: Role): void {
    this.metrics.inc("realtime_sse_connections_closed_total", { service: "gateway", role });
    const next = Math.max(0, (this.realtimeConnectionsByRole.get(role) ?? 0) - 1);
    this.realtimeConnectionsByRole.set(role, next);
    this.metrics.set("realtime_sse_connections_active", next, { service: "gateway", role });
  }

  incRealtimeEventReceived(topic: string): void {
    this.metrics.inc("realtime_events_received_total", { service: "gateway", topic });
  }

  incRealtimeEventDelivered(topic: string, role: Role): void {
    this.metrics.inc("realtime_events_delivered_total", { service: "gateway", topic, role });
  }

  incRealtimeEventFiltered(topic: string, role: Role): void {
    this.metrics.inc("realtime_events_filtered_total", { service: "gateway", topic, role });
  }

  incRealtimeEventDropped(reason: string, topic = "unknown"): void {
    this.metrics.inc("realtime_events_dropped_total", { service: "gateway", reason, topic });
  }

  renderPrometheus(): string {
    return this.metrics.renderPrometheus();
  }
}
