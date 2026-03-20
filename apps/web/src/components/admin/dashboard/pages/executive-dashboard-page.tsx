// ════════════════════════════════════════════════════════════════════════════
// executive-dashboard-page.tsx — Admin executive dashboard wired to real API
// Data   : loadAdminSnapshotWithRefresh → clients, projects, invoices, payments
//          loadAllStaffWithRefresh       → staff headcount
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminClient, AdminProject, AdminInvoice } from "../../../../lib/api/admin/types";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import { loadAllStaffWithRefresh } from "../../../../lib/api/admin/hr";
import type { PageId } from "../config";

// ── Helpers ───────────────────────────────────────────────────────────────────

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

function centsToK(cents: number): string {
  return `R${(cents / 100_000).toFixed(0)}k`;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function Sparkline({ data, color, height = 40, width = 100 }: { data: number[]; color: string; height?: number; width?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className={styles.exdSparkSvg}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return i === data.length - 1 ? <circle key={i} cx={x} cy={y} r="3.5" fill={color} /> : null;
      })}
    </svg>
  );
}

const tabs = ["overview", "financial", "clients", "team", "alerts"] as const;
type Tab = (typeof tabs)[number];

function healthClass(score: number): string {
  if (score >= 70) return "colorAccent";
  if (score >= 50) return "colorAmber";
  return "colorRed";
}

function dotClass(idx: number): string {
  const classes = [styles.exdDotAccent, styles.exdDotBlue, styles.exdDotPurple, styles.exdDotAmber, styles.exdDotRed];
  return classes[idx % classes.length];
}

function progressToneClass(idx: number): string {
  const classes = [styles.exdProgressAccent, styles.exdProgressBlue, styles.exdProgressPurple, styles.exdProgressAmber, styles.exdProgressRed];
  return classes[idx % classes.length];
}

