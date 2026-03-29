// ════════════════════════════════════════════════════════════════════════════
// integration-connections-page.tsx — Admin Integration Connection Health
// Data     : loadIntegrationConnectionsWithRefresh  → GET /admin/integrations/connections
//            loadIntegrationProvidersWithRefresh    → GET /admin/integrations/providers
//            loadConnectionSyncEventsWithRefresh    → GET /admin/integrations/connections/:id/sync-events
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadIntegrationConnectionsWithRefresh,
  loadIntegrationProvidersWithRefresh,
  loadConnectionSyncEventsWithRefresh,
  type AdminIntegrationConnection,
  type AdminConnectionSyncEvent,
  type AdminIntegrationProvider,
} from "../../../../lib/api/admin/integrations";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function healthBadgeClass(h: string | null | undefined): string {
  if (!h || h === "UNKNOWN") return "badge";
  if (h === "HEALTHY") return "icHealthyBadge";
  if (h === "ACTION_NEEDED") return "icActionBadge";
  if (h === "FAILED" || h === "NEEDS_REAUTH") return "icFailedBadge";
  return "badge";
}

function healthLabel(h: string | null | undefined): string {
  if (!h || h === "UNKNOWN") return "Unknown";
  const m: Record<string, string> = {
    HEALTHY: "Healthy",
    ACTION_NEEDED: "Action Needed",
    FAILED: "Failed",
    NEEDS_REAUTH: "Needs Re-auth",
  };
  return m[h] ?? h;
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    CONNECTED: "Connected",
    DISCONNECTED: "Disconnected",
    PENDING: "Pending",
    ERROR: "Error",
  };
  return m[s] ?? s;
}

function statusBadgeClass(s: string): string {
  if (s === "CONNECTED") return "badgeGreen";
  if (s === "DISCONNECTED") return "badgeMuted";
  if (s === "ERROR") return "badgeRed";
  return "badge";
}

function connectionTypeBadge(t: string): string {
  if (t === "oauth") return "badgePurple";
  if (t === "assisted") return "badgeAmber";
  return "badge";
}

