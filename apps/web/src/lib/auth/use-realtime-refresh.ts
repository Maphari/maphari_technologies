"use client";

import { useEffect, useRef } from "react";
import type { AuthSession } from "./session";

const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

/**
 * Keeps portal data responsive by subscribing to the gateway SSE pulse stream.
 * This supplements polling and reduces stale UI windows between refresh cycles.
 */
export function useRealtimeRefresh(
  session: AuthSession | null,
  onRefresh: () => void
): void {
  const onRefreshRef = useRef(onRefresh);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const refreshThrottleRef = useRef(0);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!session) return;
    let source: EventSource | null = null;
    let closed = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const handleRefresh = () => {
      const now = Date.now();
      if (now - refreshThrottleRef.current < 900) return;
      refreshThrottleRef.current = now;
      onRefreshRef.current();
    };

    const connect = () => {
      if (closed) return;
      const streamUrl = `${gatewayBaseUrl}/events/stream?accessToken=${encodeURIComponent(session.accessToken)}`;
      source = new EventSource(streamUrl);
      source.addEventListener("refresh", handleRefresh);
      source.addEventListener("ready", handleRefresh);
      source.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };
      source.onerror = () => {
        source?.close();
        if (closed) return;
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const nextDelay = Math.min(10_000, 500 * Math.pow(2, Math.min(attempt, 5)));
        clearReconnect();
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, nextDelay);
      };
    };

    connect();
    return () => {
      closed = true;
      clearReconnect();
      source?.removeEventListener("refresh", handleRefresh);
      source?.removeEventListener("ready", handleRefresh);
      source?.close();
    };
  }, [session]);
}
