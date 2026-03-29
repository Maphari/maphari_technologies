"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
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

  return (
    <div className={cx(styles.pageBody, styles.crisRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.crisEyebrow}>ADMIN / CRISIS &amp; ESCALATION</div>
          <h1 className={styles.pageTitle}>Crisis Command</h1>
          <div className={styles.pageSub}>Active crises - Escalation chains - Recovery playbooks</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" onClick={() => { void handleLogCrisis(); }} className={cx("btnSm", "btnAccent", styles.crisPrimaryBtn)}>+ Log New Crisis</button>
        </div>
      </div>

      {loading ? (
        <div className={cx(styles.card, "textCenter", "colorMuted", "text13")}>
          <div className={styles.cardInner}>Loading crises…</div>
        </div>
      ) : error ? (
        <div className={cx(styles.card, "textCenter", "colorRed", "text13")}>
          <div className={styles.cardInner}>{error}</div>
        </div>
      ) : null}

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Crises", value: activeCrises.length.toString(), color: "var(--red)", sub: `${activeCrises.filter((c) => c.severity === "critical").length} critical` },
          { label: "Revenue at Risk", value: `R${(activeCrises.reduce((s, c) => s + c.revenue, 0) / 1000).toFixed(0)}k`, color: "var(--amber)", sub: "Monthly retainer value" },
          { label: "Avg Days Open", value: `${activeCrises.length > 0 ? Math.round(activeCrises.reduce((s, c) => s + c.daysOpen, 0) / activeCrises.length) : 0}d`, color: "var(--amber)", sub: "Active cases only" },
          { label: "Resolved (90d)", value: resolved.length.toString(), color: "var(--accent)", sub: `Avg ${resolved.length > 0 ? Math.round(resolved.reduce((s, c) => s + c.daysToResolve, 0) / resolved.length) : 0}d to resolve` }
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.label === "Active Crises" && styles.crisRiskStat)}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as CrisisTab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "active crises" ? (
        <div className={styles.crisList16}>
          {activeCrises.length === 0 ? (
            <div className={cx(styles.card, "textCenter", "colorMuted", "text13")}>
              <div className={styles.cardInner}>
                <div className={cx("fw700", "text15", "mb8")}>No active crises</div>
                <div>All client accounts are running smoothly. If a crisis is identified, use "+ Log New Crisis" to open a case.</div>
              </div>
            </div>
          ) : null}
          {activeCrises.map((crisis) => (
            <div key={crisis.id} className={cx(styles.crisCard, severityCardClass(crisis.severity))}>
              <div
                role="button"
                tabIndex={0}
                className={styles.crisHead}
                onClick={() => setExpanded(expanded === crisis.id ? null : crisis.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpanded(expanded === crisis.id ? null : crisis.id);
                  }
                }}
              >
                <div className={styles.crisHeadTop}>
                  <div className={styles.crisHeadLeft}>
                    <div className={cx(styles.crisSeverityBar, severityBarClass(crisis.severity))} />
                    <div>
                      <div className={styles.crisMetaLine}>
                        <span className={styles.crisId}>{crisis.id}</span>
                        <span className={cx(styles.crisSeverityTag, severityTagClass(crisis.severity))}>{crisis.severity}</span>
                        <span className={cx(styles.crisClient, colorClass(crisis.color))}>{crisis.client}</span>
                      </div>
                      <div className={styles.crisTitle}>{crisis.title}</div>
                      <div className={styles.crisInfoRow}>
                        <span>Owner: <span className={styles.colorText}>{crisis.owner}</span></span>
                        <span>Stage: <span className={styles.colorAmber}>{crisis.stage}</span></span>
                        <span>Open: <span className={crisis.daysOpen >= 7 ? "colorRed" : "colorAmber"}>{crisis.daysOpen}d</span></span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.crisHeadRight}>
                    <div className={styles.crisTiny}>Revenue at risk</div>
                    <div className={styles.crisRevenue}>R{crisis.revenue.toLocaleString()}</div>
                    <div className={styles.crisHealth}>Health: <span className={crisis.health < 50 ? "colorRed" : "colorAmber"}>{crisis.health}/100</span></div>
                  </div>
                </div>

                <div className={styles.crisActionGrid}>
                  <div className={styles.crisActionBox}>
                    <div className={styles.crisTinyUpper}>Last Action</div>
                    <div className={styles.text12}>{crisis.lastAction}</div>
                  </div>
                  <div className={styles.crisNextBox}>
                    <div className={styles.crisNextUpper}>Next Action</div>
                    <div className={styles.text12}>{crisis.nextAction}</div>
                  </div>
                </div>
              </div>

              {expanded === crisis.id ? (
                <div className={styles.crisExpanded}>
                  <div className={styles.crisExpandedInner}>
                    <div className={styles.crisSectionTitle}>Crisis Timeline</div>
                    <div className={styles.crisTimelineWrap}>
                      <div className={styles.crisTimelineLine} />
                      <div className={styles.crisTimelineList}>
                        {crisis.timeline.map((event, i) => (
                          <div key={i} className={styles.crisTimelineRow}>
                            <span className={styles.crisTimelineDate}>{event.date}</span>
                            <div className={cx(styles.crisTimelineDot, severityTimelineDotClass(crisis.severity))} />
                            <div>
                              <div className={styles.text13}>{event.event}</div>
                              <div className={styles.text11 + " " + styles.colorMuted}>{event.who}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.crisBtnRow}>
                      <button type="button" className={cx("btnSm", "btnAccent")}>Log Action</button>
                      <button type="button" className={cx("btnSm", "btnGhost")}>Escalate</button>
                      <button type="button" onClick={() => { void handleMarkResolved(crisis.id); }} className={cx("btnSm", "btnGhost", styles.crisResolveBtn)}>Mark Resolved</button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

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
          <div className={styles.crisPolicyCard}>
            <div className={styles.crisSectionTitle}>Escalation Policy</div>
            {[
              { threshold: "3 days silent", action: "AM sends personal message", level: 1 },
              { threshold: "5 days silent", action: "AM logs alert + checks in", level: 1 },
              { threshold: "7 days silent", action: "Escalate to Operations Admin", level: 2 },
              { threshold: "Invoice 7+ days overdue", action: "Auto-escalate to Admin", level: 2 },
              { threshold: "Churn risk > 60%", action: "Super Admin intervention", level: 3 },
              { threshold: "Legal threat received", action: "Immediate Super Admin + legal review", level: 3 }
            ].map((policy) => (
              <div key={policy.threshold} className={styles.crisPolicyRow}>
                <div className={cx(styles.crisPolicyLevel, levelToneClass(policy.level))}>{policy.level}</div>
                <div>
                  <div className={styles.crisThreshold}>{policy.threshold}</div>
                  <div className={styles.text12 + " " + styles.colorText}>{policy.action}</div>
                </div>
              </div>
            ))}
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

      {activeTab === "resolved" ? (
        <div className={styles.crisResolvedList}>
          {resolved.length === 0 ? (
            <div className={cx(styles.card, "textCenter", "colorMuted", "text13")}>
              <div className={styles.cardInner}>
                No resolved crises in the last 90 days. Resolved cases will appear here for post-mortem review.
              </div>
            </div>
          ) : null}
          {resolved.map((r) => (
            <div key={r.id} className={styles.crisResolvedRow}>
              <span className={styles.crisId}>{r.id}</span>
              <span className={cx(styles.crisSeverityTag, severityTagClass(r.severity))}>{r.severity}</span>
              <div>
                <div className={styles.fw600}>{r.client}</div>
                <div className={styles.text12 + " " + styles.colorMuted}>{r.title}</div>
              </div>
              <div>
                <div className={styles.crisTiny}>Days</div>
                <div className={styles.crisDays}>{r.daysToResolve}d</div>
              </div>
              <div>
                <div className={styles.crisTiny}>Resolved</div>
                <div className={styles.text12}>{r.resolved}</div>
              </div>
              <div className={cx(styles.text12, r.outcome.includes("churned") ? "colorRed" : "colorAmber")}>{r.outcome}</div>
              <button type="button" className={cx("btnSm", "btnGhost")}>View Post-Mortem</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
