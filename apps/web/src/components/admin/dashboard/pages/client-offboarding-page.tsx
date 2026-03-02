"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";

type ReasonType = "natural" | "churn" | "paused";

type ChecklistItem = {
  id: number;
  category: "Financial" | "Delivery" | "Legal" | "Communication" | "System" | "BD";
  task: string;
  done: boolean;
  doneDate?: string;
};

type Offboarding = {
  id: string;
  client: string;
  clientColor: string;
  reason: string;
  reasonType: ReasonType;
  am: string;
  startedDate: string;
  targetDate: string;
  mrr: number;
  outstandingInvoice: number;
  status: "in-progress" | "complete";
  checklist: ChecklistItem[];
};

type PostMortem = {
  client: string;
  clientColor: string;
  type: "churn" | "natural";
  completedDate: string;
  rootCause: string;
  whatWentWell: string[];
  whatWentWrong: string[];
  preventionActions: string[];
  npsScore: number;
};

const offboardings: Offboarding[] = [
  {
    id: "OFB-003",
    client: "Studio Outpost",
    clientColor: "var(--red)",
    reason: "Project complete - no retainer renewal",
    reasonType: "natural",
    am: "Nomsa Dlamini",
    startedDate: "Feb 10",
    targetDate: "Feb 28",
    mrr: 0,
    outstandingInvoice: 8400,
    status: "in-progress",
    checklist: [
      { id: 1, category: "Financial", task: "Send final invoice", done: true, doneDate: "Feb 11" },
      { id: 2, category: "Financial", task: "Confirm payment received", done: false },
      { id: 3, category: "Financial", task: "Issue credit note if applicable", done: true, doneDate: "Feb 11" },
      { id: 4, category: "Delivery", task: "Deliver all final files to client", done: true, doneDate: "Feb 12" },
      { id: 5, category: "Delivery", task: "Transfer project assets (source files, fonts, IP)", done: false },
      { id: 6, category: "Legal", task: "Confirm IP transfer signed off", done: false },
      { id: 7, category: "Legal", task: "Archive contract copy", done: true, doneDate: "Feb 13" },
      { id: 8, category: "Communication", task: "Send farewell email from AM", done: true, doneDate: "Feb 14" },
      { id: 9, category: "Communication", task: "Request exit feedback / NPS", done: false },
      { id: 10, category: "System", task: "Revoke client portal access", done: false },
      { id: 11, category: "System", task: "Archive project in system", done: false },
      { id: 12, category: "BD", task: "Log re-engagement date (6 months)", done: false }
    ]
  },
  {
    id: "OFB-002",
    client: "Helios Digital",
    clientColor: "var(--amber)",
    reason: "Client churned - dissatisfied with deliverable quality",
    reasonType: "churn",
    am: "Renzo Fabbri",
    startedDate: "Jan 10",
    targetDate: "Jan 31",
    mrr: 16000,
    outstandingInvoice: 0,
    status: "complete",
    checklist: [
      { id: 1, category: "Financial", task: "Send final invoice", done: true, doneDate: "Jan 11" },
      { id: 2, category: "Financial", task: "Confirm payment received", done: true, doneDate: "Jan 20" },
      { id: 3, category: "Delivery", task: "Deliver all final files", done: true, doneDate: "Jan 12" },
      { id: 4, category: "Legal", task: "IP transfer confirmed", done: true, doneDate: "Jan 15" },
      { id: 5, category: "Communication", task: "Exit survey sent", done: true, doneDate: "Jan 14" },
      { id: 6, category: "System", task: "Portal access revoked", done: true, doneDate: "Jan 31" },
      { id: 7, category: "BD", task: "Post-mortem completed", done: true, doneDate: "Feb 2" }
    ]
  }
];

