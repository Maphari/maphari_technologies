// ════════════════════════════════════════════════════════════════════════════
// my-reports-page.tsx — Staff My Reports
// Data : GET /staff/me/performance → derive report entries client-side
//        POST /ai/generate-report  → on-demand AI report generation
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import {
  getStaffMyPerformance,
  type StaffPerformance,
} from "../../../../lib/api/staff/performance";
import {
  generateReportWithRefresh,
} from "../../../../lib/api/staff/ai-drafts";
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

// ── Scheduled report types ────────────────────────────────────────────────────

type ScheduledReportType = "Weekly Progress" | "Monthly Summary" | "Sprint Review";
type ScheduledFrequency  = "Weekly (Mon)" | "Monthly (1st)" | "After each sprint";

interface ScheduledReport {
  id: string;
  reportType: ScheduledReportType;
  frequency: ScheduledFrequency;
  recipients: string;
  projectId: string;
  clientName: string;
  createdAt: string;
}

const SCHEDULE_STORAGE_KEY = "maphari_staff_scheduled_reports";

function loadScheduled(): ScheduledReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledReport[]) : [];
  } catch { return []; }
}

function saveScheduled(items: ScheduledReport[]): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore quota errors */ }
}

function nextRunLabel(freq: ScheduledFrequency): string {
  const now = new Date();
  if (freq === "Weekly (Mon)") {
    const day = now.getDay(); // 0 Sun … 6 Sat
    const daysUntilMon = day === 1 ? 7 : (8 - day) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMon);
    return next.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  }
  if (freq === "Monthly (1st)") {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }
  return "After next sprint closes";
}

// ── Section preview labels ────────────────────────────────────────────────────

