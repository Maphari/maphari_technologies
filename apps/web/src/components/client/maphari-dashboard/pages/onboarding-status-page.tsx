// ════════════════════════════════════════════════════════════════════════════
// onboarding-status-page.tsx — Client Onboarding Status
// Data     : loadPortalOnboardingWithRefresh → GET /clients/:id/onboarding
// Mobile   : stepper stacks vertically; KPI row collapses to 1-col
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalOnboardingWithRefresh,
  type PortalOnboardingRecord
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type StageStatus = "done" | "active" | "pending";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toStageStatus(status: string): StageStatus {
  if (status === "COMPLETED") return "done";
  if (status === "IN_PROGRESS") return "active";
  return "pending";
}

function formatDate(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  return new Date(raw).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapRecord(r: PortalOnboardingRecord): { label: string; status: StageStatus; date?: string; notes?: string } {
  const s = toStageStatus(r.status);
  return {
    label: r.stageLabel,
    status: s,
    date: s === "done" ? formatDate(r.completedAt) : formatDate(r.estimatedAt) ? `Est. ${formatDate(r.estimatedAt)}` : undefined,
    notes: r.notes ?? undefined
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OnboardingStatusPage() {
  const { session } = useProjectLayer();
  const [stages, setStages] = useState<Array<{ label: string; status: StageStatus; date?: string; notes?: string }>>([]);

  useEffect(() => {
    if (!session) return;
    loadPortalOnboardingWithRefresh(session, session.user.clientId ?? "").then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setStages(result.data.map(mapRecord));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const completedSteps = stages.filter((s) => s.status === "done").length;
  const totalSteps = stages.length;
  const activeStage = stages.find((s) => s.status === "active");

  return (
    <div className={cx("pageBody")}>
      {/* ── Header ── */}
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>OVERVIEW</div>
          <h1 className={cx("pageTitle")}>Onboarding Status</h1>
          <div className={cx("pageSub")}>Track your onboarding progress with Maphari Technologies</div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className={cx("obsKpiRow")}>
        {[
          { label: "Steps Completed", value: totalSteps > 0 ? `${completedSteps} / ${totalSteps}` : "—", sub: "Onboarding stages" },
          { label: "Remaining", value: totalSteps > 0 ? `${totalSteps - completedSteps}` : "—", sub: "Steps to completion" },
          { label: "Current Stage", value: activeStage?.label ?? (completedSteps === totalSteps && totalSteps > 0 ? "Complete" : "—"), sub: "Active step" },
        ].map((k) => (
          <div key={k.label} className={cx("obsKpiCard")}>
            <div className={cx("obsKpiLabel")}>{k.label}</div>
            <div className={cx("obsKpiValue")}>{k.value}</div>
            <div className={cx("obsKpiMeta")}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Progress Stepper ── */}
      {stages.length > 0 && (
        <div className={cx("card", "obsStepper")}>
          <div className={cx("obsStepperTitle")}>Your Onboarding Journey</div>
          <div className={cx("obsStages")}>
            {stages.map((stage, i) => (
              <div key={stage.label} className={cx("obsStage", stage.status === "done" && "obsStageDone", stage.status === "active" && "obsStageActive")}>
                <div className={cx("obsStageNode")}>
                  {stage.status === "done" ? "✓" : stage.status === "active" ? `${i + 1}` : "○"}
                </div>
                {i < stages.length - 1 && (
                  <div className={cx("obsConnector", stage.status === "done" && "obsConnectorDone")} />
                )}
                <div className={cx("obsStageLabel")}>{stage.label}</div>
                {stage.date && <div className={cx("obsStageDate")}>{stage.date}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Current Step Detail ── */}
      {activeStage && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Current Step: {activeStage.label}</span>
            <span className={cx("badge", "badgeAmber")}>Active</span>
          </div>
          <div className={cx("cardInner")}>
            {activeStage.notes ? (
              <p className={cx("text13", "colorMuted", "mb16", "lineH16")}>{activeStage.notes}</p>
            ) : (
              <p className={cx("text13", "colorMuted", "mb16", "lineH16")}>
                This stage is currently in progress. Your account manager will be in touch shortly.
              </p>
            )}
            {activeStage.date && (
              <div>
                <div className={cx("text11", "colorMuted", "mb4", "fontMono", "uppercase")}>Expected Completion</div>
                <div className={cx("fw600", "text13")}>{activeStage.date}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {stages.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="check" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No onboarding stages yet</div>
          <div className={cx("emptyStateSub")}>Your account manager will configure your onboarding stages shortly.</div>
        </div>
      )}
    </div>
  );
}
