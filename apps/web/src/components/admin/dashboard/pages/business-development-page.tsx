"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

type Stage = "Discovery" | "Proposal Sent" | "Negotiation" | "Contract Sent";

const prospects: Array<{
  id: string;
  name: string;
  industry: string;
  stage: Stage;
  value: number;
  probability: number;
  contact: string;
  touchpoints: number;
  lastContact: string;
  source: string;
  daysInStage: number;
}> = [
  { id: "PRO-012", name: "Horizon Media", industry: "Media & Publishing", stage: "Discovery", value: 28000, probability: 40, contact: "Aisha Okafor", touchpoints: 3, lastContact: "Feb 20", source: "Referral", daysInStage: 5 },
  { id: "PRO-013", name: "Apex Financial", industry: "Finance", stage: "Proposal Sent", value: 45000, probability: 60, contact: "David Nkosi", touchpoints: 7, lastContact: "Feb 22", source: "LinkedIn", daysInStage: 12 },
  { id: "PRO-014", name: "Bloom Wellness", industry: "Health & Wellness", stage: "Negotiation", value: 22000, probability: 75, contact: "Priya Singh", touchpoints: 11, lastContact: "Feb 21", source: "Conference", daysInStage: 19 },
  { id: "PRO-015", name: "Craft & Co", industry: "Retail", stage: "Contract Sent", value: 18000, probability: 90, contact: "Marco Russo", touchpoints: 14, lastContact: "Feb 23", source: "Referral", daysInStage: 4 },
  { id: "PRO-016", name: "Stellenbosch Wines", industry: "FMCG", stage: "Discovery", value: 55000, probability: 25, contact: "Elise van der Berg", touchpoints: 2, lastContact: "Feb 18", source: "Cold Outreach", daysInStage: 8 }
];

const partnerships = [
  { partner: "Studio Outpost", type: "Production Partner", status: "active", dealsReferred: 3, revenueGenerated: 142000, since: "Jan 2025" },
  { partner: "Figma Community SA", type: "Community Partner", status: "active", dealsReferred: 1, revenueGenerated: 28000, since: "Jun 2025" },
  { partner: "Cape Design Week", type: "Sponsorship", status: "exploring", dealsReferred: 0, revenueGenerated: 0, since: "Feb 2026" }
];

const segments = [
  { name: "Finance & Legal", clients: 2, avgMRR: 24500, winRate: 44, color: "var(--purple)" },
  { name: "Creative & Media", clients: 2, avgMRR: 22000, winRate: 58, color: "var(--accent)" },
  { name: "Healthcare", clients: 1, avgMRR: 21600, winRate: 62, color: "var(--blue)" },
  { name: "Professional Services", clients: 1, avgMRR: 12000, winRate: 71, color: "var(--amber)" }
];

const stageOrder: Stage[] = ["Discovery", "Proposal Sent", "Negotiation", "Contract Sent"];
const stageColors: Record<Stage, string> = {
  Discovery: "var(--blue)",
  "Proposal Sent": "var(--purple)",
  Negotiation: "var(--amber)",
  "Contract Sent": "var(--accent)"
};

const tabs = ["pipeline", "partnerships", "market segments", "targets"] as const;
type Tab = (typeof tabs)[number];
type ViewMode = "list" | "kanban";

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.bdevFillAccent;
    case "var(--red)":
      return styles.bdevFillRed;
    case "var(--amber)":
      return styles.bdevFillAmber;
    case "var(--blue)":
      return styles.bdevFillBlue;
    case "var(--purple)":
      return styles.bdevFillPurple;
    default:
      return styles.bdevFillMuted;
  }
}

function tagClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.bdevTagAccent;
    case "var(--red)":
      return styles.bdevTagRed;
    case "var(--amber)":
      return styles.bdevTagAmber;
    case "var(--blue)":
      return styles.bdevTagBlue;
    case "var(--purple)":
      return styles.bdevTagPurple;
    default:
      return styles.bdevTagMuted;
  }
}

function segmentCardClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.bdevSegmentCardAccent;
    case "var(--red)":
      return styles.bdevSegmentCardRed;
    case "var(--amber)":
      return styles.bdevSegmentCardAmber;
    case "var(--blue)":
      return styles.bdevSegmentCardBlue;
    case "var(--purple)":
      return styles.bdevSegmentCardPurple;
    default:
      return styles.bdevSegmentCardMuted;
  }
}

