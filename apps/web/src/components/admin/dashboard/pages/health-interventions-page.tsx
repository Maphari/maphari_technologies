"use client";

import { useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";

type TriggerType = "health-drop" | "invoice-overdue" | "nps-drop" | "quality-complaint" | "silent-client";
type InterventionStatus = "open" | "resolved" | "churned";
type Tab = "all interventions" | "open" | "resolved" | "patterns";

type InterventionAction = {
  date: string;
  action: string;
  outcome: string;
  by: string;
};

type Intervention = {
  id: string;
  client: string;
  clientColor: string;
  trigger: string;
  triggerType: TriggerType;
  adminWhoActed: string;
  date: string;
  status: InterventionStatus;
  healthBefore: number;
  healthAfter: number | null;
  churnRiskBefore: number;
  churnRiskAfter: number | null;
  actions: InterventionAction[];
  nextStep: string | null;
  mrrAtRisk: number;
  notes: string;
};

const interventions: Intervention[] = [
  {
    id: "INT-018",
    client: "Kestrel Capital",
    clientColor: "var(--purple)",
    trigger: "Health score dropped from 72 -> 44 in 14 days",
    triggerType: "health-drop",
    adminWhoActed: "Sipho Nkosi",
    date: "Feb 22",
    status: "open",
    healthBefore: 72,
    healthAfter: null,
    churnRiskBefore: 38,
    churnRiskAfter: null,
    actions: [
      { date: "Feb 22", action: "Called client CEO directly", outcome: "Acknowledged invoice dispute. Agreed to 72h resolution window.", by: "Sipho Nkosi" },
      { date: "Feb 22", action: "Paused non-critical AM tasks to focus on Kestrel", outcome: "Nomsa cleared schedule for Monday follow-up.", by: "Sipho Nkosi" },
    ],
    nextStep: "Follow-up call Feb 24 @ 10:00 to confirm invoice resolution",
    mrrAtRisk: 21000,
    notes: "Client may be experiencing internal budget pressure. Keep tone supportive, not transactional.",
  },
  {
    id: "INT-017",
    client: "Dune Collective",
    clientColor: "var(--amber)",
    trigger: "Invoice overdue 14+ days + communication breakdown",
    triggerType: "invoice-overdue",
    adminWhoActed: "Sipho Nkosi",
    date: "Feb 19",
    status: "open",
    healthBefore: 54,
    healthAfter: null,
    churnRiskBefore: 52,
    churnRiskAfter: null,
    actions: [
      { date: "Feb 19", action: "Reviewed full project history with Renzo", outcome: "Identified scope creep as root cause of tension.", by: "Sipho Nkosi" },
      { date: "Feb 20", action: "Reached out to Dune Collective via personal email", outcome: "No response yet.", by: "Sipho Nkosi" },
      { date: "Feb 21", action: "Sent formal scope change documentation", outcome: "Awaiting client signature.", by: "Renzo Fabbri" },
    ],
    nextStep: "Chase scope doc signature by Feb 25. If no response, consider escalation to legal review.",
    mrrAtRisk: 16000,
    notes: "Dune's founder is hard to reach. Consider going through their ops manager instead.",
  },
  {
    id: "INT-016",
    client: "Mira Health",
    clientColor: "var(--blue)",
    trigger: "NPS dropped from 8 -> 6 in two consecutive surveys",
    triggerType: "nps-drop",
    adminWhoActed: "Leilani Fotu",
    date: "Jan 15",
    status: "resolved",
    healthBefore: 61,
    healthAfter: 74,
    churnRiskBefore: 44,
    churnRiskAfter: 22,
    actions: [
      { date: "Jan 15", action: "Reviewed all client comms from past 6 weeks", outcome: "Identified response time delays as key frustration.", by: "Leilani Fotu" },
      { date: "Jan 16", action: "Restructured project workflow to add weekly status email", outcome: "Implemented immediately.", by: "Leilani Fotu" },
      { date: "Jan 20", action: "Nomsa scheduled bi-weekly check-ins with client", outcome: "First check-in positive - client felt heard.", by: "Nomsa Dlamini" },
      { date: "Feb 5", action: "NPS re-survey sent", outcome: "Score improved to 8. Client praised increased communication.", by: "Nomsa Dlamini" },
    ],
    nextStep: null,
    mrrAtRisk: 21600,
    notes: "This intervention worked. Pattern: structured communication frequency was the fix.",
  },
  {
    id: "INT-015",
    client: "Helios Digital",
    clientColor: "var(--orange)",
    trigger: "Client requested project pause - quality concerns",
    triggerType: "quality-complaint",
    adminWhoActed: "Sipho Nkosi",
    date: "Jan 5",
    status: "churned",
    healthBefore: 41,
    healthAfter: 0,
    churnRiskBefore: 68,
    churnRiskAfter: 100,
    actions: [
      { date: "Jan 5", action: "Admin called client founder directly", outcome: "Client expressed deep frustration with revision quality.", by: "Sipho Nkosi" },
      { date: "Jan 8", action: "Offered free revision round + discounted next month", outcome: "Client declined - decided to exit.", by: "Sipho Nkosi" },
      { date: "Jan 10", action: "Initiated structured offboarding", outcome: "Exit completed Jan 31. R16k MRR lost.", by: "Leilani Fotu" },
    ],
    nextStep: null,
    mrrAtRisk: 16000,
    notes: "Post-mortem completed. Main lesson: QA gate at round 2 should have triggered admin review.",
  },
];

const triggerTypeConfig: Record<TriggerType, { color: string; label: string; icon: string }> = {
  "health-drop": { color: "var(--red)", label: "Health Drop", icon: "\uD83D\uDCC9" },
  "invoice-overdue": { color: "var(--amber)", label: "Invoice Overdue", icon: "\uD83D\uDCB8" },
  "nps-drop": { color: "var(--orange)", label: "NPS Drop", icon: "\uD83D\uDCCA" },
  "quality-complaint": { color: "var(--purple)", label: "Quality Complaint", icon: "\u26A0" },
  "silent-client": { color: "var(--red)", label: "Silent Client", icon: "\uD83D\uDD07" },
};

const statusConfig: Record<InterventionStatus, { color: string; label: string }> = {
  open: { color: "var(--red)", label: "Open" },
  resolved: { color: "var(--accent)", label: "Resolved" },
  churned: { color: "var(--muted)", label: "Churned" },
};

const tabs: Tab[] = ["all interventions", "open", "resolved", "patterns"];

export function HealthInterventionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all interventions");
  const [expanded, setExpanded] = useState<string | null>("INT-018");

  const open = interventions.filter((i) => i.status === "open");
  const resolved = interventions.filter((i) => i.status === "resolved");
  const churned = interventions.filter((i) => i.status === "churned");
  const mrrAtRisk = open.reduce((s, i) => s + i.mrrAtRisk, 0);

  const displayList = activeTab === "open" ? open : activeTab === "resolved" ? resolved : interventions;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={cx(styles.pageEyebrow, "colorRed")}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Health Interventions</h1>
          <div className={styles.pageSub}>Every time admin stepped in - Why - What happened - Outcome</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", styles.healthIntvDangerBtn)}>+ Log Intervention</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Open Interventions", value: open.length.toString(), color: "var(--red)", sub: "Active cases", highlight: true },
          { label: "MRR at Risk", value: `R${(mrrAtRisk / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Across open cases", highlight: false },
          { label: "Resolved (90d)", value: resolved.length.toString(), color: "var(--accent)", sub: "Health recovered", highlight: false },
          { label: "Churned Despite Intervention", value: churned.length.toString(), color: "var(--muted)", sub: "Couldn't save", highlight: false },
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, s.highlight && styles.healthIntvStatHighlight)}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      {(activeTab === "all interventions" || activeTab === "open" || activeTab === "resolved") && (
        <div className={cx("flexCol", "gap16")}>
          {displayList.map((intv) => {
            const sc = statusConfig[intv.status];
            const tc = triggerTypeConfig[intv.triggerType];
            const isExp = expanded === intv.id;
            return (
              <div key={intv.id} className={cx("bgSurface", styles.healthIntvCard, toneClass(intv.status === "open" ? tc.color : intv.status === "resolved" ? "var(--accent)" : "var(--border)"))}>
                <div
                  role="button"
                  tabIndex={0}
                  className={cx("p24", "pointerCursor")}
                  onClick={() => setExpanded(isExp ? null : intv.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpanded(isExp ? null : intv.id);
                    }
                  }}
                >
                  <div className={styles.healthIntvHeadGrid}>
                    <span className={cx("fontMono", "text10", "colorMuted")}>{intv.id}</span>
                    <div>
                      <div className={cx("fw700", "text14", colorClass(intv.clientColor))}>{intv.client}</div>
                      <div className={cx("text10", "colorMuted")}>by {intv.adminWhoActed} - {intv.date}</div>
                    </div>
                    <div>
                      <div className={cx("flexRow", "gap8", "mb4")}>
                        <span className={styles.healthIntvIcon14}>{tc.icon}</span>
                        <span className={cx("text10", "fontMono", "uppercase", colorClass(tc.color))}>{tc.label}</span>
                      </div>
                      <div className={cx("text13", "fw600")}>{intv.trigger}</div>
                    </div>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb4")}>Health: before -&gt; after</div>
                      <div className={cx("fontMono", "text13")}>
                        <span className={intv.healthBefore < 60 ? "colorRed" : "colorAmber"}>{intv.healthBefore}</span>
                        <span className={cx("colorMuted")}> -&gt; </span>
                        <span className={intv.healthAfter ? (intv.healthAfter >= 70 ? "colorAccent" : "colorAmber") : "colorMuted"}>{intv.healthAfter ?? "-"}</span>
                      </div>
                    </div>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb2")}>MRR at Risk</div>
                      <div className={cx("fontMono", "fw700", "colorRed")}>R{(intv.mrrAtRisk / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb2")}>Actions</div>
                      <div className={cx("fontMono", "fw700", "colorBlue")}>{intv.actions.length}</div>
                    </div>
                    <span className={cx("text10", "fontMono", "textCenter", styles.healthIntvStatusChip, toneClass(sc.color))}>{sc.label}</span>
                  </div>
                </div>

                {isExp && (
                  <div className={styles.healthIntvExpanded}>
                    <div className={styles.healthIntvExpandedGrid}>
                      <div>
                        <div className={cx("text11", "colorMuted", "uppercase", "tracking", "mb16")}>Action Timeline</div>
                        <div className={styles.healthIntvTimelineWrap}>
                          <div className={styles.healthIntvTimelineLine} />
                          <div className={cx("flexCol", "gap16")}>
                            {intv.actions.map((a, i) => (
                              <div key={i} className={styles.healthIntvTimelineRow}>
                                <span className={cx("fontMono", "text10", "colorMuted", "textRight", styles.healthIntvDateTop2)}>{a.date}</span>
                                <div className={cx(styles.healthIntvTimelineDot, toneClass(tc.color))} />
                                <div className={cx("bgBg", "p12", styles.healthIntvTimelineCard, toneClass(tc.color))}>
                                  <div className={cx("fw600", "text13", "mb4")}>{a.action}</div>
                                  <div className={cx("text11", "colorAccent", "mb4")}>-&gt; {a.outcome}</div>
                                  <div className={cx("text10", "colorMuted")}>{a.by}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {intv.nextStep && (
                          <div className={cx("bgSurface", "mt16", "p14", styles.healthIntvNextStep)}>
                            <div className={cx("text10", "colorAccent", "uppercase", "tracking", "mb4")}>Next Step</div>
                            <div className={cx("text13")}>{intv.nextStep}</div>
                          </div>
                        )}
                      </div>

                      <div className={cx("flexCol", "gap12")}>
                        {intv.notes && (
                          <div className={cx("bgSurface", "p16", styles.healthIntvPrivateNote)}>
                            <div className={cx("text10", "colorBlue", "uppercase", "tracking", "mb6")}>Private Admin Note</div>
                            <div className={cx("text12", styles.healthIntvLine16)}>{intv.notes}</div>
                          </div>
                        )}
                        <div className={cx("bgBg", "p16", styles.healthIntvRounded8)}>
                          <div className={cx("text10", "colorMuted", "uppercase", "tracking", "mb12")}>Health Impact</div>
                          <div className={cx("grid2", "gap8")}>
                            {[
                              { label: "Health Before", value: intv.healthBefore, color: intv.healthBefore < 60 ? "var(--red)" : "var(--amber)" },
                              { label: "Health After", value: intv.healthAfter ?? "-", color: intv.healthAfter ? (intv.healthAfter >= 70 ? "var(--accent)" : "var(--amber)") : "var(--muted)" },
                              { label: "Churn Risk Before", value: `${intv.churnRiskBefore}%`, color: intv.churnRiskBefore > 50 ? "var(--red)" : "var(--amber)" },
                              { label: "Churn Risk After", value: intv.churnRiskAfter !== null ? `${intv.churnRiskAfter}%` : "-", color: intv.churnRiskAfter !== null ? (intv.churnRiskAfter < 30 ? "var(--accent)" : "var(--amber)") : "var(--muted)" },
                            ].map((m) => (
                              <div key={m.label} className={cx("bgSurface", "textCenter", "p10", styles.healthIntvRounded6)}>
                                <div className={cx("fontMono", "fw800", styles.healthIntvMetricVal, colorClass(m.color))}>{m.value}</div>
                                <div className={cx("textXs", "colorMuted", "mt2")}>{m.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {intv.status === "open" && (
                          <div className={cx("flexRow", "gap8")}>
                            <button type="button" className={cx("btnSm", "btnAccent", styles.healthIntvFlex1)}>Mark Resolved</button>
                            <button type="button" className={cx("btnSm", "btnGhost", styles.healthIntvFlex1)}>Log Action</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "patterns" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Most Common Triggers</div>
            {(Object.entries(triggerTypeConfig) as Array<[TriggerType, { color: string; label: string; icon: string }]>).map(([key, cfg]) => {
              const count = interventions.filter((i) => i.triggerType === key).length;
              if (count === 0) return null;
              return (
                <div key={key} className={cx("flexRow", "gap12", "mb14")}>
                  <span className={styles.healthIntvIcon16}>{cfg.icon}</span>
                  <span className={cx("text12", styles.healthIntvFlex1, colorClass(cfg.color))}>{cfg.label}</span>
                  <div className={styles.healthIntvMiniTrack}>
                    <progress className={cx(styles.healthIntvMiniFill, "uiProgress", toneClass(cfg.color))} max={100} value={(count / interventions.length) * 100} />
                  </div>
                  <span className={cx("fontMono", "fw700", styles.healthIntvCountW16, colorClass(cfg.color))}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Intervention Outcomes</div>
            {[
              { label: "Resolved - health recovered", count: resolved.length, color: "var(--accent)" },
              { label: "Open - still in progress", count: open.length, color: "var(--amber)" },
              { label: "Churned despite intervention", count: churned.length, color: "var(--red)" },
            ].map((o) => (
              <div key={o.label} className={cx("flexRow", "gap12", "mb14")}>
                <span className={cx("text12", styles.healthIntvFlex1, colorClass(o.color))}>{o.label}</span>
                <div className={styles.healthIntvMiniTrack}>
                  <progress className={cx(styles.healthIntvMiniFill, "uiProgress", toneClass(o.color))} max={100} value={(o.count / interventions.length) * 100} />
                </div>
                <span className={cx("fontMono", "fw700", styles.healthIntvCountW16, colorClass(o.color))}>{o.count}</span>
              </div>
            ))}
            <div className={cx("bgSurface", "p16", "mt20", styles.healthIntvLearnCard)}>
              <div className={cx("text11", "colorAccent", "mb4")}>Key Learning</div>
              <div className={cx("text12", "colorMuted", styles.healthIntvLine17)}>
                Interventions triggered by NPS drops have the highest recovery rate. Invoice and quality issues are harder to recover - earlier detection is critical.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
