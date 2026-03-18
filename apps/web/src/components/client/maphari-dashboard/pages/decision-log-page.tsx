"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalDecisionsWithRefresh,
  type PortalDecision,
} from "../../../../lib/api/portal";
import { useProjectLayer } from "../hooks/use-project-layer";

// ── Types ──────────────────────────────────────────────────────────────────────

type DLCategory = "Technical" | "Design" | "Scope" | "Commercial" | "Process";
type DLStatus   = "Active" | "Under Review" | "Superseded";
type DLImpact   = "High" | "Medium" | "Low";
type DLTab      = "All" | DLCategory;

type DLDecider  = { name: string; initials: string; role: string };

type DLDecision = {
  id:           string;
  title:        string;
  date:         string;
  category:     DLCategory;
  status:       DLStatus;
  impactLevel:  DLImpact;
  project:      string;
  deciders:     DLDecider[];
  rationale:    string;
  alternatives: string;
  impact:       string;
  tags:         string[];
  reviewDate?:  string;
};

// ── Config ─────────────────────────────────────────────────────────────────────

const CAT_CFG: Record<DLCategory, { icon: string; color: string; badge: string }> = {
  Technical:  { icon: "code",     color: "var(--lime)",   badge: "badgeAccent" },
  Design:     { icon: "layers",   color: "var(--purple)", badge: "badgePurple" },
  Scope:      { icon: "target",   color: "var(--amber)",  badge: "badgeAmber"  },
  Commercial: { icon: "dollar",   color: "var(--green)",  badge: "badgeGreen"  },
  Process:    { icon: "settings", color: "var(--cyan)",   badge: "badgeMuted"  },
};

const STATUS_COLOR: Record<DLStatus, string> = {
  "Active":       "var(--lime)",
  "Under Review": "var(--amber)",
  "Superseded":   "var(--muted2)",
};

const STATUS_BADGE: Record<DLStatus, string> = {
  "Active":       "badgeAccent",
  "Under Review": "badgeAmber",
  "Superseded":   "badgeMuted",
};

const STATUS_ICON: Record<DLStatus, string> = {
  "Active":       "check",
  "Under Review": "clock",
  "Superseded":   "x",
};

const IMPACT_COLOR: Record<DLImpact, string> = {
  High:   "var(--red)",
  Medium: "var(--amber)",
  Low:    "var(--muted2)",
};

const ALL_CATS: DLCategory[] = ["Technical", "Design", "Scope", "Commercial", "Process"];
const TABS: DLTab[]           = ["All", ...ALL_CATS];


// ── Mapper ─────────────────────────────────────────────────────────────────────