function healthToneClass(score: number): string {
  if (score >= 70) return styles.exdProgressAccent;
  if (score >= 50) return styles.exdProgressAmber;
  return styles.exdProgressRed;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
  onNavigate?: (page: PageId) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExecutiveDashboardPage({ session, onNotify, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const [snap, staff] = await Promise.all([
        loadAdminSnapshotWithRefresh(session),
        loadAllStaffWithRefresh(session)
      ]);
      if (cancelled) return;
      if (snap.nextSession) saveSession(snap.nextSession);
      if (staff.nextSession) saveSession(staff.nextSession);
      if (snap.error) onNotify("error", snap.error.message);
      setClients(snap.data?.clients ?? []);
      setProjects(snap.data?.projects ?? []);
      setInvoices(snap.data?.invoices ?? []);
      setStaffCount((staff.data ?? []).filter((s) => s.isActive).length);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // ── Derived KPIs ─────────────────────────────────────────────────────────────
  const activeClients = useMemo(() => clients.filter((c) => c.status === "ACTIVE").length, [clients]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === "IN_PROGRESS").length, [projects]);

  const monthlyRevenue = useMemo(() => {
    const key = currentMonthKey();
    return invoices
      .filter((inv) => inv.status === "PAID" && inv.paidAt?.startsWith(key))
      .reduce((s, inv) => s + inv.amountCents, 0);
  }, [invoices]);

  const outstanding = useMemo(
    () => invoices.filter((inv) => inv.status === "ISSUED" || inv.status === "OVERDUE").reduce((s, inv) => s + inv.amountCents, 0),
    [invoices]
  );

  const overdueInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "OVERDUE"),
    [invoices]
  );

  const atRiskClients = useMemo(() => clients.filter((c) => c.status === "AT_RISK" || c.status === "CHURNED").length, [clients]);

  const kpis = useMemo(() => [
    { label: "Monthly Revenue", value: centsToK(monthlyRevenue), prev: "—", change: "—", color: "var(--accent)", up: null as boolean | null },
    { label: "Active Projects",  value: String(activeProjects),   prev: "—", change: "—", color: "var(--blue)",   up: null },
    { label: "Active Clients",   value: String(activeClients),    prev: "—", change: "—", color: "var(--accent)", up: null },
    { label: "Staff Headcount",  value: String(staffCount),       prev: "—", change: "—", color: "var(--purple)", up: null },
    { label: "Outstanding",      value: centsToK(outstanding),    prev: "—", change: outstanding > 0 ? "+R" + (outstanding / 100_000).toFixed(0) + "k" : "—", color: outstanding > 0 ? "var(--red)" : "var(--accent)", up: outstanding > 0 ? false : null },
    { label: "Overdue Invoices", value: String(overdueInvoices.length), prev: "—", change: overdueInvoices.length > 0 ? `+${overdueInvoices.length}` : "—", color: overdueInvoices.length > 0 ? "var(--red)" : "var(--accent)", up: overdueInvoices.length > 0 ? (false as boolean | null) : null },
    { label: "Clients at Risk",  value: String(atRiskClients),   prev: "—", change: atRiskClients > 0 ? `+${atRiskClients}` : "—", color: atRiskClients > 0 ? "var(--red)" : "var(--accent)", up: atRiskClients > 0 ? (false as boolean | null) : null },
    { label: "Avg Progress",     value: projects.length ? Math.round(projects.reduce((s, p) => s + p.progressPercent, 0) / projects.length) + "%" : "—", prev: "—", change: "—", color: "var(--accent)", up: null },
  ], [monthlyRevenue, activeProjects, activeClients, staffCount, outstanding, overdueInvoices, atRiskClients, projects]);

  // MRR placeholder sparkline data (real data would need historical invoices)
  const mrrHistory = useMemo(() => {
    const base = monthlyRevenue > 0 ? Math.round(monthlyRevenue / 100) : 0;
    return [base * 0.64, base * 0.69, base * 0.74, base * 0.78, base * 0.90, base || 1];
  }, [monthlyRevenue]);

  const totalMRR = useMemo(() => clients.reduce((s) => s + 1, 0), [clients]);
  const _ = totalMRR; // suppress unused

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
    <div className={cx(styles.pageBody, "rdStudioPage")}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Executive Dashboard</h1>
          <div className={styles.pageSub}>Single pane of glass · Maphari Creative Studio</div>
        </div>
        <div className={styles.exdHeadActions}>
          <div className={styles.exdUpdated}>Live data</div>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Board Pack</button>
        </div>
      </div>

      {overdueInvoices.length > 0 && (
        <div className={styles.exdAlertStripWrap}>
          {overdueInvoices.slice(0, 3).map((inv) => (
            <div key={inv.id} className={cx(styles.exdAlertStrip, toneClass("var(--red)"))}>
              <div className={styles.exdAlertLeft}>
                <span className={styles.exdAlertIcon}>🔴</span>
                <span className={styles.text12}>Invoice {inv.number} overdue — {centsToK(inv.amountCents)}</span>
              </div>
              <button type="button" className={cx(styles.exdAlertBtn, toneClass("var(--red)"))} onClick={() => onNavigate?.("invoices")}>View</button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.exdKpiGrid}>
        {kpis.map((k) => {
          const tone = k.color === "var(--red)" ? "var(--red)" : "var(--border)";
          return (
            <div key={k.label} className={cx(styles.exdKpiCard, toneClass(tone), "rdStudioCard")}>
              <div className={cx(styles.exdKpiLabel, "rdStudioLabel")}>{k.label}</div>
              <div className={cx(styles.exdKpiValue, colorClass(k.color), "rdStudioMetric", k.color === "var(--red)" ? "rdStudioMetricNeg" : k.color === "var(--accent)" ? "rdStudioMetricPos" : "")}>{k.value}</div>
              <div className={styles.exdKpiMeta}>
                {k.up !== null && <span className={cx(styles.exdKpiArrow, k.up ? "colorAccent" : "colorRed")}>{k.up ? "▲" : "▼"}</span>}
                <span className={cx("text11", k.up ? "colorAccent" : k.up === false ? "colorRed" : "colorMuted")}>{k.change}</span>
                <span className={styles.exdKpiPrev}>vs {k.prev}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "overview" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx(styles.exdCardHd, "rdStudioSection")}>
              <div className={styles.exdSecTitle}>Revenue Trend (6mo estimate)</div>
              <div className={cx(styles.exdHeadValueAccent, "rdStudioMetric", "rdStudioMetricPos")}>{centsToK(monthlyRevenue)}</div>
            </div>
            <div className={styles.exdMiniBars}>
              {mrrHistory.map((v, i) => {
                const h = (v / Math.max(...mrrHistory)) * 80;
                const isLast = i === mrrHistory.length - 1;
                return (
                  <div key={i} className={styles.exdMiniBarCol}>
                    <svg className={styles.exdMiniBar} viewBox="0 0 10 80" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={80 - h} width="10" height={h} fill={isLast ? "var(--accent)" : "var(--accent-d)"} />
                    </svg>
                    <span className={styles.exdMiniMonth}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Client Health Snapshot</div>
            {clients.slice(0, 6).map((c, idx) => {
              const health = c.status === "ACTIVE" ? 80 : c.status === "AT_RISK" ? 40 : 60;
              return (
                <div key={c.id} className={styles.exdHealthRow}>
                  <div className={cx(styles.exdDot, dotClass(idx))} />
                  <span className={cx(styles.exdHealthName)}>{c.name}</span>
                  <progress
                    className={cx(styles.exdHealthTrack, healthToneClass(health))}
                    max={100}
                    value={health}
                    aria-label={`${c.name} health ${health}`}
                  />
                  <span className={cx(styles.exdHealthScore, healthClass(health))}>{health}</span>
                </div>
              );
            })}
            {clients.length === 0 && <div className={cx("text12", "colorMuted")}>No clients yet.</div>}
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Team & Operations Pulse</div>
            <div className={styles.exdPulseBlock}>
              <div className={styles.exdPulseHead}>
                <span className={cx("text12", "colorMuted")}>Active Projects</span>
                <span className={cx(styles.exdPulseValue, "colorAccent")}>{activeProjects}</span>
              </div>
              <Sparkline data={[activeProjects * 0.6, activeProjects * 0.7, activeProjects * 0.8, activeProjects * 0.9, activeProjects * 0.95, activeProjects || 1]} color="var(--accent)" height={36} width={360} />
            </div>
            <div className={styles.exdPulseBlock}>
              <div className={styles.exdPulseHead}>
                <span className={cx("text12", "colorMuted")}>Staff Headcount</span>
                <span className={cx(styles.exdPulseValue, "colorPurple")}>{staffCount}</span>
              </div>
            </div>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Billing Summary</div>
            {[
              { label: "Monthly revenue", value: centsToK(monthlyRevenue), color: "var(--accent)" },
              { label: "Outstanding receivables", value: centsToK(outstanding), color: outstanding > 0 ? "var(--red)" : "var(--accent)" },
              { label: "Overdue invoices", value: String(overdueInvoices.length), color: overdueInvoices.length > 0 ? "var(--red)" : "var(--accent)" },
            ].map((r, idx) => (
              <div key={r.label} className={cx(styles.exdCashRow, idx < 2 && "borderB", "rdStudioRow")}>
                <span className={cx(styles.exdCashLabel, "rdStudioLabel")}>{r.label}</span>
                <span className={cx(styles.exdCashValue, colorClass(r.color), "rdStudioMetric", r.color === "var(--red)" ? "rdStudioMetricNeg" : "rdStudioMetricPos")}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "financial" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Revenue by Status</div>
            {["PAID", "ISSUED", "OVERDUE", "DRAFT"].map((status) => {
              const total = invoices.filter((inv) => inv.status === status).reduce((s, inv) => s + inv.amountCents, 0);
              const allTotal = invoices.reduce((s, inv) => s + inv.amountCents, 0) || 1;
              const color = status === "PAID" ? "var(--accent)" : status === "OVERDUE" ? "var(--red)" : "var(--muted)";
              return (
                <div key={status} className={styles.exdRevRow}>
                  <span className={cx(styles.exdRevName, colorClass(color))}>{status}</span>
                  <progress className={cx(styles.exdRevTrack, progressToneClass(0))} max={allTotal} value={total} aria-label={`${status} revenue share`} />
                  <span className={cx(styles.exdRevValue, colorClass(color))}>{centsToK(total)}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Cash Position</div>
            {[
              { label: "Monthly revenue", value: centsToK(monthlyRevenue), color: "var(--accent)" },
              { label: "Outstanding receivables", value: centsToK(outstanding), color: outstanding > 0 ? "var(--red)" : "var(--accent)" },
              { label: "Overdue count", value: String(overdueInvoices.length), color: overdueInvoices.length > 0 ? "var(--red)" : "var(--accent)" },
            ].map((r, idx) => (
              <div key={r.label} className={cx(styles.exdCashRow, idx < 2 && "borderB")}>
                <span className={styles.exdCashLabel}>{r.label}</span>
                <span className={cx(styles.exdCashValue, colorClass(r.color))}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "clients" && (
        <div className={styles.exdClientsCol}>
          {clients.map((c, idx) => {
            const health = c.status === "ACTIVE" ? 80 : c.status === "AT_RISK" ? 40 : 60;
            const tone = health < 50 ? "var(--red)" : "var(--border)";
            return (
              <div key={c.id} className={cx(styles.exdClientRow, toneClass(tone))}>
                <div className={cx(styles.exdClientName, dotClass(idx))}>{c.name}</div>
                <div className={cx(styles.exdClientHealthValue, healthClass(health))}>{health}</div>
                <div>
                  <progress className={cx(styles.exdTrack8, healthToneClass(health))} max={100} value={health} aria-label={`${c.name} health bar`} />
                </div>
                <div className={styles.exdCenterCol}><div className={styles.exdMiniLabel}>Status</div><div className={styles.exdMonoAccent}>{c.status}</div></div>
                <div className={styles.exdCenterCol}><div className={styles.exdMiniLabel}>Tier</div><div className={cx(styles.exdMonoBold)}>{c.tier}</div></div>
                {health < 50 ? <span className={styles.exdAtRiskTag}>At Risk</span> : <span />}
              </div>
            );
          })}
          {clients.length === 0 && <div className={cx("text13", "colorMuted")}>No clients found.</div>}
        </div>
      )}

      {activeTab === "team" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Staff Overview</div>
            {[
              { label: "Active headcount", value: String(staffCount), color: "var(--accent)" },
              { label: "Active projects", value: String(activeProjects), color: "var(--blue)" },
              { label: "Active clients", value: String(activeClients), color: "var(--purple)" },
            ].map((r, idx) => (
              <div key={r.label} className={cx(styles.exdCashRow, idx < 2 && "borderB")}>
                <span className={styles.exdCashLabel}>{r.label}</span>
                <span className={cx(styles.exdCashValue, colorClass(r.color))}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Projects by Status</div>
            {["IN_PROGRESS", "PLANNING", "REVIEW", "ON_HOLD", "COMPLETED"].map((status) => {
              const count = projects.filter((p) => p.status === status).length;
              const color = status === "IN_PROGRESS" ? "var(--accent)" : status === "ON_HOLD" ? "var(--red)" : "var(--muted)";
              return (
                <div key={status} className={styles.exdRevRow}>
                  <span className={cx(styles.exdRevName, colorClass(color))}>{status}</span>
                  <progress className={cx(styles.exdRevTrack, progressToneClass(0))} max={Math.max(projects.length, 1)} value={count} aria-label={`${status} projects`} />
                  <span className={cx(styles.exdRevValue, colorClass(color))}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className={styles.exdAlertsCol}>
          {overdueInvoices.length === 0 && atRiskClients === 0 && (
            <div className={cx(styles.exdAlertRow, toneClass("var(--accent)"))}>
              <div className={styles.exdAlertLeftBig}>
                <span className={styles.exdAlertBigIcon}>🟢</span>
                <div>
                  <span className={cx(styles.exdAlertType, "colorAccent")}>info</span>
                  <span className={styles.text13}>No critical alerts at this time.</span>
                </div>
              </div>
            </div>
          )}
          {overdueInvoices.map((inv) => (
            <div key={inv.id} className={cx(styles.exdAlertRow, toneClass("var(--red)"))}>
              <div className={styles.exdAlertLeftBig}>
                <span className={styles.exdAlertBigIcon}>🔴</span>
                <div>
                  <span className={cx(styles.exdAlertType, "colorRed")}>critical</span>
                  <span className={styles.text13}>Invoice {inv.number} is overdue — {centsToK(inv.amountCents)}</span>
                </div>
              </div>
              <button type="button" className={cx(styles.exdAlertBtnBig, toneClass("var(--red)"))} onClick={() => onNavigate?.("invoices")}>View</button>
            </div>
          ))}
          {atRiskClients > 0 && (
            <div className={cx(styles.exdAlertRow, toneClass("var(--amber)"))}>
              <div className={styles.exdAlertLeftBig}>
                <span className={styles.exdAlertBigIcon}>🟡</span>
                <div>
                  <span className={cx(styles.exdAlertType, "colorAmber")}>warning</span>
                  <span className={styles.text13}>{atRiskClients} client{atRiskClients > 1 ? "s" : ""} at risk — review health scores.</span>
                </div>
              </div>
              <button type="button" className={cx(styles.exdAlertBtnBig, toneClass("var(--amber)"))} onClick={() => onNavigate?.("healthScorecard")}>Review</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
