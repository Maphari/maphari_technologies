"use client";
// ════════════════════════════════════════════════════════
// health-score-page.tsx — Client Health Score
// Source  : snapshot.invoices + snapshot.projects (props)
// Scope   : CLIENT own-tenant; scores derived from billing + project data
// ════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PortalInvoice, PortalProject } from "../../../../lib/api/portal/types";

// ── Local types ────────────────────────────────────────────────────────────────
interface HealthDimension {
  name: string; score: number;
  description: string; tip: string;
}

// circumference for r=70: 2π × 70 ≈ 439.8
const CIRC = 439.8;

// ── Score helpers ──────────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  return s > 80 ? "var(--lime)" : s > 60 ? "var(--amber)" : "var(--red)";
}
function scoreBg(s: number): string {
  const base = s > 80 ? "var(--lime)" : s > 60 ? "var(--amber)" : "var(--red)";
  return `color-mix(in oklab, ${base} 6%, transparent)`;
}
function scoreBorder(s: number): string {
  const base = s > 80 ? "var(--lime)" : s > 60 ? "var(--amber)" : "var(--red)";
  return `color-mix(in oklab, ${base} 18%, transparent)`;
}

function exportHealthScoreCsv(overall: number, dimensions: HealthDimension[]): void {
  const header = ["Metric", "Score", "Description"];
  const rows = [
    ["Overall Health Score", String(overall), "Combined score across payment, delivery, risk, and portfolio stability signals"],
    ...dimensions.map((dimension) => [dimension.name, String(dimension.score), dimension.description]),
  ];
  const escape = (value: string) => "\"" + value.replace(/"/g, "\"\"") + "\"";
  const csv = [header, ...rows].map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "project-health-score.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Health score derivation ────────────────────────────────────────────────────
function buildHealthData(
  invoices: PortalInvoice[],
  projects: PortalProject[]
): {
  overall: number;
  dimensions: HealthDimension[];
  history: { week: string; month: string; score: number }[];
} {
  if (invoices.length === 0 && projects.length === 0) {
    return { overall: 0, dimensions: [], history: [] };
  }

  // ── Payment health ────────────────────────────────────────────────────────
  const totalInvoices = invoices.length;
  const paidInvoices  = invoices.filter(i => i.status === "PAID").length;
  const payRate       = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 100;

  // ── Project delivery ──────────────────────────────────────────────────────
  const activeProjects  = projects.filter(p => p.status === "ACTIVE" || p.status === "IN_PROGRESS").length;
  const highRisk        = projects.filter(p => p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH").length;
  const deliveryRate    = activeProjects > 0
    ? Math.round(((activeProjects - highRisk) / activeProjects) * 100)
    : 100;

  // ── Risk score ────────────────────────────────────────────────────────────
  const lowRisk    = projects.filter(p => !["CRITICAL", "HIGH"].includes(p.riskLevel ?? "")).length;
  const riskScore  = projects.length > 0 ? Math.round((lowRisk / projects.length) * 100) : 100;

  // ── Engagement index (proxy: payment + delivery average) ──────────────────
  const engagementScore = Math.round((payRate * 0.6 + deliveryRate * 0.4));

  // ── Overall ───────────────────────────────────────────────────────────────
  const overall = Math.round((payRate + deliveryRate + riskScore + engagementScore) / 4);

  // ── 6-month trend from invoice data ──────────────────────────────────────
  const now = new Date();
  const history = Array.from({ length: 6 }, (_, i) => {
    const target = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label  = target.toLocaleString("en-ZA", { month: "short" });
    const monthInvs = invoices.filter(inv => {
      const d = new Date(inv.issuedAt ?? inv.createdAt);
      return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
    });
    const mTotal = monthInvs.length;
    const mPaid  = monthInvs.filter(inv => inv.status === "PAID").length;
    // For months with no invoices use overall; for months with invoices use payment rate
    const score  = mTotal > 0 ? Math.round((mPaid / mTotal) * 100) : (mTotal === 0 ? 0 : overall);
    return { week: `M${i + 1}`, month: label, score };
  });

  // ── Dimensions ────────────────────────────────────────────────────────────
  const dimensions: HealthDimension[] = [
    {
      name:        "Payment Reliability",
      score:       payRate,
      description: "On-time invoice payment rate",
      tip:         payRate < 80
        ? "Consider setting up payment reminders to avoid overdue invoices."
        : "Excellent — consistent payments strengthen your working relationship.",
    },
    {
      name:        "Delivery Stability",
      score:       deliveryRate,
      description: "Active projects delivered without high risk",
      tip:         highRisk > 0
        ? `${highRisk} project(s) flagged as high risk. Review with your project manager.`
        : "All active projects are running smoothly.",
    },
    {
      name:        "Risk Control",
      score:       riskScore,
      description: "Proportion of projects at low risk level",
      tip:         riskScore < 70
        ? "Several projects have elevated risk. Engage your project manager to review mitigation plans."
        : "Risk levels are well controlled across all projects.",
    },
    {
      name:        "Portfolio Stability",
      score:       engagementScore,
      description: "Composite of payment and delivery indicators",
      tip:         engagementScore < 70
        ? "One or more core delivery signals are slipping. Review payment cadence and project risk together."
        : "Payment and delivery signals are aligned well across your active work.",
    },
  ];

  return { overall, dimensions, history };
}

// ── Component ──────────────────────────────────────────────────────────────────
export function HealthScorePage({
  invoices,
  projects,
}: {
  invoices: PortalInvoice[];
  projects: PortalProject[];
}) {
  const [mounted, setMounted] = useState(false);
  const [hoveredDim, setHoveredDim] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { overall, dimensions, history } = useMemo(
    () => buildHealthData(invoices, projects),
    [invoices, projects]
  );

  const maxHistory  = history.length > 0 ? Math.max(...history.map(h => h.score)) : 1;
  const fillColor   = scoreColor(overall);
  const weakDims    = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 3);
  const overallLabel = overall > 80 ? "Excellent" : overall > 60 ? "Good" : overall > 0 ? "Needs attention" : "—";
  const today       = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Reporting · Health</div>
          <h1 className={cx("pageTitle")}>Project Health Score</h1>
          <p className={cx("pageSub")}>A view of payment reliability, delivery stability, project risk, and overall portfolio momentum.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => exportHealthScoreCsv(overall, dimensions)} disabled={overall === 0}>
            Export CSV
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Overall Score",   value: overall > 0 ? `${overall}` : "—", color: overall > 80 ? "statCardGreen" : overall > 60 ? "statCardAmber" : "statCardRed" },
          { label: "Payment Reliability", value: overall > 0 ? `${dimensions[0]?.score ?? 0}%` : "—", color: "statCardBlue" },
          { label: "Risk Control",        value: overall > 0 ? `${dimensions[2]?.score ?? 0}%` : "—", color: "statCardAccent" },
          { label: "Portfolio Stability", value: overall > 0 ? `${dimensions[3]?.score ?? 0}%` : "—", color: "statCardAmber" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Score ring + trend chart ─────────────────────────────────────── */}
      <div className={cx("grid2", "mb20")}>
        {/* Animated ring */}
        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Overall Health Score</span></div>
          <div className={cx("cardBodyPad", "hsCenterPanel")}>
            {overall === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No score yet</div>
                <div className={cx("emptyStateSub")}>Your health score will appear once project activity begins.</div>
              </div>
            ) : (
              <>
                <svg width={200} height={200} viewBox="-10 -10 180 180">
                  <circle cx={80} cy={80} r={70} fill="none" stroke="var(--b2)" strokeWidth={16} />
                  <circle
                    cx={80} cy={80} r={70}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={16}
                    strokeDasharray={`${CIRC} ${CIRC}`}
                    strokeDashoffset={mounted ? CIRC * (1 - overall / 100) : CIRC}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    className={reducedMotion ? undefined : "hsRingTransition"}
                  />
                  <text x={80} y={74} textAnchor="middle" dominantBaseline="middle" fontSize={52} fontWeight={800} fill={fillColor}>{overall}</text>
                  <text x={80} y={107} textAnchor="middle" fontSize={14} fill="var(--muted2)">/100</text>
                  <text x={80} y={122} textAnchor="middle" fontSize={10} fill="var(--muted2)">Health Score</text>
                </svg>
                <div className={cx("text11", "colorMuted", "mt8")}>
                  <span className={cx("dynColor")} style={{ "--color": fillColor } as React.CSSProperties}>{overallLabel}</span> · Updated {today}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 6-month trend bar chart */}
        <div className={cx("card")}>
          <div className={cx("cardHd", "mb12")}>
            <span className={cx("cardHdTitle")}>6-Month Trend</span>
          </div>
          <div className={cx("cardBodyPad")}>
            {history.length === 0 || history.every(h => h.score === 0) ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateSub")}>Trend data will appear once your account is active.</div>
              </div>
            ) : (
              <>
                <div className={cx("hsBarsRow")}>
                  {history.map((h, i) => {
                    const heightPct = maxHistory > 0 ? (h.score / maxHistory) * 100 : 0;
                    const isCurrent = i === history.length - 1;
                    return (
                      <div key={h.week} className={cx("hsBarCol")}>
                        <span
                          className={cx("hsBarLabel", "dynColor")}
                          style={{ "--color": h.score > 0 ? scoreColor(h.score) : "var(--muted2)" } as React.CSSProperties}
                        >{h.score > 0 ? h.score : ""}</span>
                        <div
                          className={cx("hsBar", "dynBgColor", isCurrent && "hsBarCurrent")}
                          style={{
                            "--bar-h": h.score > 0 ? `${heightPct}%` : "4%",
                            "--bg-color": h.score > 0 ? scoreColor(h.score) : "var(--b2)",
                            "--outline-color": isCurrent ? fillColor : "none",
                          } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className={cx("flexRow", "gap6", "mt6")}>
                  {history.map((h, i) => (
                    <div
                      key={h.week}
                      className={cx("hsMonthLabel", "dynColor", i === history.length - 1 ? "fw700" : "fw400")}
                      style={{ "--color": i === history.length - 1 ? fillColor : "var(--muted2)" } as React.CSSProperties}
                    >
                      {h.month}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Dimension tiles ──────────────────────────────────────────────── */}
      <div className={cx("card", "mb20")}>
        <div className={cx("cardHd", "mb16")}>
          <span className={cx("cardHdTitle")}>Score Breakdown by Dimension</span>
          {dimensions.length > 0 && (
            <span className={cx("text11", "colorMuted", "mlAuto")}>Hover for tips</span>
          )}
        </div>
        {dimensions.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No score data yet</div>
            <div className={cx("emptyStateSub")}>Dimension scores will appear once your health score has been calculated.</div>
          </div>
        ) : (
          <>
            <div className={cx("grid2Cols12Gap")}>
              {dimensions.map((d) => (
                <DimensionTile
                  key={d.name}
                  d={d}
                  hovered={hoveredDim === d.name}
                  onHover={setHoveredDim}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Recommendations ──────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <Ic n="sparkle" sz={14} c="var(--amber)" />
          <span className={cx("cardHdTitle", "ml6")}>Recommended Focus</span>
        </div>
        <div className={cx("listGroup")}>
          {weakDims.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateSub")}>Recommendations will appear once your health score is available.</div>
            </div>
          ) : weakDims.map((d) => (
            <div key={d.name} className={cx("listRow", "hsRecoRow")}>
              <Ic n="chevronRight" sz={13} c="var(--amber)" />
              <div>
                <div className={cx("fw600", "text12")}>{d.name} — {d.score}/100</div>
                <div className={cx("text11", "colorMuted")}>{d.tip}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dimension tile subcomponent ────────────────────────────────────────────────
function DimensionTile({
  d,
  hovered,
  onHover,
}: {
  d: HealthDimension;
  hovered: boolean;
  onHover: (n: string | null) => void;
}) {
  const color = scoreColor(d.score);
  const tipId = `tip-${d.name.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div
      tabIndex={0}
      aria-describedby={hovered ? tipId : undefined}
      className={cx("hsDimTile", "dynBgColor", "dynBorderColor")}
      style={{ "--bg-color": scoreBg(d.score), "--border-color": scoreBorder(d.score) } as React.CSSProperties}
      onMouseEnter={() => onHover(d.name)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(d.name)}
      onBlur={() => onHover(null)}
    >
      <div className={cx("text11", "colorMuted", "mb6")}>{d.name}</div>
      <div className={cx("fs2rem", "fw800", "dynColor", "lineH1", "mb8")} style={{ "--color": color } as React.CSSProperties}>{d.score}</div>
      <div className={cx("trackH5B1")}>
        <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': d.score, "--bg-color": color } as React.CSSProperties} />
      </div>
      <div className={cx("text10", "colorMuted")}>{d.description}</div>

      {/* Tooltip */}
      {hovered && (
        <div
          id={tipId}
          role="tooltip"
          className={cx("hsTipBox")}
        >
          <div className={cx("flexRow", "flexAlignStart", "gap6")}>
            <Ic n="sparkle" sz={12} c="var(--amber)" />
            <span className={cx("colorText", "lineH14")}>{d.tip}</span>
          </div>
        </div>
      )}
    </div>
  );
}
