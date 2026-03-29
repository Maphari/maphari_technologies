// ════════════════════════════════════════════════════════════════════════════
// competitor-market-intel-page.tsx — Admin Competitor & Market Intel
// Data     : loadMarketIntelWithRefresh → GET /admin/market-intel (Intel Feed tab)
// Static   : Competitor analysis, win/loss, market rates, positioning tabs
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadMarketIntelWithRefresh,
  loadCompetitorsWithRefresh,
  loadWinLossWithRefresh,
  loadMarketRatesWithRefresh,
  createCompetitorWithRefresh,
  createWinLossEntryWithRefresh,
  type AdminMarketIntel,
  type AdminCompetitor,
  type AdminWinLossEntry,
  type AdminMarketRate,
} from "../../../../lib/api/admin";

type Tab = "competitors" | "win/loss analysis" | "market rates" | "positioning" | "intel feed";

const tabs: Tab[] = ["competitors", "win/loss analysis", "market rates", "positioning", "intel feed"];

function relevanceBadge(r: string) {
  const v = r.toUpperCase();
  if (v === "HIGH")     return "badgeRed";
  if (v === "MEDIUM")   return "badgeAmber";
  return "badgeMuted";
}


// ── blank form state helpers ──────────────────────────────────────────────────
const blankComp = () => ({ name: "", type: "Direct", tier: "Same tier", color: "var(--red)", pricing: "", positioning: "", beatStrategy: "", services: "", strengths: "", weaknesses: "" });
const blankWL   = () => ({ date: new Date().toISOString().slice(0, 10), prospect: "", outcome: "pending", competitorId: "", reason: "" });