const postMortems: PostMortem[] = [
  {
    client: "Helios Digital",
    clientColor: "var(--amber)",
    type: "churn",
    completedDate: "Feb 2",
    rootCause: "Deliverable quality did not meet client expectations on rounds 3+. No escalation was triggered until too late.",
    whatWentWell: ["Project kickoff smooth", "Communication was frequent", "Invoice process clean"],
    whatWentWrong: ["QA gate missed on Rd 2", "Client feedback loop too slow", "AM did not flag scope risk early enough"],
    preventionActions: [
      "Add QA escalation trigger at Rd 2",
      "AM to flag any 3rd round revision to admin within 24h",
      "Bi-weekly project health check for all projects"
    ],
    npsScore: 3
  }
];

const offboardingTemplate: Array<{ category: ChecklistItem["category"]; tasks: string[] }> = [
  { category: "Financial", tasks: ["Send final invoice", "Confirm payment received", "Issue credit note if applicable"] },
  { category: "Delivery", tasks: ["Deliver all final files to client", "Transfer source files, fonts, IP", "Confirm no outstanding deliverables"] },
  { category: "Legal", tasks: ["Confirm IP transfer signed off", "Archive contract copy", "Check for any NDA obligations"] },
  { category: "Communication", tasks: ["Send farewell email from AM", "Request exit feedback / NPS", "Admin personal note to client founder"] },
  { category: "System", tasks: ["Revoke client portal access", "Archive project in system", "Remove from active reporting"] },
  { category: "BD", tasks: ["Log churn reason", "Set re-engagement reminder (3-6 months)", "Document learnings for post-mortem"] }
];

const tabs = ["active offboardings", "post-mortems", "offboarding template", "churn analysis"] as const;
type Tab = (typeof tabs)[number];

const categoryColors: Record<ChecklistItem["category"], string> = {
  Financial: "var(--accent)",
  Delivery: "var(--blue)",
  Legal: "var(--accent)",
  Communication: "var(--amber)",
  System: "var(--amber)",
  BD: "var(--muted)"
};

const reasonColors: Record<ReasonType, string> = {
  natural: "var(--blue)",
  churn: "var(--red)",
  paused: "var(--amber)"
};

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.cobFillAccent;
    case "var(--red)":
      return styles.cobFillRed;
    case "var(--amber)":
      return styles.cobFillAmber;
    case "var(--blue)":
      return styles.cobFillBlue;
    case "var(--purple)":
      return styles.cobFillPurple;
    default:
      return styles.cobFillMuted;
  }
}

function reasonClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.cobReasonAccent;
    case "var(--red)":
      return styles.cobReasonRed;
    case "var(--amber)":
      return styles.cobReasonAmber;
    case "var(--blue)":
      return styles.cobReasonBlue;
    case "var(--purple)":
      return styles.cobReasonPurple;
    default:
      return styles.cobReasonMuted;
  }
}

function templateCardClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.cobTemplateCardAccent;
    case "var(--red)":
      return styles.cobTemplateCardRed;
    case "var(--amber)":
      return styles.cobTemplateCardAmber;
    case "var(--blue)":
      return styles.cobTemplateCardBlue;
    case "var(--purple)":
      return styles.cobTemplateCardPurple;
    default:
      return styles.cobTemplateCardMuted;
  }
}

