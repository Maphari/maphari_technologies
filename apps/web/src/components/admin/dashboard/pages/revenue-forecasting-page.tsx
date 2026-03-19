// ════════════════════════════════════════════════════════════════════════════
// revenue-forecasting-page.tsx — Admin revenue forecasting wired to real API
// Data   : GET /invoices  (via loadAdminSnapshotWithRefresh)
//          Paid invoices  → actual monthly revenue grouped by paidAt month
//          Pending/Draft  → projected revenue grouped by dueAt month
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminInvoice } from "../../../../lib/api/admin/types";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "6-month forecast" | "monthly breakdown" | "outstanding";
const tabs: Tab[] = ["6-month forecast", "monthly breakdown", "outstanding"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  if (!key) return "";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function centsToK(cents: number): string {
  return `R${(cents / 100_000).toFixed(0)}k`;
}

function buildMonthBuckets(invoices: AdminInvoice[]) {
  const actual: Record<string, number> = {};   // paid invoices by paidAt month
  const projected: Record<string, number> = {}; // open/draft by dueAt month

  for (const inv of invoices) {
    if (inv.status === "PAID" && inv.paidAt) {
      const key = monthKey(inv.paidAt);
      if (key) actual[key] = (actual[key] ?? 0) + inv.amountCents;
    }
    if ((inv.status === "ISSUED" || inv.status === "DRAFT" || inv.status === "OVERDUE") && inv.dueAt) {
      const key = monthKey(inv.dueAt);
      if (key) projected[key] = (projected[key] ?? 0) + inv.amountCents;
    }
  }

  // Build a sorted month list spanning last 3 months + next 5 months from today
  const now = new Date();
  const keys = new Set<string>();
  for (let offset = -3; offset <= 5; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  // Also include any key from real data
  [...Object.keys(actual), ...Object.keys(projected)].forEach((k) => keys.add(k));

  return [...keys]
    .sort()
    .map((key) => ({
      key,
      label: monthLabel(key),
      actual: actual[key] ?? 0,
      projected: projected[key] ?? 0
    }));
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RevenueForecastingPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("6-month forecast");
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const r = await loadAdminSnapshotWithRefresh(session);
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) onNotify("error", r.error.message);
      setInvoices(r.data?.invoices ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  const months = useMemo(() => buildMonthBuckets(invoices), [invoices]);

  // KPI summary
  const totalPaid = useMemo(() => invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountCents, 0), [invoices]);
  const totalOutstanding = useMemo(
    () => invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE").reduce((s, i) => s + i.amountCents, 0),
    [invoices]
  );
  const totalDraft = useMemo(() => invoices.filter((i) => i.status === "DRAFT").reduce((s, i) => s + i.amountCents, 0), [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter((i) => i.status === "OVERDUE"), [invoices]);

  // Future 6-month projection window
  const now = new Date();
  const futureKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const forecastMonths = months.filter((m) => futureKeys.includes(m.key));
  const maxForecastBar = Math.max(...forecastMonths.map((m) => m.actual + m.projected), 1);

  const outstandingInvoices = invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE");

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.pageBody, styles.revfRoot, "rdStudioPage")}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING &amp; INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Revenue Forecasting</h1>
          <div className={styles.pageSub}>6-month MRR projection - Invoice pipeline - Collected vs outstanding</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Forecast</button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Collected", value: centsToK(totalPaid), color: "var(--accent)", sub: "Paid invoices" },
          { label: "Outstanding", value: centsToK(totalOutstanding), color: totalOutstanding > 0 ? "var(--amber)" : "var(--accent)", sub: "Issued but unpaid" },
          { label: "Draft Pipeline", value: centsToK(totalDraft), color: "var(--blue)", sub: "Not yet issued" },
          { label: "Overdue", value: String(overdueInvoices.length), color: overdueInvoices.length > 0 ? "var(--red)" : "var(--accent)", sub: "Past due date" }
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, "rdStudioCard")}>
            <div className={cx(styles.statLabel, "rdStudioLabel")}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color), "rdStudioMetric", s.color === "var(--accent)" ? "rdStudioMetricPos" : s.color === "var(--red)" ? "rdStudioMetricNeg" : s.color === "var(--amber)" ? "rdStudioMetricWarn" : "")}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.filterRow}>
        <select
          title="View"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── 6-month forecast ── */}
      {activeTab === "6-month forecast" && (
        <div className={styles.revfStack20}>
          <div className={cx(styles.revfChartCard, "rdStudioCard")}>
            <div className={cx(styles.revfSectionTitle, "rdStudioSection")}>6-Month Revenue Forecast</div>
            <div className={cx("text11", "colorMuted", "mb24")}>
              Lime bars = collected (PAID) · Blue bars = projected (ISSUED/DRAFT)
            </div>
            {forecastMonths.length === 0 ? (
              <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No invoice data for forecast window.</div>
            ) : (
              <div className={styles.revfBarRow}>
                {forecastMonths.map((m) => {
                  const totalH = ((m.actual + m.projected) / maxForecastBar) * 140;
                  const actH = m.actual > 0 ? (m.actual / (m.actual + m.projected || 1)) * totalH : 0;
                  const projH = totalH - actH;
                  return (
                    <div key={m.key} className={styles.revfBarCol}>
                      <div className={cx("fontMono", "text10", "colorAccent")}>
                        {centsToK(m.actual + m.projected)}
                      </div>
                      <svg className={styles.revfStackedBar} viewBox="0 0 10 140" preserveAspectRatio="none" aria-hidden="true">
                        {projH > 0 && (
                          <rect x="0" y={140 - projH} width="10" height={projH} className={styles.revfExpansion} />
                        )}
                        {actH > 0 && (
                          <rect x="0" y={140 - actH - projH} width="10" height={actH} className={styles.revfRetained} />
                        )}
                      </svg>
                      <span className={styles.revfBarMonth}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className={styles.revfTableCard}>
            <div className={cx(styles.revfTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {"Month|Collected|Projected|Total|Invoices".split("|").map((h) => <span key={h}>{h}</span>)}
            </div>
            {forecastMonths.map((m, i) => {
              const total = m.actual + m.projected;
              const invoiceCount = invoices.filter((inv) => {
                const dateField = inv.status === "PAID" ? inv.paidAt : inv.dueAt;
                return monthKey(dateField) === m.key;
              }).length;
              return (
                <div key={m.key} className={cx(styles.revfTableRow, i < forecastMonths.length - 1 && "borderB", "rdStudioRow")}>
                  <span className={cx("fontMono", "fw700", "rdStudioLabel")}>{m.label}</span>
                  <span className={cx("fontMono", "colorAccent")}>{m.actual > 0 ? centsToK(m.actual) : "—"}</span>
                  <span className={cx("fontMono", "colorBlue")}>{m.projected > 0 ? centsToK(m.projected) : "—"}</span>
                  <span className={cx("fontMono", "fw800", "text14", "colorAccent", "rdStudioMetric", "rdStudioMetricPos")}>{total > 0 ? centsToK(total) : "—"}</span>
                  <span className={cx("text12", "colorMuted")}>{invoiceCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Monthly breakdown ── */}
      {activeTab === "monthly breakdown" && (
        <div className={styles.revfStack14}>
          {months.length === 0 && (
            <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No invoice data available.</div>
          )}
          {months.filter((m) => m.actual + m.projected > 0).map((m) => {
            const total = m.actual + m.projected;
            const actPct = total > 0 ? Math.round((m.actual / total) * 100) : 0;
            return (
              <div key={m.key} className={styles.revfPipelineCard}>
                <div className={styles.revfPipelineGrid}>
                  <div>
                    <div className={cx(styles.revfPipelineName, "colorAccent")}>{m.label}</div>
                    <div className={cx("text10", "colorMuted")}>
                      {invoices.filter((i) => monthKey(i.status === "PAID" ? i.paidAt : i.dueAt) === m.key).length} invoice(s)
                    </div>
                  </div>
                  <div>
                    <div className={styles.revfMiniLabel}>Collected</div>
                    <div className={cx("fontMono", "fw700", "colorAccent")}>{m.actual > 0 ? centsToK(m.actual) : "—"}</div>
                  </div>
                  <div>
                    <div className={styles.revfMiniLabel}>Projected</div>
                    <div className={cx("fontMono", "fw700", "colorBlue")}>{m.projected > 0 ? centsToK(m.projected) : "—"}</div>
                  </div>
                  <div>
                    <div className={styles.revfProbHead}>
                      <span className={styles.revfMiniLabel}>Collected rate</span>
                      <span className={cx("fontMono", "text11", actPct >= 60 ? "colorAccent" : "colorAmber")}>{actPct}%</span>
                    </div>
                    <progress
                      className={cx(styles.revfProbTrack, actPct >= 60 ? styles.revfProgressAccent : styles.revfProgressAmber)}
                      max={100}
                      value={actPct}
                      aria-label={`${m.label} collected rate ${actPct}%`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Outstanding ── */}
      {activeTab === "outstanding" && (
        <div className={styles.revfStack14}>
          <div className={styles.revfPipelineSummary}>
            <div>
              <div className={styles.revfSummaryTitle}>Outstanding Receivables</div>
              <div className={cx("text11", "colorMuted")}>Issued + overdue invoices</div>
            </div>
            <div className={styles.revfSummaryValue}>{centsToK(totalOutstanding)}</div>
          </div>
          {outstandingInvoices.length === 0 && (
            <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No outstanding invoices.</div>
          )}
          {outstandingInvoices.map((inv) => (
            <div key={inv.id} className={styles.revfPipelineCard}>
              <div className={styles.revfPipelineGrid}>
                <div>
                  <div className={cx(styles.revfPipelineName, inv.status === "OVERDUE" ? "colorRed" : "colorAccent")}>
                    {inv.number}
                  </div>
                  <div className={cx("text10", "colorMuted")}>Client: {inv.clientId}</div>
                </div>
                <div>
                  <div className={styles.revfMiniLabel}>Status</div>
                  <span className={cx(
                    styles.revfStageTag,
                    inv.status === "OVERDUE" ? styles.revfStageAmber : styles.revfStageBlue
                  )}>
                    {inv.status}
                  </span>
                </div>
                <div className={styles.revfCenterCol}>
                  <div className={styles.revfTinyLabel}>Amount</div>
                  <div className={cx("fontMono", "fw700", "colorAccent")}>{centsToK(inv.amountCents)}</div>
                </div>
                <div className={styles.revfCenterCol}>
                  <div className={styles.revfTinyLabel}>Due</div>
                  <div className={cx("fontMono", inv.status === "OVERDUE" ? "colorRed" : "")}>
                    {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}
                  </div>
                </div>
                <button type="button" className={cx("btnSm", "btnGhost")}>Chase</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
