// ════════════════════════════════════════════════════════════════════════════
// meetings-page.tsx — Client Portal Time Tracking
// Data : No portal API yet — time entries are staff-facing only.
//        Empty states shown until a client-facing time API is added.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { Ic } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeTab = "Overview" | "Time Log" | "By Team Member" | "Weekly Summary";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: TimeTab[] = ["Overview", "Time Log", "By Team Member", "Weekly Summary"];

// ── Component ─────────────────────────────────────────────────────────────────

export function MeetingsPage() {
  useProjectLayer();
  const [tab, setTab] = useState<TimeTab>("Overview");
  const notify        = usePageToast();

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Time</div>
          <h1 className={cx("pageTitle")}>Time Tracking</h1>
          <p className={cx("pageSub")}>
            Full transparency on every hour worked — by phase, by person, and by task.
          </p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => notify("success", "Report exported", "Time report downloaded as CSV")}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Progress summary */}
      <div className={cx("card", "p12", "mb16")}>
        <div className={cx("flexBetween", "mb6")}>
          <span className={cx("text12", "colorMuted")}>0h logged of 0h budgeted</span>
          <span className={cx("fw700", "colorAccent")}>—</span>
        </div>
        <div className={cx("progressBar", "wFull", "h6px")}>
          <div className={cx("progressFill", "pfAccent", "w0p")} />
        </div>
      </div>

      {/* Tabs */}
      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={cx("pillTab", tab === item && "pillTabActive")}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "Overview" && (
        <>
          <div className={cx("topCardsStack", "mb16")}>
            {[
              { value: "0h", label: "Hours Logged",   sub: "of 0h budgeted",             color: "var(--accent)"  },
              { value: "0h", label: "Hours Remaining", sub: "across all phases",           color: "var(--muted)"   },
              { value: "0",  label: "Team Members",   sub: "actively logging time",        color: "var(--purple)"  },
              { value: "0h", label: "This Week",      sub: "no entries yet",               color: "var(--green)"   },
            ].map((stat) => (
              <div key={stat.label} className={cx("card", "p16")}>
                <div className={cx("fontDisplay", "fw800", "text20", "dynColor")} style={{ "--color": stat.color } as React.CSSProperties}>{stat.value}</div>
                <div className={cx("text12", "fw600", "mb4")}>{stat.label}</div>
                <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <div className={cx("cardHdTitle")}>Hours by Phase</div>
            </div>
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="clock" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No time entries yet</div>
              <div className={cx("emptyStateSub")}>Phase-by-phase hours will appear here as your team logs time against the project.</div>
            </div>
          </div>
        </>
      )}

      {/* ── Time Log ── */}
      {tab === "Time Log" && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("cardHdTitle")}>Detailed Time Log</div>
          </div>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No log entries yet</div>
            <div className={cx("emptyStateSub")}>Individual time log entries will appear here as the team records their work.</div>
          </div>
        </div>
      )}

      {/* ── By Team Member ── */}
      {tab === "By Team Member" && (
        <>
          <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb12")}>Hours by Team Member</div>
          <div className={cx("card", "emptyPad40x20", "textCenter")}>
            <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No team hours yet</div>
            <div className={cx("emptyStateSub")}>Per-member hour breakdowns will appear here once time is logged against the project.</div>
          </div>
        </>
      )}

      {/* ── Weekly Summary ── */}
      {tab === "Weekly Summary" && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("cardHdTitle")}>Weekly Hours Summary</div>
          </div>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No weekly data yet</div>
            <div className={cx("emptyStateSub")}>Weekly summaries will be compiled here as the team logs hours week over week.</div>
          </div>
        </div>
      )}
    </div>
  );
}
