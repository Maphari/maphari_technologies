// ════════════════════════════════════════════════════════════════════════════
// integration-requests-page.tsx — Admin Integration Requests Operations
// Data     : loadIntegrationRequestsWithRefresh   → GET  /admin/integration-requests
//            updateIntegrationRequestWithRefresh  → PATCH /admin/integration-requests/:id
//            createIntegrationConnectionWithRefresh → POST /admin/integrations/connections
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadIntegrationRequestsWithRefresh,
  updateIntegrationRequestWithRefresh,
  createIntegrationConnectionWithRefresh,
  type AdminIntegrationRequestItem,
} from "../../../../lib/api/admin/integrations";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatStatus(s: string): string {
  const m: Record<string, string> = {
    REQUESTED: "Requested",
    IN_PROGRESS: "In Setup",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };
  return m[s] ?? s;
}

function statusBadgeClass(s: string): string {
  if (s === "REQUESTED") return "badgeAmber";
  if (s === "IN_PROGRESS") return "badgePurple";
  if (s === "COMPLETED") return "badgeGreen";
  if (s === "REJECTED") return "badgeRed";
  return "badge";
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function providerIcon(key: string): string {
  const icons: Record<string, string> = {
    slack: "💬", notion: "📝", asana: "📋", trello: "📌", github: "🐙",
    jira: "🔷", figma: "🎨", google_drive: "📁", dropbox: "📦",
    hubspot: "🔶", salesforce: "☁️", stripe: "💳", xero: "📊",
    quickbooks: "📒", zapier: "⚡", make: "🔧", clickup: "✅",
    monday: "📅", linear: "🎯", intercom: "💭",
  };
  return icons[key.toLowerCase()] ?? "🔌";
}

type StatusFilter = "ALL" | "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

// ── Component ─────────────────────────────────────────────────────────────────
export function IntegrationRequestsPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}) {
  const [requests, setRequests]       = useState<AdminIntegrationRequestItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<StatusFilter>("ALL");
  const [selected, setSelected]       = useState<AdminIntegrationRequestItem | null>(null);
  const [panelNotes, setPanelNotes]   = useState("");
  const [panelAssignee, setPanelAssignee] = useState("");
  const [rejectReason, setRejectReason]   = useState("");
  const [showRejectField, setShowRejectField] = useState(false);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadIntegrationRequestsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else if (r.data) setRequests(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  // KPI counts
  const countRequested   = requests.filter((r) => r.status === "REQUESTED").length;
  const countInProgress  = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const countCompleted   = requests.filter((r) => r.status === "COMPLETED").length;
  const countRejected    = requests.filter((r) => r.status === "REJECTED").length;

  // Filtered list
  const filtered = tab === "ALL" ? requests : requests.filter((r) => r.status === tab);

  function openPanel(req: AdminIntegrationRequestItem) {
    setSelected(req);
    setPanelNotes(req.notes ?? "");
    setPanelAssignee(req.assignedToName ?? "");
    setRejectReason(req.rejectedReason ?? "");
    setShowRejectField(false);
  }

  async function handleTransition(
    req: AdminIntegrationRequestItem,
    newStatus: "IN_PROGRESS" | "COMPLETED" | "REJECTED"
  ) {
    if (!session) return;
    if (newStatus === "REJECTED" && !showRejectField) {
      setShowRejectField(true);
      return;
    }
    setSaving(true);
    const r = await updateIntegrationRequestWithRefresh(session, req.id, {
      status: newStatus,
      notes: panelNotes || null,
      rejectedReason: newStatus === "REJECTED" ? (rejectReason.trim() || null) : undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
      setSaving(false);
      return;
    }

    // If completing, also create a connection record
    if (newStatus === "COMPLETED") {
      const conn = await createIntegrationConnectionWithRefresh(session, {
        clientId: req.clientId,
        providerKey: req.providerKey,
        connectionType: "assisted",
      });
      if (conn.nextSession) saveSession(conn.nextSession);
      if (conn.error) {
        onNotify("warning", "Request completed, but connection record creation failed.");
      }
    }

    setRequests((prev) => prev.map((x) => x.id === req.id ? { ...x, status: newStatus, notes: panelNotes || null } : x));
    onNotify("success", `Request marked as ${formatStatus(newStatus)}.`);
    setSelected(null);
    setSaving(false);
  }

  async function handleSaveNotes(req: AdminIntegrationRequestItem) {
    if (!session) return;
    setSaving(true);
    const r = await updateIntegrationRequestWithRefresh(session, req.id, { notes: panelNotes || null });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) { onNotify("error", r.error.message); }
    else {
      setRequests((prev) => prev.map((x) => x.id === req.id ? { ...x, notes: panelNotes || null } : x));
      onNotify("success", "Notes saved.");
    }
    setSaving(false);
  }

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

  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "ALL",         label: "All",        count: requests.length },
    { id: "REQUESTED",   label: "Requested",  count: countRequested },
    { id: "IN_PROGRESS", label: "In Setup",   count: countInProgress },
    { id: "COMPLETED",   label: "Completed",  count: countCompleted },
    { id: "REJECTED",    label: "Rejected",   count: countRejected },
  ];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AUTOMATION / INTEGRATION REQUESTS</div>
          <h1 className={styles.pageTitle}>Integration Requests</h1>
          <div className={styles.pageSub}>Manage client integration setup requests and track their lifecycle</div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Requested",  value: countRequested,  color: "var(--amber)" },
          { label: "In Setup",   value: countInProgress, color: "var(--accent)" },
          { label: "Completed",  value: countCompleted,  color: "var(--green)" },
          { label: "Rejected",   value: countRejected,   color: "var(--red)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className={cx("irTabBar", "mb16")}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx("irTab", tab === t.id ? "irTabActive" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count > 0 && <span className={cx("irTabCount")}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Main layout: table + detail panel ──────────────────────────── */}
      <div className={cx(selected ? "irShellWithPanel" : "")}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>
              {tab === "ALL" ? "All Requests" : `${formatStatus(tab)} Requests`}
              {" "}({filtered.length})
            </span>
          </div>
          <div className={styles.cardInner}>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No requests found</div>
                <div className={styles.emptySub}>No integration requests match this filter.</div>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Provider</th>
                    <th scope="col">Client</th>
                    <th scope="col">Requested By</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Status</th>
                    <th scope="col">Assigned To</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => (
                    <tr
                      key={req.id}
                      className={cx("irRow", selected?.id === req.id ? "irRowSelected" : "")}
                      onClick={() => openPanel(req)}
                    >
                      <td>
                        <div className={cx("irProviderCell")}>
                          <span className={cx("irProviderIcon")}>{providerIcon(req.providerKey)}</span>
                          <span className={cx("fw600", "text13")}>{req.providerLabel || req.providerKey}</span>
                        </div>
                      </td>
                      <td className={cx("text13")}>{req.clientName}</td>
                      <td>
                        <div className={cx("text12")}>
                          <div>{req.requestedByName ?? "—"}</div>
                          {req.requestedByEmail && (
                            <div className={cx("colorMuted")}>{req.requestedByEmail}</div>
                          )}
                        </div>
                      </td>
                      <td className={cx("text12", "colorMuted")}>{fmtDate(req.requestedAt)}</td>
                      <td>
                        <span className={cx("badge", statusBadgeClass(req.status))}>
                          {formatStatus(req.status)}
                        </span>
                      </td>
                      <td className={cx("text12")}>{req.assignedToName ?? "Unassigned"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className={cx("irActionBtns")}>
                          {req.status === "REQUESTED" && (
                            <button
                              type="button"
                              className={cx("btnXs", "btnPrimary")}
                              onClick={() => { openPanel(req); void handleTransition(req, "IN_PROGRESS"); }}
                            >
                              Start Setup
                            </button>
                          )}
                          {req.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              className={cx("btnXs", "btnAccent")}
                              onClick={() => { openPanel(req); void handleTransition(req, "COMPLETED"); }}
                            >
                              Complete
                            </button>
                          )}
                          {(req.status === "REQUESTED" || req.status === "IN_PROGRESS") && (
                            <button
                              type="button"
                              className={cx("btnXs", "btnGhost")}
                              onClick={() => { openPanel(req); setShowRejectField(true); }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        {/* ── Detail panel ───────────────────────────────────────────── */}
        {selected && (
          <aside className={cx("irDetailPanel")}>
            <div className={cx("irDetailHd")}>
              <div className={cx("irDetailTitle")}>
                <span>{providerIcon(selected.providerKey)}</span>
                <span>{selected.providerLabel || selected.providerKey}</span>
              </div>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className={cx("irDetailBody")}>
              <div className={cx("irDetailMeta")}>
                <div className={cx("irDetailMetaRow")}>
                  <span className={cx("irDetailMetaLabel")}>Client</span>
                  <span className={cx("irDetailMetaValue")}>{selected.clientName}</span>
                </div>
                <div className={cx("irDetailMetaRow")}>
                  <span className={cx("irDetailMetaLabel")}>Status</span>
                  <span className={cx("badge", statusBadgeClass(selected.status))}>{formatStatus(selected.status)}</span>
                </div>
                <div className={cx("irDetailMetaRow")}>
                  <span className={cx("irDetailMetaLabel")}>Requested By</span>
                  <span className={cx("irDetailMetaValue")}>{selected.requestedByName ?? "—"}</span>
                </div>
                <div className={cx("irDetailMetaRow")}>
                  <span className={cx("irDetailMetaLabel")}>Requested</span>
                  <span className={cx("irDetailMetaValue")}>{fmtDate(selected.requestedAt)}</span>
                </div>
                <div className={cx("irDetailMetaRow")}>
                  <span className={cx("irDetailMetaLabel")}>Assigned To</span>
                  <input
                    className={cx("irDetailInput")}
                    value={panelAssignee}
                    onChange={(e) => setPanelAssignee(e.target.value)}
                    placeholder="Assignee name or ID…"
                  />
                </div>
              </div>

              <div className={cx("irDetailSection")}>
                <label className={cx("irDetailLabel")}>Notes</label>
                <textarea
                  className={cx("irDetailTextarea")}
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  placeholder="Add setup notes…"
                  rows={4}
                />
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  disabled={saving}
                  onClick={() => void handleSaveNotes(selected)}
                >
                  Save Notes
                </button>
              </div>

              {showRejectField && (
                <div className={cx("irDetailSection")}>
                  <label className={cx("irDetailLabel")}>Rejection Reason</label>
                  <textarea
                    className={cx("irDetailTextarea")}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this request is being rejected…"
                    rows={3}
                  />
                </div>
              )}

              <div className={cx("irDetailActions")}>
                {selected.status === "REQUESTED" && (
                  <button
                    type="button"
                    className={cx("btnSm", "btnPrimary")}
                    disabled={saving}
                    onClick={() => void handleTransition(selected, "IN_PROGRESS")}
                  >
                    Start Setup
                  </button>
                )}
                {selected.status === "IN_PROGRESS" && (
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    disabled={saving}
                    onClick={() => void handleTransition(selected, "COMPLETED")}
                  >
                    Mark Completed
                  </button>
                )}
                {(selected.status === "REQUESTED" || selected.status === "IN_PROGRESS") && (
                  <button
                    type="button"
                    className={cx("btnSm", "btnDanger")}
                    disabled={saving}
                    onClick={() => void handleTransition(selected, "REJECTED")}
                  >
                    {showRejectField ? "Confirm Reject" : "Reject"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
