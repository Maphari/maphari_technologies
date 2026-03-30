"use client";

import { useState, useMemo } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import type { AdminSnapshot } from "../../../../lib/api/admin";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

type Priority = "critical" | "high" | "medium" | "low";

const ownerOKRs: readonly { objective: string; keyResults: readonly { kr: string; progress: number; target: number; current: number; note?: string }[] }[] = [];

const decisions: readonly { date: string; title: string; context: string; tags: readonly string[]; outcome: string }[] = [];

const privateNotes: Array<{ client: string; note: string; priority: Priority; date: string }> = [];

const focusItems: Array<{ text: string; priority: Priority; done: boolean }> = [];

const priorityColors: Record<Priority, string> = {
  critical: "var(--red)",
  high: "var(--amber)",
  medium: "var(--amber)",
  low: "var(--muted)",
};

const priorityBadge: Record<Priority, string> = {
  critical: "badgeRed",
  high: "badgeAmber",
  medium: "badgeAmber",
  low: "badgeMuted",
};

const tabs = ["owner dashboard", "personal okrs", "decision journal", "private notes"] as const;
type Tab = (typeof tabs)[number];

export function OwnersWorkspacePage({ snapshot }: { snapshot?: AdminSnapshot }) {
  const [activeTab, setActiveTab] = useState<Tab>("owner dashboard");
  const [todos, setTodos] = useState(focusItems);

  // Dynamic today label: "SUN 29 MAR"
  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
  }, []);

  // Business Pulse metrics derived from snapshot
  const pulse = useMemo(() => {
    if (!snapshot) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // MRR: sum of COMPLETED payments in the current calendar month
    const mrrCents = snapshot.payments
      .filter((p) => p.status === "COMPLETED" && p.paidAt && new Date(p.paidAt) >= monthStart)
      .reduce((sum, p) => sum + p.amountCents, 0);

    // Client Health: % of clients with ACTIVE status
    const totalClients = snapshot.clients.length;
    const activeClients = snapshot.clients.filter((c) => c.status === "ACTIVE").length;
    const clientHealth = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : null;

    // Pipeline: count of non-closed leads
    const openLeads = snapshot.leads.filter((l) => l.status !== "WON" && l.status !== "LOST").length;

    // Overdue Invoices
    const overdueInv = snapshot.invoices.filter((inv) => {
      if (inv.status === "OVERDUE") return true;
      if (inv.status === "ISSUED" && inv.dueAt && new Date(inv.dueAt) < now) return true;
      return false;
    }).length;

    return { mrrCents, clientHealth, openLeads, overdueInv };
  }, [snapshot]);

  const toggleTodo = (idx: number) => {
    setTodos((prev) => prev.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)));
  };

  const mrrDisplay   = pulse ? formatMoneyCents(pulse.mrrCents, { currency: "ZAR", maximumFractionDigits: 0 }) : "—";
  const healthDisplay = pulse?.clientHealth != null ? `${pulse.clientHealth}%` : "—";

  const focusDone    = todos.filter(t => t.done).length;
  const focusPending = todos.filter(t => !t.done).length;

  const focusData = [
    { label: "Done",    count: focusDone    },
    { label: "Pending", count: focusPending },
  ];

  const todoTableRows = todos.map(t => ({
    text:     t.text,
    priority: t.priority,
    status:   t.done ? "done" : "pending",
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / OWNER</div>
          <h1 className={styles.pageTitle}>Owner&apos;s Workspace</h1>
          <div className={styles.pageSub}>Business pulse · OKRs · Focus items · Private notes</div>
        </div>
        <div className={cx("flexRow", "gap8", "p16", styles.ownerLockCard)}>
          <span className={cx("text14")}>&#128274;</span>
          <span className={cx("text12", "colorAccent", "fontMono")}>Admin-only - Not visible to staff</span>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="MRR" value={mrrDisplay} sub="This month (payments)" tone="accent" />
        <StatWidget label="Client Health" value={healthDisplay} sub="Active vs total" tone={pulse?.clientHealth != null && pulse.clientHealth >= 80 ? "green" : "amber"} />
        <StatWidget label="Open Pipeline" value={pulse?.openLeads ?? 0} sub="Active leads" tone="default" />
        <StatWidget label="Overdue Invoices" value={pulse?.overdueInv ?? 0} sub="Past due" tone={pulse?.overdueInv ? "red" : "default"} />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label={`Today's Focus — ${todayLabel}`}
          data={focusData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="OKR Progress"
          stages={ownerOKRs.map(okr => {
            const avg = okr.keyResults.length > 0 ? Math.round(okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length) : 0;
            return { label: okr.objective.slice(0, 20), count: avg, total: 100, color: avg >= 75 ? "#34d98b" : avg >= 50 ? "#f5a623" : "#ff5f5f" };
          })}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Focus Items"
          rows={todoTableRows as Record<string, unknown>[]}
          columns={[
            { key: "text",     header: "Item" },
            { key: "priority", header: "Priority", render: (v) => {
              const val = v as Priority;
              return <span className={cx("badge", priorityBadge[val])}>{val}</span>;
            }},
            { key: "status",   header: "Status", align: "right", render: (v) => {
              const val = v as string;
              const cls = val === "done" ? cx("badge", "badgeGreen") : cx("badge", "badgeMuted");
              return <span className={cls}>{val}</span>;
            }},
          ]}
          emptyMessage="No focus items added"
        />
      </WidgetGrid>

      {/* Tab selector for detail views */}
      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "decision journal" && (
        <div className={cx("flexCol", "gap16")}>
          <div className={cx("flexEnd", "mb4")}>
            <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Decision</button>
          </div>
          {decisions.map((d) => (
            <div key={d.title} className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("flexBetween", "mb12", styles.ownerAlignStart)}>
                <div>
                  <div className={cx("fontMono", "text11", "colorMuted", "mb6")}>{d.date}</div>
                  <div className={cx("fw700", "mb8", styles.ownerTitle15, styles.ownerLine14)}>{d.title}</div>
                  <div className={cx("flexRow", "gap6", "flexWrap")}>
                    {d.tags.map((tag) => (
                      <span key={tag} className={cx("badge", "badgeBlue")}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span className={cx("badge", "noShrink", d.outcome === "implemented" ? "badgeGreen" : d.outcome === "in-progress" ? "badgeAmber" : "badgeMuted")}>{d.outcome}</span>
              </div>
              <div className={cx("bgBg", "text13", styles.ownerDecisionBody)}>{d.context}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "private notes" && (
        <div className={cx("flexCol", "gap16")}>
          <div className={cx(styles.card, styles.ownerPrivateAlert)}>
            <span className={cx("text12", "colorMuted")}>&#128274; These notes are private and only visible to you.</span>
          </div>
          {privateNotes.map((note) => (
            <div key={note.client + note.date} className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("flexBetween", "mb12")}>
                <div className={cx("flexRow", "gap10")}>
                  <span className={cx("fw700", "text14", "colorAccent")}>{note.client}</span>
                  <span className={cx("badge", priorityBadge[note.priority])}>{note.priority}</span>
                </div>
                <div className={cx("flexRow", "gap6")}>
                  <span className={cx("text11", "colorMuted", "fontMono")}>{note.date}</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                </div>
              </div>
              <div className={cx("text13", "bgBg", styles.ownerPrivateNote, toneClass(priorityColors[note.priority]))}>{note.note}</div>
            </div>
          ))}
          <button type="button" className={cx("btnSm", "btnGhost", "textCenter", styles.ownerAddPrivateBtn)}>+ Add Private Note</button>
        </div>
      )}
    </div>
  );
}
