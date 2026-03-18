// ════════════════════════════════════════════════════════════════════════════
// my-reports-page.tsx — Staff My Reports
// Data : GET /staff/me/performance → derive report entries client-side
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import {
  getStaffMyPerformance,
  type StaffPerformance,
  type StaffPerformanceWeek,
  type StaffPerformanceClient,
  type StaffPerformanceMilestone,
} from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Derived report row ────────────────────────────────────────────────────────

type ReportRow = {
  id: string;
  name: string;
  type: "Time" | "Performance" | "Project" | "Skills";
  format: "PDF" | "CSV";
  generatedAt: string;
};

type ReportType = ReportRow["type"];
type Format     = ReportRow["format"];

function typeBadgeCls(t: ReportType): string {
  if (t === "Time")        return "rptTypeTime";
  if (t === "Performance") return "rptTypePerformance";
  if (t === "Project")     return "rptTypeProject";
  if (t === "Skills")      return "rptTypeSkills";
  return "";
}

function formatChipCls(f: Format): string {
  return f === "PDF" ? "rptFormatPdf" : "rptFormatCsv";
}

function fmtMonth(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

// ── Derive reports from performance data ──────────────────────────────────────

function deriveReports(perf: StaffPerformance): ReportRow[] {
  const rows: ReportRow[] = [];
  let counter = 1;

  // One "Time" report per week with logged hours
  const weeksWithHours = perf.weeklyData.filter((w) => w.hoursLogged > 0);
  for (const w of weeksWithHours) {
    rows.push({
      id: `RPT-${String(counter++).padStart(3, "0")}`,
      name: `Weekly Time Summary \u2014 ${w.week}`,
      type: "Time",
      format: "PDF",
      generatedAt: new Date().toISOString(),
    });
  }

  // One "Project" report per client with logged hours
  for (const c of perf.clientBreakdown) {
    rows.push({
      id: `RPT-${String(counter++).padStart(3, "0")}`,
      name: `Project Contribution \u2014 ${c.clientName}`,
      type: "Project",
      format: "CSV",
      generatedAt: new Date().toISOString(),
    });
  }

  // One "Performance" summary if we have any weekly data
  if (perf.weeklyData.length > 0) {
    rows.push({
      id: `RPT-${String(counter++).padStart(3, "0")}`,
      name: "Performance Review \u2014 Current Period",
      type: "Performance",
      format: "PDF",
      generatedAt: new Date().toISOString(),
    });
  }

  // One "Skills" entry per approved milestone
  const approvedMilestones = perf.milestoneHistory.filter((m) => m.status === "APPROVED" || m.status === "approved");
  for (const m of approvedMilestones) {
    rows.push({
      id: `RPT-${String(counter++).padStart(3, "0")}`,
      name: `Milestone Report \u2014 ${m.title}`,
      type: "Skills",
      format: "PDF",
      generatedAt: m.approvedAt ?? new Date().toISOString(),
    });
  }

  return rows;
}

// ── Page component ────────────────────────────────────────────────────────────

export function MyReportsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [perf, setPerf]       = useState<StaffPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getStaffMyPerformance(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setPerf(result.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const reports = useMemo(() => (perf ? deriveReports(perf) : []), [perf]);

  const totalReports = reports.length;
  const now          = new Date();
  const currentMonth = now.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  const thisMonth    = reports.filter((r) => {
    const d = new Date(r.generatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const typeCount    = new Set(reports.map((r) => r.type)).size;
  const pdfCount     = reports.filter((r) => r.format === "PDF").length;

  const sorted = [...reports].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-reports">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>My Reports</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Export personal performance and time reports</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("rptStatGrid")}>

        <div className={cx("rptStatCard")}>
          <div className={cx("rptStatCardTop")}>
            <div className={cx("rptStatLabel")}>Reports</div>
            <div className={cx("rptStatValue", "colorAccent")}>{loading ? "\u2026" : totalReports}</div>
          </div>
          <div className={cx("rptStatCardDivider")} />
          <div className={cx("rptStatCardBottom")}>
            <span className={cx("rptStatDot", "dotBgAccent")} />
            <span className={cx("rptStatMeta")}>available</span>
          </div>
        </div>

        <div className={cx("rptStatCard")}>
          <div className={cx("rptStatCardTop")}>
            <div className={cx("rptStatLabel")}>This Month</div>
            <div className={cx("rptStatValue", thisMonth > 0 ? "colorGreen" : "colorMuted2")}>{loading ? "\u2026" : thisMonth}</div>
          </div>
          <div className={cx("rptStatCardDivider")} />
          <div className={cx("rptStatCardBottom")}>
            <span className={cx("rptStatDot", "dynBgColor")} style={{ "--bg-color": thisMonth > 0 ? "var(--green)" : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("rptStatMeta")}>{currentMonth}</span>
          </div>
        </div>

        <div className={cx("rptStatCard")}>
          <div className={cx("rptStatCardTop")}>
            <div className={cx("rptStatLabel")}>Types</div>
            <div className={cx("rptStatValue", "colorMuted2")}>{loading ? "\u2026" : typeCount}</div>
          </div>
          <div className={cx("rptStatCardDivider")} />
          <div className={cx("rptStatCardBottom")}>
            <span className={cx("rptStatDot", "dotBgMuted2")} />
            <span className={cx("rptStatMeta")}>distinct categories</span>
          </div>
        </div>

        <div className={cx("rptStatCard")}>
          <div className={cx("rptStatCardTop")}>
            <div className={cx("rptStatLabel")}>PDF</div>
            <div className={cx("rptStatValue", "colorMuted2")}>{loading ? "\u2026" : pdfCount}</div>
          </div>
          <div className={cx("rptStatCardDivider")} />
          <div className={cx("rptStatCardBottom")}>
            <span className={cx("rptStatDot", "dotBgMuted2")} />
            <span className={cx("rptStatMeta")}>documents</span>
          </div>
        </div>

      </div>

      {/* ── Report list ───────────────────────────────────────────────────── */}
      <div className={cx("rptSection")}>

        <div className={cx("rptSectionHeader")}>
          <div className={cx("rptSectionTitle")}>All Reports</div>
          <span className={cx("rptSectionMeta")}>{loading ? "\u2026" : `${reports.length} REPORTS`}</span>
        </div>

        <div className={cx("rptList")}>
          {loading ? (
            <div className={cx("rptRow", "rptRowLast", "opacity50", "justifyCenter")} >
              Loading reports\u2026
            </div>
          ) : sorted.length === 0 ? (
            <div className={cx("rptRow", "rptRowLast", "justifyCenter")} >
              No reports available yet. Log time and complete tasks to generate reports.
            </div>
          ) : sorted.map((r, idx) => (
            <div
              key={r.id}
              className={cx("rptRow", idx === sorted.length - 1 && "rptRowLast")}
            >

              {/* Type badge */}
              <span className={cx("rptTypeBadge", typeBadgeCls(r.type))}>{r.type}</span>

              {/* Report name + ID */}
              <div className={cx("rptReportInfo")}>
                <span className={cx("rptReportName")}>{r.name}</span>
                <span className={cx("rptReportId")}>{r.id}</span>
              </div>

              {/* Format chip */}
              <span className={cx("rptFormatChip", formatChipCls(r.format))}>{r.format}</span>

              {/* Generated date */}
              <div className={cx("rptGeneratedCell")}>
                <span className={cx("rptGeneratedLabel")}>Generated</span>
                <span className={cx("rptGeneratedDate")}>{fmtMonth(r.generatedAt)}</span>
              </div>

            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
