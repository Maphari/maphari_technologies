"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  project: string;
};

type Milestone = {
  name: string;
  estimated: number;
  actual: number | null;
  approved: string | null;
  status: "approved" | "in_progress" | "upcoming";
};

type Report = {
  project: string;
  client: string;
  duration: string;
  weeks: number;
  status: "draft" | "complete";
  summary: string;
  milestones: Milestone[];
  finance: {
    contracted: number;
    invoiced: number;
    collected: number;
    retainerMonths: number;
    scopeChanges: number;
    totalValue: number;
  };
  burnData: Array<{ week: string; hours: number }>;
  satisfaction: number;
  retentionRisk: "low" | "medium" | "high";
  wellWent: string[];
  toImprove: string[];
  recommendation: string;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)", project: "Brand Identity System" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00", project: "Annual Report 2025" }
];

const reports: Record<number, Report> = {
  1: {
    project: "Brand Identity System",
    client: "Volta Studios",
    duration: "Jan 9 - Mar 14, 2026",
    weeks: 10,
    status: "draft",
    summary:
      "A complete brand identity system for Volta Studios, including logo, colour palette, typography, brand guidelines, and animation direction. The project delivered across 6 milestones with one scope extension for motion guidelines.",
    milestones: [
      { name: "Logo & Visual Direction", estimated: 12, actual: 14.5, approved: "Feb 22", status: "approved" },
      { name: "Brand Colour System", estimated: 4, actual: 3.5, approved: "Feb 10", status: "approved" },
      { name: "Typography Pairing", estimated: 3, actual: 2, approved: "Feb 5", status: "approved" },
      { name: "Brand Guidelines Doc", estimated: 8, actual: null, approved: null, status: "in_progress" },
      { name: "Animation Direction", estimated: 6, actual: null, approved: null, status: "upcoming" }
    ],
    finance: {
      contracted: 48500,
      invoiced: 32000,
      collected: 32000,
      retainerMonths: 3,
      scopeChanges: 18000,
      totalValue: 66500
    },
    burnData: [
      { week: "W1", hours: 8 },
      { week: "W2", hours: 12 },
      { week: "W3", hours: 10 },
      { week: "W4", hours: 14 },
      { week: "W5", hours: 9 },
      { week: "W6", hours: 11 }
    ],
    satisfaction: 91,
    retentionRisk: "low",
    wellWent: [
      "Client highly engaged from kickoff - clear brief and fast feedback",
      "Typography direction landed first time with no revisions",
      "Scope extension negotiated smoothly - R18,000 added without friction"
    ],
    toImprove: [
      "Logo phase ran 2.5h over - need better milestone scoping for complex brand marks",
      "Animation brief came late - should clarify motion requirements at kickoff"
    ],
    recommendation:
      "Strong candidate for annual retainer - high satisfaction, pays early, expanding needs."
  },
  5: {
    project: "Annual Report 2025",
    client: "Okafor & Sons",
    duration: "Jan 15 - Mar 10, 2026",
    weeks: 8,
    status: "complete",
    summary:
      "End-to-end design and production of the 2025 annual report for Okafor & Sons, including data visualisation, layout, typesetting, cover design, and print-ready PDF export. All 4 milestones approved on time.",
    milestones: [
      { name: "Data Visualisation Suite", estimated: 10, actual: 9.5, approved: "Feb 19", status: "approved" },
      { name: "Layout & Typesetting", estimated: 14, actual: 16, approved: "Feb 27", status: "approved" },
      { name: "Cover Design (3 options)", estimated: 4, actual: 3.5, approved: "Mar 3", status: "approved" },
      { name: "Final PDF & Print Prep", estimated: 3, actual: 2.5, approved: "Mar 10", status: "approved" }
    ],
    finance: {
      contracted: 28000,
      invoiced: 28000,
      collected: 28000,
      retainerMonths: 2,
      scopeChanges: 0,
      totalValue: 28000
    },
    burnData: [
      { week: "W1", hours: 6 },
      { week: "W2", hours: 10 },
      { week: "W3", hours: 14 },
      { week: "W4", hours: 11 },
      { week: "W5", hours: 8 },
      { week: "W6", hours: 5 },
      { week: "W7", hours: 4 },
      { week: "W8", hours: 3 }
    ],
    satisfaction: 96,
    retentionRisk: "low",
    wellWent: [
      "Zero revision requests across all 4 milestones - exceptional client clarity",
      "Chidi paid every invoice early - zero cash flow friction",
      "Data vis phase was highly efficient - 0.5h under estimate",
      "Client referred two contacts to the studio"
    ],
    toImprove: [
      "Layout phase ran 2h over estimate - complex data tables took longer than scoped",
      "Could have proposed motion / interactive version as upsell earlier"
    ],
    recommendation:
      "Propose 2026 annual report retainer immediately. Also explore quarterly report design as an add-on."
  }
};

