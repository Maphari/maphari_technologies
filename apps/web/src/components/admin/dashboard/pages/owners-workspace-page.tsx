"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type Priority = "critical" | "high" | "medium" | "low";

const ownerOKRs = [
  {
    objective: "Scale to R500k MRR",
    keyResults: [
      { kr: "Close 5 new retainers", progress: 60, target: 5, current: 3 },
      { kr: "Upsell 3 existing clients to Growth tier", progress: 33, target: 3, current: 1 },
      { kr: "Zero churn Q1", progress: 100, target: 0, current: 0 },
    ],
  },
  {
    objective: "Build a high-performance team",
    keyResults: [
      { kr: "Hire Senior Designer by Apr 2026", progress: 50, target: 1, current: 0, note: "Interviewing" },
      { kr: "Avg staff delivery score >= 88", progress: 80, target: 88, current: 87.2 },
      { kr: "All staff complete Q1 L&D", progress: 40, target: 5, current: 2 },
    ],
  },
] as const;

const decisions = [
  {
    date: "Feb 22",
    title: "Approved Studio Outpost for Dune Collective scope extension",
    context: "Dune Collective project delayed due to scope creep. Approved additional R18k contractor budget to meet deadline.",
    tags: ["budget", "client"],
    outcome: "pending",
  },
  {
    date: "Feb 18",
    title: "Decided to pause Helios Digital pitch",
    context: "Prospect showed inconsistent buying signals across 4 touchpoints. Marketing team overstretched. Revisit Q3 2026.",
    tags: ["bd", "resourcing"],
    outcome: "implemented",
  },
  {
    date: "Feb 10",
    title: "Invested in Figma Enterprise upgrade",
    context: "Team of 6 regularly hitting file limits. Figma Enterprise solves collaboration issues and adds SSO. Annual cost R31,200.",
    tags: ["tooling", "budget"],
    outcome: "implemented",
  },
  {
    date: "Jan 28",
    title: "Approved Kira Bosman performance review plan",
    context: "Kira's utilisation at 65.5% and task completion rate below threshold. Agreed: bi-weekly 1:1s with Leilani, focused task assignments for 60 days.",
    tags: ["staff", "hr"],
    outcome: "in-progress",
  },
] as const;

const privateNotes: Array<{ client: string; note: string; priority: Priority; date: string }> = [
  {
    client: "Kestrel Capital",
    note: "CEO is under pressure from board. The dispute may be about cash flow, not the invoice itself. Consider offering a 30-day extension quietly before escalating.",
    priority: "high",
    date: "Feb 22",
  },
  {
    client: "Volta Studios",
    note: "Founder mentioned wanting to expand into events. Potential for a new project scope or retainer tier upgrade by mid-year.",
    priority: "medium",
    date: "Feb 15",
  },
  {
    client: "General",
    note: "Need to restructure BD process - currently too reactive. Target 2 proactive outreach per week from March.",
    priority: "medium",
    date: "Feb 10",
  },
];

const focusItems: Array<{ text: string; priority: Priority; done: boolean }> = [
  { text: "Call Kestrel Capital CEO re: invoice", priority: "critical", done: false },
  { text: "Review Kira performance plan with Leilani", priority: "high", done: false },
  { text: "Sign off Senior Designer job spec", priority: "high", done: false },
  { text: "Review Feb P&L with accountant", priority: "medium", done: true },
  { text: "Horizon Media proposal - review before sending", priority: "high", done: false },
];

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

