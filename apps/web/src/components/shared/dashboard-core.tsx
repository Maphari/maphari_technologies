"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type DashboardToast = {
  id: string;
  tone: "success" | "error" | "warning" | "info";
  message: string;
};

export function hasAnyDashboardData(values: unknown[]): boolean {
  return values.some((value) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
    return true;
  });
}

export function useDashboardToasts(options: { dismissMs?: number } = {}) {
  const dismissMs = options.dismissMs ?? 3200;
  const [toasts, setToasts] = useState<DashboardToast[]>([]);

  const pushToast = useCallback((tone: "success" | "error" | "warning" | "info", message: string) => {
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, tone, message }]);
  }, []);

  const setFeedback = useCallback((feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => {
    pushToast(feedback.tone, feedback.message);
  }, [pushToast]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const handle = window.setTimeout(() => setToasts((current) => current.slice(1)), dismissMs);
    return () => window.clearTimeout(handle);
  }, [toasts, dismissMs]);

  return useMemo(() => ({ toasts, pushToast, setFeedback }), [toasts, pushToast, setFeedback]);
}

export function DashboardLoadingFallback({ label = "Loading dashboard..." }: { label?: string }) {
  return (
    <div style={{ minHeight: "40vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ fontSize: 14 }}>{label}</div>
    </div>
  );
}

export function DashboardToastStack({ toasts }: { toasts: DashboardToast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60, display: "grid", gap: 8 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            border: "1px solid var(--mk-border)",
            background: "var(--mk-surface)",
            color: "var(--mk-text)",
            padding: "10px 12px",
            borderLeft: `3px solid ${toast.tone === "success" ? "var(--success)" : toast.tone === "warning" ? "var(--amber)" : toast.tone === "info" ? "var(--accent)" : "var(--error)"}`
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
