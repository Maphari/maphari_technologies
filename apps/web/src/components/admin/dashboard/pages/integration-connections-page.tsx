// ════════════════════════════════════════════════════════════════════════════
// integration-connections-page.tsx — Admin Integration Connection Health
// Data     : loadIntegrationConnectionsWithRefresh  → GET /admin/integrations/connections
//            loadIntegrationProvidersWithRefresh    → GET /admin/integrations/providers
//            loadConnectionSyncEventsWithRefresh    → GET /admin/integrations/connections/:id/sync-events
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
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
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Connections", value: total,        color: "var(--accent)"  },
          { label: "Healthy",           value: healthy,      color: "var(--green)"   },
          { label: "Action Needed",     value: actionNeeded, color: "var(--amber)"   },
          { label: "Failed / Re-auth",  value: failed,       color: "var(--red)"     },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

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

      {/* ── Main layout: table + sync panel ────────────────────────────── */}
      <div className={cx(selected ? "icShellWithPanel" : "")}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Connections</span>
          </div>
          <div className={styles.cardInner}>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No connections found</div>
                <div className={styles.emptySub}>No integration connections match the current filters.</div>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Client</th>
                    <th scope="col">Provider</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Health</th>
                    <th scope="col">Connected By</th>
                    <th scope="col">Connected</th>
                    <th scope="col">Last Synced</th>
                    <th scope="col">Last Error</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((conn) => (
                    <tr
                      key={conn.id}
                      className={cx("icRow", selected?.id === conn.id ? "icRowSelected" : "")}
                      onClick={() => void openSyncPanel(conn)}
                    >
                      <td className={cx("fw600", "text13")}>{conn.clientName}</td>
                      <td className={cx("text13")}>{providerLabel(conn.providerKey)}</td>
                      <td>
                        <span className={cx("badge", connectionTypeBadge(conn.connectionType))}>
                          {conn.connectionType === "oauth" ? "OAuth" : conn.connectionType === "assisted" ? "Assisted" : conn.connectionType}
                        </span>
                      </td>
                      <td>
                        <span className={cx("badge", statusBadgeClass(conn.status))}>
                          {statusLabel(conn.status)}
                        </span>
                      </td>
                      <td>
                        <span className={cx("badge", healthBadgeClass(conn.healthStatus))}>
                          {healthLabel(conn.healthStatus)}
                        </span>
                      </td>
                      <td className={cx("text12")}>
                        {conn.connectedByContactEmail ?? (conn.assignedOwnerUserId ? "Maphari" : "—")}
                      </td>
                      <td className={cx("text12", "colorMuted")}>{fmtDate(conn.connectedAt)}</td>
                      <td className={cx("text12", "colorMuted")}>{fmtDate(conn.lastSyncedAt)}</td>
                      <td>
                        {conn.lastErrorMessage ? (
                          <span
                            className={cx("icErrorCell")}
                            title={conn.lastErrorMessage}
                          >
                            {conn.lastErrorMessage.slice(0, 40)}{conn.lastErrorMessage.length > 40 ? "…" : ""}
                          </span>
                        ) : (
                          <span className={cx("colorMuted", "text12")}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

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
    </div>
  );
}