export function BusinessDevelopmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const weightedPipeline = prospects.reduce((s, p) => s + (p.value * p.probability) / 100, 0);
  const totalPipeline = prospects.reduce((s, p) => s + p.value, 0);

  return (
    <div className={cx(styles.pageBody, styles.bdevRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / BUSINESS DEVELOPMENT</div>
          <h1 className={styles.pageTitle}>Business Development</h1>
          <div className={styles.pageSub}>Prospects - Partnerships - Market segments - Growth targets</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Pipeline</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Prospect</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Pipeline", value: `R${(totalPipeline / 1000).toFixed(0)}k`, color: "var(--accent)", sub: `${prospects.length} prospects` },
          { label: "Weighted Pipeline", value: `R${(weightedPipeline / 1000).toFixed(0)}k`, color: "var(--blue)", sub: "Probability-adjusted" },
          { label: "Avg Deal Size", value: `R${Math.round(totalPipeline / prospects.length / 1000).toFixed(0)}k`, color: "var(--purple)", sub: "Target: R35k" },
          { label: "Close Rate (90d)", value: "42%", color: "var(--amber)", sub: "3 won - 4 lost" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "pipeline" ? (
          <select title="Select view mode" value={viewMode} onChange={e => setViewMode(e.target.value as ViewMode)} className={styles.filterSelect}>
            <option value="list">list</option>
            <option value="kanban">kanban</option>
          </select>
        ) : null}
      </div>

      {activeTab === "pipeline" && (
        <div>
          {viewMode === "list" && (
            <div className={styles.bdevTableCard}>
              <div className={cx(styles.bdevTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {"ID|Company|Stage|Value|Prob.|Touches|Last Contact|Source|".split("|").map((h, idx) => (
                  <span key={`${h}-${idx}`}>{h}</span>
                ))}
              </div>
              {prospects.map((p, i) => (
                <div key={p.id} className={cx(styles.bdevTableRow, i < prospects.length - 1 && "borderB")}>
                  <span className={cx("fontMono", "text11", "colorMuted")}>{p.id}</span>
                  <div>
                    <div className={cx("fw600")}>{p.name}</div>
                    <div className={cx("text11", "colorMuted")}>{p.industry} - {p.contact}</div>
                  </div>
                  <span className={cx(styles.bdevStageTag, tagClass(stageColors[p.stage]))}>{p.stage}</span>
                  <span className={cx("fontMono", "fw700", "colorAccent")}>R{(p.value / 1000).toFixed(0)}k</span>
                  <span className={cx("fontMono", p.probability >= 75 ? "colorAccent" : p.probability >= 50 ? "colorAmber" : "colorMuted")}>{p.probability}%</span>
                  <span className={cx("fontMono", "colorBlue")}>{p.touchpoints}</span>
                  <span className={cx("text12", "colorMuted")}>{p.lastContact}</span>
                  <span className={cx("text11", "colorMuted")}>{p.source}</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Open</button>
                </div>
              ))}
            </div>
          )}

          {viewMode === "kanban" && (
            <div className={styles.bdevKanbanGrid}>
              {stageOrder.map((stage) => {
                const stageProspects = prospects.filter((p) => p.stage === stage);
                const stageValue = stageProspects.reduce((s, p) => s + p.value, 0);
                return (
                  <div key={stage}>
                    <div className={styles.bdevStageHead}>
                      <span className={cx(styles.bdevStageName, colorClass(stageColors[stage]))}>{stage}</span>
                      <span className={cx("fontMono", "text11", "colorMuted")}>R{(stageValue / 1000).toFixed(0)}k</span>
                    </div>
                    <div className={styles.bdevStageStack}>
                      {stageProspects.map((p) => (
                        <div key={p.id} className={styles.bdevDealCard}>
                          <div className={styles.bdevDealName}>{p.name}</div>
                          <div className={styles.bdevDealMeta}>{p.industry}</div>
                          <div className={styles.bdevDealFoot}>
                            <span className={cx("fontMono", "fw700", "colorAccent")}>R{(p.value / 1000).toFixed(0)}k</span>
                            <span className={cx("colorMuted")}>{p.probability}% win</span>
                          </div>
                          <progress className={cx(styles.bdevMiniTrack, fillClass(stageColors[stage]))} max={100} value={p.probability} aria-label={`${p.name} win probability ${p.probability}%`} />
                          <div className={styles.bdevDealSmall}>{p.daysInStage}d in stage - {p.touchpoints} touches</div>
                        </div>
                      ))}
                      {stageProspects.length === 0 && <div className={styles.bdevEmptyLane}>No prospects</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "partnerships" && (
        <div className={styles.bdevPartnerList}>
          {partnerships.map((p) => (
            <div key={p.partner} className={cx(styles.bdevPartnerRow, p.status === "exploring" && styles.bdevPartnerRowExploring)}>
              <div>
                <div className={styles.bdevPartnerName}>{p.partner}</div>
                <div className={styles.bdevPartnerMeta}>{p.type} - Since {p.since}</div>
              </div>
              <div>
                <div className={styles.bdevCellLabel}>Deals Referred</div>
                <div className={cx("fontMono", "fw700", "colorBlue")}>{p.dealsReferred}</div>
              </div>
              <span className={cx(styles.bdevStageTag, p.status === "active" ? styles.bdevTagAccent : styles.bdevTagAmber)}>{p.status}</span>
              <div>
                <div className={styles.bdevCellLabel}>Revenue Generated</div>
                <div className={cx("fontMono", "fw700", "colorAccent")}>{p.revenueGenerated > 0 ? `R${(p.revenueGenerated / 1000).toFixed(0)}k` : "-"}</div>
              </div>
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                <button type="button" className={cx("btnSm", "btnGhost", styles.bdevContactBtn)}>Contact</button>
              </div>
            </div>
          ))}
          <button type="button" className={styles.bdevAddPartnership}>+ Add Partnership</button>
        </div>
      )}

      {activeTab === "market segments" && (
        <div className={styles.bdevSegmentGrid}>
          {segments.map((seg) => (
            <div key={seg.name} className={cx(styles.bdevSegmentCard, segmentCardClass(seg.color))}>
              <div className={styles.bdevSegmentHead}>
                <div>
                  <div className={styles.bdevSegmentName}>{seg.name}</div>
                  <div className={styles.bdevSegmentMeta}>{seg.clients} active client{seg.clients !== 1 ? "s" : ""}</div>
                </div>
                <div className={cx(styles.bdevSegmentDot, fillClass(seg.color))} />
              </div>
              <div className={styles.bdevSegmentStats}>
                <div className={styles.bdevMiniCard}>
                  <div className={styles.bdevCellLabel}>Avg MRR</div>
                  <div className={cx(styles.bdevMiniValue, colorClass(seg.color))}>R{(seg.avgMRR / 1000).toFixed(1)}k</div>
                </div>
                <div className={styles.bdevMiniCard}>
                  <div className={styles.bdevCellLabel}>Win Rate</div>
                  <div className={cx(styles.bdevMiniValue, seg.winRate > 60 ? "colorAccent" : "colorAmber")}>{seg.winRate}%</div>
                </div>
              </div>
                <div className={cx("mt16")}>
                  <div className={styles.bdevRateRow}>
                    <span className={cx("text12", "colorMuted")}>Win rate vs avg (42%)</span>
                    <span className={cx("text12", seg.winRate > 42 ? "colorAccent" : "colorRed")}>{seg.winRate > 42 ? "+" : ""}{seg.winRate - 42}pp</span>
                  </div>
                  <progress className={cx(styles.bdevMiniTrack, fillClass(seg.color))} max={100} value={seg.winRate} aria-label={`${seg.name} win rate ${seg.winRate}%`} />
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "targets" && (
        <div className={styles.bdevTargetsGrid}>
          <div className={cx("card", "p24")}>
            <div className={styles.bdevSectionTitle}>Q1 2026 BD Targets</div>
            <div className={styles.bdevTargetStack}>
              {[
                { target: "New clients won", goal: 4, current: 3, color: "var(--accent)" },
                { target: "MRR from new biz", goal: 80000, current: 57000, color: "var(--blue)", format: "R" },
                { target: "Proposals sent", goal: 12, current: 9, color: "var(--purple)" },
                { target: "Discovery calls", goal: 20, current: 14, color: "var(--amber)" }
              ].map((t) => {
                const pct = Math.min((t.current / t.goal) * 100, 100);
                return (
                  <div key={t.target}>
                    <div className={styles.bdevTargetHead}>
                      <span className={styles.text13}>{t.target}</span>
                      <div className={cx("fontMono", "text12")}>
                        <span className={cx("fw700", colorClass(t.color))}>{t.format}{typeof t.current === "number" && t.format === "R" ? `${(t.current / 1000).toFixed(0)}k` : t.current}</span>
                        <span className={cx("colorMuted")}> / {t.format}{typeof t.goal === "number" && t.format === "R" ? `${(t.goal / 1000).toFixed(0)}k` : t.goal}</span>
                      </div>
                    </div>
                    <div className={styles.bdevTargetTrack}>
                      <progress className={cx(styles.bdevTargetTrackFill, fillClass(t.color))} max={100} value={pct} aria-label={`${t.target} progress ${pct.toFixed(0)}%`} />
                    </div>
                    <div className={cx(styles.bdevTargetPct, pct >= 75 ? "colorAccent" : pct >= 50 ? "colorAmber" : "colorRed")}>{pct.toFixed(0)}% of target</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.bdevTargetSide}>
            <div className={cx("card", "p24")}>
              <div className={styles.bdevSectionTitle}>Lead Sources</div>
              {[
                { source: "Referral", count: 3, pct: 60, color: "var(--accent)" },
                { source: "LinkedIn", count: 1, pct: 20, color: "var(--blue)" },
                { source: "Conference", count: 1, pct: 20, color: "var(--purple)" },
                { source: "Cold Outreach", count: 1, pct: 20, color: "var(--muted)" }
              ].map((s) => (
                <div key={s.source} className={styles.bdevSourceRow}>
                  <span className={styles.bdevSourceName}>{s.source}</span>
                  <div className={styles.bdevSourceTrack}>
                    <progress className={cx(styles.bdevSourceTrackFill, fillClass(s.color))} max={100} value={s.pct} aria-label={`${s.source} lead source ${s.pct}%`} />
                  </div>
                  <span className={cx(styles.bdevSourceCount, colorClass(s.color))}>{s.count}</span>
                </div>
              ))}
            </div>

            <div className={styles.bdevAnnualCard}>
              <div className={styles.bdevAnnualTitle}>2026 Annual Target</div>
              <div className={styles.bdevAnnualValue}>R500k</div>
              <div className={cx("text12", "colorMuted")}>
                MRR by Dec 2026. Currently at R398.6k - <span className={styles.bdevAnnualAccent}>79.7%</span> of target with 10 months remaining.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