export function CompetitorMarketIntelPage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab]       = useState<Tab>("competitors");
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [competitors, setCompetitors]   = useState<AdminCompetitor[]>([]);
  const [winLossLog, setWinLossLog]     = useState<AdminWinLossEntry[]>([]);
  const [marketRates, setMarketRates]   = useState<AdminMarketRate[]>([]);
  const [intelFeed, setIntelFeed]       = useState<AdminMarketIntel[]>([]);

  // modal state
  const [showCompModal, setShowCompModal] = useState(false);
  const [showWLModal,   setShowWLModal]   = useState(false);
  const [compForm,      setCompForm]      = useState(blankComp);
  const [wlForm,        setWlForm]        = useState(blankWL);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    if (!session) return;
    void loadCompetitorsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setCompetitors(r.data);
        if (r.data.length > 0) setSelectedComp(r.data[0].id);
      }
    });
    void loadWinLossWithRefresh(session).then((r) => {
      if (!r.error && r.data) setWinLossLog(r.data);
    });
    void loadMarketRatesWithRefresh(session).then((r) => {
      if (!r.error && r.data) setMarketRates(r.data);
    });
    void loadMarketIntelWithRefresh(session).then((r) => {
      if (!r.error && r.data) setIntelFeed(r.data);
    });
  }, [session]);

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!session || saving) return;
    setSaving(true);
    const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const r = await createCompetitorWithRefresh(session, {
      name:         compForm.name,
      type:         compForm.type,
      tier:         compForm.tier,
      color:        compForm.color,
      pricing:      compForm.pricing || undefined,
      positioning:  compForm.positioning || undefined,
      beatStrategy: compForm.beatStrategy || undefined,
      services:     toArr(compForm.services),
      strengths:    toArr(compForm.strengths),
      weaknesses:   toArr(compForm.weaknesses),
    });
    setSaving(false);
    if (!r.error && r.data) {
      setCompetitors((prev) => [...prev, r.data!]);
      setSelectedComp(r.data.id);
      setShowCompModal(false);
      setCompForm(blankComp());
    }
  }

  async function handleAddWinLoss(e: React.FormEvent) {
    e.preventDefault();
    if (!session || saving) return;
    setSaving(true);
    const r = await createWinLossEntryWithRefresh(session, {
      date:         wlForm.date,
      prospect:     wlForm.prospect,
      outcome:      wlForm.outcome,
      competitorId: wlForm.competitorId || undefined,
      reason:       wlForm.reason || undefined,
    });
    setSaving(false);
    if (!r.error && r.data) {
      setWinLossLog((prev) => [r.data!, ...prev]);
      setShowWLModal(false);
      setWlForm(blankWL());
    }
  }

  const totalWon  = winLossLog.filter((w) => w.outcome === "won").length;
  const totalLost = winLossLog.filter((w) => w.outcome === "lost").length;
  const winRate   = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;
  const rivalCounts: Record<string, number> = {};
  for (const w of winLossLog) { if (w.competitorName) rivalCounts[w.competitorName] = (rivalCounts[w.competitorName] ?? 0) + 1; }
  const topRival = Object.entries(rivalCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / COMPETITOR & MARKET INTEL</div>
          <h1 className={styles.pageTitle}>Competitor &amp; Market Intel</h1>
          <div className={styles.pageSub}>Competitor tracking - Win/loss - Market rates - Positioning</div>
        </div>
        <div className={styles.pageActions}>
          {activeTab === "competitors" && (
            <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowCompModal(true)}>+ Add Competitor</button>
          )}
          {activeTab === "win/loss analysis" && (
            <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowWLModal(true)}>+ Log Entry</button>
          )}
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Win Rate (6mo)", value: `${winRate}%`, color: winRate >= 50 ? "var(--accent)" : "var(--amber)", sub: `${totalWon} won - ${totalLost} lost`, word: false },
          { label: "Tracked Competitors", value: competitors.length.toString(), color: "var(--blue)", sub: `${competitors.filter((c) => c.type === "Direct").length} direct`, word: false },
          { label: "Most Common Rival", value: topRival ? topRival[0] : "—", color: "var(--red)", sub: topRival ? `Lost to ${topRival[1]}x in 90d` : "No data yet", word: false },
          { label: "Market Position", value: "Mid-Premium", color: "var(--purple)", sub: "Between Brandcraft & Collective", word: true }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.label === "Most Common Rival" && styles.cmpiValue18, s.word && styles.statValueWord, colorClass(s.color))}>{s.value}</div>
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
            {competitors.length === 0 ? (
              <div className={cx("colorMuted", "text12", "py24", "textCenter")}>No competitors tracked yet.</div>
            ) : competitors.map((c) => (
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
                  <span className={styles.cmpiWLWin}>W:{c.winsCount}</span>
                  <span className={styles.cmpiWLLoss}>L:{c.lossesCount}</span>
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
                      <span className={styles.cmpiWLWin}>{comp.winsCount}W</span>
                      <span className={cx("colorMuted")}> / </span>
                      <span className={styles.cmpiWLLoss}>{comp.lossesCount}L</span>
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

                {comp.beatStrategy && (
                  <div className={styles.cmpiBeatCard}>
                    <div className={styles.cmpiBeatHd}>How to Beat Them</div>
                    <div className={styles.cmpiBeatBody}>{comp.beatStrategy}</div>
                  </div>
                )}
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
            {winLossLog.length === 0 ? (
              <div className={cx("colorMuted", "text12", "textCenter", "py24", "px20")}>No win/loss entries yet.</div>
            ) : winLossLog.map((w, i) => (
              <div key={w.id} className={cx(styles.cmpiWinLossGrid, styles.cmpiTableRow, i < winLossLog.length - 1 && "borderB")}>
                <span className={cx("fontMono", "text11", "colorMuted")}>{w.date}</span>
                <span className={cx("fw600")}>{w.prospect}</span>
                <span className={cx("text10", "fontMono", "uppercase", w.outcome === "won" ? "colorAccent" : w.outcome === "lost" ? "colorRed" : "colorAmber")}>{w.outcome}</span>
                <span className={cx("text12", w.competitorName ? "colorRed" : "colorMuted")}>{w.competitorName || "-"}</span>
                <span className={cx("text12", "colorMuted")}>{w.reason}</span>
              </div>
            ))}
          </div>
          <div className={styles.cmpiSideCol}>
            <div className={cx("card")}>
              <div className={styles.cardInner}>
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
            </div>
            <div className={cx("card")}>
              <div className={styles.cardInner}>
                <div className={styles.cmpiSecTitle}>Lost To (count)</div>
                {competitors
                  .filter((c) => c.type === "Direct")
                  .map((c, i, arr) => (
                    <div key={c.id} className={cx("flexBetween", "py10", i < arr.length - 1 && "borderB")}>
                      <span className={cx("text13")}>{c.name}</span>
                      <span className={styles.cmpiLossCount}>{c.lossesCount}</span>
                    </div>
                  ))}
              </div>
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

      {activeTab === "intel feed" && (
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("flexBetween", "mb4")}>
            <span className={cx("text12", "colorMuted")}>{intelFeed.length} entries from database</span>
            <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Intel Entry</button>
          </div>
          {intelFeed.length === 0 ? (
            <div className={cx("colorMuted", "text12", "textCenter", "py24")}>
              No market intel entries yet. Add your first entry above.
            </div>
          ) : (
            intelFeed.map((item) => (
              <article key={item.id} className={cx(styles.card)}>
                <div className={styles.cardInner}>
                  <div className={cx("flexBetween", "mb8")}>
                    <div className={cx("flexRow", "gap8")}>
                      <span className={cx("badge", "badgeMuted")}>{item.type}</span>
                      <span className={cx("badge", relevanceBadge(item.relevance))}>{item.relevance}</span>
                    </div>
                    <span className={cx("text11", "colorMuted", "fontMono")}>
                      {new Date(item.enteredAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className={cx("fw600", "text13", "mb4")}>{item.title}</div>
                  {item.summary && <div className={cx("text12", "colorMuted")}>{item.summary}</div>}
                  {item.source && (
                    <div className={cx("text11", "colorMuted", "mt8")}>
                      Source: {item.source}
                      {item.enteredByName ? ` · by ${item.enteredByName}` : ""}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {activeTab === "positioning" && (
        <div className={styles.cmpiPosSplit}>
          <div className={cx("card")}>
            <div className={styles.cardInner}>
              <div className={styles.cmpiSecTitle}>Positioning Map</div>
              <div className={styles.cmpiMapWrap}>
                <div className={styles.cmpiMapAxisH} />
                <div className={styles.cmpiMapAxisV} />
                <span className={styles.cmpiLabelTop}>High Specialisation</span>
                <span className={styles.cmpiLabelBottom}>Generalised</span>
                <span className={styles.cmpiLabelLeft}>Low Price</span>
                <span className={styles.cmpiLabelRight}>High Price</span>
                <div className={cx(styles.cmpiDotWrap, styles.cmpiDotPosMaphari)}>
                  <div className={cx(styles.cmpiDot, styles.cmpiDotUs)} />
                  <div className={cx(styles.cmpiDotLabel, styles.cmpiDotLabelUs)}>Maphari</div>
                </div>
                {competitors.map((c, i) => {
                  const posClasses = [styles.cmpiDotPosLemon, styles.cmpiDotPosBrandcraft, styles.cmpiDotPosCollective, styles.cmpiDotPosFreelancers];
                  return (
                    <div key={c.id} className={cx(styles.cmpiDotWrap, posClasses[i % posClasses.length])}>
                      <div className={cx(styles.cmpiDot, toneClass(c.color))} />
                      <div className={cx(styles.cmpiDotLabel, toneClass(c.color))}>{c.name.split(" ").slice(0, 2).join(" ")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.cmpiSideCol}>
            <div className={styles.cmpiPositionCard}>
              <div className={styles.cmpiPosCardHd}>Maphari&apos;s Positioning</div>
              <div className={styles.cmpiBeatBody}>Mid-premium creative agency for ambitious South African brands. We offer specialist strategy + design with personal account management - at a price point between boutique freelancers and full-service agencies.</div>
            </div>
            <div className={cx("card")}>
              <div className={styles.cardInner}>
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
        </div>
      )}

      {/* ── Add Competitor Modal ─────────────────────────────────────────── */}
      {showCompModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCompModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>Add Competitor</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowCompModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddCompetitor} className={styles.modalBody}>
              <label className={styles.fieldLabel}>Name *</label>
              <input className={styles.fieldInput} value={compForm.name} onChange={(e) => setCompForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Lemon & Clay" required />

              <div className={cx("flexRow", "gap8")}>
                <div className={cx("flex1")}>
                  <label className={styles.fieldLabel}>Type</label>
                  <select className={styles.fieldInput} value={compForm.type} onChange={(e) => setCompForm((f) => ({ ...f, type: e.target.value }))}>
                    <option>Direct</option>
                    <option>Adjacent</option>
                    <option>Indirect</option>
                  </select>
                </div>
                <div className={cx("flex1")}>
                  <label className={styles.fieldLabel}>Tier</label>
                  <select className={styles.fieldInput} value={compForm.tier} onChange={(e) => setCompForm((f) => ({ ...f, tier: e.target.value }))}>
                    <option>Same tier</option>
                    <option>Below us</option>
                    <option>Above us</option>
                  </select>
                </div>
              </div>

              <label className={styles.fieldLabel}>Color accent</label>
              <select className={styles.fieldInput} value={compForm.color} onChange={(e) => setCompForm((f) => ({ ...f, color: e.target.value }))}>
                <option value="var(--red)">Red</option>
                <option value="var(--amber)">Amber</option>
                <option value="var(--purple)">Purple</option>
                <option value="var(--blue)">Blue</option>
                <option value="var(--accent)">Accent (lime)</option>
              </select>

              <label className={styles.fieldLabel}>Pricing range</label>
              <input className={styles.fieldInput} value={compForm.pricing} onChange={(e) => setCompForm((f) => ({ ...f, pricing: e.target.value }))} placeholder="e.g. R28k–R45k/mo" />

              <label className={styles.fieldLabel}>Positioning (one-liner)</label>
              <input className={styles.fieldInput} value={compForm.positioning} onChange={(e) => setCompForm((f) => ({ ...f, positioning: e.target.value }))} placeholder="e.g. Premium creative studio" />

              <label className={styles.fieldLabel}>Services (comma-separated)</label>
              <input className={styles.fieldInput} value={compForm.services} onChange={(e) => setCompForm((f) => ({ ...f, services: e.target.value }))} placeholder="Branding, Web, Social" />

              <label className={styles.fieldLabel}>Strengths (comma-separated)</label>
              <input className={styles.fieldInput} value={compForm.strengths} onChange={(e) => setCompForm((f) => ({ ...f, strengths: e.target.value }))} placeholder="Strong portfolio, Faster turnaround" />

              <label className={styles.fieldLabel}>Weaknesses (comma-separated)</label>
              <input className={styles.fieldInput} value={compForm.weaknesses} onChange={(e) => setCompForm((f) => ({ ...f, weaknesses: e.target.value }))} placeholder="No strategy, Higher churn" />

              <label className={styles.fieldLabel}>How to beat them</label>
              <textarea className={styles.fieldInput} rows={3} value={compForm.beatStrategy} onChange={(e) => setCompForm((f) => ({ ...f, beatStrategy: e.target.value }))} placeholder="Emphasise our strategic depth…" />

              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowCompModal(false)}>Cancel</button>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={saving}>{saving ? "Saving…" : "Add Competitor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Win/Loss Modal ───────────────────────────────────────────── */}
      {showWLModal && (
        <div className={styles.modalOverlay} onClick={() => setShowWLModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>Log Win / Loss</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowWLModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddWinLoss} className={styles.modalBody}>
              <label className={styles.fieldLabel}>Date *</label>
              <input type="date" className={styles.fieldInput} value={wlForm.date} onChange={(e) => setWlForm((f) => ({ ...f, date: e.target.value }))} required />

              <label className={styles.fieldLabel}>Prospect name *</label>
              <input className={styles.fieldInput} value={wlForm.prospect} onChange={(e) => setWlForm((f) => ({ ...f, prospect: e.target.value }))} placeholder="e.g. Acme Corp" required />

              <label className={styles.fieldLabel}>Outcome</label>
              <select className={styles.fieldInput} value={wlForm.outcome} onChange={(e) => setWlForm((f) => ({ ...f, outcome: e.target.value }))}>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
              </select>

              <label className={styles.fieldLabel}>Lost to competitor (optional)</label>
              <select className={styles.fieldInput} value={wlForm.competitorId} onChange={(e) => setWlForm((f) => ({ ...f, competitorId: e.target.value }))}>
                <option value="">— none —</option>
                {competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label className={styles.fieldLabel}>Key reason</label>
              <input className={styles.fieldInput} value={wlForm.reason} onChange={(e) => setWlForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Price too high, went with cheaper option" />

              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowWLModal(false)}>Cancel</button>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={saving}>{saving ? "Saving…" : "Log Entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
