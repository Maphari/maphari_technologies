// ════════════════════════════════════════════════════════════════════════════
// offboarding-page.tsx — Client Offboarding Checklist
// Data     : loadPortalOffboardingWithRefresh → GET /clients/:id/offboarding
//            patchPortalOffboardingTaskWithRefresh → PATCH /:id
// Mobile   : KPI row stacks; checklist rows wrap
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalOffboardingWithRefresh,
  patchPortalOffboardingTaskWithRefresh,
  type PortalOffboardingTask
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  action: string;
};

type ChecklistGroup = {
  title: string;
  items: ChecklistItem[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildGroups(tasks: PortalOffboardingTask[]): ChecklistGroup[] {
  const groupMap = new Map<string, ChecklistItem[]>();
  for (const t of tasks) {
    if (!groupMap.has(t.groupName)) groupMap.set(t.groupName, []);
    groupMap.get(t.groupName)!.push({
      id: t.id,
      label: t.label,
      done: t.status === "COMPLETED",
      action: t.actionLabel ?? "View"
    });
  }
  return Array.from(groupMap.entries()).map(([title, items]) => ({ title, items }));
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OffboardingPage() {
  const { session } = useProjectLayer();
  const [groups,   setGroups]   = useState<ChecklistGroup[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadPortalOffboardingWithRefresh(session, session.user.clientId ?? "").then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error.message ?? "Failed to load."); setLoading(false); return; }
      if (result.data) setGroups(buildGroups(result.data));
      setLoading(false);
    });
  }, [session]);

  const allItems = groups.flatMap((g) => g.items);
  const doneCount = allItems.filter((i) => i.done).length;

  const toggle = useCallback((itemId: string) => {
    if (!session) return;
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;
    const newDone = !item.done;
    const newStatus = newDone ? "COMPLETED" : "PENDING";
    const completedAt = newDone ? new Date().toISOString() : undefined;

    // Optimistic update
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((i) => i.id === itemId ? { ...i, done: newDone } : i)
      }))
    );

    patchPortalOffboardingTaskWithRefresh(session, session.user.clientId ?? "", itemId, {
      status: newStatus,
      ...(completedAt ? { completedAt } : {})
    }).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.data) {
        // Revert on failure
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            items: g.items.map((i) => i.id === itemId ? { ...i, done: !newDone } : i)
          }))
        );
      }
    });
  }, [session, allItems]);

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      {/* ── Header ── */}
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>ACCOUNT</div>
          <h1 className={cx("pageTitle")}>Offboarding</h1>
          <div className={cx("pageSub")}>Complete the following steps to finalise your engagement with Maphari Technologies</div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className={cx("obdKpiRow")}>
        {[
          { label: "Tasks Complete", value: `${doneCount} / ${allItems.length}`, sub: "Offboarding checklist" },
          { label: "Pending Items", value: String(allItems.length - doneCount), sub: "Still to complete" },
          { label: "Groups", value: String(groups.length), sub: "Offboarding categories" },
        ].map((k) => (
          <div key={k.label} className={cx("obdKpiCard")}>
            <div className={cx("obdKpiLabel")}>{k.label}</div>
            <div className={cx("obdKpiValue")}>{k.value}</div>
            <div className={cx("obdKpiMeta")}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Progress banner ── */}
      {allItems.length > 0 && (
        <div className={cx("card", "p14", "flexBetween")}>
          <div className={cx("text13", "fw600")}>Overall Progress</div>
          <div className={cx("flexRow", "gap12", "alignCenter")}>
            <div className={cx("obdProgressTrack")}>
              <div className={cx("obdProgressFill")} style={{ '--pct': `${allItems.length > 0 ? Math.round((doneCount / allItems.length) * 100) : 0}%` } as React.CSSProperties} />
            </div>
            <span className={cx("fontMono", "text12")}>{doneCount}/{allItems.length} complete</span>
          </div>
        </div>
      )}

      {/* ── Checklist groups ── */}
      {groups.map((group) => {
        const groupDone = group.items.filter((i) => i.done).length;
        return (
          <div key={group.title} className={cx("card")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>{group.title}</span>
              <span className={cx("badge", groupDone === group.items.length ? "badgeGreen" : "badgeMuted")}>
                {groupDone}/{group.items.length}
              </span>
            </div>
            <div className={cx("cardInner")}>
              {group.items.map((item) => (
                <div key={item.id} className={cx("obdCheckRow")}>
                  <button
                    type="button"
                    className={cx("obdCheckBtn", item.done && "obdCheckBtnDone")}
                    onClick={() => toggle(item.id)}
                    aria-label={item.done ? `Unmark: ${item.label}` : `Mark done: ${item.label}`}
                  >
                    {item.done ? "✓" : "○"}
                  </button>
                  <span
                    className={cx("text13", "flex1", item.done ? "colorMuted" : "", item.done ? "textLineThrough" : "")}
                  >
                    {item.label}
                  </span>
                  <span className={cx("badge", item.done ? "badgeGreen" : "badgeMuted")}>
                    {item.done ? "Done" : "Pending"}
                  </span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>{item.action}</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Empty state ── */}
      {groups.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="check" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No offboarding tasks</div>
          <div className={cx("emptyStateSub")}>Your account manager will set up offboarding tasks here when the time comes.</div>
        </div>
      )}
    </div>
  );
}
