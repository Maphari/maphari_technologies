"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes before

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const expiresAtRef = useRef(Date.now() + SESSION_DURATION);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    expiresAtRef.current = Date.now() + SESSION_DURATION;
    setShowWarning(false);
    setRemainingSeconds(0);

    /* Clear existing timers */
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    /* Set new warning timer */
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(Math.ceil(WARNING_BEFORE / 1000));

      /* Start countdown */
      countdownRef.current = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((expiresAtRef.current - Date.now()) / 1000)
        );
        setRemainingSeconds(remaining);
        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 1000);
    }, SESSION_DURATION - WARNING_BEFORE);
  }, []);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    resetTimer();

    /* Reset on user activity (throttled) */
    let throttle = false;
    const onActivity = () => {
      if (throttle) return;
      throttle = true;
      setTimeout(() => {
        throttle = false;
      }, 60000); // Throttle to once per minute
      if (!showWarning) resetTimer(); // Don't reset if warning is showing
    };

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimer, showWarning]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return { showWarning, remainingSeconds, extendSession, formatTime };
}