export function ClientOffboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active offboardings");
  const [expanded, setExpanded] = useState<string>("OFB-003");

  const active = offboardings.filter((o) => o.status === "in-progress");
  const complete = offboardings.filter((o) => o.status === "complete");

  return (
    <div className={cx(styles.pageBody, styles.cobRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Client Offboarding</h1>
          <div className={styles.pageSub}>Structured exits, file handover, IP transfer, and post-mortems</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Start Offboarding</button>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Active Offboardings", value: active.length.toString(), color: "var(--amber)", sub: "In progress" },
          { label: "Completed (90d)", value: complete.length.toString(), color: "var(--muted)", sub: "Archived" },
          { label: "Outstanding Invoices", value: `R${offboardings.reduce((s, o) => s + o.outstandingInvoice, 0).toLocaleString()}`, color: offboardings.some((o) => o.outstandingInvoice > 0) ? "var(--red)" : "var(--accent)", sub: "Across active offboardings" },
          { label: "MRR Lost (90d)", value: `R${offboardings.filter((o) => o.status === "complete").reduce((s, o) => s + o.mrr, 0).toLocaleString()}`, color: "var(--red)", sub: "From churned clients" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
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
        primaryColor={"var(--accent)"}
        mutedColor={"var(--muted)"}
        panelColor={"var(--surface)"}
        borderColor={"var(--border)"}
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "active offboardings" ? (
          <div className={styles.cobList}>
            {offboardings.map((ofb) => {
              const done = ofb.checklist.filter((t) => t.done).length;
              const total = ofb.checklist.length;
              const pct = Math.round((done / total) * 100);
              const isExpanded = expanded === ofb.id;
              const byCategory = offboardingTemplate
                .map((c) => ({ ...c, tasks: ofb.checklist.filter((t) => t.category === c.category) }))
                .filter((c) => c.tasks.length > 0);

              return (
                <div key={ofb.id} className={cx(styles.cobCard, ofb.status === "complete" && styles.cobCardComplete)}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={styles.cobHead}
                    onClick={() => setExpanded(isExpanded ? "" : ofb.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpanded(isExpanded ? "" : ofb.id);
                      }
                    }}
                  >
                    <div className={styles.cobHeadRow}>
                      <div className={styles.cobClientBlock}>
                        <div className={cx(styles.cobLeadBar, fillClass(ofb.status === "complete" ? "var(--accent)" : reasonColors[ofb.reasonType]))} />
                        <div>
                          <div className={styles.cobHeadMeta}>
                            <span className={styles.cobMono}>{ofb.id}</span>
                            <span className={cx(styles.cobReasonPill, reasonClass(reasonColors[ofb.reasonType]))}>{ofb.reasonType}</span>
                          </div>
                          <div className={cx(styles.cobClientName, colorClass(ofb.clientColor))}>{ofb.client}</div>
                          <div className={styles.cobMuted}>{ofb.reason}</div>
                          <div className={styles.cobMuted}>AM: {ofb.am} · Target: {ofb.targetDate}</div>
                        </div>
                      </div>
                      <div className={styles.cobProgressBlock}>
                        <div className={cx(styles.cobProgressPct, pct === 100 ? "colorAccent" : pct >= 60 ? "colorAmber" : "colorRed")}>{pct}%</div>
                        <div className={styles.cobMuted}>{done}/{total} tasks</div>
                        {ofb.outstandingInvoice > 0 ? <div className={styles.cobOutstanding}>R{ofb.outstandingInvoice.toLocaleString()} outstanding</div> : null}
                      </div>
                    </div>
                    <div className={styles.progressBar}>
                      <progress className={cx("barFill", "uiProgress", pct === 100 ? styles.cobFillAccent : pct >= 60 ? styles.cobFillAmber : styles.cobFillRed)} max={100} value={pct} />
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className={styles.cobExpanded}>
                      <div className={styles.cobExpandedGrid}>
                        {byCategory.map((cat) => (
                          <div key={cat.category} className={styles.cobCategoryCard}>
                            <div className={cx(styles.cobCategoryTitle, colorClass(categoryColors[cat.category]))}>{cat.category}</div>
                            {cat.tasks.map((task) => (
                              <div key={task.id} className={styles.cobTaskRow}>
                                <div className={cx(styles.cobCheck, task.done && styles.cobCheckDone)}>
                                  {task.done ? <span className={styles.cobCheckMark}>✓</span> : null}
                                </div>
                                <div className={styles.cobTaskTextWrap}>
                                  <div className={cx(styles.cobTaskText, task.done && styles.cobTaskTextDone)}>{task.task}</div>
                                  {task.doneDate ? <div className={styles.cobTaskDate}>{task.doneDate}</div> : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {ofb.status === "in-progress" ? (
                        <div className={styles.cobActionRow}>
                          <button type="button" className={cx("btnSm", "btnAccent")}>Mark Complete</button>
                          <button type="button" className={cx("btnSm", "btnGhost")}>Update Progress</button>
                          <button type="button" className={styles.cobPostBtn}>Start Post-Mortem</button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "post-mortems" ? (
          <div className={styles.cobPmList}>
            {postMortems.map((pm) => (
              <div key={pm.client} className={styles.cobPmCard}>
                <div className={styles.cobPmHead}>
                  <div>
                    <div className={cx(styles.cobPmClient, colorClass(pm.clientColor))}>{pm.client}</div>
                    <div className={styles.cobMuted}>Post-mortem completed {pm.completedDate}</div>
                  </div>
                  <div className={styles.cobPmScoreWrap}>
                    <div className={styles.cobLabel}>Exit NPS</div>
                    <div className={cx(styles.cobPmScore, pm.npsScore >= 8 ? "colorAccent" : pm.npsScore >= 5 ? "colorAmber" : "colorRed")}>{pm.npsScore}/10</div>
                  </div>
                </div>
                <div className={styles.cobRootCause}>
                  <div className={styles.cobRootCauseLabel}>Root Cause</div>
                  <div className={styles.cobRootCauseText}>{pm.rootCause}</div>
                </div>
                <div className={styles.cobPmGrid3}>
                  <div className={styles.cobPmWell}>
                    <div className={styles.cobPmHeadingWell}>What Went Well</div>
                    {pm.whatWentWell.map((w) => <div key={w} className={styles.cobPmLine}>+ {w}</div>)}
                  </div>
                  <div className={styles.cobPmWrong}>
                    <div className={styles.cobPmHeadingWrong}>What Went Wrong</div>
                    {pm.whatWentWrong.map((w) => <div key={w} className={styles.cobPmLine}>- {w}</div>)}
                  </div>
                  <div className={styles.cobPmPrev}>
                    <div className={styles.cobPmHeadingPrev}>Prevention Actions</div>
                    {pm.preventionActions.map((a) => <div key={a} className={styles.cobPmLine}>&gt; {a}</div>)}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className={styles.cobCreateBtn}>+ Create Post-Mortem</button>
          </div>
        ) : null}

        {activeTab === "offboarding template" ? (
          <div className={styles.cobTemplateGrid}>
            {offboardingTemplate.map((cat) => (
              <div key={cat.category} className={cx(styles.cobTemplateCard, templateCardClass(categoryColors[cat.category]))}>
                <div className={cx(styles.cobTemplateTitle, colorClass(categoryColors[cat.category]))}>{cat.category}</div>
                {cat.tasks.map((task, i) => (
                  <div key={i} className={styles.cobTemplateTask}>
                    <div className={styles.cobTemplateBox} />
                    <span className={styles.text12}>{task}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "churn analysis" ? (
          <div className={styles.cobAnalysisSplit}>
            <div className={cx("card", "p24")}>
              <div className={styles.cobSectionTitle}>Offboarding Reasons</div>
              {[
                { reason: "Project complete - no renewal", count: 1, color: "var(--blue)" },
                { reason: "Quality dissatisfaction", count: 1, color: "var(--red)" },
                { reason: "Budget constraints", count: 0, color: "var(--amber)" },
                { reason: "Went in-house", count: 0, color: "var(--muted)" }
              ].map((r) => (
                <div key={r.reason} className={styles.cobBarRow}>
                  <span className={styles.text12}>{r.reason}</span>
                  <div className={styles.cobTrack80}>
                    <progress className={cx("barFill", "uiProgress", fillClass(r.color))} max={100} value={(r.count / offboardings.length) * 100} />
                  </div>
                  <span className={cx(styles.cobBarCount, colorClass(r.color))}>{r.count}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.cobSectionTitle}>Re-Engagement Pipeline</div>
              <div className={styles.cobMutedBlock}>Clients who leave on good terms are logged for re-engagement at 3-6 months. Churned clients are logged with context for learnings only.</div>
              {[
                { client: "Studio Outpost", date: "Aug 2026", type: "Re-engage", color: "var(--accent)" },
                { client: "Helios Digital", date: "n/a", type: "Learnings only", color: "var(--muted)" }
              ].map((re) => (
                <div key={re.client} className={styles.cobReRow}>
                  <div>
                    <div className={styles.cobCellStrong}>{re.client}</div>
                    <div className={styles.cobMuted}>{re.type}</div>
                  </div>
                  <span className={cx(styles.cobMonoDate, colorClass(re.color))}>{re.date}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