function syncStatusClass(s: string): string {
  if (s === "SUCCESS" || s === "COMPLETED") return "icSyncSuccess";
  if (s === "FAILED" || s === "ERROR") return "icSyncFailed";
  if (s === "RUNNING" || s === "IN_PROGRESS") return "icSyncRunning";
  return "icSyncMuted";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function IntegrationConnectionsPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}) {
  const [connections, setConnections]     = useState<AdminIntegrationConnection[]>([]);
  const [providers, setProviders]         = useState<AdminIntegrationProvider[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterHealth, setFilterHealth]   = useState("");
  const [selected, setSelected]           = useState<AdminIntegrationConnection | null>(null);
  const [syncEvents, setSyncEvents]       = useState<AdminConnectionSyncEvent[]>([]);
  const [loadingSync, setLoadingSync]     = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    Promise.all([
      loadIntegrationConnectionsWithRefresh(session),
      loadIntegrationProvidersWithRefresh(session),
    ]).then(([connR, provR]) => {
      if (connR.nextSession) saveSession(connR.nextSession);
      if (provR.nextSession) saveSession(provR.nextSession);
      if (connR.error) { setError(connR.error.message ?? "Failed to load connections."); return; }
      if (connR.data) setConnections(connR.data);
      if (provR.data) setProviders(provR.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  async function openSyncPanel(conn: AdminIntegrationConnection) {
    setSelected(conn);
    setSyncEvents([]);
    if (!session) return;
    setLoadingSync(true);
    const r = await loadConnectionSyncEventsWithRefresh(session, conn.id);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) { onNotify("error", r.error.message); }
    else if (r.data) setSyncEvents(r.data.slice(0, 10));
    setLoadingSync(false);
  }

  // KPI counts
  const total         = connections.length;
  const healthy       = connections.filter((c) => c.healthStatus === "HEALTHY").length;
  const actionNeeded  = connections.filter((c) => c.healthStatus === "ACTION_NEEDED").length;
  const failed        = connections.filter((c) => c.healthStatus === "FAILED" || c.healthStatus === "NEEDS_REAUTH").length;

  // Filtered list
  const filtered = connections.filter((c) => {
    if (filterProvider && c.providerKey !== filterProvider) return false;
    if (filterHealth && c.healthStatus !== filterHealth) return false;
    return true;
  });

  // Unique provider keys for filter
  const uniqueProviders = Array.from(new Set(connections.map((c) => c.providerKey))).sort();
  const providerLabel = (key: string) => providers.find((p) => p.key === key)?.label ?? key;

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

  // Build chart data: connections by provider
  const providerCounts = uniqueProviders.map((k) => ({
    name: providerLabel(k),
    count: connections.filter((c) => c.providerKey === k).length,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AUTOMATION / INTEGRATIONS</div>
          <h1 className={styles.pageTitle}>Connection Health</h1>
          <div className={styles.pageSub}>Monitor all client integration connections and sync history</div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Total Connections" value={String(total)} tone="accent" />
        <StatWidget label="Active" value={String(healthy)} tone="green" />
        <StatWidget label="Failing" value={String(failed)} tone="red" sub={failed > 0 ? "Needs attention" : undefined} subTone={failed > 0 ? "warn" : "neutral"} />
        <StatWidget label="Pending" value={String(actionNeeded)} tone="amber" />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      <WidgetGrid columns={2}>
        <ChartWidget
          label="Connections by Provider"
          data={providerCounts}
          dataKey="count"
          xKey="name"
          type="bar"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Connection Health"
          stages={[
            { label: "Healthy", count: healthy, total: Math.max(total, 1), color: "#34d98b" },
            { label: "Action Needed", count: actionNeeded, total: Math.max(total, 1), color: "#f5a623" },
            { label: "Failed / Re-auth", count: failed, total: Math.max(total, 1), color: "#ff5f5f" },
            { label: "Unknown", count: connections.filter((c) => !c.healthStatus || c.healthStatus === "UNKNOWN").length, total: Math.max(total, 1), color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className={cx("icFilterBar", "mb16")}>
        <select
          className={cx("icFilterSelect")}
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
        >
          <option value="">All Providers</option>
          {uniqueProviders.map((k) => (
            <option key={k} value={k}>{providerLabel(k)}</option>
          ))}
        </select>
        <select
          className={cx("icFilterSelect")}
          value={filterHealth}
          onChange={(e) => setFilterHealth(e.target.value)}
        >
          <option value="">All Health States</option>
          <option value="HEALTHY">Healthy</option>
          <option value="ACTION_NEEDED">Action Needed</option>
          <option value="FAILED">Failed</option>
          <option value="NEEDS_REAUTH">Needs Re-auth</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
        {(filterProvider || filterHealth) && (
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => { setFilterProvider(""); setFilterHealth(""); }}
          >
            Clear Filters
          </button>
        )}
        <span className={cx("text12", "colorMuted")}>{filtered.length} connection{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Connections Table ───────────────────────────────────────────── */}
      <TableWidget
        label="Connections"
        rows={filtered as unknown as Record<string, unknown>[]}
        rowKey="id"
        emptyMessage="No integration connections match the current filters."
        columns={[
          { key: "client", header: "Client", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return row.clientName; } },
          { key: "provider", header: "Provider", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return providerLabel(row.providerKey); } },
          { key: "type", header: "Type", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return (
            <span className={cx("badge", connectionTypeBadge(row.connectionType))}>
              {row.connectionType === "oauth" ? "OAuth" : row.connectionType === "assisted" ? "Assisted" : row.connectionType}
            </span>
          ); } },
          { key: "status", header: "Status", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return (
            <span className={cx("badge", statusBadgeClass(row.status))}>{statusLabel(row.status)}</span>
          ); } },
          { key: "health", header: "Health", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return (
            <span className={cx("badge", healthBadgeClass(row.healthStatus))}>{healthLabel(row.healthStatus)}</span>
          ); } },
          { key: "lastSynced", header: "Last Synced", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return fmtDate(row.lastSyncedAt); } },
          { key: "events", header: "Events", render: (_, r) => { const row = r as unknown as AdminIntegrationConnection; return (
            <span className={cx("text12", "colorMuted")} style={{ cursor: "pointer" }} onClick={() => void openSyncPanel(row)}>View</span>
          ); } },
        ]}
      />

      {/* ── Sync history panel ──────────────────────────────────────── */}
      {selected && (
        <aside className={cx("icSyncPanel")}>
          <div className={cx("icSyncPanelHd")}>
            <div className={cx("icSyncPanelTitle")}>
              <span className={cx("fw600")}>{providerLabel(selected.providerKey)}</span>
              <span className={cx("colorMuted", "text12")}>{selected.clientName}</span>
            </div>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSelected(null)}>✕</button>
          </div>

          <div className={cx("icSyncPanelMeta")}>
            <div className={cx("icSyncMetaRow")}>
              <span className={cx("icSyncMetaLabel")}>Status</span>
              <span className={cx("badge", statusBadgeClass(selected.status))}>{statusLabel(selected.status)}</span>
            </div>
            <div className={cx("icSyncMetaRow")}>
              <span className={cx("icSyncMetaLabel")}>Health</span>
              <span className={cx("badge", healthBadgeClass(selected.healthStatus))}>{healthLabel(selected.healthStatus)}</span>
            </div>
            <div className={cx("icSyncMetaRow")}>
              <span className={cx("icSyncMetaLabel")}>Last Synced</span>
              <span className={cx("text12")}>{fmtDate(selected.lastSyncedAt)}</span>
            </div>
            {selected.lastErrorMessage && (
              <div className={cx("icSyncMetaRow")}>
                <span className={cx("icSyncMetaLabel")}>Last Error</span>
                <span className={cx("icSyncErrorMsg")}>{selected.lastErrorMessage}</span>
              </div>
            )}
          </div>

          <div className={cx("icSyncHistoryHd")}>Sync History</div>

          {loadingSync ? (
            <div className={cx("icSyncLoading")}>Loading sync events…</div>
          ) : syncEvents.length === 0 ? (
            <div className={cx("icSyncEmpty")}>No sync events recorded.</div>
          ) : (
            <div className={cx("icSyncList")}>
              {syncEvents.map((ev) => (
                <div key={ev.id} className={cx("icSyncEvent")}>
                  <div className={cx("icSyncEventTop")}>
                    <span className={cx("icSyncChip", syncStatusClass(ev.status))}>{ev.status}</span>
                    <span className={cx("text11", "colorMuted")}>{fmtDateTime(ev.startedAt)}</span>
                    <span className={cx("text11", "colorMuted")}>{fmtDuration(ev.durationMs)}</span>
                  </div>
                  {ev.summary && (
                    <div className={cx("icSyncSummary")}>{ev.summary}</div>
                  )}
                  {ev.errorMessage && (
                    <div className={cx("icSyncEventError")}>{ev.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
