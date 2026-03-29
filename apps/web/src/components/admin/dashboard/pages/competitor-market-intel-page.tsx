// ════════════════════════════════════════════════════════════════════════════
// competitor-market-intel-page.tsx — Admin Competitor & Market Intel
// Data     : loadMarketIntelWithRefresh → GET /admin/market-intel (Intel Feed tab)
// Static   : Competitor analysis, win/loss, market rates, positioning tabs
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
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

  const winLossData = [
    { label: "Won",  count: totalWon  },
    { label: "Lost", count: totalLost },
  ];

  const compTableRows = winLossLog.map(w => ({
    date:       w.date,
    prospect:   w.prospect,
    outcome:    w.outcome,
    lostTo:     w.competitorName ?? "—",
    reason:     w.reason ?? "—",
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / MARKET INTEL</div>
          <h1 className={styles.pageTitle}>Competitor &amp; Market Intel</h1>
          <div className={styles.pageSub}>Competitor tracking · Win/loss · Market rates · Positioning</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowCompModal(true)}>+ Add Competitor</button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowWLModal(true)}>+ Log Entry</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Win Rate" value={`${winRate}%`} sub={`${totalWon} won · ${totalLost} lost`} tone={winRate >= 50 ? "green" : "amber"} />
        <StatWidget label="Tracked Competitors" value={competitors.length} sub={`${competitors.filter(c => c.type === "Direct").length} direct`} tone="default" />
        <StatWidget label="Most Common Rival" value={topRival ? topRival[0] : "—"} sub={topRival ? `Lost to ${topRival[1]}x` : "No data"} tone={topRival ? "red" : "default"} />
        <StatWidget label="Market Position" value="Mid-Premium" sub="Between Brandcraft & Collective" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Win / Loss Analysis"
          data={winLossData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Competitor Breakdown"
          stages={[
            { label: "Direct",   count: competitors.filter(c => c.type === "Direct").length,   total: Math.max(competitors.length, 1), color: "#ff5f5f" },
            { label: "Adjacent", count: competitors.filter(c => c.type === "Adjacent").length, total: Math.max(competitors.length, 1), color: "#f5a623" },
            { label: "Indirect", count: competitors.filter(c => c.type === "Indirect").length, total: Math.max(competitors.length, 1), color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Win / Loss Log"
          rows={compTableRows as Record<string, unknown>[]}
          columns={[
            { key: "date",     header: "Date"     },
            { key: "prospect", header: "Prospect" },
            { key: "outcome",  header: "Outcome",  render: (v) => {
              const val = v as string;
              const cls = val === "won" ? cx("badge", "badgeGreen") : val === "lost" ? cx("badge", "badgeRed") : cx("badge", "badgeAmber");
              return <span className={cls}>{val}</span>;
            }},
            { key: "lostTo",   header: "Lost To",  align: "right" },
            { key: "reason",   header: "Reason",   align: "right" },
          ]}
          emptyMessage="No win/loss entries yet"
        />
      </WidgetGrid>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

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
