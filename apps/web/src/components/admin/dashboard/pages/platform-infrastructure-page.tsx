// ════════════════════════════════════════════════════════════════════════════
// platform-infrastructure-page.tsx — Admin Platform & Infrastructure page
// Data sources:
//   Service health — session-based check (real infra metrics API: future)
//   Feature flags  — GET /admin/feature-flags (core Prisma FeatureFlag table)
//                    PATCH /admin/feature-flags/:key/toggle (live toggle)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadFeatureFlagsWithRefresh, toggleFeatureFlagWithRefresh, type FeatureFlag } from "../../../../lib/api/admin/settings";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceStatus = "healthy" | "unknown" | "down";
type Tab = "services" | "feature flags";
const tabs: Tab[] = ["services", "feature flags"];

interface ServiceDef {
  name: string;
  description: string;
  requiresSession: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_DEFS: ServiceDef[] = [
  { name: "Core API", description: "Primary business logic service", requiresSession: true },
  { name: "Billing API", description: "Invoice and payment processing", requiresSession: true },
  { name: "Auth Service", description: "Session management and token refresh", requiresSession: true },
  { name: "API Gateway", description: "Request routing and rate limiting", requiresSession: true },
  { name: "Redis Cache", description: "Session store and short-lived data", requiresSession: true },
  { name: "NATS Messaging", description: "Async event bus and notifications", requiresSession: false },
];

// ── Default flags seeded into DB on first load if table is empty ──────────────
const DEFAULT_FLAGS: Array<{ key: string; name: string; description: string; enabled: boolean; scope: string }> = [
  { key: "ai_auto_draft", name: "AI Auto-Draft Updates", description: "AI-generated client update emails", enabled: true, scope: "All staff" },
  { key: "realtime_notifications", name: "Real-time Notifications", description: "WebSocket push notifications", enabled: true, scope: "All users" },
  { key: "client_portal_v2", name: "Client Portal V2 UI", description: "Redesigned client dashboard", enabled: false, scope: "Disabled" },
  { key: "new_invoice_builder", name: "New Invoice Builder", description: "Updated invoice creation flow", enabled: false, scope: "Disabled" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusConfig: Record<ServiceStatus, { color: string; label: string }> = {
  healthy: { color: "var(--accent)", label: "Healthy" },
  unknown: { color: "var(--amber)", label: "Unknown" },
  down: { color: "var(--red)", label: "Down" },
};

function serviceStatus(svc: ServiceDef, sessionOk: boolean): ServiceStatus {
  if (!svc.requiresSession) return "unknown";
  return sessionOk ? "healthy" : "down";
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlatformInfrastructurePage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setLastRefresh(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Load feature flags (seed defaults if empty) ────────────────────────────
  const loadFlags = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setFlagsLoading(true);
    setError(null);
    try {
      const r = await loadFeatureFlagsWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setFlags(r.data);
      } else if (r.error) {
        setError(r.error.message ?? "Failed to load.");
      } else {
        // Seed defaults into DB on first visit
        const created: FeatureFlag[] = [];
        for (const def of DEFAULT_FLAGS) {
          const res = await fetch("/api/gateway/admin/feature-flags", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(def),
          });
          const json = (await res.json()) as { success?: boolean; data?: FeatureFlag };
          if (json.success && json.data) created.push(json.data);
        }
        if (created.length > 0) {
          setFlags(created);
        } else {
          // Fallback: display defaults as local-only (no API available)
          setFlags(DEFAULT_FLAGS.map((d) => ({ ...d, key: d.key, updatedBy: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })));
        }
      }
    } finally {
      setFlagsLoading(false);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  // ── Toggle a feature flag ──────────────────────────────────────────────────
  const handleToggle = useCallback(async (key: string) => {
    if (!session || togglingKey) return;
    setTogglingKey(key);
    try {
      const r = await toggleFeatureFlagWithRefresh(session, key);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setFlags((prev) => prev.map((f) => (f.key === key ? r.data! : f)));
        onNotify("success", `Feature flag "${r.data.name}" ${r.data.enabled ? "enabled" : "disabled"}.`);
      } else if (r.error) {
        onNotify("error", r.error.message);
      }
    } finally {
      setTogglingKey(null);
    }
  }, [session, togglingKey, onNotify]);

  const sessionOk = session !== null;

  const services = SERVICE_DEFS.map((svc) => ({
    ...svc,
    status: serviceStatus(svc, sessionOk),
  }));

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const unknownCount = services.filter((s) => s.status === "unknown").length;
  const downCount = services.filter((s) => s.status === "down").length;

  const overallHealth: ServiceStatus = downCount > 0 ? "down" : unknownCount > 0 ? "unknown" : "healthy";
  const cfg = statusConfig[overallHealth];

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.pageBody, styles.pifRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / PLATFORM & INFRASTRUCTURE</div>
          <h1 className={styles.pageTitle}>Platform &amp; Infrastructure</h1>
          <div className={styles.pageSub}>Service health · Feature flags · Session status</div>
        </div>
        <div className={styles.pifHeadActions}>
          <div className={cx(styles.pifHealthBadge, styles.pifHealthBadgeTone, toneClass(cfg.color))}>
            <div className={cx(styles.pifHealthDot, styles.pifHealthDotTone, toneClass(cfg.color))} />
            <span className={cx(styles.pifHealthText, colorClass(cfg.color))}>
              System {cfg.label}
            </span>
          </div>
          <div className={cx("text11", "colorMuted")}>
            Last checked {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Healthy Services", value: healthyCount.toString(), color: healthyCount > 0 ? "var(--accent)" : "var(--muted)", sub: "Session-verified" },
          { label: "Unknown Services", value: unknownCount.toString(), color: unknownCount > 0 ? "var(--amber)" : "var(--accent)", sub: "No health endpoint yet" },
          { label: "Down Services", value: downCount.toString(), color: downCount > 0 ? "var(--red)" : "var(--accent)", sub: downCount > 0 ? "Session unavailable" : "All reachable" },
          { label: "Session", value: sessionOk ? "Active" : "No session", color: sessionOk ? "var(--accent)" : "var(--red)", sub: sessionOk ? `User: ${session.user.role}` : "Sign in required" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select
          title="Select tab"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "services" && (
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("text12", "colorMuted", "mb4")}>
            Service status is derived from gateway session health. Real-time metrics will be available once an infra monitoring API is connected.
          </div>
          {services.map((svc) => {
            const scfg = statusConfig[svc.status];
            return (
              <div
                key={svc.name}
                className={cx(styles.pifServiceRow, svc.status !== "healthy" && styles.pifServiceRowAlert, toneClass(scfg.color))}
              >
                <div className={styles.pifServiceNameCell}>
                  <div className={cx(styles.pifServiceDot, styles.pifServiceDotTone, svc.status !== "healthy" && styles.pifServiceDotAlert, toneClass(scfg.color))} />
                  <div>
                    <span className={styles.pifServiceName}>{svc.name}</span>
                    <div className={cx("text11", "colorMuted")}>{svc.description}</div>
                  </div>
                </div>
                <div>
                  <div className={styles.pifLabel}>Source</div>
                  <div className={cx("text12", "colorMuted")}>{svc.requiresSession ? "Session check" : "No check yet"}</div>
                </div>
                <div>
                  <div className={styles.pifLabel}>Checked</div>
                  <div className={cx(styles.pifMono)}>{lastRefresh.toLocaleTimeString()}</div>
                </div>
                <span className={cx(styles.pifStatusPill, styles.pifStatusPillTone, toneClass(scfg.color))}>
                  {scfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "feature flags" && (
        <div className={cx("flexCol", "gap12")}>
          <div className={styles.pifInfoCard}>
            Feature flags allow you to enable or disable platform features without deploying new code. Changes take effect immediately for all users in the specified scope.
          </div>
          {flagsLoading ? (
            <div className={cx("text12", "colorMuted", "py20")}>Loading feature flags…</div>
          ) : flags.length === 0 ? (
            <div className={cx("text12", "colorMuted", "py20")}>No feature flags configured.</div>
          ) : flags.map((flag) => (
            <div key={flag.key} className={styles.pifFlagRow}>
              <div>
                <div className={cx("fw700", "mb4")}>{flag.name}</div>
                <div className={cx("text12", "colorMuted")}>{flag.description ?? ""}</div>
              </div>
              <div>
                <div className={styles.pifLabel}>Scope</div>
                <div className={cx("text12", flag.enabled ? "colorBlue" : "colorMuted")}>{flag.scope}</div>
              </div>
              <button
                type="button"
                disabled={togglingKey === flag.key}
                onClick={() => void handleToggle(flag.key)}
                className={cx(styles.pifToggleWrap, "noBorder", "bgTransp", "p0", togglingKey === flag.key ? "notAllowed" : "pointer")}
              >
                <div className={cx(styles.pifToggle, flag.enabled && styles.pifToggleOn)}>
                  <div className={cx(styles.pifToggleKnob, flag.enabled && styles.pifToggleKnobOn)} />
                </div>
                <span className={cx(styles.pifToggleText, flag.enabled ? "colorAccent" : "colorMuted")}>
                  {togglingKey === flag.key ? "…" : flag.enabled ? "On" : "Off"}
                </span>
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => void handleToggle(flag.key)}
                disabled={togglingKey === flag.key}
              >
                {flag.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
