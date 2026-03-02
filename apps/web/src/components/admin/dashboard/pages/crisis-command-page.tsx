"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

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

const activeCrises: Crisis[] = [
  {
    id: "CRS-003",
    client: "Kestrel Capital",
    color: "var(--purple)",
    severity: "critical",
    title: "Invoice dispute + communication breakdown",
    opened: "2026-02-17",
    daysOpen: 6,
    owner: "Nomsa Dlamini",
    stage: "Escalated to Admin",
    lastAction: "Admin called CEO Feb 22",
    nextAction: "Follow-up call Feb 24 @ 10:00",
    health: 34,
    revenue: 21000,
    timeline: [
      { date: "Feb 17", event: "Client flagged invoice as disputed", who: "Kestrel Capital" },
      { date: "Feb 18", event: "Nomsa sent payment breakdown", who: "Nomsa Dlamini" },
      { date: "Feb 19", event: "No response - 2nd reminder sent", who: "Nomsa Dlamini" },
      { date: "Feb 21", event: "Escalated to Admin", who: "Nomsa Dlamini" },
      { date: "Feb 22", event: "Admin called client CEO", who: "Sipho Nkosi" }
    ]
  },
  {
    id: "CRS-004",
    client: "Dune Collective",
    color: "var(--amber)",
    severity: "high",
    title: "Project delay + scope creep complaint",
    opened: "2026-02-19",
    daysOpen: 4,
    owner: "Renzo Fabbri",
    stage: "Account Manager handling",
    lastAction: "Scope review sent Feb 21",
    nextAction: "Await client response by Feb 25",
    health: 43,
    revenue: 16000,
    timeline: [
      { date: "Feb 19", event: "Client emailed re: missed milestone", who: "Dune Collective" },
      { date: "Feb 20", event: "Renzo reviewed with Kira", who: "Renzo Fabbri" },
      { date: "Feb 21", event: "Scope change doc sent to client", who: "Renzo Fabbri" }
    ]
  }
];

const resolved = [
  { id: "CRS-001", client: "Luma Events", severity: "medium" as Severity, title: "Payment dispute - settled at 80%", resolved: "Jan 2026", daysToResolve: 12, outcome: "Write-off R3,200" },
  { id: "CRS-002", client: "Helios Digital", severity: "high" as Severity, title: "Project scope breakdown - client exited", resolved: "Jan 2026", daysToResolve: 21, outcome: "Client churned" }
] as const;

const escalationChain = [
  { level: 1, role: "Account Manager", person: "Nomsa Dlamini", trigger: "Client unresponsive 3+ days", color: "var(--accent)" },
  { level: 2, role: "Operations Admin", person: "Leilani Fotu", trigger: "AM escalation or invoice 7+ days overdue", color: "var(--blue)" },
  { level: 3, role: "Super Admin / Owner", person: "Sipho Nkosi", trigger: "Churn risk confirmed or legal threat", color: "var(--red)" }
] as const;

const recoveryPlaybooks = [
  { name: "Silent Client", steps: ["Send personal message from AM", "Follow-up with value recap", "Offer check-in call", "Escalate if 5 days silent"] },
  { name: "Invoice Dispute", steps: ["Send itemised breakdown", "Offer to schedule review call", "Offer flexible payment plan", "Escalate to admin if unresolved in 7 days"] },
  { name: "Scope Conflict", steps: ["Acknowledge the issue directly", "Share original scope document", "Propose change order", "Offer project reset session"] },
  { name: "Quality Complaint", steps: ["Apologise without admitting full fault", "Schedule quality review", "Offer revision at no cost", "Send satisfaction check 72h later"] }
] as const;

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

export function CrisisCommandPage() {
  const [activeTab, setActiveTab] = useState<CrisisTab>("active crises");
  const [expanded, setExpanded] = useState<string | null>("CRS-003");

  return (
    <div className={cx(styles.pageBody, styles.crisRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.crisEyebrow}>ADMIN / CRISIS &amp; ESCALATION</div>
          <h1 className={styles.pageTitle}>Crisis Command</h1>
          <div className={styles.pageSub}>Active crises - Escalation chains - Recovery playbooks</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent", styles.crisPrimaryBtn)}>+ Log New Crisis</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Crises", value: activeCrises.length.toString(), color: "var(--red)", sub: `${activeCrises.filter((c) => c.severity === "critical").length} critical` },
          { label: "Revenue at Risk", value: `R${(activeCrises.reduce((s, c) => s + c.revenue, 0) / 1000).toFixed(0)}k`, color: "var(--amber)", sub: "Monthly retainer value" },
          { label: "Avg Days Open", value: `${Math.round(activeCrises.reduce((s, c) => s + c.daysOpen, 0) / activeCrises.length)}d`, color: "var(--amber)", sub: "Active cases only" },
          { label: "Resolved (90d)", value: resolved.length.toString(), color: "var(--accent)", sub: `Avg ${Math.round(resolved.reduce((s, c) => s + c.daysToResolve, 0) / resolved.length)}d to resolve` }
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
                      <button type="button" className={cx("btnSm", "btnGhost", styles.crisResolveBtn)}>Mark Resolved</button>
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
                        <div className={cx(styles.crisPerson, levelToneClass(level.level))}>{level.person}</div>
                        <div className={styles.text12 + " " + styles.colorMuted}>Trigger: {level.trigger}</div>
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
                  <div key={i} className={styles.crisPlayStepRow}>
                    <div className={styles.crisPlayStepNum}>{i + 1}</div>
                    <div className={styles.crisPlayStepText}>{step}</div>
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
