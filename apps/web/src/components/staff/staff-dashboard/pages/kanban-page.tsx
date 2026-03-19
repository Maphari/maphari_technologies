"use client";

import { cx, styles } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import type { KanbanColumn } from "../types";

/* ─── helpers ───────────────────────────────────────────────────── */
function colTopStrip(tone?: string) {
  if (tone === "var(--accent)") return "kbColTopStripAccent";
  if (tone === "var(--amber)")  return "kbColTopStripAmber";
  if (tone === "var(--green)")  return "kbColTopStripGreen";
  return "kbColTopStripDefault";
}

function colTitleColor(tone?: string) {
  if (tone === "var(--accent)") return "colorAccent";
  if (tone === "var(--amber)")  return "colorAmber";
  if (tone === "var(--green)")  return "colorGreen";
  return "colorMuted";
}

function colCountVariant(tone?: string) {
  if (tone === "var(--accent)") return "kbColCountAccentV3";
  if (tone === "var(--amber)")  return "kbColCountAmberV3";
  if (tone === "var(--green)")  return "kbColCountGreenV3";
  return "kbColCountDefaultV3";
}

function cardPriority(priority: "high" | "med" | "low") {
  if (priority === "high") return "kbCardHigh";
  if (priority === "med")  return "kbCardMed";
  return "kbCardLow";
}

function progressFill(tone: "blue" | "green" | "amber" | "purple") {
  if (tone === "blue")   return "kbProgressFillBlue";
  if (tone === "green")  return "kbProgressFillGreen";
  if (tone === "amber")  return "kbProgressFillAmber";
  if (tone === "purple") return "kbProgressFillPurple";
  return "kbProgressFillAccent";
}

function ageBadge(ageTone?: "muted" | "amber" | "red") {
  if (ageTone === "red")   return "kbCardAgeOver";
  if (ageTone === "amber") return "kbCardAgeWarn";
  return "kbCardAgeOk";
}

