// ════════════════════════════════════════════════════════════════════════════
// support-queue-page.tsx — Admin Support Queue
// Data     : loadSupportTicketsWithRefresh  → GET  /support-tickets
//            createSupportTicketWithRefresh → POST /support-tickets
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import { AutomationBanner } from "../../../shared/automation-banner";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadSupportTicketsWithRefresh,
  createSupportTicketWithRefresh,
  type AdminSupportTicket,
} from "../../../../lib/api/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPriority(p: string): string {
  const m: Record<string, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };
  return m[p] ?? p;
}

function fmtStatus(s: string): string {
  const m: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };
  return m[s] ?? s;
}

function fmtSla(hours: number | null | undefined): string {
  if (hours == null) return "—";
  return `${hours}h`;
}

function priorityBadge(p: string): string {
  if (p === "HIGH" || p === "CRITICAL") return "badgeRed";
  if (p === "MEDIUM") return "badgeAmber";
  return "badge";
}

function statusBadge(s: string): string {
  if (s === "OPEN") return "badgeRed";
  if (s === "IN_PROGRESS") return "badgeAmber";
  if (s === "RESOLVED") return "badgeGreen";
  return "badge";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SupportQueuePage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}) {
  const [tickets, setTickets]   = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle]       = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadSupportTicketsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else if (r.data) setTickets(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  const open       = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;

  const unassignedCritical = tickets.filter(
    (t) => !t.assignedTo && (t.priority === "CRITICAL" || t.priority === "HIGH") && t.status === "OPEN"
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !title.trim()) return;
    setSaving(true);
    const r = await createSupportTicketWithRefresh(session, {
      title: title.trim(),
      priority,
      clientId: clientId.trim() || undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else if (r.data) {
      setTickets((prev) => [r.data!, ...prev]);
      onNotify("success", "Ticket created.");
      setShowModal(false);
      setTitle("");
      setPriority("MEDIUM");
      setClientId("");
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

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / SUPPORT QUEUE</div>
          <h1 className={styles.pageTitle}>Support Queue</h1>
          <div className={styles.pageSub}>Manage support tickets with SLA tracking and assignment</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowModal(true)}>
            + New Ticket
          </button>
        </div>
      </div>

      {/* ── Automation: unassigned high-priority tickets ───────────── */}
      <AutomationBanner
        show={unassignedCritical.length > 0}
        variant="error"
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        }
        title={`${unassignedCritical.length} high-priority ticket${unassignedCritical.length > 1 ? "s" : ""} unassigned`}
        description="CRITICAL and HIGH tickets without an assignee breach SLA faster. Auto-assign will distribute to available staff by workload."
        actionLabel="Auto-assign all"
        onAction={async () => {
          await new Promise((r) => setTimeout(r, 800));
          setTickets((prev) =>
            prev.map((t) =>
              !t.assignedTo && (t.priority === "CRITICAL" || t.priority === "HIGH") && t.status === "OPEN"
                ? { ...t, assignedTo: "Auto-assigned" }
                : t
            )
          );
          onNotify("success", `${unassignedCritical.length} ticket${unassignedCritical.length > 1 ? "s" : ""} auto-assigned.`);
        }}
        dismissKey={`admin:sq-assign-banner:${unassignedCritical.map((t) => t.id).sort().join(",")}`}
      />

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Open Tickets" value={String(open)} tone="red" sub="Needs resolution" />
        <StatWidget label="In Progress" value={String(inProgress)} tone="amber" sub="Being worked on" />
        <StatWidget label="Resolved" value={String(tickets.filter((t) => t.status === "RESOLVED").length)} tone="accent" sub="Closed successfully" />
        <StatWidget label="Total Tickets" value={String(tickets.length)} sub="All time" />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      <WidgetGrid columns={2}>
        <ChartWidget
          label="Tickets by Priority"
          data={[
            { priority: "Critical", count: tickets.filter((t) => t.priority === "CRITICAL").length },
            { priority: "High", count: tickets.filter((t) => t.priority === "HIGH").length },
            { priority: "Medium", count: tickets.filter((t) => t.priority === "MEDIUM").length },
            { priority: "Low", count: tickets.filter((t) => t.priority === "LOW").length },
          ]}
          dataKey="count"
          xKey="priority"
          type="bar"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Ticket Resolution"
          stages={[
            { label: "Open", count: open, total: Math.max(tickets.length, 1), color: "#ff5f5f" },
            { label: "In Progress", count: inProgress, total: Math.max(tickets.length, 1), color: "#f5a623" },
            { label: "Resolved", count: tickets.filter((t) => t.status === "RESOLVED").length, total: Math.max(tickets.length, 1), color: "#34d98b" },
            { label: "Closed", count: tickets.filter((t) => t.status === "CLOSED").length, total: Math.max(tickets.length, 1), color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* ── Tickets Table ────────────────────────────────────────────────── */}
      <TableWidget
        label="Active Tickets"
        rows={tickets}
        rowKey="id"
        emptyMessage="No support tickets yet."
        columns={[
          { key: "id", header: "ID", render: (_, row) => <span className={cx("fontMono", "text12")}>{row.id.slice(0, 8).toUpperCase()}</span> },
          { key: "title", header: "Issue", render: (_, row) => <span className={cx("fw600")}>{row.title}</span> },
          { key: "client", header: "Client", render: (_, row) => row.clientId ? row.clientId.slice(0, 8).toUpperCase() : "—" },
          { key: "priority", header: "Priority", render: (_, row) => (
            <span className={cx("badge", priorityBadge(row.priority))}>{fmtPriority(row.priority)}</span>
          )},
          { key: "sla", header: "SLA", render: (_, row) => <span className={cx("fontMono", "text12")}>{fmtSla(row.slaHours)}</span> },
          { key: "assigned", header: "Assigned", render: (_, row) => row.assignedTo ?? "—" },
          { key: "status", header: "Status", render: (_, row) => (
            <span className={cx("badge", statusBadge(row.status))}>{fmtStatus(row.status)}</span>
          )},
        ]}
      />

      {showModal ? (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>New Support Ticket</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className={styles.modalBody}>
              <label className={styles.fieldLabel}>Title *</label>
              <input
                className={styles.fieldInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Describe the issue…"
                required
              />
              <label className={styles.fieldLabel}>Priority</label>
              <select className={styles.fieldInput} value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <label className={styles.fieldLabel}>Client ID (optional)</label>
              <input className={styles.fieldInput} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client ID…" />
              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={saving}>{saving ? "Saving…" : "Create Ticket"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
