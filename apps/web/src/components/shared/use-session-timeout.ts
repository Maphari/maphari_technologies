"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_IDLE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_THROTTLE_MS = 60 * 1000; // 1 minute
const COUNTDOWN_INTERVAL_MS = 1_000; // 1 second

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Shared session timeout hook usable by all dashboards.
 * Each dashboard can specify its own idle duration (admin should be shorter for security).
 *
 * @example
 * const timeout = useSessionTimeout({
 *   onTimeout: signOut,
 *   idleDurationMs: 15 * 60 * 1000, // 15 mins for admin
 * });
 */
export function useSessionTimeout({
  onTimeout,
  idleDurationMs = DEFAULT_IDLE_DURATION_MS,
  warningBeforeMs = DEFAULT_WARNING_BEFORE_MS,
}: {
  onTimeout: () => void;
  idleDurationMs?: number;
  warningBeforeMs?: number;
}) {
  const warningThresholdMs = idleDurationMs - warningBeforeMs;

  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    warningBeforeMs / 1000,
  );

  const lastActivityRef = useRef(Date.now());
  const lastThrottledRef = useRef(Date.now());
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  onTimeoutRef.current = onTimeout;

  // Reset activity (throttled)
  const resetActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottledRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottledRef.current = now;
    lastActivityRef.current = now;

    setShowWarning(false);
    setRemainingSeconds(warningBeforeMs / 1000);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [warningBeforeMs]);

  // Extend session (user clicks "Stay Logged In")
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastThrottledRef.current = Date.now();
    setShowWarning(false);
    setRemainingSeconds(warningBeforeMs / 1000);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [warningBeforeMs]);

  // Activity listeners
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"] as const;

    for (const event of events) {
      window.addEventListener(event, resetActivity, { passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, resetActivity);
      }
    };
  }, [resetActivity]);

  // Idle check loop
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;

      if (idle >= idleDurationMs) {
        clearInterval(checkInterval);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setShowWarning(false);
        onTimeoutRef.current();
        return;
      }

      if (idle >= warningThresholdMs && !countdownRef.current) {
        setShowWarning(true);
        const expiresAt = lastActivityRef.current + idleDurationMs;

        countdownRef.current = setInterval(() => {
          const secsLeft = Math.max(
            0,
            Math.ceil((expiresAt - Date.now()) / 1000),
          );
          setRemainingSeconds(secsLeft);

          if (secsLeft <= 0) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
          }
        }, COUNTDOWN_INTERVAL_MS);
      }
    }, 5_000);

    return () => {
      clearInterval(checkInterval);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [idleDurationMs, warningThresholdMs]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
  };
}
