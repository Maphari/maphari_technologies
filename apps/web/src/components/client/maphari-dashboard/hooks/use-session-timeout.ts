"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const IDLE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before expiry
const WARNING_THRESHOLD_MS = IDLE_DURATION_MS - WARNING_BEFORE_MS; // 25 minutes
const ACTIVITY_THROTTLE_MS = 60 * 1000; // 1 minute
const COUNTDOWN_INTERVAL_MS = 1_000; // 1 second

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSessionTimeout({
  onTimeout,
}: {
  onTimeout: () => void;
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    WARNING_BEFORE_MS / 1000,
  );

  const lastActivityRef = useRef(Date.now());
  const lastThrottledRef = useRef(Date.now());
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep onTimeout ref current
  onTimeoutRef.current = onTimeout;

  // ── Reset activity timestamp (throttled) ─────────────────────────────────

  const resetActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottledRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottledRef.current = now;
    lastActivityRef.current = now;

    // If warning was showing, dismiss it
    setShowWarning(false);
    setRemainingSeconds(WARNING_BEFORE_MS / 1000);

    // Clear any countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // ── Extend session ───────────────────────────────────────────────────────

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastThrottledRef.current = Date.now();
    setShowWarning(false);
    setRemainingSeconds(WARNING_BEFORE_MS / 1000);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // ── Register activity listeners ──────────────────────────────────────────

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

  // ── Idle check loop ──────────────────────────────────────────────────────

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;

      // Expired
      if (idle >= IDLE_DURATION_MS) {
        clearInterval(checkInterval);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setShowWarning(false);
        onTimeoutRef.current();
        return;
      }

      // Warning zone
      if (idle >= WARNING_THRESHOLD_MS && !countdownRef.current) {
        setShowWarning(true);
        const expiresAt = lastActivityRef.current + IDLE_DURATION_MS;

        // Start countdown
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
    }, 5_000); // Check every 5 seconds

    return () => {
      clearInterval(checkInterval);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
  };
}
