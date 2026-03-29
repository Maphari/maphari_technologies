"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminCrisesWithRefresh,
  createCrisisWithRefresh,
  updateCrisisWithRefresh,
  loadEscalationChainWithRefresh,
  loadPlaybooksWithRefresh,
  type AdminCrisis,
  type AdminEscalationLevel,
  type AdminPlaybook,
} from "../../../../lib/api/admin";

type Severity = "critical" | "high" | "medium" | "low";
type CrisisTab = "active crises" | "escalation chain" | "recovery playbooks" | "resolved";

type Crisis = {
  id: string;
  client: string;
  color: string;
  severity: Severity;
  title: string;
  opened: string;
  daysOpen: number;
  owner: string;
  stage: string;
  lastAction: string;
  nextAction: string;
  health: number;
  revenue: number;
  timeline: Array<{ date: string; event: string; who: string }>;
};

type ResolvedCrisis = { id: string; client: string; severity: Severity; title: string; resolved: string; daysToResolve: number; outcome: string };

function severityToLocal(raw: string): Severity {
  const s = raw.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high")     return "high";
  if (s === "medium")   return "medium";
  return "low";
}

function mapApiCrisis(c: AdminCrisis): Crisis {
  const createdAt = new Date(c.createdAt);
  const daysOpen = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
  return {
    id:         c.id,
    client:     c.clientName ?? c.clientId ?? "Unknown",
    color:      "var(--accent)",
    severity:   severityToLocal(c.severity),
    title:      c.title,
    opened:     createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    daysOpen,
    owner:      c.ownerId ?? "Unassigned",
    stage:      c.status,
    lastAction: c.description ?? "—",
    nextAction: "—",
    health:     100,
    revenue:    0,
    timeline:   []
  };
}

function mapApiResolved(c: AdminCrisis): ResolvedCrisis {
  const resolvedDate = c.resolvedAt ? new Date(c.resolvedAt) : new Date(c.updatedAt);
  const created      = new Date(c.createdAt);
  const daysToResolve = Math.max(1, Math.floor((resolvedDate.getTime() - created.getTime()) / 86_400_000));
  return {
    id:            c.id,
    client:        c.clientName ?? c.clientId ?? "Unknown",
    severity:      severityToLocal(c.severity),
    title:         c.title,
    resolved:      resolvedDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    daysToResolve,
    outcome:       c.description ?? "Resolved"
  };
}

// escalationChain and recoveryPlaybooks are loaded from the API on mount

const tabs = ["active crises", "escalation chain", "recovery playbooks", "resolved"] as const;

function severityCardClass(severity: Severity): string {
  if (severity === "critical") return styles.crisCardCritical;
  if (severity === "high") return styles.crisCardHigh;
  if (severity === "medium") return styles.crisCardMedium;
  return styles.crisCardLow;
}

function severityBarClass(severity: Severity): string {
  if (severity === "critical") return styles.crisSeverityBarCritical;
  if (severity === "high") return styles.crisSeverityBarHigh;
  if (severity === "medium") return styles.crisSeverityBarMedium;
  return styles.crisSeverityBarLow;
}

function severityTagClass(severity: Severity): string {
  if (severity === "critical") return styles.crisSeverityTagCritical;
  if (severity === "high") return styles.crisSeverityTagHigh;
  if (severity === "medium") return styles.crisSeverityTagMedium;
  return styles.crisSeverityTagLow;
}

function severityTimelineDotClass(severity: Severity): string {
  if (severity === "critical") return styles.crisTimelineDotCritical;
  if (severity === "high") return styles.crisTimelineDotHigh;
  if (severity === "medium") return styles.crisTimelineDotMedium;
  return styles.crisTimelineDotLow;
}

function levelToneClass(level: number): string {
  if (level === 1) return styles.crisLevelTone1;
  if (level === 2) return styles.crisLevelTone2;
  return styles.crisLevelTone3;
}

