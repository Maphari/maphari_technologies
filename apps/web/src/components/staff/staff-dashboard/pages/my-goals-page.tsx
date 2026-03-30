"use client";

import { useEffect, useCallback, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  loadStaffGoalsWithRefresh,
  createStaffGoalWithRefresh,
  updateStaffGoalWithRefresh,
  deleteStaffGoalWithRefresh,
  type StaffGoal,
  type CreateGoalInput,
} from "@/lib/api/staff/goals";
import { saveSession } from "@/lib/auth/session";
import type { AuthSession } from "@/lib/auth/session";
import { Alert } from "@/components/shared/ui/alert";

// ── Types ─────────────────────────────────────────────────────────────────────

type MyGoalsPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

type Quarter = string;

function buildQuarters(year: number): Quarter[] {
  return ["Q1", "Q2", "Q3", "Q4"].map((q) => `${q}-${year}`);
}

const QUARTERS: Quarter[] = buildQuarters(new Date().getFullYear());

function currentQuarter(): Quarter {
  const month = new Date().getMonth(); // 0-indexed
  const year  = new Date().getFullYear();
  return `Q${Math.floor(month / 3) + 1}-${year}`;
}

// ── Empty form defaults ───────────────────────────────────────────────────────

function emptyDraft(quarter: Quarter): CreateGoalInput {
  return {
    title:       "",
    description: "",
    targetDate:  "",
    quarter,
    progress:    0,
  };
}

// ── Helper: badge tone for status ─────────────────────────────────────────────

function statusBadgeCx(status: StaffGoal["status"]): string {
  if (status === "ACHIEVED") return cx("badge", "badgeGreen");
  if (status === "CANCELLED") return cx("badge", "badgeMuted");
  return cx("badge", "badgeAccent");
}

function statusLabel(status: StaffGoal["status"]): string {
  if (status === "ACHIEVED") return "Achieved";
  if (status === "CANCELLED") return "Cancelled";
  return "Active";
}

// ── KPI strip data ────────────────────────────────────────────────────────────

function computeKpis(goals: StaffGoal[]) {
  const active   = goals.filter((g) => g.status === "ACTIVE").length;
  const achieved = goals.filter((g) => g.status === "ACHIEVED").length;
  const total    = goals.length;
  const avgProg  = total === 0
    ? 0
    : Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / total);
  return { active, achieved, avgProg };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GoalCardSkeleton() {
  return (
    <div className={cx("okrCard", "opacity50")}>
      <div className={cx("skeletonBlock", "skeleH68")} />
      <div className={cx("skeletonBlock", "skeleH20")} />
      <div className={cx("skeletonBlock", "skeleH20")} />
    </div>
  );
}

// ── Add Goal Modal ────────────────────────────────────────────────────────────

type AddGoalModalProps = {
  draft:      CreateGoalInput;
  saving:     boolean;
  saveError:  string | null;
  onChange:   (patch: Partial<CreateGoalInput>) => void;
  onSave:     () => void;
  onClose:    () => void;
};