const REPORT_SECTIONS: Record<ScheduledReportType, string[]> = {
  "Weekly Progress":  ["Executive Summary", "Progress This Period", "Milestones & Deliverables", "Risks & Blockers", "Next Steps"],
  "Monthly Summary":  ["Month-in-Review", "KPIs & Metrics", "Budget vs Actuals", "Team Performance", "Next Month Goals"],
  "Sprint Review":    ["Sprint Goal", "Completed Stories", "Incomplete Items", "Velocity", "Retrospective Notes"],
};

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

  // ── Scheduled reports ────────────────────────────────────────────────────
  const [scheduled, setScheduled] = useState<ScheduledReport[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Schedule form state
  const [schedReportType, setSchedReportType] = useState<ScheduledReportType>("Weekly Progress");
  const [schedFrequency,  setSchedFrequency]  = useState<ScheduledFrequency>("Weekly (Mon)");
  const [schedRecipients, setSchedRecipients] = useState("");
  const [schedClientName, setSchedClientName] = useState("");
  const [schedProjectId,  setSchedProjectId]  = useState("");

  // ── Generate-Now modal ───────────────────────────────────────────────────
  const [showGenModal,   setShowGenModal]   = useState(false);
  const [genLoading,     setGenLoading]     = useState(false);
  const [genMarkdown,    setGenMarkdown]    = useState("");
  const [genTitle,       setGenTitle]       = useState("");
  const [genTarget,      setGenTarget]      = useState<ScheduledReport | null>(null);

  // Load performance data
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

  // Load scheduled reports from localStorage
  useEffect(() => {
    if (!isActive) return;
    setScheduled(loadScheduled());
  }, [isActive]);

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAddSchedule() {
    if (!schedClientName.trim()) return;
    const newItem: ScheduledReport = {
      id: `SCH-${Date.now()}`,
      reportType: schedReportType,
      frequency:  schedFrequency,
      recipients: schedRecipients.trim(),
      projectId:  schedProjectId.trim(),
      clientName: schedClientName.trim(),
      createdAt:  new Date().toISOString(),
    };
    const updated = [newItem, ...scheduled];
    setScheduled(updated);
    saveScheduled(updated);
    setShowScheduleModal(false);
    setSchedClientName("");
    setSchedRecipients("");
    setSchedProjectId("");
  }

  function handleRemoveSchedule(id: string) {
    const updated = scheduled.filter((s) => s.id !== id);
    setScheduled(updated);
    saveScheduled(updated);
  }

  async function handleGenerateNow(item: ScheduledReport) {
    setGenTarget(item);
    setGenMarkdown("");
    setGenTitle("");
    setShowGenModal(true);
    setGenLoading(true);

    if (session) {
      const result = await generateReportWithRefresh(session, {
        reportType: item.reportType,
        projectId:  item.projectId,
        clientName: item.clientName,
        period:     item.frequency === "Weekly (Mon)"
          ? "this week"
          : item.frequency === "Monthly (1st)"
          ? "this month"
          : "this sprint",
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) {
        setGenMarkdown(result.data.markdown);
        setGenTitle(result.data.title);
        setGenLoading(false);
        return;
      }
    }

    // Fallback: local stub
    const sections = REPORT_SECTIONS[item.reportType] ?? [];
    setGenTitle(`${item.reportType} — ${item.clientName}`);
    setGenMarkdown(
      `# ${item.reportType} — ${item.clientName}\n\n` +
      sections.map((s) => `## ${s}\n\n_AI-generated content will appear here once configured._`).join("\n\n")
    );
    setGenLoading(false);
  }

  function handleCloseGenModal() {
    setShowGenModal(false);
    setGenTarget(null);
    setGenMarkdown("");
    setGenTitle("");
  }

  if (!isActive) return null;

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

      {/* ── Scheduled Reports ─────────────────────────────────────────────── */}
      <div className={cx("rptSection")}>
        <div className={cx("rptSectionHeader")}>
          <div className={cx("rptSectionTitle")}>Scheduled Reports</div>
          <button
            type="button"
            className={cx("rptScheduleBtn")}
            onClick={() => setShowScheduleModal(true)}
          >
            + Schedule Report
          </button>
        </div>

        {scheduled.length === 0 ? (
          <div className={cx("rptScheduledEmpty")}>
            No recurring reports configured. Click &ldquo;+ Schedule Report&rdquo; to set one up.
          </div>
        ) : (
          <div className={cx("rptScheduledList")}>
            {scheduled.map((item) => (
              <div key={item.id} className={cx("rptScheduledCard")}>
                <div className={cx("rptScheduledCardTop")}>
                  <div>
                    <div className={cx("rptScheduledTitle")}>{item.reportType}</div>
                    <div className={cx("rptScheduledMeta")}>
                      {item.clientName}{item.projectId ? ` · ${item.projectId}` : ""}
                    </div>
                  </div>
                  <div className={cx("rptScheduledActions")}>
                    <button
                      type="button"
                      className={cx("rptGenNowBtn")}
                      onClick={() => void handleGenerateNow(item)}
                    >
                      Generate Now
                    </button>
                    <button
                      type="button"
                      className={cx("rptRemoveBtn")}
                      onClick={() => handleRemoveSchedule(item.id)}
                      aria-label="Remove scheduled report"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className={cx("rptScheduledFooter")}>
                  <span className={cx("rptFreqBadge")}>{item.frequency}</span>
                  <span className={cx("rptNextRun")}>Next: {nextRunLabel(item.frequency)}</span>
                  {item.recipients && (
                    <span className={cx("rptRecipients")} title={item.recipients}>
                      → {item.recipients.split(",").length} recipient{item.recipients.split(",").length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* ── Schedule Report Modal ──────────────────────────────────────────── */}
      {showScheduleModal && (
        <div className={cx("rptModalOverlay")} onClick={() => setShowScheduleModal(false)}>
          <div className={cx("rptModal")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("rptModalHeader")}>
              <div className={cx("rptModalTitle")}>Schedule Report</div>
              <button
                type="button"
                className={cx("rptModalClose")}
                onClick={() => setShowScheduleModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={cx("rptModalBody")}>
              {/* Report Type */}
              <div className={cx("rptModalField")}>
                <label className={cx("rptModalLabel")}>Report Type</label>
                <div className={cx("rptModalOptions")}>
                  {(["Weekly Progress", "Monthly Summary", "Sprint Review"] as ScheduledReportType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={cx("rptModalOptionBtn", schedReportType === t ? "rptModalOptionActive" : "rptModalOptionIdle")}
                      onClick={() => setSchedReportType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className={cx("rptModalField")}>
                <label className={cx("rptModalLabel")}>Frequency</label>
                <div className={cx("rptModalOptions")}>
                  {(["Weekly (Mon)", "Monthly (1st)", "After each sprint"] as ScheduledFrequency[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={cx("rptModalOptionBtn", schedFrequency === f ? "rptModalOptionActive" : "rptModalOptionIdle")}
                      onClick={() => setSchedFrequency(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Name */}
              <div className={cx("rptModalField")}>
                <label className={cx("rptModalLabel")}>Client Name</label>
                <input
                  type="text"
                  value={schedClientName}
                  onChange={(e) => setSchedClientName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className={cx("rptModalInput")}
                />
              </div>

              {/* Project ID (optional) */}
              <div className={cx("rptModalField")}>
                <label className={cx("rptModalLabel")}>Project ID <span className={cx("rptModalOptional")}>(optional)</span></label>
                <input
                  type="text"
                  value={schedProjectId}
                  onChange={(e) => setSchedProjectId(e.target.value)}
                  placeholder="e.g. proj_abc123"
                  className={cx("rptModalInput")}
                />
              </div>

              {/* Recipients */}
              <div className={cx("rptModalField")}>
                <label className={cx("rptModalLabel")}>Recipients <span className={cx("rptModalOptional")}>(comma-separated emails)</span></label>
                <input
                  type="text"
                  value={schedRecipients}
                  onChange={(e) => setSchedRecipients(e.target.value)}
                  placeholder="client@example.com, pm@yourteam.com"
                  className={cx("rptModalInput")}
                />
              </div>

              {/* Section preview */}
              <div className={cx("rptModalField")}>
                <label className={cx("rptModalLabel")}>Sections included</label>
                <div className={cx("rptModalPreview")}>
                  {REPORT_SECTIONS[schedReportType]?.map((s, i) => (
                    <div key={s} className={cx("rptModalPreviewRow")}>
                      <span className={cx("rptModalPreviewNum")}>{i + 1}</span>
                      <span className={cx("rptModalPreviewLabel")}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cx("rptModalFooter")}>
              <button
                type="button"
                className={cx("rptModalCancelBtn")}
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("rptModalSaveBtn")}
                onClick={handleAddSchedule}
                disabled={!schedClientName.trim()}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Now Modal ─────────────────────────────────────────────── */}
      {showGenModal && (
        <div className={cx("rptModalOverlay")} onClick={handleCloseGenModal}>
          <div className={cx("rptModal", "rptModalWide")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("rptModalHeader")}>
              <div className={cx("rptModalTitle")}>
                {genLoading ? "AI is generating report\u2026" : (genTitle || "Generated Report")}
              </div>
              <button
                type="button"
                className={cx("rptModalClose")}
                onClick={handleCloseGenModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={cx("rptModalBody")}>
              {genLoading ? (
                <div className={cx("rptGenLoading")}>
                  <div className={cx("rptGenSpinner")} />
                  <span className={cx("rptGenLoadingText")}>
                    AI is drafting your {genTarget?.reportType ?? "report"}\u2026
                  </span>
                </div>
              ) : (
                <pre className={cx("rptMarkdownPre")}>{genMarkdown}</pre>
              )}
            </div>

            {!genLoading && (
              <div className={cx("rptModalFooter")}>
                <button
                  type="button"
                  className={cx("rptModalCancelBtn")}
                  onClick={() => {
                    if (genMarkdown) {
                      void navigator.clipboard?.writeText(genMarkdown);
                    }
                  }}
                >
                  Copy Markdown
                </button>
                <button
                  type="button"
                  className={cx("rptModalSaveBtn")}
                  onClick={handleCloseGenModal}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