function StatusBadge({ status }: { status: Milestone["status"] }) {
  const cfg: Record<Milestone["status"], { label: string; color: string; bg: string }> = {
    approved: { label: "Approved", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" },
    in_progress: { label: "In progress", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
    upcoming: { label: "Upcoming", color: "var(--muted2)", bg: "rgba(160,160,176,0.06)" }
  };
  return (
    <span
      style={{
        fontSize: 9,
        padding: "2px 7px",
        borderRadius: 2,
        background: cfg[status].bg,
        color: cfg[status].color,
        letterSpacing: "0.08em",
        textTransform: "uppercase"
      }}
    >
      {cfg[status].label}
    </span>
  );
}

export function CloseOutReportPage({ isActive }: { isActive: boolean }) {
  const [selectedId, setSelectedId] = useState(5);
  const [section, setSection] = useState<"overview" | "finance" | "milestones" | "retro">("overview");
  const report = reports[selectedId];
  const client = clients.find((row) => row.id === selectedId) ?? clients[0];

  const totalEst = report.milestones.reduce((sum, milestone) => sum + milestone.estimated, 0);
  const totalAct = report.milestones.reduce((sum, milestone) => sum + (milestone.actual ?? 0), 0);
  const totalHours = report.burnData.reduce((sum, row) => sum + row.hours, 0);
  const variance = totalAct - totalEst;
  const accuracy = totalEst > 0 ? Math.round((1 - Math.abs(variance) / totalEst) * 100) : 100;
  const maxBurnHours = Math.max(...report.burnData.map((row) => row.hours), 1);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-closeout-report">
      <style>{`
        .co-project-btn { transition: all 0.12s ease; cursor: pointer; }
        .co-project-btn:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .co-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .co-export-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .co-export-btn:hover { background: #a8d420 !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Workflow
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Close-out Report
            </h1>
          </div>
          <button
            className="co-export-btn"
            style={{
              padding: "10px 18px",
              background: "var(--accent)",
              color: "#050508",
              border: "none",
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            Export PDF
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 0 }}>
          {clients.map((row) => {
            const rowReport = reports[row.id];
            const isActiveProject = selectedId === row.id;
            return (
              <div
                key={row.id}
                className="co-project-btn"
                onClick={() => setSelectedId(row.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "4px 4px 0 0",
                  flex: "0 0 auto",
                  border: `1px solid ${isActiveProject ? `${row.color}40` : "rgba(255,255,255,0.06)"}`,
                  borderBottom: isActiveProject ? "1px solid #050508" : "1px solid rgba(255,255,255,0.06)",
                  background: isActiveProject ? "#050508" : "rgba(255,255,255,0.01)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 2, background: `${row.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: row.color }}>
                  {row.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: isActiveProject ? "#fff" : "#a0a0b0" }}>{row.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted2)" }}>{rowReport.project}</div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    borderRadius: 2,
                    background: rowReport.status === "complete" ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "rgba(96,165,250,0.1)",
                    color: rowReport.status === "complete" ? "var(--accent)" : "#60a5fa",
                    letterSpacing: "0.06em",
                    marginLeft: 4
                  }}
                >
                  {rowReport.status === "complete" ? "Complete" : "Draft"}
                </span>
              </div>
            );
          })}

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
            {[
              { key: "overview", label: "Overview" },
              { key: "finance", label: "Finance" },
              { key: "milestones", label: "Milestones" },
              { key: "retro", label: "Retrospective" }
            ].map((tab) => (
              <button
                key={tab.key}
                className="co-tab-btn"
                onClick={() => setSection(tab.key as "overview" | "finance" | "milestones" | "retro")}
                style={{
                  padding: "10px 16px",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "transparent",
                  color: section === tab.key ? "var(--accent)" : "var(--muted2)",
                  borderBottom: `2px solid ${section === tab.key ? "var(--accent)" : "transparent"}`,
                  marginBottom: -1
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 28 }}>
        {section === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 3, background: `${client.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: client.color }}>
                  {client.avatar}
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>{report.project}</div>
                  <div style={{ fontSize: 11, color: "var(--muted2)" }}>{report.client} - {report.duration}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.8, marginBottom: 24, maxWidth: 580 }}>{report.summary}</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  { label: "Duration", value: `${report.weeks}w`, color: "#a0a0b0" },
                  { label: "Total hours", value: `${totalHours}h`, color: "#a0a0b0" },
                  { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 85 ? "var(--accent)" : "#f5c518" },
                  { label: "Satisfaction", value: `${report.satisfaction}/100`, color: report.satisfaction >= 85 ? "var(--accent)" : "#f5c518" }
                ].map((stat) => (
                  <div key={stat.label} style={{ padding: "14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Hours logged by week</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 180, padding: "14px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                {report.burnData.map((row) => (
                  <div key={row.week} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#a0a0b0" }}>{row.hours}h</span>
                    <div style={{ width: "100%", maxWidth: 32, height: `${Math.max(8, Math.round((row.hours / maxBurnHours) * 110))}px`, borderRadius: "3px 3px 0 0", background: client.color, opacity: 0.75 }} />
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>{row.week}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: "16px", border: `1px solid ${client.color}30`, borderRadius: 4, background: `${client.color}05` }}>
                <div style={{ fontSize: 10, color: client.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  Retention signal
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                  {report.recommendation}
                </div>
                <div style={{ fontSize: 9, padding: "2px 8px", borderRadius: 2, background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", display: "inline-block", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {report.retentionRisk === "low" ? "Low churn risk" : "Monitor retention"}
                </div>
              </div>

              <div style={{ padding: "14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Project value</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>
                  R{report.finance.totalValue.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted2)" }}>Contracted + scope changes</div>
              </div>

              <div style={{ padding: "14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Milestone summary</div>
                {report.milestones.map((milestone) => (
                  <div key={milestone.name} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 10, color: milestone.status === "approved" ? "var(--accent)" : milestone.status === "in_progress" ? "#60a5fa" : "var(--muted2)", flexShrink: 0 }}>
                      {milestone.status === "approved" ? "v" : milestone.status === "in_progress" ? "*" : "o"}
                    </span>
                    <span style={{ fontSize: 11, color: "#a0a0b0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{milestone.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "finance" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Financial Summary</div>
            {[
              { label: "Contracted value", value: `R${report.finance.contracted.toLocaleString()}`, color: "#a0a0b0" },
              { label: "Scope changes", value: `+ R${report.finance.scopeChanges.toLocaleString()}`, color: report.finance.scopeChanges > 0 ? "var(--accent)" : "var(--muted2)" },
              { label: "Total project value", value: `R${report.finance.totalValue.toLocaleString()}`, color: "var(--accent)", bold: true },
              { label: "Total invoiced", value: `R${report.finance.invoiced.toLocaleString()}`, color: "#a0a0b0" },
              { label: "Total collected", value: `R${report.finance.collected.toLocaleString()}`, color: "var(--accent)" },
              { label: "Outstanding", value: `R${(report.finance.invoiced - report.finance.collected).toLocaleString()}`, color: report.finance.invoiced - report.finance.collected > 0 ? "#ff4444" : "var(--muted2)" }
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: row.bold ? "color-mix(in srgb, var(--accent) 3%, transparent)" : "transparent" }}>
                <span style={{ fontSize: 13, color: "var(--muted2)" }}>{row.label}</span>
                <span style={{ fontSize: 15, color: row.color, fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
              </div>
            ))}

            <div style={{ marginTop: 20, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Effective hourly rate</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>
                R{Math.round(report.finance.totalValue / Math.max(totalHours, 1)).toLocaleString()} / hr
              </div>
              <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>Based on {totalHours}h logged</div>
            </div>
          </div>
        )}

        {section === "milestones" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Milestone Review</div>
            {report.milestones.map((milestone) => {
              const varianceHours = milestone.actual !== null ? milestone.actual - milestone.estimated : null;
              return (
                <div key={milestone.name} style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, marginBottom: 10, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{milestone.name}</div>
                      {milestone.approved ? <div style={{ fontSize: 10, color: "var(--muted2)" }}>Approved {milestone.approved}</div> : null}
                    </div>
                    <StatusBadge status={milestone.status} />
                  </div>
                  {milestone.actual !== null ? (
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 3 }}>ESTIMATED</div>
                        <div style={{ fontSize: 14, color: "#a0a0b0" }}>{milestone.estimated}h</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 3 }}>ACTUAL</div>
                        <div style={{ fontSize: 14, color: "#a0a0b0" }}>{milestone.actual}h</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 3 }}>VARIANCE</div>
                        <div style={{ fontSize: 14, color: (varianceHours ?? 0) > 0 ? "#ff4444" : "var(--accent)" }}>
                          {(varianceHours ?? 0) > 0 ? "+" : ""}
                          {varianceHours}h
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--muted2)" }}>Estimated {milestone.estimated}h - Not yet complete</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {section === "retro" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, maxWidth: 800 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>What went well</span>
              </div>
              {report.wellWent.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", border: "1px solid color-mix(in srgb, var(--accent) 10%, transparent)", borderRadius: 3, marginBottom: 8, background: "color-mix(in srgb, var(--accent) 3%, transparent)" }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, fontSize: 12, marginTop: 1 }}>v</span>
                  <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f5c518" }} />
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>To improve</span>
              </div>
              {report.toImprove.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", border: "1px solid rgba(245,197,24,0.1)", borderRadius: 3, marginBottom: 8, background: "rgba(245,197,24,0.03)" }}>
                  <span style={{ color: "#f5c518", flexShrink: 0, fontSize: 12, marginTop: 1 }}>!</span>
                  <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}

              <div style={{ marginTop: 20, padding: "14px", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 3, background: "rgba(167,139,250,0.05)" }}>
                <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Recommendation</div>
                <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{report.recommendation}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