const VIEW_MODES = [
  { id: "all"            as const, label: "All",
    icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4"/></svg> },
  { id: "my_work"        as const, label: "My Work",
    icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { id: "urgent"         as const, label: "Urgent",
    icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="12.5" r="1.2" fill="currentColor"/></svg> },
  { id: "client_waiting" as const, label: "Client Waiting",
    icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { id: "blocked"        as const, label: "Blocked",
    icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 8h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
];

const SWIMLANES = [
  { id: "status"  as const, label: "Status"  },
  { id: "project" as const, label: "Project" },
  { id: "client"  as const, label: "Client"  },
];

/* ─── types ─────────────────────────────────────────────────────── */
type KanbanPageProps = {
  isActive: boolean;
  taskCount: number;
  openTasksCount: number;
  blockedTasksCount: number;
  overdueTasksCount: number;
  inProgressCount: number;
  inProgressLimit: number;
  kanbanColumns: KanbanColumn[];
  animateProgress: boolean;
  onOpenTaskFilters: () => void;
  onOpenTaskComposer: () => void;
  onOpenBlockedQueue: () => void;
  onOpenOverdueQueue: () => void;
  onTaskAction: (taskId: string, projectId: string, status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE") => void;
  onOpenTaskThread: (projectId: string) => void;
  hasProjectThread: (projectId: string) => boolean;
  kanbanViewMode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked";
  onKanbanViewModeChange: (mode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked") => void;
  kanbanSwimlane: "status" | "project" | "client";
  onKanbanSwimlaneChange: (mode: "status" | "project" | "client") => void;
  flowMetrics: {
    points: Array<{ label: string; created: number; completed: number; blocked: number }>;
    throughput7d: number;
    throughputPrev7d: number;
    cycleDays: number;
  };
  kanbanHealth: {
    wipBreach: boolean;
    agingTasks: number;
    blockedTasks: number;
    clientWaiting: number;
  };
  blockDraft: { taskId: string; projectId: string; title: string } | null;
  blockReason: string;
  blockSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  blockEta: string;
  creatingBlocker: boolean;
  onOpenBlockDraft: (taskId: string, projectId: string, title: string) => void;
  onCancelBlockDraft: () => void;
  onBlockReasonChange: (value: string) => void;
  onBlockSeverityChange: (value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
  onBlockEtaChange: (value: string) => void;
  onSubmitBlockDraft: () => void;
  onMoveTask: (
    taskId: string,
    projectId: string,
    currentStatus: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE",
    nextStatus:    "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"
  ) => void;
  announcement: string;
  /** Optional automation callback — escalate all blocked tasks */
  onAutoEscalateBlocked?: () => Promise<void>;
};

/* ─── component ─────────────────────────────────────────────────── */
export function KanbanPage({
  isActive,
  taskCount,
  openTasksCount,
  blockedTasksCount,
  overdueTasksCount,
  inProgressCount,
  inProgressLimit,
  kanbanColumns,
  animateProgress,
  onOpenTaskFilters,
  onOpenTaskComposer,
  onOpenBlockedQueue,
  onOpenOverdueQueue,
  onTaskAction,
  onOpenTaskThread,
  hasProjectThread,
  kanbanViewMode,
  onKanbanViewModeChange,
  kanbanSwimlane,
  onKanbanSwimlaneChange,
  flowMetrics,
  kanbanHealth,
  blockDraft,
  blockReason,
  blockSeverity,
  blockEta,
  creatingBlocker,
  onOpenBlockDraft,
  onCancelBlockDraft,
  onBlockReasonChange,
  onBlockSeverityChange,
  onBlockEtaChange,
  onSubmitBlockDraft,
  onMoveTask,
  announcement,
  onAutoEscalateBlocked,
}: KanbanPageProps) {
  const throughputDelta = flowMetrics.throughput7d - flowMetrics.throughputPrev7d;
  const chartMax = Math.max(1, ...flowMetrics.points.map((p) => Math.max(p.created, p.completed)));

  return (
    <section className={cx("page", "pageBody", "kanbanPage", "rdStudioPage", isActive && "pageActive")} id="page-kanban">
      <div className={styles.srOnly} aria-live="polite">{announcement}</div>

      {/* ── Automation: escalate blocked + aging tasks ───────────────── */}
      <AutomationBanner
        show={(kanbanHealth.blockedTasks > 0 || kanbanHealth.agingTasks > 0) && !!onAutoEscalateBlocked}
        variant="error"
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        }
        title={[
          kanbanHealth.blockedTasks > 0 && `${kanbanHealth.blockedTasks} blocked task${kanbanHealth.blockedTasks > 1 ? "s" : ""}`,
          kanbanHealth.agingTasks > 0 && `${kanbanHealth.agingTasks} aging task${kanbanHealth.agingTasks > 1 ? "s" : ""}`,
        ].filter(Boolean).join(" · ") + " need attention"}
        description="Escalating will raise severity, notify the project manager, and set 24h resolution ETA on all impacted items."
        actionLabel="Escalate all"
        onAction={onAutoEscalateBlocked ?? (async () => {})}
        dismissKey={`staff:kb-escalate:${kanbanHealth.blockedTasks}-${kanbanHealth.agingTasks}`}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeaderBar", "kbHeader")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Assignments</div>
            <h1 className={cx("pageTitleText")}>Kanban Board</h1>
            <p className={cx("pageSubtitleText")}>
              {taskCount} task{taskCount !== 1 ? "s" : ""} in flight · {openTasksCount} assigned to you. Move cards to keep delivery signal accurate.
            </p>
          </div>
          <div className={cx("pageActions", "kbHeaderActions")}>
            {blockedTasksCount > 0 && (
              <button className={cx("btnSm", "btnGhost", "kbAlertBtn", "kbAlertBtnRed")} type="button" onClick={onOpenBlockedQueue}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 8h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {blockedTasksCount} Blocked
              </button>
            )}
            {overdueTasksCount > 0 && (
              <button className={cx("btnSm", "btnGhost", "kbAlertBtn", "kbAlertBtnAmber")} type="button" onClick={onOpenOverdueQueue}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {overdueTasksCount} Overdue
              </button>
            )}
            <button className={cx("btnSm", "btnGhost")} type="button" onClick={onOpenTaskFilters}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Filters
            </button>
            <button className={cx("btnSm", "btnAccent", "kbAddTaskBtn")} type="button" onClick={onOpenTaskComposer}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* ── Mission control strip ───────────────────────────────────── */}
      <div className={cx("kbMissionStrip")}>
        {/* WIP Health */}
        <div className={cx("kbMetricCell", kanbanHealth.wipBreach && "kbMetricCellBreached")}>
          <span className={cx("kbMetricLabel")}>WIP Health</span>
          <span className={cx("kbMetricValue", kanbanHealth.wipBreach ? "kbMetricRed" : "kbMetricGreen")}>
            {kanbanHealth.wipBreach ? "Exceeded" : "Healthy"}
          </span>
          <span className={cx("kbMetricSub")}>{inProgressCount} / {inProgressLimit} in progress</span>
        </div>

        {/* Throughput */}
        <div className={cx("kbMetricCell")}>
          <span className={cx("kbMetricLabel")}>Throughput 7d</span>
          <span className={cx("kbMetricValue", "kbMetricAccent")}>{flowMetrics.throughput7d}</span>
          <span className={cx("kbMetricTrend",
            throughputDelta > 0 ? "kbMetricTrendUp"
            : throughputDelta < 0 ? "kbMetricTrendDown"
            : "kbMetricTrendFlat"
          )}>
            {throughputDelta > 0 ? "↑" : throughputDelta < 0 ? "↓" : "→"} {Math.abs(throughputDelta)} vs prev
          </span>
        </div>

        {/* Cycle time + spark chart */}
        <div className={cx("kbMetricCell")}>
          <span className={cx("kbMetricLabel")}>Avg Cycle Time</span>
          <span className={cx("kbMetricValue")}>{taskCount > 0 ? `${flowMetrics.cycleDays.toFixed(1)}d` : "—"}</span>
          {taskCount > 0 && (
            <div className={cx("kbMiniChart")}>
              {flowMetrics.points.map((p) => (
                <div key={p.label} className={cx("flex1", "flexColReverse", "gap1")}>
                  <div className={cx("kbMiniBar", "kbMiniBarCompleted")} style={{ '--pct': `${Math.max(2, Math.round((p.completed / chartMax) * 24))}px` } as React.CSSProperties} />
                  <div className={cx("kbMiniBar", "kbMiniBarCreated")} style={{ '--pct': `${Math.max(2, Math.round((p.created   / chartMax) * 14))}px` } as React.CSSProperties} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blocked */}
        <div className={cx("kbMetricCell", kanbanHealth.blockedTasks > 0 && "kbMetricCellBreached")}>
          <span className={cx("kbMetricLabel")}>Blocked</span>
          <span className={cx("kbMetricValue", kanbanHealth.blockedTasks > 0 ? "kbMetricRed" : "")}>{kanbanHealth.blockedTasks}</span>
          <span className={cx("kbMetricSub")}>task{kanbanHealth.blockedTasks !== 1 ? "s" : ""} halted</span>
        </div>

        {/* Client waiting */}
        <div className={cx("kbMetricCell", kanbanHealth.clientWaiting > 0 && "kbMetricCellAlert")}>
          <span className={cx("kbMetricLabel")}>Client Waiting</span>
          <span className={cx("kbMetricValue", kanbanHealth.clientWaiting > 0 ? "kbMetricAmber" : "")}>{kanbanHealth.clientWaiting}</span>
          <span className={cx("kbMetricSub")}>awaiting response</span>
        </div>

        {/* Aging */}
        <div className={cx("kbMetricCell", kanbanHealth.agingTasks > 0 && "kbMetricCellAlert")}>
          <span className={cx("kbMetricLabel")}>Aging Tasks</span>
          <span className={cx("kbMetricValue", kanbanHealth.agingTasks > 0 ? "kbMetricAmber" : "")}>{kanbanHealth.agingTasks}</span>
          <span className={cx("kbMetricSub")}>stale ≥ 3 days</span>
        </div>
      </div>

      {/* ── View + Swimlane controls ────────────────────────────────── */}
      <div className={cx("kbControlsRow")}>
        <div className={cx("kbViewPills")}>
          {VIEW_MODES.map((opt) => {
            const active = kanbanViewMode === opt.id;
            return (
              <button key={opt.id} type="button"
                className={cx("kbViewPill", active ? "kbViewPillActive" : "kbViewPillIdle")}
                onClick={() => onKanbanViewModeChange(opt.id)}
                aria-pressed={active}
              >
                {opt.icon}{opt.label}
              </button>
            );
          })}
        </div>
        <div className={cx("kbSwimlaneGroup")} role="group" aria-label="Group tasks by">
          <span className={cx("kbSwimlaneLabel")}>Group</span>
          {SWIMLANES.map((opt) => {
            const active = kanbanSwimlane === opt.id;
            return (
              <button key={opt.id} type="button"
                className={cx("kbSwimlaneBtn", active ? "kbSwimlaneBtnActive" : "kbSwimlaneBtnIdle")}
                onClick={() => onKanbanSwimlaneChange(opt.id)}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Block draft panel ───────────────────────────────────────── */}
      {blockDraft && (
        <div className={cx("kbBlockPanelV3")}>
          <div className={cx("kbBlockPanelHead")}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cx("noShrink")}>
              <circle cx="8" cy="8" r="6.5" stroke="var(--red)" strokeWidth="1.4"/>
              <path d="M4.5 8h7" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className={cx("kbBlockPanelTitle")}>Flag as Blocked</span>
            <span className={cx("kbBlockPanelTaskName")}>{blockDraft.title}</span>
            <button className={cx("tskComposerClose", "mlAuto")} type="button" onClick={onCancelBlockDraft}
              aria-label="Cancel">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className={cx("kbBlockPanelBody")}>
            <div className={cx("kbBlockFormGrid")}>
              <div className={cx("kbBlockFieldWrap")}>
                <label className={cx("kbBlockLabel")}>Block reason</label>
                <input className={styles.fieldInput} placeholder="Describe why this task is blocked…"
                  value={blockReason} onChange={(e) => onBlockReasonChange(e.target.value)} />
              </div>
              <div className={cx("kbBlockFieldWrap")}>
                <label className={cx("kbBlockLabel")}>Severity</label>
                <select className={styles.fieldInput} aria-label="Blocker severity"
                  value={blockSeverity} onChange={(e) => onBlockSeverityChange(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className={cx("kbBlockFieldWrap")}>
                <label className={cx("kbBlockLabel")}>Est. resolution</label>
                <input className={styles.fieldInput} type="datetime-local"
                  value={blockEta} onChange={(e) => onBlockEtaChange(e.target.value)} />
              </div>
            </div>
            <div className={cx("flexEnd", "gap8")}>
              <button className={cx("button", "buttonGhost")} type="button" onClick={onCancelBlockDraft}>Cancel</button>
              <button className={cx("button", "buttonBlue")} type="button" onClick={onSubmitBlockDraft}
                disabled={creatingBlocker || blockReason.trim().length < 4}>
                {creatingBlocker ? "Blocking…" : "Block + Escalate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Board ───────────────────────────────────────────────────── */}
      <div className={cx("kbBoard")}>
        {kanbanColumns.map((column) => {
          const wipLimit = column.wipLimit;
          const wipCount = typeof column.wipCount === "number" ? column.wipCount : column.tasks.length;
          const wipPct = wipLimit && wipLimit > 0 ? Math.min(100, (wipCount / wipLimit) * 100) : 0;
          const wipBreached = Boolean(wipLimit && wipCount >= wipLimit);
          return (
            <div key={column.title} className={cx("kbColV3")}>

              {/* Coloured top strip */}
              <div className={cx("kbColTopStrip", colTopStrip(column.tone))} />

              {/* Column header */}
              <div className={cx("kbColHeadV3", "rdStudioSection")}>
                <div className={cx("kbColHeadRow")}>
                  <span className={cx("kbColTitleV3", colTitleColor(column.tone), "rdStudioLabel")}>{column.title}</span>
                  <span className={cx("kbColCountV3", colCountVariant(column.countTone), "rdStudioMetric")}>{column.count}</span>
                </div>

                {/* WIP meter + aging */}
                {wipLimit ? (
                  <div className={cx("kbColWipRow")}>
                    <div className={cx("kbWipMeterBar")}>
                      <div
                        className={cx("kbWipMeterFill",
                          wipBreached ? "kbWipMeterFillOver"
                          : wipPct >= 66 ? "kbWipMeterFillWarn"
                          : "kbWipMeterFillOk"
                        )} style={{ '--pct': `${wipPct}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("kbWipMeterLabel", wipBreached ? "colorRed" : "colorMuted")}>
                      {wipCount}/{wipLimit} WIP
                    </span>
                    {typeof column.agingCount === "number" && column.agingCount > 0 && (
                      <span className={cx("kbColAgingChip", column.agingCount >= 3 ? "kbColAgingChipRed" : "kbColAgingChipAmber")}>
                        {column.agingCount} aging
                      </span>
                    )}
                  </div>
                ) : typeof column.agingCount === "number" && column.agingCount > 0 ? (
                  <div className={cx("kbColWipRow")}>
                    <span className={cx("kbColAgingChip", column.agingCount >= 3 ? "kbColAgingChipRed" : "kbColAgingChipAmber")}>
                      {column.agingCount} aging
                    </span>
                  </div>
                ) : null}

                {column.policyHint && <div className={cx("kbColPolicyV3")}>{column.policyHint}</div>}
              </div>

              {/* Scrollable card list */}
              <div className={cx("kbColBody")}>
                {column.tasks.length === 0 ? (
                  <div className={cx("kbColEmptyV3")}>
                    <div className={cx("kbColEmptyIcon")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className={cx("kbColEmptyText")}>No tasks</span>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <div key={task.id} className={cx("kbCardV3", cardPriority(task.priority), task.faded && "kbCardFaded")}>
                      <div className={cx("kbCardInner")}>

                        {/* Tag + blocked badge */}
                        <div className={cx("kbCardTopRow")}>
                          <span className={cx("kbCardTagV3")}>{task.tag}</span>
                          {task.serviceClass === "expedite" && (
                            <span className={cx("kbCardServiceBadge", "kbCardServiceExpedite")}>Expedite</span>
                          )}
                          {task.needsPrep && (
                            <span className={cx("kbCardPrepBadge")} title={task.needsPrepReason || "Needs prep"}>Needs prep</span>
                          )}
                          {task.blocked && (
                            <span className={cx("kbCardBlockedBadge")}>
                              <svg width="7" height="7" viewBox="0 0 10 10" fill="none" className={cx("inlineBlock", "mr3")} aria-hidden="true">
                                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M2.5 5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                              Blocked
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div className={cx("kbCardTitleV3", task.faded && "kbCardTitleFaded")}>{task.title}</div>

                        {/* Progress bar */}
                        {task.progress && (
                          <div className={cx("kbCardProgressV3")}>
                            <div className={cx("kbProgressBarTrack")}>
                              <div
                                className={cx("kbProgressBarFill", progressFill(task.progress.tone))}
                                style={{ '--pct': animateProgress ? `${task.progress.value}%` : "0%" } as React.CSSProperties}
                              />
                            </div>
                            <div className={cx("kbProgressPct")}>{task.progress.value}%</div>
                          </div>
                        )}
                        {!task.progress && (
                          <div className={cx("kbCardProgressV3", "kbCardProgressSpacer")} />
                        )}

                        {/* Meta: due + age + avatar */}
                        <div className={cx("kbCardMetaV3")}>
                          <span className={cx("kbCardDue", task.dueTone === "today" && "kbCardDueToday")}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={cx("opacity50")}>
                              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                              <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                            </svg>
                            {task.due}
                          </span>
                          <div className={cx("kbCardMetaRight")}>
                            {typeof task.ageDays === "number" && (
                              <span className={cx("kbCardAgeBadge", ageBadge(task.ageTone))}>{task.ageDays}d</span>
                            )}
                            {task.meta && (
                              <div className={cx("kbCardAvatarV3")} title={task.meta.avatar}>{task.meta.avatar}</div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={cx("kbCardActionsV3")}>
                          <button
                            className={cx("btnXs", hasProjectThread(task.projectId) ? "buttonGhost" : "buttonDisabled")}
                            type="button"
                            onClick={() => onOpenTaskThread(task.projectId)}
                            disabled={!hasProjectThread(task.projectId)}
                            title={hasProjectThread(task.projectId) ? "Open client thread" : "No thread"}
                          >
                            {hasProjectThread(task.projectId) ? "Thread" : "—"}
                          </button>

                          {task.status !== "DONE" && task.status !== "BLOCKED" && (
                            <button className={cx("btnXs", "kbBtnBlock")} type="button"
                              onClick={() => onOpenBlockDraft(task.id, task.projectId, task.title)}
                              title="Flag as blocked">
                              Block
                            </button>
                          )}

                          <button
                            className={cx("btnXs",
                              task.status === "DONE"    ? "tskBtnDone"
                              : task.status === "BLOCKED" ? "tskBtnUnblock"
                              : "tskBtnStart"
                            )}
                            type="button"
                            onClick={() => onTaskAction(task.id, task.projectId, task.status)}
                          >
                            {task.status === "DONE" ? (
                              <>
                                <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Done
                              </>
                            ) : task.status === "IN_PROGRESS" ? "Mark Done"
                              : task.status === "BLOCKED"     ? "Unblock"
                              : "Start →"}
                          </button>

                          <select className={cx("kbMoveSelect")}
                            aria-label={`Move ${task.title}`} value=""
                            onChange={(e) => {
                              const next = e.target.value as "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
                              if (!next) return;
                              onMoveTask(task.id, task.projectId, task.status, next);
                              e.currentTarget.value = "";
                            }}
                          >
                            <option value="">Move…</option>
                            {task.status !== "TODO"        && <option value="TODO">Backlog</option>}
                            {task.status !== "IN_PROGRESS" && <option value="IN_PROGRESS">In Progress</option>}
                            {task.status !== "BLOCKED"     && <option value="BLOCKED">Blocked</option>}
                            {task.status !== "DONE"        && <option value="DONE">Done</option>}
                          </select>
                        </div>

                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
