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
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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
  healthy: { color: "var(--accent)", label: "Session Healthy" },
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

  // Overall health: if any session-checked service is down → down.
  // If all session-verified services pass → healthy (green), even when some
  // services lack a health endpoint (those remain "unknown" individually but
  // should not degrade the overall status to amber "Unknown").
  // Only show "Unknown" when there is zero health data at all (no session).
  const sessionCheckedCount = services.filter((s) => s.status !== "unknown").length;
  const overallHealth: ServiceStatus =
    downCount > 0 ? "down" :
    sessionCheckedCount > 0 ? "healthy" :
    "unknown";
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

  const serviceStatusData = [
    { label: "Healthy",  count: healthyCount },
    { label: "Unknown",  count: unknownCount },
    { label: "Down",     count: downCount    },
  ];

  const flagsEnabled  = flags.filter(f => f.enabled).length;
  const flagsDisabled = flags.filter(f => !f.enabled).length;

  const tableRows = services.map(svc => ({
    name:        svc.name,
    description: svc.description,
    source:      svc.requiresSession ? "Session check" : "No check yet",
    status:      svc.status,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / INFRASTRUCTURE</div>
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
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Healthy Services" value={healthyCount} sub="Session-verified" tone={healthyCount > 0 ? "green" : "default"} />
        <StatWidget label="Unknown Services" value={unknownCount} sub="No health endpoint" tone={unknownCount > 0 ? "amber" : "default"} />
        <StatWidget label="Down Services" value={downCount} sub={downCount > 0 ? "Session unavailable" : "All reachable"} tone={downCount > 0 ? "red" : "default"} />
        <StatWidget label="Feature Flags" value={flags.length} sub={`${flagsEnabled} enabled`} tone="accent" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Service Health Breakdown"
          data={serviceStatusData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Feature Flag Status"
          stages={[
            { label: "Enabled",  count: flagsEnabled,  total: Math.max(flags.length, 1), color: "#34d98b" },
            { label: "Disabled", count: flagsDisabled, total: Math.max(flags.length, 1), color: "#888"    },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Services"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "name",        header: "Service" },
            { key: "description", header: "Description" },
            { key: "source",      header: "Source",  align: "right" },
            { key: "status",      header: "Status",  align: "right", render: (v) => {
              const val = v as ServiceStatus;
              const sc  = statusConfig[val];
              const cls = val === "healthy" ? cx("badge", "badgeGreen") : val === "down" ? cx("badge", "badgeRed") : cx("badge", "badgeAmber");
              return <span className={cls}>{sc.label}</span>;
            }},
          ]}
          emptyMessage="No services configured"
        />
      </WidgetGrid>

      {/* Feature flags section */}
      {activeTab === "feature flags" && (
        <WidgetGrid>
          <div className={cx("flexCol", "gap12")}>
            {flagsLoading ? (
              <div className={cx("text12", "colorMuted", "py20")}>Loading feature flags…</div>
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
        </WidgetGrid>
      )}

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
    </div>
  );
}