function AddGoalModal({ draft, saving, saveError, onChange, onSave, onClose }: AddGoalModalProps) {
  return (
    <div className={cx("modalOverlay")} onClick={onClose}>
      <div
        className={cx("modalBox")}
        role="dialog"
        aria-modal="true"
        aria-label="Add goal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("okrModalTitle")}>Add a New Goal</div>

        <div className={cx("flexCol", "gap16")}>
          {/* Title */}
          <div className={cx("okrFormField")}>
            <label className={cx("okrFormLabel")}>Goal Title *</label>
            <input
              className={cx("input")}
              type="text"
              placeholder="e.g. Complete React certification"
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div className={cx("okrFormField")}>
            <label className={cx("okrFormLabel")}>Description (optional)</label>
            <textarea
              className={cx("input")}
              rows={3}
              placeholder="What does success look like?"
              value={draft.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              disabled={saving}
            />
          </div>

          {/* Quarter + Target Date row */}
          <div className={cx("flexRow", "gap12")}>
            <div className={cx("okrFormField", "okrFormFlexItem")}>
              <label className={cx("okrFormLabel")}>Quarter *</label>
              <select
                className={cx("input")}
                value={draft.quarter}
                onChange={(e) => onChange({ quarter: e.target.value })}
                disabled={saving}
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className={cx("okrFormField", "okrFormFlexItem")}>
              <label className={cx("okrFormLabel")}>Target Date *</label>
              <input
                className={cx("input")}
                type="date"
                value={draft.targetDate}
                onChange={(e) => onChange({ targetDate: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {saveError && (
          <div className={cx("formErrorMsg")}>{saveError}</div>
        )}
        <div className={cx("okrModalActions")}>
          <button className={cx("btnGhost")} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.title.trim() || !draft.targetDate}
          >
            {saving ? "Saving…" : "Add Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

type GoalCardProps = {
  goal:            StaffGoal;
  updatingId:      string | null;
  onUpdateProgress:(id: string, progress: number) => void;
  onMarkAchieved:  (id: string) => void;
  onCancel:        (id: string) => void;
};

function GoalCard({ goal, updatingId, onUpdateProgress, onMarkAchieved, onCancel }: GoalCardProps) {
  const [localProgress, setLocalProgress] = useState(goal.progress);
  const isBusy = updatingId === goal.id;

  // Sync if server data changes (e.g. after save)
  useEffect(() => { setLocalProgress(goal.progress); }, [goal.progress]);

  const targetDateLabel = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  const fillCx = goal.status === "ACHIEVED"
    ? cx("okrProgressFill", "okrProgressFillGreen")
    : cx("okrProgressFill");

  return (
    <div className={cx("okrCard")}>
      {/* Header row */}
      <div className={cx("okrCardHeader")}>
        <div className={cx("okrCardTitle")}>{goal.title}</div>
        <span className={statusBadgeCx(goal.status)}>{statusLabel(goal.status)}</span>
      </div>

      {/* Meta: quarter + target date */}
      <div className={cx("okrCardMeta")}>
        <span className={cx("badge", "badgeMuted")}>{goal.quarter}</span>
        <span className={cx("okrCardTargetDate")}>Due {targetDateLabel}</span>
      </div>

      {/* Description */}
      {goal.description && (
        <div className={cx("okrCardDesc")}>{goal.description}</div>
      )}

      {/* Progress bar */}
      <div className={cx("okrProgressRow")}>
        <div className={cx("okrProgressTrack")}>
          <div
            className={fillCx}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <span className={cx("okrProgressPct")}>{goal.progress}%</span>
      </div>

      {/* Slider to update progress (only for ACTIVE goals) */}
      {goal.status === "ACTIVE" && (
        <div className={cx("okrSliderRow")}>
          <Ic n="trending-up" sz={14} c="var(--muted2)" />
          <input
            type="range"
            className={cx("okrSlider")}
            min={0}
            max={100}
            step={5}
            value={localProgress}
            onChange={(e) => setLocalProgress(Number(e.target.value))}
            onMouseUp={() => onUpdateProgress(goal.id, localProgress)}
            onTouchEnd={() => onUpdateProgress(goal.id, localProgress)}
            disabled={isBusy}
            aria-label="Update progress"
          />
          <span className={cx("okrSliderVal")}>{localProgress}%</span>
        </div>
      )}

      {/* Action buttons */}
      {goal.status === "ACTIVE" && (
        <div className={cx("okrCardActions")}>
          <button
            className={cx("btnSm")}
            onClick={() => onMarkAchieved(goal.id)}
            disabled={isBusy}
          >
            {isBusy ? "Saving…" : "Mark Achieved"}
          </button>
          <button
            className={cx("btnGhost", "btnSm")}
            onClick={() => onCancel(goal.id)}
            disabled={isBusy}
            aria-label="Cancel goal"
          >
            <Ic n="x" sz={13} c="var(--muted)" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function MyGoalsPage({ isActive, session }: MyGoalsPageProps) {
  const [quarter, setQuarter]         = useState<Quarter>(currentQuarter());
  const [goals, setGoals]             = useState<StaffGoal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [draft, setDraft]             = useState<CreateGoalInput>(emptyDraft(currentQuarter()));
  const [saving, setSaving]           = useState(false);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [retryCount, setRetryCount]         = useState(0);
  const [mutationError, setMutationError]   = useState<string | null>(null);
  const [saveError, setSaveError]           = useState<string | null>(null);

  // ── Load goals ──────────────────────────────────────────────────────────────
  const loadGoals = useCallback((sess: AuthSession, q: string) => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadStaffGoalsWithRefresh(sess, q).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        setError(result.error?.message ?? "Failed to load goals.");
        return;
      }
      setGoals(result.data);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load goals.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    return loadGoals(session, quarter);
  }, [session?.accessToken, isActive, quarter, retryCount, loadGoals]);

  // ── Create goal ─────────────────────────────────────────────────────────────
  const handleSaveGoal = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await createStaffGoalWithRefresh(session, draft);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        setSaveError(result.error?.message ?? "Failed to create goal. Please try again.");
        return;
      }
      setGoals((prev) => [result.data!, ...prev]);
      setShowModal(false);
      setDraft(emptyDraft(quarter));
    } finally {
      setSaving(false);
    }
  }, [session, draft, quarter]);

  // ── Update progress ─────────────────────────────────────────────────────────
  const handleUpdateProgress = useCallback(async (id: string, progress: number) => {
    if (!session) return;
    setUpdatingId(id);
    setMutationError(null);
    try {
      const result = await updateStaffGoalWithRefresh(session, id, { progress });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        setMutationError(result.error?.message ?? "Failed to update progress. Please try again.");
        return;
      }
      setGoals((prev) => prev.map((g) => g.id === id ? result.data! : g));
    } finally {
      setUpdatingId(null);
    }
  }, [session]);

  // ── Mark achieved ───────────────────────────────────────────────────────────
  const handleMarkAchieved = useCallback(async (id: string) => {
    if (!session) return;
    setUpdatingId(id);
    setMutationError(null);
    try {
      const result = await updateStaffGoalWithRefresh(session, id, { status: "ACHIEVED", progress: 100 });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        setMutationError(result.error?.message ?? "Failed to mark goal as achieved. Please try again.");
        return;
      }
      setGoals((prev) => prev.map((g) => g.id === id ? result.data! : g));
    } finally {
      setUpdatingId(null);
    }
  }, [session]);

  // ── Cancel goal ─────────────────────────────────────────────────────────────
  const handleCancelGoal = useCallback(async (id: string) => {
    if (!session) return;
    setUpdatingId(id);
    setMutationError(null);
    try {
      const result = await deleteStaffGoalWithRefresh(session, id);
      if (result.nextSession) saveSession(result.nextSession);
      // Guard ghost delete: check result.error (API failure) OR result.data === null
      // (token-refresh failure returns { data: null, error: null }; success returns { data: undefined }).
      // Strict null check distinguishes unauthorized (null) from success (undefined).
      if (result.error || result.data === null) {
        setMutationError(result.error?.message ?? "Failed to cancel goal. Please try again.");
        return;
      }
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } finally {
      setUpdatingId(null);
    }
  }, [session]);

  const kpis = computeKpis(goals);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-goals">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("okrGrid")}>
            <GoalCardSkeleton />
            <GoalCardSkeleton />
            <GoalCardSkeleton />
            <GoalCardSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-goals">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button
            className={cx("emptyStateAction")}
            onClick={() => { setError(null); setRetryCount((c) => c + 1); }}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-goals">

      {/* ── Mutation error banner ─────────────────────────────────────────── */}
      {mutationError && (
        <Alert
          variant="error"
          message={mutationError}
          onRetry={() => setMutationError(null)}
        />
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className={cx("pageHeader")}>
        <div className={cx("pageHeaderLeft")}>
          <div className={cx("pageEyebrow")}>Personal Growth</div>
          <h1 className={cx("pageTitle")}>My Goals &amp; OKRs</h1>
          <p className={cx("pageSub")}>Track personal objectives and key results by quarter</p>
        </div>
        <button onClick={() => { setShowModal(true); setDraft(emptyDraft(quarter)); }}>
          <Ic n="plus" sz={14} c="currentColor" />
          Add Goal
        </button>
      </div>

      {/* ── Quarter filter tabs ────────────────────────────────────────────── */}
      <div className={cx("okrQuarterTabs")}>
        {QUARTERS.map((q) => (
          <button
            key={q}
            className={cx("okrQTab", quarter === q && "okrQTabActive")}
            onClick={() => setQuarter(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Active Goals</div>
          <div className={cx("staffKpiValue", "colorAccent")} data-testid="kpi-active-value">{kpis.active}</div>
          <div className={cx("staffKpiSub")}>in {quarter}</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Achieved</div>
          <div className={cx("staffKpiValue", "colorGreen")} data-testid="kpi-achieved-value">{kpis.achieved}</div>
          <div className={cx("staffKpiSub")}>completed goals</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg. Progress</div>
          <div className={cx("staffKpiValue")}>{kpis.avgProg}%</div>
          <div className={cx("staffKpiSub")}>across all goals</div>
        </div>
      </div>

      {/* ── Goals grid ────────────────────────────────────────────────────── */}
      {goals.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <Ic n="target" sz={24} c="var(--muted2)" />
          </div>
          <div className={cx("emptyStateTitle")}>No goals for {quarter}</div>
          <div className={cx("emptyStateSub")}>
            Set personal OKRs to track your growth this quarter.
          </div>
          <button onClick={() => { setShowModal(true); setDraft(emptyDraft(quarter)); }}>
            <Ic n="plus" sz={13} c="currentColor" />
            Add your first goal
          </button>
        </div>
      ) : (
        <div className={cx("okrGrid")}>
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              updatingId={updatingId}
              onUpdateProgress={(id, progress) => void handleUpdateProgress(id, progress)}
              onMarkAchieved={(id) => void handleMarkAchieved(id)}
              onCancel={(id) => void handleCancelGoal(id)}
            />
          ))}
        </div>
      )}

      {/* ── Add Goal Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <AddGoalModal
          draft={draft}
          saving={saving}
          saveError={saveError}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onSave={() => void handleSaveGoal()}
          onClose={() => { setShowModal(false); setSaveError(null); }}
        />
      )}
    </section>
  );
}
