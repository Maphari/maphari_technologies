"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";

type CompetitorType = "Direct" | "Adjacent" | "Indirect";
type CompetitorTier = "Same tier" | "Below us" | "Above us";
type Outcome = "won" | "lost" | "pending";
type Tab = "competitors" | "win/loss analysis" | "market rates" | "positioning";

const competitors: Array<{
  id: number;
  name: string;
  type: CompetitorType;
  tier: CompetitorTier;
  color: string;
  avgRetainer: number;
  services: string[];
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  positioning: string;
  lastUpdated: string;
  winLoss: { won: number; lost: number };
}> = [
  {
    id: 1,
    name: "Lemon & Clay",
    type: "Direct",
    tier: "Same tier",
    color: "var(--red)",
    avgRetainer: 32000,
    services: ["Branding", "Web", "Social"],
    strengths: ["Strong portfolio", "Award-winning", "Faster turnaround"],
    weaknesses: ["No strategy", "Less personal AM", "Higher churn"],
    pricing: "R28k-R45k/mo",
    positioning: "Premium creative studio",
    lastUpdated: "Feb 2026",
    winLoss: { won: 3, lost: 5 }
  },
  {
    id: 2,
    name: "Brandcraft SA",
    type: "Direct",
    tier: "Below us",
    color: "var(--amber)",
    avgRetainer: 18000,
    services: ["Branding", "Social"],
    strengths: ["Price competitive", "Fast delivery"],
    weaknesses: ["Limited strategy", "No UX", "Junior team"],
    pricing: "R12k-R22k/mo",
    positioning: "Affordable creative",
    lastUpdated: "Jan 2026",
    winLoss: { won: 6, lost: 2 }
  },
  {
    id: 3,
    name: "The Collective JHB",
    type: "Adjacent",
    tier: "Above us",
    color: "var(--purple)",
    avgRetainer: 85000,
    services: ["Strategy", "Branding", "Dev", "PR"],
    strengths: ["Full-service", "Enterprise clients", "PR network"],
    weaknesses: ["Expensive", "Slow", "Bureaucratic"],
    pricing: "R60k-R120k/mo",
    positioning: "Full-service agency",
    lastUpdated: "Jan 2026",
    winLoss: { won: 1, lost: 3 }
  },
  {
    id: 4,
    name: "Freelance Aggregators",
    type: "Indirect",
    tier: "Below us",
    color: "var(--amber)",
    avgRetainer: 8000,
    services: ["Design", "Copy"],
    strengths: ["Very cheap", "Flexible"],
    weaknesses: ["No AM", "Inconsistent", "No strategy"],
    pricing: "R3k-R12k/mo",
    positioning: "Cost-first buyers",
    lastUpdated: "Dec 2025",
    winLoss: { won: 4, lost: 1 }
  }
];

const winLossLog: Array<{
  date: string;
  prospect: string;
  outcome: Outcome;
  competitorLost: string | null;
  reason: string;
}> = [
  { date: "Feb 2026", prospect: "Horizon Media", outcome: "pending", competitorLost: null, reason: "Proposal sent, awaiting response" },
  { date: "Jan 2026", prospect: "Helios Digital", outcome: "lost", competitorLost: "Lemon & Clay", reason: "Chose competitor for faster onboarding" },
  { date: "Jan 2026", prospect: "Vivid Commerce", outcome: "won", competitorLost: "Brandcraft SA", reason: "Won on strategy depth + AM experience" },
  { date: "Dec 2025", prospect: "Urban Co-op", outcome: "lost", competitorLost: "The Collective JHB", reason: "Budget expanded, went full-service" },
  { date: "Dec 2025", prospect: "Solar Sense", outcome: "won", competitorLost: "Brandcraft SA", reason: "Client valued long-term partnership over price" }
];

const marketRates = [
  { service: "Brand Identity", maphari: 22000, marketLow: 8000, marketMid: 18000, marketHigh: 45000 },
  { service: "Retainer - Core", maphari: 28000, marketLow: 12000, marketMid: 22000, marketHigh: 65000 },
  { service: "Website Design & Dev", maphari: 42000, marketLow: 15000, marketMid: 38000, marketHigh: 95000 },
  { service: "Social Media Mgmt", maphari: 12000, marketLow: 4000, marketMid: 9000, marketHigh: 22000 }
];

