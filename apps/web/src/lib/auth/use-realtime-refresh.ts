"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthSession } from "./session";

const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

/**
 * Keeps portal data responsive by subscribing to the gateway SSE pulse stream.
 * This supplements polling and reduces stale UI windows between refresh cycles.
 *
 * Security: instead of passing the main JWT in the SSE URL query string (which
 * leaks the token into server logs, browser history, and Referer headers), we
 * first call POST /events/stream-token with the JWT in the Authorization header
 * to obtain a 30-second one-time stream token, then open the EventSource with
 * only that short-lived opaque token in the URL.
 *
 * Returns `{ isConnected }` — true when the SSE connection is open and the
 * gateway has sent a `ready` event; false while connecting, reconnecting, or
 * when there is no session.
 */
export function useRealtimeRefresh(
  session: AuthSession | null,
  onRefresh: () => void
): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const refreshThrottleRef = useRef(0);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!session) {
      setIsConnected(false);
      return;
    }
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

    const handleReady = () => {
      setIsConnected(true);
      handleRefresh();
    };

    const connect = async () => {
      if (closed) return;

      // Step 1: Exchange the main JWT for a short-lived one-time stream token.
      // The JWT travels only in the Authorization header (never in the URL).
      let streamToken: string;
      try {
        const res = await fetch(`${gatewayBaseUrl}/events/stream-token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (!res.ok) {
          throw new Error(`stream-token exchange failed: ${res.status}`);
        }
        const body = (await res.json()) as { token: string };
        streamToken = body.token;
      } catch {
        if (closed) return;
        setIsConnected(false);
        // Back-off on token exchange failure the same as on SSE errors
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const nextDelay = Math.min(10_000, 500 * Math.pow(2, Math.min(attempt, 5)));
        clearReconnect();
        reconnectTimerRef.current = window.setTimeout(() => {
          void connect();
        }, nextDelay);
        return;
      }

      if (closed) return;

      // Step 2: Open the SSE connection using only the opaque stream token in the URL.
      const streamUrl = `${gatewayBaseUrl}/events/stream?token=${encodeURIComponent(streamToken)}`;
      source = new EventSource(streamUrl);
      source.addEventListener("refresh", handleRefresh);
      source.addEventListener("ready", handleReady);
      source.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };
      source.onerror = () => {
        source?.close();
        if (closed) return;
        setIsConnected(false);
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const nextDelay = Math.min(10_000, 500 * Math.pow(2, Math.min(attempt, 5)));
        clearReconnect();
        reconnectTimerRef.current = window.setTimeout(() => {
          void connect();
        }, nextDelay);
      };
    };

    void connect();
    return () => {
      closed = true;
      setIsConnected(false);
      clearReconnect();
      source?.removeEventListener("refresh", handleRefresh);
      source?.removeEventListener("ready", handleReady);
      source?.close();
    };
  }, [session]);

  return { isConnected };
}
