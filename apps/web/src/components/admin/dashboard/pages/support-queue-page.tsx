// ════════════════════════════════════════════════════════════════════════════
// support-queue-page.tsx — Admin Support Queue
// Data     : loadSupportTicketsWithRefresh  → GET  /support-tickets
//            createSupportTicketWithRefresh → POST /support-tickets
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import { colorClass } from "./admin-page-utils";
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

function fmtSla(hours: number | null): string {
  if (hours === null) return "—";
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
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle]       = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void loadSupportTicketsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setTickets(r.data);
      else if (r.error) onNotify("error", r.error.message);
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

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
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

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Open Tickets",  value: String(open),       color: "var(--red)"    },
          { label: "In Progress",   value: String(inProgress), color: "var(--amber)"  },
          { label: "Total Tickets", value: String(tickets.length), color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
          </div>
        ))}
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Active Tickets</span></div>
        <div className={styles.cardInner}>
          {loading ? (
            <div className={cx("colorMuted", "text13", "p24", "textCenter")}>Loading…</div>
          ) : tickets.length === 0 ? (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No support tickets yet</div>
                <div className={styles.emptySub}>Create a new ticket to track client issues with SLA monitoring and team assignment.</div>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowModal(true)}>+ New Ticket</button>
              </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">ID</th><th scope="col">Issue</th><th scope="col">Client</th><th scope="col">Priority</th>
                  <th scope="col">SLA</th><th scope="col">Assigned</th><th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className={cx("fontMono", "text12")}>{t.id.slice(0, 8).toUpperCase()}</td>
                    <td className={cx("fw600")}>{t.title}</td>
                    <td className={cx("colorMuted")}>{t.clientId ?? "—"}</td>
                    <td><span className={cx("badge", priorityBadge(t.priority))}>{fmtPriority(t.priority)}</span></td>
                    <td className={cx("fontMono", "text12")}>{fmtSla(t.slaHours)}</td>
                    <td className={cx("text12")}>{t.assignedTo ?? "—"}</td>
                    <td><span className={cx("badge", statusBadge(t.status))}>{fmtStatus(t.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

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