const tabs: Tab[] = ["competitors", "win/loss analysis", "market rates", "positioning"];

function dotPositionClass(name: string): string {
  if (name === "Maphari") return styles.cmpiDotPosMaphari;
  if (name === "Lemon & Clay") return styles.cmpiDotPosLemon;
  if (name === "Brandcraft SA") return styles.cmpiDotPosBrandcraft;
  if (name === "The Collective") return styles.cmpiDotPosCollective;
  return styles.cmpiDotPosFreelancers;
}

export function CompetitorMarketIntelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("competitors");
  const [selectedComp, setSelectedComp] = useState(1);

  const totalWon = winLossLog.filter((w) => w.outcome === "won").length;
  const totalLost = winLossLog.filter((w) => w.outcome === "lost").length;
  const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / MARKET INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Competitor &amp; Market Intel</h1>
          <div className={styles.pageSub}>Competitor tracking - Win/loss - Market rates - Positioning</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Competitor</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Win Rate (6mo)", value: `${winRate}%`, color: winRate >= 50 ? "var(--accent)" : "var(--amber)", sub: `${totalWon} won - ${totalLost} lost` },
          { label: "Tracked Competitors", value: competitors.length.toString(), color: "var(--blue)", sub: `${competitors.filter((c) => c.type === "Direct").length} direct` },
          { label: "Most Common Rival", value: "Lemon & Clay", color: "var(--red)", sub: "Lost to 2x in 90d" },
          { label: "Market Position", value: "Mid-Premium", color: "var(--purple)", sub: "Between Brandcraft & Collective" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.label === "Most Common Rival" && styles.cmpiValue18, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "competitors" && (
        <div className={styles.cmpiCompSplit}>
          <div className={styles.cmpiCompList}>
            {competitors.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelectedComp(c.id)}
                className={cx(styles.cmpiCompItem, toneClass(c.color), selectedComp === c.id && styles.cmpiCompItemActive)}
              >
                <div className={styles.cmpiCompName}>{c.name}</div>
                <div className={styles.cmpiCompMeta}>
                  {c.type} - {c.tier}
                </div>
                <div className={styles.cmpiCompWL}>
                  <span className={styles.cmpiWLWin}>W:{c.winLoss.won}</span>
                  <span className={styles.cmpiWLLoss}>L:{c.winLoss.lost}</span>
                </div>
              </button>
            ))}
          </div>

          {(() => {
            const comp = competitors.find((c) => c.id === selectedComp);
            if (!comp) return null;
            return (
              <div className={cx(styles.cmpiCompDetail, toneClass(comp.color))}>
                <div className={styles.cmpiCompDetailHead}>
                  <div>
                    <div className={styles.cmpiCompTitle}>{comp.name}</div>
                    <div className={styles.cmpiCompPos}>{comp.positioning}</div>
                  </div>
                  <div className={styles.cmpiCompScore}>
                    <div className={styles.cmpiCompScoreLbl}>Win/Loss vs them</div>
                    <div className={styles.cmpiCompScoreVal}>
                      <span className={styles.cmpiWLWin}>{comp.winLoss.won}W</span>
                      <span className={cx("colorMuted")}> / </span>
                      <span className={styles.cmpiWLLoss}>{comp.winLoss.lost}L</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cmpiCompTiles}>
                  <div className={styles.cmpiTile}>
                    <div className={styles.cmpiTileLbl}>Type</div>
                    <div className={cx("fw600")}>{comp.type}</div>
                  </div>
                  <div className={styles.cmpiTile}>
                    <div className={styles.cmpiTileLbl}>Pricing Range</div>
                    <div className={cx("fontMono", "text12")}>{comp.pricing}</div>
                  </div>
                  <div className={styles.cmpiTile}>
                    <div className={styles.cmpiTileLbl}>Services</div>
                    <div className={cx("text12")}>{comp.services.join(", ")}</div>
                  </div>
                </div>

                <div className={styles.cmpiStrengthSplit}>
                  <div>
                    <div className={styles.cmpiStrengthHd}>Their Strengths</div>
                    {comp.strengths.map((s) => (
                      <div key={s} className={styles.cmpiPointRow}>
                        <span className={styles.cmpiPointUp}>▲</span> {s}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className={styles.cmpiWeakHd}>Their Weaknesses</div>
                    {comp.weaknesses.map((w) => (
                      <div key={w} className={styles.cmpiPointRow}>
                        <span className={styles.cmpiPointCheck}>✓</span> {w}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.cmpiBeatCard}>
                  <div className={styles.cmpiBeatHd}>How to Beat Them</div>
                  <div className={styles.cmpiBeatBody}>
                    {comp.name === "Lemon & Clay" && "Emphasise our strategic depth, personal AM relationship, and retainer flexibility. Lead with client retention stats."}
                    {comp.name === "Brandcraft SA" && "Win on quality, strategy, and AM attentiveness. Don't compete on price - anchor on outcomes."}
                    {comp.name === "The Collective JHB" && "Position as a boutique alternative - faster decisions, closer relationships, 70% of the output at 40% of the cost."}
                    {comp.name === "Freelance Aggregators" && "Sell consistency, accountability, and a single point of contact. Show cost of coordination overhead."}
                  </div>
                </div>
                <div className={styles.cmpiUpdated}>Last updated: {comp.lastUpdated}</div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "win/loss analysis" && (
        <div className={styles.cmpiWinLossSplit}>
          <div className={cx("card", "overflowHidden", "p0")}>
            <div className={cx(styles.cmpiWinLossGrid, styles.cmpiTableHead)}>
              {["Date", "Prospect", "Outcome", "Lost To", "Key Reason"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {winLossLog.map((w, i) => (
              <div key={w.date + w.prospect} className={cx(styles.cmpiWinLossGrid, styles.cmpiTableRow, i < winLossLog.length - 1 && "borderB")}>
                <span className={cx("fontMono", "text11", "colorMuted")}>{w.date}</span>
                <span className={cx("fw600")}>{w.prospect}</span>
                <span className={cx("text10", "fontMono", "uppercase", w.outcome === "won" ? "colorAccent" : w.outcome === "lost" ? "colorRed" : "colorAmber")}>{w.outcome}</span>
                <span className={cx("text12", w.competitorLost ? "colorRed" : "colorMuted")}>{w.competitorLost || "-"}</span>
                <span className={cx("text12", "colorMuted")}>{w.reason}</span>
              </div>
            ))}
          </div>
          <div className={styles.cmpiSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.cmpiSecTitle}>Summary</div>
              <div className={styles.cmpiSummaryGrid}>
                <div className={styles.cmpiSummaryCell}>
                  <div className={styles.cmpiSummaryWin}>{totalWon}</div>
                  <div className={cx("text12", "colorMuted")}>Won</div>
                </div>
                <div className={styles.cmpiSummaryCell}>
                  <div className={styles.cmpiSummaryLoss}>{totalLost}</div>
                  <div className={cx("text12", "colorMuted")}>Lost</div>
                </div>
              </div>
              <div className={cx("text11", "colorMuted", "mb8")}>Win Rate</div>
              <progress className={cx(styles.cmpiRateTrack, winRate >= 50 ? styles.cmpiRateFillGood : styles.cmpiRateFillWarn)} max={100} value={winRate} aria-label={`Win rate ${winRate}%`} />
              <div className={cx(styles.cmpiRateValue, winRate >= 50 ? "colorAccent" : "colorAmber")}>{winRate}%</div>
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.cmpiSecTitle}>Lost To (count)</div>
              {competitors
                .filter((c) => c.type === "Direct")
                .map((c, i, arr) => (
                  <div key={c.id} className={cx("flexBetween", "py10", i < arr.length - 1 && "borderB")}> 
                    <span className={cx("text13")}>{c.name}</span>
                    <span className={styles.cmpiLossCount}>{c.winLoss.lost}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "market rates" && (
        <div className={cx("card", "overflowHidden", "p0")}>
          <div className={styles.cmpiLegendRow}>
            <span className={styles.cmpiLegendItem}><span className={styles.cmpiLegendAccent}>■</span> Maphari</span>
            <span className={styles.cmpiLegendItem}><span className={styles.cmpiLegendBlue}>■</span> Market Mid</span>
            <span className={styles.cmpiLegendItem}><span className={styles.cmpiLegendMuted}>◁▷</span> Market Range</span>
          </div>
          <div className={cx(styles.cmpiRatesGrid, styles.cmpiTableHead)}>
            {["Service", "Maphari", "Mkt Low", "Mkt Mid", "Position"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {marketRates.map((rate, i) => {
            const range = rate.marketHigh - rate.marketLow;
            const maphariFraction = (rate.maphari - rate.marketLow) / range;
            const midFraction = (rate.marketMid - rate.marketLow) / range;
            const vsMarket = Math.round(((rate.maphari - rate.marketMid) / rate.marketMid) * 100);
            return (
              <div key={rate.service} className={cx(styles.cmpiRatesGrid, styles.cmpiRatesRow, i < marketRates.length - 1 && "borderB")}>
                <span className={cx("fw600")}>{rate.service}</span>
                <span className={styles.cmpiMaphariVal}>R{(rate.maphari / 1000).toFixed(0)}k</span>
                <span className={styles.cmpiLowVal}>R{(rate.marketLow / 1000).toFixed(0)}k</span>
                <span className={styles.cmpiMidVal}>R{(rate.marketMid / 1000).toFixed(0)}k</span>
                <div>
                  <div className={styles.cmpiPosTrack}>
                    <div className={styles.cmpiPosRange} />
                    <svg className={styles.cmpiPosSvg} viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                      <rect className={styles.cmpiPosMidRect} x={midFraction * 100} y="0" width="1.5" height="12" />
                      <rect className={styles.cmpiPosMarkerRect} x={Math.min(maphariFraction * 100, 95)} y="0" width="3" height="12" />
                    </svg>
                  </div>
                  <div className={cx("text11", vsMarket > 0 ? "colorAmber" : "colorAccent")}>
                    {vsMarket > 0 ? `+${vsMarket}%` : `${vsMarket}%`} vs market mid
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "positioning" && (
        <div className={styles.cmpiPosSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.cmpiSecTitle}>Positioning Map</div>
            <div className={styles.cmpiMapWrap}>
              <div className={styles.cmpiMapAxisH} />
              <div className={styles.cmpiMapAxisV} />
              <span className={styles.cmpiLabelTop}>High Specialisation</span>
              <span className={styles.cmpiLabelBottom}>Generalised</span>
              <span className={styles.cmpiLabelLeft}>Low Price</span>
              <span className={styles.cmpiLabelRight}>High Price</span>
              {[
                { name: "Maphari", color: "var(--accent)", isUs: true },
                { name: "Lemon & Clay", color: "var(--red)" },
                { name: "Brandcraft SA", color: "var(--amber)" },
                { name: "The Collective", color: "var(--purple)" },
                { name: "Freelancers", color: "var(--amber)" }
              ].map((dot) => (
                <div key={dot.name} className={cx(styles.cmpiDotWrap, dotPositionClass(dot.name))}>
                  <div className={cx(styles.cmpiDot, toneClass(dot.color), dot.isUs && styles.cmpiDotUs)} />
                  <div className={cx(styles.cmpiDotLabel, toneClass(dot.color), dot.isUs && styles.cmpiDotLabelUs)}>{dot.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cmpiSideCol}>
            <div className={styles.cmpiPositionCard}>
              <div className={styles.cmpiPosCardHd}>Maphari&apos;s Positioning</div>
              <div className={styles.cmpiBeatBody}>Mid-premium creative agency for ambitious South African brands. We offer specialist strategy + design with personal account management - at a price point between boutique freelancers and full-service agencies.</div>
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.cmpiSecTitle}>Key Differentiators</div>
              {[
                { label: "Strategic AM model", desc: "Every client has a dedicated AM - not just a designer" },
                { label: "Retainer clarity", desc: "Transparent hour tracking with monthly burn reports" },
                { label: "Mid-market pricing", desc: "Premium quality without full-service price tag" },
                { label: "Client portal", desc: "Self-service visibility into projects, invoices, and reports" }
              ].map((d, i) => (
                <div key={d.label} className={cx(styles.cmpiDiffRow, i < 3 && "borderB")}>
                  <span className={styles.cmpiDiffDot}>◎</span>
                  <div>
                    <div className={styles.cmpiDiffLbl}>{d.label}</div>
                    <div className={styles.cmpiDiffDesc}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