function mapApiDecision(d: PortalDecision): DLDecision {
  const CAT_MAP: Record<string, DLCategory> = {
    TECHNICAL: "Technical", DESIGN: "Design", SCOPE: "Scope",
    COMMERCIAL: "Commercial", PROCESS: "Process",
  };
  const STATUS_MAP: Record<string, DLStatus> = {
    ACTIVE: "Active", UNDER_REVIEW: "Under Review", SUPERSEDED: "Superseded",
  };
  return {
    id:          d.id,
    title:       d.title,
    date:        d.decidedAt ? new Date(d.decidedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : new Date(d.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    category:    CAT_MAP[(d.category ?? "").toUpperCase()] ?? "Process",
    status:      STATUS_MAP[(d.status ?? "").toUpperCase()] ?? "Active",
    impactLevel: ((d.impact ?? "").toLowerCase().includes("high") || (d.impact ?? "").toLowerCase().includes("critical"))
      ? "High"
      : (d.impact ?? "").toLowerCase().includes("low")
      ? "Low"
      : "Medium",
    project:     d.projectId,
    deciders:    [],
    rationale:   d.rationale ?? "—",
    alternatives: d.detail ?? "—",
    impact:      d.impact ?? "—",
    tags:        [],
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DecisionLogPage() {
  const { session, projectId } = useProjectLayer();
  const [decisions, setDecisions] = useState<DLDecision[]>([]);
  const [tab,      setTab]      = useState<DLTab>("All");
  const [query,    setQuery]    = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !projectId) return;
    void loadPortalDecisionsWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setDecisions(r.data.map(mapApiDecision));
    });
  }, [session, projectId]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? decisions : decisions.filter(d => d.category === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)    ||
        d.rationale.toLowerCase().includes(q) ||
        d.project.toLowerCase().includes(q)
      );
    }
    return list;
  }, [decisions, tab, query]);

  // Counts
  const totalActive   = decisions.filter(d => d.status === "Active").length;
  const underReview   = decisions.filter(d => d.status === "Under Review").length;
  const highImpact    = decisions.filter(d => d.impactLevel === "High").length;

  // Category breakdown
  const catCounts = ALL_CATS.map(c => ({ cat: c, count: decisions.filter(d => d.category === c).length }));

  // Impact distribution
  const impactCounts: Array<[DLImpact, number]> = [
    ["High",   decisions.filter(d => d.impactLevel === "High").length],
    ["Medium", decisions.filter(d => d.impactLevel === "Medium").length],
    ["Low",    decisions.filter(d => d.impactLevel === "Low").length],
  ];

  // Timeline: 4 most recent
  const recentFour = decisions.slice(0, 4);

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Decisions</div>
          <h1 className={cx("pageTitle")}>Decision Log</h1>
          <p className={cx("pageSub")}>A permanent record of every major project decision — what was decided, why, and what alternatives were considered.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")}>
            <Ic n="download" sz={13} /> Export Log
          </button>
          <button type="button" className={cx("btnSm", "btnAccent", "flexRow", "gap6")}>
            <Ic n="plus" sz={13} c="var(--bg)" /> Add Decision
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Decisions", value: decisions.length, color: "statCard",      icon: "file",  ic: "var(--muted2)" },
          { label: "Active",          value: totalActive,       color: "statCardGreen", icon: "check", ic: "var(--lime)"   },
          { label: "Under Review",    value: underReview,       color: "statCardAmber", icon: "clock", ic: "var(--amber)"  },
          { label: "High Impact",     value: highImpact,        color: "statCardRed",   icon: "alert", ic: "var(--red)"    },
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

        {/* Category Breakdown */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Category Breakdown</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{decisions.length} decisions</span>
          </div>

          <div className={cx("flexCol", "gap8", "mb14")}>
            {catCounts.map(({ cat, count }) => {
              const cfg = CAT_CFG[cat];
              const pct = decisions.length > 0 ? Math.round((count / decisions.length) * 100) : 0;
              return (
                <div key={cat} className={cx("flexRow", "gap10")}>
                  <div className={cx("rrCatIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${cfg.color} 20%, transparent)` } as React.CSSProperties}>
                    <Ic n={cfg.icon} sz={11} c={cfg.color} />
                  </div>
                  <span className={cx("text11", "flex1")}>{cat}</span>
                  <div className={cx("trackW80h4")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": cfg.color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "text10", "colorMuted2", "w42", "textRight")}>
                    {count} <span className={cx("fs06")}>{pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Composition bar */}
          <div className={cx("trackH8Flex")}>
            {catCounts.filter(c => c.count > 0).map(({ cat, count }) => (
              <div key={cat} className={cx("dynFlex", "dynBgColor")} style={{ "--flex": count, "--bg-color": CAT_CFG[cat].color } as React.CSSProperties} />
            ))}
          </div>
          <div className={cx("flexRow", "flexWrap", "gapR5x12", "mt8")}>
            {catCounts.filter(c => c.count > 0).map(({ cat }) => (
              <span key={cat} className={cx("flexRow", "gap4")}>
                <span className={cx("dot6", "inlineBlock")} style={{ "--bg-color": CAT_CFG[cat].color } as React.CSSProperties} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>{cat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Recent Decisions Timeline + Impact */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Recent Decisions</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>Latest 4</span>
          </div>

          {/* Left-timeline */}
          <div className={cx("relative", "pl20", "mb16")}>
            <div className={cx("timelineLineL6")} />
            <div className={cx("flexCol", "gap12")}>
              {recentFour.map(d => {
                const cfg = CAT_CFG[d.category];
                return (
                  <div key={d.id} className={cx("flexRow", "flexAlignStart", "gap10")}>
                    <div className={cx("stackedDot10", "dynBgColor")} style={{ "--bg-color": cfg.color } as React.CSSProperties} />
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("fw600", "text11", "truncate")}>{d.title}</div>
                      <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                        <span className={cx("badge", cfg.badge, "fs06")}>{d.category}</span>
                        <span className={cx("fontMono", "text10", "colorMuted2")}>{d.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impact distribution */}
          <div className={cx("borderT", "pt12")}>
            <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb8")}>Impact Distribution</div>
            <div className={cx("flexCol", "gap6")}>
              {impactCounts.map(([level, count]) => {
                const pct = decisions.length > 0 ? Math.round((count / decisions.length) * 100) : 0;
                return (
                  <div key={level} className={cx("flexRow", "gap8")}>
                    <div className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": IMPACT_COLOR[level] } as React.CSSProperties} />
                    <span className={cx("text10", "w50")}>{level}</span>
                    <div className={cx("flex1", "progressTrack")}>
                      <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": IMPACT_COLOR[level] } as React.CSSProperties} />
                    </div>
                    <span className={cx("fontMono", "text10", "colorMuted2", "w28", "textRight")}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Under-review alert ───────────────────────────────────────────────── */}
      {underReview > 0 && (
        <div className={cx("dlUnderReviewAlert")}>
          <Ic n="clock" sz={15} c="var(--amber)" />
          <span className={cx("text11")}>
            <strong className={cx("fontMono")}>{underReview} decision{underReview > 1 ? "s" : ""} under review</strong>
            <span className={cx("colorMuted")}> — pending re-evaluation. Check review dates and update status as needed.</span>
          </span>
        </div>
      )}

      {/* ── Search + tabs ─────────────────────────────────────────────────────── */}
      <div className={cx("flexBetween", "gap10", "mb10")}>
        <div className={cx("pillTabs", "mb0")}>
          {TABS.map(t => (
            <button key={t} type="button" className={cx("pillTab", tab === t ? "pillTabActive" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w260", "h36")}
          placeholder="Search by title, ID, project…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* ── Decision list ─────────────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {/* Column headers */}
        {filtered.length > 0 && (
          <div className={cx("dlColHd")}>
            {["", "Decision", "Impact", "Project", "Status", ""].map((h, i) => (
              <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="filter" sz={28} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No decisions found</div>
            <div className={cx("text12", "colorMuted")}>
              {query ? `No results for "${query}"` : "No decisions in this category."}
            </div>
            {query && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setQuery("")}>
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {filtered.map((d, idx) => {
          const isOpen = expanded === d.id;
          const cfg    = CAT_CFG[d.category];
          const sc     = STATUS_COLOR[d.status];

          return (
            <div
              key={d.id}
              className={cx("dynBorderLeft3", idx < filtered.length - 1 && "borderB")} style={{ "--color": cfg.color } as React.CSSProperties}
            >
              {/* Row trigger */}
              <button
                type="button"
                aria-expanded={isOpen}
                className={cx("gridRowBtn6colV3")}
                onClick={() => setExpanded(isOpen ? null : d.id)}
              >
                {/* Category icon box */}
                <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${cfg.color} 25%, transparent)` } as React.CSSProperties}>
                  <Ic n={cfg.icon} sz={15} c={cfg.color} />
                </div>

                {/* Title + meta */}
                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate")}>{d.title}</div>
                  <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{d.id}</span>
                    <span className={cx("badge", cfg.badge, "fs06")}>{d.category}</span>
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{d.date}</span>
                  </div>
                </div>

                {/* Impact level */}
                <div className={cx("flexRow", "gap5")}>
                  <div className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": IMPACT_COLOR[d.impactLevel] } as React.CSSProperties} />
                  <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": IMPACT_COLOR[d.impactLevel] } as React.CSSProperties}>{d.impactLevel}</span>
                </div>

                {/* Project */}
                <span className={cx("text11", "colorMuted2", "truncate")}>{d.project}</span>

                {/* Status badge */}
                <span className={cx("badge", STATUS_BADGE[d.status], "flexRow", "gap4")}>
                  <Ic n={STATUS_ICON[d.status]} sz={9} c="currentColor" />
                  {d.status}
                </span>

                {/* Chevron */}
                <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                  <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                </span>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className={cx("borderT", "dynBgColor", "p14x20x16x17")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 4%, var(--s2))` } as React.CSSProperties}>

                  {/* Deciders row */}
                  <div className={cx("flexRow", "flexCenter", "gap10", "mb14", "flexWrap")}>
                    <Ic n="users" sz={12} c="var(--muted2)" />
                    <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Decided by</span>
                    <div className={cx("flexRow", "gap8", "flexWrap")}>
                      {d.deciders.map(dec => (
                        <div key={dec.initials} className={cx("dlDeciderChip")}>
                          <Av initials={dec.initials} size={20} />
                          <span className={cx("fw600", "text10")}>{dec.name}</span>
                          <span className={cx("text10", "colorMuted2")}>· {dec.role}</span>
                        </div>
                      ))}
                    </div>
                    {d.reviewDate && (
                      <span className={cx("mlAuto", "dlReviewBadge")}>
                        <Ic n="calendar" sz={10} c="var(--amber)" />
                        <span className={cx("fontMono", "text10", "colorAmber")}>Review by {d.reviewDate}</span>
                      </span>
                    )}
                  </div>

                  {/* 3-col sections */}
                  <div className={cx("grid3Cols", "gap10", "mb12")}>
                    {[
                      { icon: "check",    color: "var(--lime)",   label: "Rationale",            body: d.rationale    },
                      { icon: "x",        color: "var(--red)",    label: "Alternatives Rejected", body: d.alternatives },
                      { icon: "activity", color: "var(--purple)", label: "Impact",                body: d.impact       },
                    ].map(sec => (
                      <div key={sec.label} className={cx("cardS1", "p12x14")}>
                        <div className={cx("flexRow", "flexCenter", "gap6", "mb8")}>
                          <div className={cx("dlSectionIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${sec.color} 12%, var(--s2))` } as React.CSSProperties}>
                            <Ic n={sec.icon} sz={10} c={sec.color} />
                          </div>
                          <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "dynColor")} style={{ "--color": sec.color } as React.CSSProperties}>{sec.label}</span>
                        </div>
                        <div className={cx("text11", "colorMuted", "lineH165")}>{sec.body}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tags + status row */}
                  <div className={cx("flexRow", "flexCenter", "gap8", "flexWrap")}>
                    <Ic n="hash" sz={11} c="var(--muted2)" />
                    {d.tags.map(t => (
                      <span key={t} className={cx("tagPill", "fontMono", "text10", "colorMuted2")}>
                        #{t}
                      </span>
                    ))}
                    <span className={cx("mlAuto", "flexRow", "flexCenter", "gap5")}>
                      <span className={cx("badge", STATUS_BADGE[d.status], "flexRow", "gap4")}>
                        <Ic n={STATUS_ICON[d.status]} sz={9} c="currentColor" />
                        {d.status}
                      </span>
                      {d.status === "Active" && (
                        <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")}>
                          <Ic n="edit" sz={10} c="var(--muted2)" /> Mark Under Review
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
