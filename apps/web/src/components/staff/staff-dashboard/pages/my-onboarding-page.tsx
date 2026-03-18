// ════════════════════════════════════════════════════════════════════════════
// my-onboarding-page.tsx — Staff My Onboarding
// Data     : loadMyStaffOnboardingWithRefresh → GET /staff/:id/onboarding
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadMyStaffOnboardingWithRefresh, type StaffOnboardingRecord, getMyProfile } from "../../../../lib/api/staff";
import { saveSession } from "../../../../lib/auth/session";

// Phase labels derived from sortOrder buckets
function phaseFromOrder(order: number): string {
  if (order <= 2) return "Day 1";
  if (order <= 5) return "Week 1";
  if (order <= 8) return "Week 2";
  if (order <= 11) return "Week 3";
  return "Month 1";
}

const PHASES = ["Day 1", "Week 1", "Week 2", "Week 3", "Month 1"] as const;

function categoryCls(c: string) {
  if (c === "Legal")      return "mobCatLegal";
  if (c === "IT Setup")   return "mobCatItSetup";
  if (c === "Compliance") return "mobCatCompliance";
  if (c === "Knowledge")  return "mobCatKnowledge";
  if (c === "Culture")    return "mobCatCulture";
  if (c === "Training")   return "mobCatTraining";
  return "mobCatOps";
}

export function MyOnboardingPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [apiOnboarding, setApiOnboarding] = useState<StaffOnboardingRecord[]>([]);

  useEffect(() => {
    if (!session) return;
    // The onboarding endpoint needs the StaffProfile.id (not userId), so resolve it first
    void getMyProfile(session).then(async (pr) => {
      if (pr.nextSession) saveSession(pr.nextSession);
      if (pr.error || !pr.data) return;
      const r = await loadMyStaffOnboardingWithRefresh(session, pr.data.id);
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiOnboarding(r.data);
    });
  }, [session]);

  const checklistItems = useMemo(() =>
    [...apiOnboarding].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => ({
      id:        o.sortOrder,
      title:     o.stageLabel,
      category:  "Operations",
      completed: o.status.toUpperCase() === "COMPLETED",
      dueAt:     phaseFromOrder(o.sortOrder),
    })),
  [apiOnboarding]);

  const completed  = checklistItems.filter((i) => i.completed).length;
  const remaining  = checklistItems.length - completed;
  const progress   = checklistItems.length > 0 ? Math.round((completed / checklistItems.length) * 100) : 0;
  const dueSoon    = checklistItems.filter((i) => i.dueAt === "Week 2" && !i.completed).length;

  const grouped = PHASES.reduce<Record<string, typeof checklistItems>>((acc, phase) => {
    const items = checklistItems.filter((i) => i.dueAt === phase);
    if (items.length > 0) acc[phase] = items;
    return acc;
  }, {});

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-onboarding">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Onboarding</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal onboarding checklist and progress</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("mobStatGrid")}>

        <div className={cx("mobStatCard")}>
          <div className={cx("mobStatCardTop")}>
            <div className={cx("mobStatLabel")}>Progress</div>
            <div className={cx("mobStatValue", "colorAccent")}>{progress}%</div>
          </div>
          <div className={cx("mobStatCardDivider")} />
          <div className={cx("mobStatCardBottom")}>
            <span className={cx("mobStatDot", "dotBgAccent")} />
            <span className={cx("mobStatMeta")}>overall completion</span>
          </div>
        </div>

        <div className={cx("mobStatCard")}>
          <div className={cx("mobStatCardTop")}>
            <div className={cx("mobStatLabel")}>Completed</div>
            <div className={cx("mobStatValue", "colorGreen")}>
              {completed}<span className={cx("mobStatSuffix")}>/{checklistItems.length}</span>
            </div>
          </div>
          <div className={cx("mobStatCardDivider")} />
          <div className={cx("mobStatCardBottom")}>
            <span className={cx("mobStatDot", "dotBgGreen")} />
            <span className={cx("mobStatMeta")}>tasks done</span>
          </div>
        </div>

        <div className={cx("mobStatCard")}>
          <div className={cx("mobStatCardTop")}>
            <div className={cx("mobStatLabel")}>Remaining</div>
            <div className={cx("mobStatValue", remaining > 0 ? "colorAmber" : "colorGreen")}>{remaining}</div>
          </div>
          <div className={cx("mobStatCardDivider")} />
          <div className={cx("mobStatCardBottom")}>
            <span className={cx("mobStatDot", "dynBgColor")} style={{ "--bg-color": remaining > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("mobStatMeta")}>{remaining > 0 ? "still to complete" : "all done"}</span>
          </div>
        </div>

        <div className={cx("mobStatCard")}>
          <div className={cx("mobStatCardTop")}>
            <div className={cx("mobStatLabel")}>Due This Week</div>
            <div className={cx("mobStatValue", dueSoon > 0 ? "colorRed" : "colorGreen")}>{dueSoon}</div>
          </div>
          <div className={cx("mobStatCardDivider")} />
          <div className={cx("mobStatCardBottom")}>
            <span className={cx("mobStatDot", "dynBgColor")} style={{ "--bg-color": dueSoon > 0 ? "var(--red)" : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("mobStatMeta")}>{dueSoon > 0 ? "needs attention" : "on track"}</span>
          </div>
        </div>

      </div>

      {/* ── Checklist ────────────────────────────────────────────────────── */}
      <div className={cx("mobSection")}>

        {/* Section header */}
        <div className={cx("mobSectionHeader")}>
          <div className={cx("mobSectionTitle")}>Onboarding Checklist</div>
          <span className={cx("mobSectionMeta")}>{checklistItems.length} TASKS</span>
        </div>

        {/* Overall progress bar */}
        <div className={cx("mobProgressWrap")}>
          <div className={cx("mobProgressMeta")}>
            <span className={cx("mobProgressLabel")}>Overall Progress</span>
            <span className={cx("mobProgressPct", "colorAccent")}>{progress}%</span>
          </div>
          <div className={cx("mobProgressTrack")}>
            <div className={cx("mobProgressFill")} style={{ '--pct': `${progress}%` } as React.CSSProperties} />
          </div>
        </div>

        {/* Phase groups */}
        {PHASES.filter((p) => grouped[p]).map((phase) => {
          const items    = grouped[phase];
          const phaseDone = items.filter((i) => i.completed).length;
          const allDone   = phaseDone === items.length;

          return (
            <div key={phase} className={cx("mobPhase", allDone && "mobPhaseDone")}>

              {/* Phase header */}
              <div className={cx("mobPhaseHeader")}>
                <div className={cx("mobPhaseLeft")}>
                  <span className={cx("mobPhaseName")}>{phase}</span>
                  {allDone && <span className={cx("mobPhaseBadge")}>Complete</span>}
                </div>
                <span className={cx("mobPhaseCount")}>{phaseDone} / {items.length}</span>
              </div>

              {/* Items */}
              <div className={cx("mobCheckList")}>
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cx(
                      "mobCheckItem",
                      item.completed && "mobCheckItemDone",
                      idx === items.length - 1 && "mobCheckItemLast",
                    )}
                  >
                    <span className={cx("mobCheckbox", item.completed && "mobCheckboxDone")} />
                    <span className={cx("mobItemTitle")}>{item.title}</span>
                    <span className={cx("mobItemCategory", categoryCls(item.category))}>{item.category}</span>
                  </div>
                ))}
              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}