export function OwnersWorkspacePage() {
  const [activeTab, setActiveTab] = useState<Tab>("owner dashboard");
  const [todos, setTodos] = useState(focusItems);

  const toggleTodo = (idx: number) => {
    setTodos((prev) => prev.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)));
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / PERSONAL WORKSPACE</div>
          <h1 className={styles.pageTitle}>Owner&apos;s Workspace</h1>
          <div className={styles.pageSub}>Private - Only visible to you</div>
        </div>
        <div className={cx("flexRow", "gap8", "p16", styles.ownerLockCard)}>
          <span className={cx("text14")}>&#128274;</span>
          <span className={cx("text12", "colorAccent", "fontMono")}>Admin-only - Not visible to staff</span>
        </div>
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "owner dashboard" && (
        <div className={styles.ownerDashSplit}>
          <div className={cx("flexCol", "gap16")}>
            <div className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking")}>Today&apos;s Focus - Mon 23 Feb</div>
              <div className={cx("flexCol", "gap10")}>
                {todos.map((item, i) => (
                  <div
                    key={item.text}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTodo(i)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleTodo(i);
                      }
                    }}
                    className={cx("flexRow", "gap12", "pointerCursor", toneClass(priorityColors[item.priority]), item.done && "opacity50")}
                  >
                    <div className={cx(styles.ownerTodoRow, item.done && styles.ownerTodoDone)}>
                      <div className={cx("flexCenter", "noShrink", styles.ownerTodoCheck, item.done && styles.ownerTodoCheckDone)}>{item.done && <span className={cx("text10", "fw800", styles.ownerCheckMark)}>&#10003;</span>}</div>
                      <div className={styles.ownerFlex1}>
                        <div className={cx("text13", styles.ownerTodoText, item.done && styles.ownerTodoTextDone)}>{item.text}</div>
                      </div>
                    </div>
                    <span className={cx("text10", "fontMono", "uppercase", "noShrink", styles.ownerToneText)}>{item.priority}</span>
                  </div>
                ))}
                <button type="button" className={cx("btnSm", "btnGhost", "colorMuted", styles.ownerAddFocusBtn)}>+ Add focus item</button>
              </div>
            </div>

            <div className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking")}>Business Pulse</div>
              <div className={cx("grid3", "gap12")}>
                {[
                  { label: "MRR", value: "R398.6k", sub: "\u25b2 5.4% MoM", color: "var(--accent)" },
                  { label: "Team Util.", value: "81%", sub: "Target: 85%", color: "var(--amber)" },
                  { label: "Client Health", value: "74/100", sub: "2 at risk", color: "var(--amber)" },
                  { label: "Pipeline", value: "R168k", sub: "5 prospects", color: "var(--blue)" },
                  { label: "Overdue Inv.", value: "R21k", sub: "1 invoice", color: "var(--red)" },
                  { label: "Runway", value: "3.9mo", sub: "Cash reserves", color: "var(--purple)" },
                ].map((s) => (
                  <div key={s.label} className={cx("bgBg", "p16", styles.ownerRounded8)}>
                    <div className={cx("text10", "colorMuted", "uppercase", "tracking", "mb4")}>{s.label}</div>
                    <div className={cx("fontMono", "fw800", "mb3", styles.ownerValue18, styles.ownerToneText, toneClass(s.color))}>{s.value}</div>
                    <div className={cx("text11", "colorMuted")}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cx("flexCol", "gap16")}>
            <div className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking")}>OKR Snapshot</div>
              {ownerOKRs.map((okr) => {
                const avgProgress = Math.round(okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length);
                return (
                  <div key={okr.objective} className={cx("mb16")}>
                    <div className={cx("flexBetween", "mb6")}>
                      <span className={cx("text12", "fw600", styles.ownerLine14)}>{okr.objective}</span>
                      <span className={cx("fontMono", "text13", "fw700", "noShrink", styles.ownerToneText, styles.ownerMl8, toneClass(avgProgress >= 75 ? "var(--accent)" : avgProgress >= 50 ? "var(--amber)" : "var(--red)"))}>{avgProgress}%</span>
                    </div>
                    <div className={cx(styles.progressBar, styles.ownerProgSm)}>
                      <progress
                        className={cx(styles.ownerProgFill, "uiProgress", toneClass(avgProgress >= 75 ? "var(--accent)" : avgProgress >= 50 ? "var(--amber)" : "var(--red)"))}
                        max={100}
                        value={avgProgress}
                      />
                    </div>
                  </div>
                );
              })}
              <button type="button" className={cx("btnSm", "btnGhost", "wFull", "mt4")}>View Full OKRs -&gt;</button>
            </div>
            <div className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking")}>Recent Decisions</div>
              {decisions.slice(0, 2).map((d) => (
                <div key={d.title} className={cx("bgBg", "mb10", styles.ownerDecisionMini)}>
                  <div className={cx("text11", "colorMuted", "mb4", "fontMono")}>{d.date}</div>
                  <div className={cx("text12", "fw600", styles.ownerLine14)}>{d.title}</div>
                </div>
              ))}
              <button type="button" className={cx("btnSm", "btnGhost", "wFull", "mt4")}>View Decision Journal -&gt;</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "personal okrs" && (
        <div className={cx("flexCol", "gap24")}>
          {ownerOKRs.map((okr) => (
            <div key={okr.objective} className={cx(styles.card, styles.ownerCard24)}>
              <div className={cx("fw800", "colorAccent", "mb20", styles.ownerTitle16)}>&#9678; {okr.objective}</div>
              <div className={cx("flexCol", "gap16")}>
                {okr.keyResults.map((kr, i) => (
                  <div key={kr.kr} className={cx("bgBg", "p16", styles.ownerRounded8)}>
                    <div className={cx("flexBetween", "mb8")}>
                      <span className={cx("text13", "fw600")}>
                        KR{i + 1}: {kr.kr}
                      </span>
                      <div className={cx("flexRow", "gap12")}>
                        {"note" in kr && kr.note ? <span className={cx("text11", "colorAmber", "fontMono")}>{kr.note}</span> : null}
                        <span className={cx("fontMono", "fw800", styles.ownerToneText, toneClass(kr.progress >= 75 ? "var(--accent)" : kr.progress >= 50 ? "var(--amber)" : "var(--red)"))}>{kr.progress}%</span>
                      </div>
                    </div>
                    <div className={cx(styles.progressBar, styles.ownerProgMd)}>
                      <progress
                        className={cx(styles.ownerProgFillMd, "uiProgress", toneClass(kr.progress >= 75 ? "var(--accent)" : kr.progress >= 50 ? "var(--amber)" : "var(--red)"))}
                        max={100}
                        value={kr.progress}
                      />
                    </div>
                    <div className={cx("text11", "colorMuted", "mt6", "fontMono")}>
                      Current: {kr.current} / Target: {kr.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
            <span className={cx("text12", "colorMuted")}>&#128274; These notes are private and only visible to you. They are not logged in the audit trail and not accessible to other admins.</span>
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