export function CrisisCommandPage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<CrisisTab>("active crises");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [allCrises, setAllCrises] = useState<AdminCrisis[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [escalationChain, setEscalationChain] = useState<AdminEscalationLevel[]>([]);
  const [recoveryPlaybooks, setRecoveryPlaybooks] = useState<AdminPlaybook[]>([]);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      loadAdminCrisesWithRefresh(session),
      loadEscalationChainWithRefresh(session),
      loadPlaybooksWithRefresh(session),
    ]).then(([cr, er, pbr]) => {
      if (cr.nextSession) saveSession(cr.nextSession);
      if (cr.error) setError(cr.error.message ?? "Failed to load crises.");
      else if (cr.data) setAllCrises(cr.data);
      if (!er.error && er.data) setEscalationChain(er.data);
      if (!pbr.error && pbr.data) setRecoveryPlaybooks(pbr.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load crises.");
      setLoading(false);
    });
  }, [session]);

  const activeCrises: Crisis[]         = allCrises.filter((c) => c.status !== "RESOLVED").map(mapApiCrisis);
  const resolved: ResolvedCrisis[]     = allCrises.filter((c) => c.status === "RESOLVED").map(mapApiResolved);

  async function handleLogCrisis() {
    if (!session) return;
    const title = window.prompt("Crisis title:");
    if (!title) return;
    const r = await createCrisisWithRefresh(session, { title, severity: "HIGH", status: "ACTIVE" });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      setError(r.error.message ?? "Failed to log crisis");
      return;
    }
    if (r.data) setAllCrises((prev) => [r.data!, ...prev]);
  }

  async function handleMarkResolved(id: string) {
    if (!session) return;
    const r = await updateCrisisWithRefresh(session, id, { status: "RESOLVED", resolvedAt: new Date().toISOString() });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) setAllCrises((prev) => prev.map((c) => (c.id === id ? r.data! : c)));
  }

  const criticalCount = activeCrises.filter(c => c.severity === "critical").length;
  const avgDaysOpen   = activeCrises.length > 0 ? Math.round(activeCrises.reduce((s, c) => s + c.daysOpen, 0) / activeCrises.length) : 0;
  const avgDaysToResolve = resolved.length > 0 ? Math.round(resolved.reduce((s, c) => s + c.daysToResolve, 0) / resolved.length) : 0;

  const crisisSeverityData = [
    { label: "Critical", count: activeCrises.filter(c => c.severity === "critical").length },
    { label: "High",     count: activeCrises.filter(c => c.severity === "high").length     },
    { label: "Medium",   count: activeCrises.filter(c => c.severity === "medium").length   },
    { label: "Low",      count: activeCrises.filter(c => c.severity === "low").length      },
  ];

  const crisisTableRows = activeCrises.map(c => ({
    client:   c.client,
    title:    c.title,
    severity: c.severity,
    daysOpen: `${c.daysOpen}d`,
    stage:    c.stage,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / CRISIS</div>
          <h1 className={styles.pageTitle}>Crisis Command</h1>
          <div className={styles.pageSub}>Active crises · Escalation chains · Recovery playbooks</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" onClick={() => { void handleLogCrisis(); }} className={cx("btnSm", "btnAccent")}>+ Log New Crisis</button>
        </div>
      </div>

      {error ? (
        <div className={cx(styles.card, "textCenter", "colorRed", "text13")}>
          <div className={styles.cardInner}>{error}</div>
        </div>
      ) : null}

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Active Crises" value={activeCrises.length} sub={`${criticalCount} critical`} tone={activeCrises.length > 0 ? "red" : "default"} />
        <StatWidget label="Revenue at Risk" value={`R${(activeCrises.reduce((s, c) => s + c.revenue, 0) / 1000).toFixed(0)}k`} sub="Monthly retainer value" tone="amber" />
        <StatWidget label="Avg Days Open" value={`${avgDaysOpen}d`} sub="Active cases" tone={avgDaysOpen > 7 ? "red" : "default"} />
        <StatWidget label="Resolved (90d)" value={resolved.length} sub={`Avg ${avgDaysToResolve}d to resolve`} subTone="up" tone="green" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Crises by Severity"
          data={crisisSeverityData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#ff5f5f"
        />
        <PipelineWidget
          label="Crisis Status"
          stages={[
            { label: "Active",   count: activeCrises.length, total: Math.max(allCrises.length, 1), color: "#ff5f5f" },
            { label: "Resolved", count: resolved.length,     total: Math.max(allCrises.length, 1), color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Active Crises"
          rows={crisisTableRows as Record<string, unknown>[]}
          columns={[
            { key: "client",   header: "Client" },
            { key: "title",    header: "Title" },
            { key: "severity", header: "Severity", render: (v) => {
              const val = v as Severity;
              const cls = val === "critical" || val === "high" ? cx("badge", "badgeRed") : val === "medium" ? cx("badge", "badgeAmber") : cx("badge", "badgeMuted");
              return <span className={cls}>{val}</span>;
            }},
            { key: "daysOpen", header: "Days Open", align: "right" },
            { key: "stage",    header: "Stage",     align: "right" },
          ]}
          emptyMessage="No active crises"
        />
      </WidgetGrid>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as CrisisTab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "escalation chain" ? (
        <div className={styles.crisEscSplit}>
          <div>
            <div className={styles.crisChainList}>
              {escalationChain.map((level, i) => (
                <div key={level.level}>
                  <div className={cx(styles.crisChainCard, levelToneClass(level.level))}>
                    <div className={styles.crisChainRow}>
                      <div className={cx(styles.crisLevelBubble, levelToneClass(level.level))}>{level.level}</div>
                      <div className={styles.onboardGrow}>
                        <div className={styles.crisRole}>{level.role}</div>
                        <div className={cx(styles.crisPerson, levelToneClass(level.level))}>{level.personLabel}</div>
                        <div className={styles.text12 + " " + styles.colorMuted}>Trigger: {level.triggerDesc}</div>
                      </div>
                      <button type="button" className={cx("btnSm", "btnGhost")}>Contact Now</button>
                    </div>
                  </div>
                  {i < escalationChain.length - 1 ? <div className={styles.crisArrow}>↓</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "recovery playbooks" ? (
        <div className={styles.crisPlaybookGrid}>
          {recoveryPlaybooks.map((pb) => (
            <div key={pb.name} className={styles.crisPlayCard}>
              <div className={styles.crisPlayTitle}>{pb.name}</div>
              <div className={styles.crisPlaySub}>Recovery Protocol</div>
              <div className={styles.crisPlaySteps}>
                {pb.steps.map((step, i) => (
                  <div key={step.id} className={styles.crisPlayStepRow}>
                    <div className={styles.crisPlayStepNum}>{i + 1}</div>
                    <div className={styles.crisPlayStepText}>{step.action}</div>
                  </div>
                ))}
              </div>
              <button type="button" className={cx("btnSm", "btnGhost", styles.crisApplyBtn)}>Apply to Active Crisis</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
