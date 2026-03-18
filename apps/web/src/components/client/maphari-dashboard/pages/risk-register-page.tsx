"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalRisksWithRefresh, type PortalRisk } from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ──────────────────────────────────────────────────────────────────────

type RSeverity    = "High" | "Medium" | "Low";
type RProbability = "High" | "Medium" | "Low";
type RStatus      = "Open" | "Mitigated" | "Monitoring";
type RCategory    = "Technical" | "Resource" | "Scope" | "Compliance" | "Client" | "Security" | "Commercial";
type RView        = "matrix" | "list";

type MStep = { label: string; done: boolean };

type Risk = {
  id:            string;
  title:         string;
  category:      RCategory;
  severity:      RSeverity;
  probability:   RProbability;
  status:        RStatus;
  impact:        string;
  mitigation:    string;
  ownerName:     string;
  ownerInitials: string;
  ownerRole:     string;
  project:       string;
  date:          string;
  lastUpdated:   string;
  dueDate:       string;
  tags:          string[];
  steps:         MStep[];
};

// ── Config ─────────────────────────────────────────────────────────────────────

const SCORE_MAP: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

const riskScore = (r: Risk) => SCORE_MAP[r.severity] * SCORE_MAP[r.probability];

const getZone = (score: number) => {
  if (score >= 7) return { label: "CRITICAL", color: "var(--red)",   bg: "color-mix(in oklab, var(--red) 14%, transparent)",   border: "color-mix(in oklab, var(--red) 35%, transparent)"   };
  if (score >= 4) return { label: "HIGH",     color: "var(--red)",   bg: "color-mix(in oklab, var(--red) 7%, transparent)",    border: "color-mix(in oklab, var(--red) 20%, transparent)"   };
  if (score >= 2) return { label: "MEDIUM",   color: "var(--amber)", bg: "color-mix(in oklab, var(--amber) 7%, transparent)",  border: "color-mix(in oklab, var(--amber) 20%, transparent)" };
  return               { label: "LOW",      color: "var(--muted2)", bg: "var(--s2)",                                           border: "var(--b2)"                                            };
};

const SEV_COLOR: Record<RSeverity, string> = {
  High: "var(--red)", Medium: "var(--amber)", Low: "var(--muted2)",
};
const SEV_BADGE: Record<RSeverity, string> = {
  High: "badgeRed", Medium: "badgeAmber", Low: "badgeMuted",
};
const STATUS_COLOR: Record<RStatus, string> = {
  Open: "var(--amber)", Mitigated: "var(--lime)", Monitoring: "var(--purple)",
};
const STATUS_BADGE: Record<RStatus, string> = {
  Open: "badgeAmber", Mitigated: "badgeAccent", Monitoring: "badgePurple",
};
const STATUS_ICON: Record<RStatus, string> = {
  Open: "alert", Mitigated: "check", Monitoring: "eye",
};
const CAT_CFG: Record<RCategory, { icon: string; color: string }> = {
  Technical:  { icon: "code",        color: "var(--lime)"   },
  Resource:   { icon: "users",       color: "var(--cyan)"   },
  Scope:      { icon: "target",      color: "var(--amber)"  },
  Compliance: { icon: "shieldCheck", color: "var(--green)"  },
  Client:     { icon: "user",        color: "var(--purple)" },
  Security:   { icon: "lock",        color: "var(--red)"    },
  Commercial: { icon: "dollar",      color: "var(--blue)"   },
};

const PROB_LABELS: RProbability[] = ["Low", "Medium", "High"];
const SEV_LABELS:  RSeverity[]    = ["High", "Medium", "Low"];
const ALL_CATS: RCategory[]       = ["Technical", "Resource", "Scope", "Compliance", "Client", "Security", "Commercial"];

// ── Client-facing explain text ─────────────────────────────────────────────────

