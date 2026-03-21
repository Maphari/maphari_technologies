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

// ── Shared pulse keyframes injected once ──────────────────────────────────────
const PULSE_STYLE = `
@keyframes _mkLoadPulse{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes _mkLoadSpin{to{transform:rotate(360deg)}}
@keyframes _mkLoadBar{0%{transform:scaleX(0)}60%{transform:scaleX(0.7)}100%{transform:scaleX(1)}}
`;

function injectPulseStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById("_mk-load-style")) return;
  const el = document.createElement("style");
  el.id = "_mk-load-style";
  el.textContent = PULSE_STYLE;
  document.head.appendChild(el);
}

export type DashboardVariant = "admin" | "staff" | "client";

const VARIANT_CONFIG: Record<DashboardVariant, { accent: string; bg: string; surface: string; border: string; label: string; sublabel: string }> = {
  admin: {
    accent: "#8b6fff",
    bg: "#07070d",
    surface: "#0f0f1a",
    border: "rgba(139,111,255,0.18)",
    label: "Admin Dashboard",
    sublabel: "Loading your workspace…"
  },
  staff: {
    accent: "#f97316",
    bg: "#06060e",
    surface: "#0d0d1a",
    border: "rgba(249,115,22,0.18)",
    label: "Staff Portal",
    sublabel: "Preparing your workspace…"
  },
  client: {
    accent: "#c8f135",
    bg: "#080810",
    surface: "#0e0e1c",
    border: "rgba(200,241,53,0.14)",
    label: "Client Portal",
    sublabel: "Loading your portal…"
  }
};

export function DashboardLoadingFallback({ label, variant = "client" }: { label?: string; variant?: DashboardVariant }) {
  useEffect(() => { injectPulseStyle(); }, []);

  const cfg = VARIANT_CONFIG[variant];
  const displayLabel = label ?? cfg.sublabel;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: cfg.bg,
        gap: 0,
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background radial glow */}
      <div style={{
        position: "absolute",
        width: 480,
        height: 480,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${cfg.accent}18 0%, transparent 70%)`,
        filter: "blur(60px)",
        pointerEvents: "none"
      }} />

      {/* Logo mark */}
      <div style={{
        width: 48,
        height: 48,
        background: cfg.accent,
        clipPath: "polygon(0 0,100% 0,100% 72%,72% 100%,0 100%)",
        marginBottom: 20,
        animation: "_mkLoadPulse 2.4s ease-in-out infinite",
        position: "relative",
        zIndex: 1
      }} />

      {/* Portal name */}
      <div style={{
        fontFamily: "var(--font-syne, system-ui, sans-serif)",
        fontWeight: 800,
        fontSize: "1rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#fff",
        marginBottom: 6,
        position: "relative",
        zIndex: 1
      }}>
        {cfg.label}
      </div>

      {/* Sub-label */}
      <div style={{
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.38)",
        letterSpacing: "0.04em",
        marginBottom: 32,
        position: "relative",
        zIndex: 1
      }}>
        {displayLabel}
      </div>

      {/* Spinner ring */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `2px solid ${cfg.border}`,
        borderTopColor: cfg.accent,
        animation: "_mkLoadSpin 0.9s linear infinite",
        position: "relative",
        zIndex: 1
      }} />

      {/* Progress bar */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        background: cfg.border
      }}>
        <div style={{
          height: "100%",
          background: cfg.accent,
          transformOrigin: "left",
          animation: "_mkLoadBar 1.8s cubic-bezier(0.4,0,0.2,1) infinite"
        }} />
      </div>
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