function riskExplainText(zone: string): string {
  if (zone === "CRITICAL") return "This risk directly threatens your delivery date or budget. The team is escalating it and may need your input.";
  if (zone === "HIGH")     return "This could affect delivery quality or scope. Being actively managed — no action needed from you unless flagged.";
  if (zone === "MEDIUM")   return "Worth watching. Impact is contained for now and the team has it under control.";
  return "Minor risk with minimal expected impact on your project.";
}

// ── API mapping ────────────────────────────────────────────────────────────────

function toLevel(s: string): "High" | "Medium" | "Low" {
  if (s === "HIGH")   return "High";
  if (s === "MEDIUM") return "Medium";
  return "Low";
}
function toRStatus(s: string): RStatus {
  if (s === "MITIGATED")  return "Mitigated";
  if (s === "MONITORING") return "Monitoring";
  return "Open";
}
function mapApiRisk(r: PortalRisk, idx: number): Risk {
  const initials = (r.name ?? "R").slice(0, 2).toUpperCase();
  return {
    id:            r.id,
    title:         r.name,
    category:      "Technical",
    severity:      toLevel(r.impact),
    probability:   toLevel(r.likelihood),
    status:        toRStatus(r.status),
    impact:        r.detail ?? r.name,
    mitigation:    r.mitigation ?? "No mitigation recorded.",
    ownerName:     "Team",
    ownerInitials: initials,
    ownerRole:     "Team Member",
    project:       "",
    date:          new Date(r.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    lastUpdated:   new Date(r.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    dueDate:       "Ongoing",
    tags:          [],
    steps:         [],
  };
}

// ── Legacy static data ────────────────────────────────────────────────────────
// _STATIC_RISKS kept as typed empty array — component uses API data via setRisks()
const _STATIC_RISKS: Risk[] = [
  /* intentionally empty — data loaded from loadPortalRisksWithRefresh */
];


// ── Component ──────────────────────────────────────────────────────────────────

export function RiskRegisterPage() {
  // ── Project layer: real API data ──────────────────────────────────────────
  const { session, projectId } = useProjectLayer();
  const [RISKS, setRisks] = useState<Risk[]>([]);

  useEffect(() => {
    if (!session || !projectId) return;
    void loadPortalRisksWithRefresh(session, projectId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data && result.data.length > 0) {
        setRisks(result.data.map((r, i) => mapApiRisk(r, i)));
      }
    });
  }, [session, projectId]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [view,         setView]         = useState<RView>("matrix");
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [listTab,      setListTab]      = useState<"All" | RSeverity>("All");

  const filtered = useMemo(() => {
    let list = listTab === "All" ? RISKS : RISKS.filter(r => r.severity === listTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q)    ||
        r.id.toLowerCase().includes(q)       ||
        r.category.toLowerCase().includes(q) ||
        r.tags.some(t => t.includes(q))
      );
    }
    return list;
  }, [listTab, search, RISKS]);

  const selectedData = RISKS.find(r => r.id === selectedRisk) ?? null;

  const cellRisks = (prob: RProbability, sev: RSeverity) =>
    RISKS.filter(r => r.probability === prob && r.severity === sev);

  // Counts
  const totalOpen      = RISKS.filter(r => r.status === "Open").length;
  const totalMonitor   = RISKS.filter(r => r.status === "Monitoring").length;
  const totalMitigated = RISKS.filter(r => r.status === "Mitigated").length;
  const totalCritical  = RISKS.filter(r => riskScore(r) >= 7).length;

  // Zone distribution
  const zoneCounts: Array<[string, number, string]> = [
    ["Critical", RISKS.filter(r => riskScore(r) >= 7).length,               "var(--red)"    ],
    ["High",     RISKS.filter(r => { const s = riskScore(r); return s >= 4 && s < 7; }).length, "var(--red)"    ],
    ["Medium",   RISKS.filter(r => { const s = riskScore(r); return s >= 2 && s < 4; }).length, "var(--amber)"  ],
    ["Low",      RISKS.filter(r => riskScore(r) < 2).length,                "var(--muted2)" ],
  ];

  // Category counts
  const catCounts = ALL_CATS.map(c => ({ cat: c, count: RISKS.filter(r => r.category === c).length })).filter(c => c.count > 0);

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Risk</div>
          <h1 className={cx("pageTitle")}>Risk Register</h1>
          <p className={cx("pageSub")}>Visibility into all known project risks, their severity, and how each is being tracked and mitigated.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")}>
            <Ic n="download" sz={13} /> Export Register
          </button>
          <button type="button" className={cx("btnSm", "btnAccent", "flexRow", "gap6")}>
            <Ic n="plus" sz={13} c="var(--bg)" /> Add Risk
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Risks",  value: RISKS.length, color: "statCard",      icon: "alert",  ic: "var(--muted2)" },
          { label: "Critical",     value: totalCritical, color: "statCardRed",  icon: "zap",    ic: "var(--red)"    },
          { label: "Open",         value: totalOpen,     color: "statCardAmber", icon: "clock",  ic: "var(--amber)"  },
          { label: "Mitigated",    value: totalMitigated,color: "statCardGreen", icon: "check",  ic: "var(--lime)"   },
        ].map(s => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{s.label}</div>
              <Ic n={s.icon} sz={14} c={s.ic} />
            </div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Overview row ─────────────────────────────────────────────────────── */}
      <div className={cx("grid2", "mb16")}>

        {/* Risk Zone Summary */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Risk Zone Summary</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{RISKS.length} total risks</span>
          </div>
          <div className={cx("flexCol", "gap10")}>
            {zoneCounts.map(([zone, count, color]) => {
              const pct = Math.round((count / RISKS.length) * 100);
              return (
                <div key={zone} className={cx("flexRow", "gap10")}>
                  <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("text11", "w62")}>{zone}</span>
                  <div className={cx("progressTrack")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "fw700", "text11", "dynColor", "w24", "textRight")} style={{ "--color": color } as React.CSSProperties}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("borderT", "mt14", "pt12", "flexRow", "gap8", "flexWrap")}>
            {[
              { label: "Open",       val: totalOpen,      color: "var(--amber)"  },
              { label: "Monitoring", val: totalMonitor,   color: "var(--purple)" },
              { label: "Mitigated",  val: totalMitigated, color: "var(--lime)"   },
            ].map(s => (
              <span key={s.label} className={cx("flexRow", "gap5")}>
                <span className={cx("dot7", "inlineBlock")} style={{ "--bg-color": s.color } as React.CSSProperties} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>{s.val} {s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Category Distribution</span>
          </div>
          <div className={cx("flexCol", "gap8", "mb14")}>
            {catCounts.map(({ cat, count }) => {
              const cfg = CAT_CFG[cat];
              const pct = Math.round((count / RISKS.length) * 100);
              return (
                <div key={cat} className={cx("flexRow", "gap10")}>
                  <div className={cx("rrCatIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${cfg.color} 20%, transparent)` } as React.CSSProperties}>
                    <Ic n={cfg.icon} sz={11} c={cfg.color} />
                  </div>
                  <span className={cx("text11", "flex1")}>{cat}</span>
                  <div className={cx("microProgressTrack")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": cfg.color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "text10", "colorMuted2", "w34", "textRight")}>
                    {count} <span className={cx("fs06")}>{pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className={cx("progressTrackFlex")}>
            {catCounts.map(({ cat, count }) => (
              <div key={cat} className={cx("dynFlex", "dynBgColor")} style={{ "--flex": count, "--bg-color": CAT_CFG[cat].color } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </div>

      {/* ── View toggle + search ─────────────────────────────────────────────── */}
      <div className={cx("flexBetween", "mb12")}>
        <div className={cx("flexRow", "h36")}>
          <div className={cx("pillTabs")}>
            <button type="button" className={cx("pillTab", view === "matrix" ? "pillTabActive" : "")} onClick={() => { setView("matrix"); setSelectedRisk(null); }}>
              <span className={cx("flexRow", "gap5")}><Ic n="grid" sz={11} /> Matrix</span>
            </button>
            <button type="button" className={cx("pillTab", view === "list" ? "pillTabActive" : "")} onClick={() => setView("list")}>
              <span className={cx("flexRow", "gap5")}><Ic n="list" sz={11} /> List</span>
            </button>
          </div>
        </div>
        {view === "list" && (
          <div className={cx("flexRow", "gap10")}>
            <input type="text" className={cx("input", "w220", "h36")} placeholder="Search risks…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className={cx("flexRow", "h36")}>
              <div className={cx("pillTabs")}>
                {(["All", "High", "Medium", "Low"] as const).map(t => (
                  <button key={t} type="button" className={cx("pillTab", listTab === t ? "pillTabActive" : "")} onClick={() => setListTab(t)}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════ MATRIX VIEW ════════════════════ */}
      {view === "matrix" && (
        <div className={cx("card", "overflowHidden")}>
          <div className={cx("cardHd", "borderB")}>
            <span className={cx("cardHdTitle")}>Impact × Probability Matrix</span>
            <span className={cx("text11", "colorMuted")}>Click a risk to see details</span>
          </div>

          <div className={cx("overflowXAuto", "p16x20x12")}>
            <div className={cx("minW500")}>

              {/* Y-axis label */}
              <div className={cx("gridHeatmap")}>
                <div />
                {PROB_LABELS.map(p => (
                  <div key={p} className={cx("textCenter", "pb8")}>
                    <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{p}</span>
                  </div>
                ))}
              </div>

              {/* Matrix rows */}
              {SEV_LABELS.map(sev => (
                <div key={sev} className={cx("gridHeatmap", "mb6")}>
                  {/* Row label */}
                  <div className={cx("flexRow", "flexCenter", "justifyEnd", "pr12")}>
                    <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{sev}</span>
                  </div>

                  {PROB_LABELS.map(prob => {
                    const risks = cellRisks(prob, sev);
                    const score = SCORE_MAP[sev] * SCORE_MAP[prob];
                    const zone  = getZone(score);
                    return (
                      <div
                        key={prob}
                        className={cx("rrMatrixCell", "dynBgColor")}
                        style={{ "--bg-color": zone.bg, "--border-color": zone.border } as React.CSSProperties}
                      >
                        {/* Zone label */}
                        <span className={cx("fontMono", "absZoneLabel", "dynColor")} style={{ "--color": zone.color } as React.CSSProperties}>
                          {zone.label}
                        </span>

                        {/* Risk circles */}
                        <div className={cx("flexWrap", "gap6", "pt2", "flexRow")}>
                          {risks.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              title={r.title}
                              onClick={() => setSelectedRisk(selectedRisk === r.id ? null : r.id)}
                              className={cx("rrRiskCircle", "dynBgColor", selectedRisk === r.id && "rrRiskCircleSelected")}
                              style={{ "--bg-color": SEV_COLOR[r.severity] } as React.CSSProperties}
                            >
                              {r.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Axis labels */}
              <div className={cx("rrAxisGrid")}>
                <div />
                <div className={cx("textCenter")}>
                  <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>← Probability →</span>
                </div>
              </div>

              {/* Legend */}
              <div className={cx("flexRow", "gap16", "mt14", "flexWrap", "flexCenter", "pt12", "borderT")}>
                {[
                  { color: "var(--red)",    label: "High severity"   },
                  { color: "var(--amber)",  label: "Medium severity" },
                  { color: "var(--muted2)", label: "Low severity"    },
                ].map(l => (
                  <span key={l.label} className={cx("flexRow", "gap6")}>
                    <div className={cx("dot12")} style={{ "--bg-color": l.color } as React.CSSProperties} />
                    <span className={cx("text10", "colorMuted")}>{l.label}</span>
                  </span>
                ))}
                {[
                  { color: "var(--red)",   bg: "color-mix(in oklab, var(--red) 14%, transparent)",   label: "Critical zone" },
                  { color: "var(--amber)", bg: "color-mix(in oklab, var(--amber) 7%, transparent)",  label: "Medium zone"   },
                ].map(l => (
                  <span key={l.label} className={cx("flexRow", "gap6")}>
                    <div className={cx("dot12sq", "dynBgColor")} style={{ "--bg-color": l.bg, "--border-color": l.color } as React.CSSProperties} />
                    <span className={cx("text10", "colorMuted")}>{l.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Detail panel ───────────────────────────────────────────────── */}
          {selectedData && (() => {
            const score = riskScore(selectedData);
            const zone  = getZone(score);
            const cfg   = CAT_CFG[selectedData.category];
            const doneCount = selectedData.steps.filter(s => s.done).length;
            return (
              <div className={cx("dynBorderLeft3", "dynBgColor", "borderT")} style={{ "--color": SEV_COLOR[selectedData.severity], "--bg-color": `color-mix(in oklab, ${SEV_COLOR[selectedData.severity]} 4%, var(--s2))` } as React.CSSProperties}>
                <div className={cx("grid2Cols252")}>

                  {/* Left */}
                  <div className={cx("panelL")}>
                    {/* Header */}
                    <div className={cx("flexAlignStart", "justifyBetween", "mb10")}>
                      <div>
                        <div className={cx("flexRow", "flexCenter", "gap8", "mb4")}>
                          <span className={cx("fontMono", "text10", "colorAccent")}>{selectedData.id}</span>
                          <span className={cx("badge", SEV_BADGE[selectedData.severity])}>{selectedData.severity} Severity</span>
                          <span className={cx("badge", STATUS_BADGE[selectedData.status], "flexRow", "flexCenter", "gap3")}>
                            <Ic n={STATUS_ICON[selectedData.status]} sz={9} c="currentColor" />{selectedData.status}
                          </span>
                          <span className={cx("zonePill", "dynBgColor", "dynColor", "fontMono", "fw700")} style={{ "--bg-color": zone.bg, "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>
                            {zone.label} · Score {score}
                          </span>
                        </div>
                        <div className={cx("fw700", "text13")}>{selectedData.title}</div>
                      </div>
                      <button type="button" className={cx("btnSm", "btnGhost", "noShrink", "ml12", "flexRow", "flexCenter", "gap4")} onClick={() => setSelectedRisk(null)}>
                        <Ic n="x" sz={11} c="var(--muted2)" /> Close
                      </button>
                    </div>

                    {/* Impact + mitigation */}
                    <div className={cx("grid2Cols", "gap10", "mb12")}>
                      {[
                        { icon: "alert",    color: "var(--red)",   label: "Impact",     body: selectedData.impact     },
                        { icon: "shieldCheck", color: "var(--lime)", label: "Mitigation", body: selectedData.mitigation },
                      ].map(sec => (
                        <div key={sec.label} className={cx("infoChip")}>
                          <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                            <Ic n={sec.icon} sz={11} c={sec.color} />
                            <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "dynColor")} style={{ "--color": sec.color } as React.CSSProperties}>{sec.label}</span>
                          </div>
                          <div className={cx("text11", "colorMuted", "lineH16")}>{sec.body}</div>
                        </div>
                      ))}
                    </div>

                    {/* Mitigation steps */}
                    <div>
                      <div className={cx("flexBetween", "mb8")}>
                        <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Mitigation Steps</span>
                        <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": doneCount === selectedData.steps.length ? "var(--lime)" : "var(--amber)" } as React.CSSProperties}>
                          {doneCount}/{selectedData.steps.length} done
                        </span>
                      </div>
                      <div className={cx("flexCol", "gap6")}>
                        {selectedData.steps.map((step, i) => (
                          <div key={i} className={cx("flexRow", "gap8")}>
                            <div className={cx("rrStepCheck", "dynBgColor")} style={{ "--bg-color": step.done ? "color-mix(in oklab, var(--lime) 15%, var(--s2))" : "var(--s3)", "--border-color": step.done ? "color-mix(in oklab, var(--lime) 30%, transparent)" : "var(--b2)" } as React.CSSProperties}>
                              {step.done && <Ic n="check" sz={10} c="var(--lime)" />}
                            </div>
                            <span className={cx("text11", "dynColor")} style={{ "--color": step.done ? "inherit" : "var(--muted2)" } as React.CSSProperties}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className={cx("sectionPanelL")}>
                    {/* Owner */}
                    <div>
                      <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb8")}>Owner</div>
                      <div className={cx("infoChip")}>
                        <Av initials={selectedData.ownerInitials} size={32} />
                        <div>
                          <div className={cx("fw600", "text12")}>{selectedData.ownerName}</div>
                          <div className={cx("text10", "colorMuted2")}>{selectedData.ownerRole}</div>
                        </div>
                      </div>
                    </div>

                    {/* Meta grid */}
                    <div className={cx("grid2Cols", "gap8")}>
                      {[
                        { label: "Category",  value: selectedData.category   },
                        { label: "Project",   value: selectedData.project     },
                        { label: "Logged",    value: selectedData.date        },
                        { label: "Due Date",  value: selectedData.dueDate     },
                      ].map(m => (
                        <div key={m.label} className={cx("infoChipSm")}>
                          <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{m.label}</div>
                          <div className={cx("fw600", "text11")}>{m.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className={cx("flexRow", "flexWrap", "gap5")}>
                      {selectedData.tags.map(t => (
                        <span key={t} className={cx("tagPill", "fontMono", "text10", "colorMuted2")}>#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════════ LIST VIEW ════════════════════ */}
      {view === "list" && (
        <div className={cx("card", "overflowHidden")}>

          {/* Column headers */}
          {filtered.length > 0 && (
            <div className={cx("rrListHeader")}>
              {["", "Risk", "Severity", "Prob.", "Status", ""].map((h, i) => (
                <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
              ))}
            </div>
          )}

          {/* Empty */}
          {filtered.length === 0 && (
            <div className={cx("emptyPad48x24", "textCenter")}>
              <Ic n="alert" sz={28} c="var(--muted2)" />
              <div className={cx("fw800", "text13", "mt12", "mb4")}>No risks found</div>
              <div className={cx("text12", "colorMuted")}>{search ? `No results for "${search}"` : "No risks in this category."}</div>
              {search && <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>Clear search</button>}
            </div>
          )}

          {/* Rows */}
          {filtered.map((r, idx) => {
            const isOpen = expanded === r.id;
            const score  = riskScore(r);
            const zone   = getZone(score);
            const cfg    = CAT_CFG[r.category];
            const doneCount = r.steps.filter(s => s.done).length;

            return (
              <div key={r.id} className={cx("dynBorderLeft3", idx < filtered.length - 1 && "borderB")} style={{ "--color": SEV_COLOR[r.severity] } as React.CSSProperties}>
                {/* Row trigger */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className={cx("gridRowBtn6colV2")}
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  {/* Category icon */}
                  <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${cfg.color} 25%, transparent)` } as React.CSSProperties}>
                    <Ic n={cfg.icon} sz={15} c={cfg.color} />
                  </div>

                  {/* Title */}
                  <div className={cx("minW0")}>
                    <div className={cx("fw600", "text12", "truncate")}>{r.title}</div>
                    <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                      <span className={cx("fontMono", "text10", "colorAccent")}>{r.id}</span>
                      <span className={cx("badge", "badgeMuted", "fs06")}>{r.category}</span>
                      <span className={cx("scorePill", "dynBgColor", "dynColor")} style={{ "--bg-color": zone.bg, "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>{zone.label} · {score}</span>
                    </div>
                  </div>

                  {/* Severity */}
                  <div className={cx("flexRow", "gap5")}>
                    <div className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": SEV_COLOR[r.severity] } as React.CSSProperties} />
                    <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": SEV_COLOR[r.severity] } as React.CSSProperties}>{r.severity}</span>
                  </div>

                  {/* Probability */}
                  <span className={cx("fontMono", "text10", "colorMuted2")}>{r.probability}</span>

                  {/* Status */}
                  <span className={cx("badge", STATUS_BADGE[r.status], "flexRow", "gap4")}>
                    <Ic n={STATUS_ICON[r.status]} sz={9} c="currentColor" />{r.status}
                  </span>

                  {/* Chevron */}
                  <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className={cx("dynBgColor", "borderT")} style={{ "--bg-color": `color-mix(in oklab, ${SEV_COLOR[r.severity]} 4%, var(--s2))` } as React.CSSProperties}>
                    <div className={cx("grid2Cols252")}>

                      {/* Left */}
                      <div className={cx("panelL")}>

                        {/* What this means for you */}
                        <div className={cx("rrExplainBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${zone.color} 6%, var(--s2))`, "--border-color": `color-mix(in oklab, ${zone.color} 16%, transparent)`, "--color": zone.color } as React.CSSProperties}>
                          <Ic n="user" sz={11} c={zone.color} />
                          <div>
                            <span className={cx("fontMono", "text10", "fw700", "uppercase", "dynColor", "blockDisplay", "mb2")} style={{ "--color": zone.color } as React.CSSProperties}>What this means for you</span>
                            <span className={cx("text11", "colorMuted", "lineH155")}>{riskExplainText(zone.label)}</span>
                          </div>
                        </div>

                        {/* Impact + Mitigation */}
                        <div className={cx("grid2Cols", "gap10", "mb12")}>
                          {[
                            { icon: "alert",       color: "var(--red)",  label: "Impact",     body: r.impact     },
                            { icon: "shieldCheck", color: "var(--lime)", label: "Mitigation", body: r.mitigation },
                          ].map(sec => (
                            <div key={sec.label} className={cx("infoChip")}>
                              <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                                <Ic n={sec.icon} sz={11} c={sec.color} />
                                <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "dynColor")} style={{ "--color": sec.color } as React.CSSProperties}>{sec.label}</span>
                              </div>
                              <div className={cx("text11", "colorMuted", "lineH16")}>{sec.body}</div>
                            </div>
                          ))}
                        </div>

                        {/* Steps */}
                        <div>
                          <div className={cx("flexBetween", "mb8")}>
                            <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Mitigation Steps</span>
                            <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": doneCount === r.steps.length ? "var(--lime)" : "var(--amber)" } as React.CSSProperties}>{doneCount}/{r.steps.length} done</span>
                          </div>
                          <div className={cx("flexCol", "gap6")}>
                            {r.steps.map((step, i) => (
                              <div key={i} className={cx("flexRow", "gap8")}>
                                <div className={cx("rrStepCheck", "dynBgColor")} style={{ "--bg-color": step.done ? "color-mix(in oklab, var(--lime) 15%, var(--s2))" : "var(--s3)", "--border-color": step.done ? "color-mix(in oklab, var(--lime) 30%, transparent)" : "var(--b2)" } as React.CSSProperties}>
                                  {step.done && <Ic n="check" sz={10} c="var(--lime)" />}
                                </div>
                                <span className={cx("text11", "dynColor")} style={{ "--color": step.done ? "inherit" : "var(--muted2)" } as React.CSSProperties}>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className={cx("sectionPanelL")}>
                        {/* Owner */}
                        <div>
                          <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb8")}>Owner</div>
                          <div className={cx("infoChip")}>
                            <Av initials={r.ownerInitials} size={32} />
                            <div>
                              <div className={cx("fw600", "text12")}>{r.ownerName}</div>
                              <div className={cx("text10", "colorMuted2")}>{r.ownerRole}</div>
                            </div>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className={cx("grid2Cols", "gap8")}>
                          {[
                            { label: "Project",  value: r.project     },
                            { label: "Due Date", value: r.dueDate     },
                            { label: "Logged",   value: r.date        },
                            { label: "Updated",  value: r.lastUpdated },
                          ].map(m => (
                            <div key={m.label} className={cx("infoChipSm")}>
                              <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{m.label}</div>
                              <div className={cx("fw600", "text11")}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Tags */}
                        <div className={cx("flexRow", "flexWrap", "gap5")}>
                          {r.tags.map(t => (
                            <span key={t} className={cx("tagPill", "fontMono", "text10", "colorMuted2")}>#{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
