"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { fetchCashFlowEvents, type CashFlowEvent } from "../../../../lib/api/admin/billing";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

const statusConfig = {
  received: { color: "var(--accent)", label: "Received" },
  expected: { color: "var(--blue)", label: "Expected" },
  overdue: { color: "var(--red)", label: "Overdue" },
  forecast: { color: "var(--muted)", label: "Forecast" },
  scheduled: { color: "var(--amber)", label: "Scheduled" }
} as const;

const tabs = ["90-day view", "calendar", "scenario planner"] as const;
type Tab = (typeof tabs)[number];

// ── Dynamic 3-month window from current date ───────────────────────────────
function buildMonths(): string[] {
  const now = new Date();
  return [0, 1, 2].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  });
}

function getMonthPrefix(label: string): string {
  // label = "Feb 2026" → "2026-02"
  const [mon, yr] = label.split(" ");
  const monMap: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  return `${yr}-${monMap[mon ?? ""] ?? "01"}`;
}

const CURRENT_DAY_OF_MONTH = new Date().getDate();
const CURRENT_MONTH_DAYS = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
const CURRENT_MONTH_ISO = new Date().toISOString().slice(0, 7); // "YYYY-MM"

export function CashFlowCalendarPage() {
  const { session } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<Tab>("90-day view");
  const [cashEvents, setCashEvents] = useState<CashFlowEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const loadCashEvents = useCallback(async () => {
    if (!session) { setLoadingEvents(false); return; }
    setLoadingEvents(true);
    try {
      const result = await fetchCashFlowEvents(session);
      setCashEvents(result.data ?? []);
    } finally {
      setLoadingEvents(false);
    }
  }, [session]);

  useEffect(() => {
    void loadCashEvents();
  }, [loadCashEvents]);

  const inflows = cashEvents.filter((e) => e.type === "inflow");
  const outflows = cashEvents.filter((e) => e.type === "outflow");
  const totalExpected = inflows.reduce((s, e) => s + e.amount, 0);
  const totalOut = Math.abs(outflows.reduce((s, e) => s + e.amount, 0));
  const overdue = cashEvents.filter((e) => e.status === "overdue").reduce((s, e) => s + e.amount, 0);

  const dynamicMonths = useMemo(() => buildMonths(), []);

  const monthData = useMemo(
    () =>
      dynamicMonths.map((m) => {
        const prefix = getMonthPrefix(m);
        const monInflows = cashEvents.filter((e) => e.date.startsWith(prefix) && e.type === "inflow");
        const monOutflows = cashEvents.filter((e) => e.date.startsWith(prefix) && e.type === "outflow");
        const totalIn = monInflows.reduce((s, e) => s + e.amount, 0);
        const monthOut = Math.abs(monOutflows.reduce((s, e) => s + e.amount, 0));
        return { month: m, totalIn, totalOut: monthOut, net: totalIn - monthOut };
      }),
    [cashEvents, dynamicMonths]
  );

  // Opening balance: sum of all received inflows so far
  const openingBalance = useMemo(
    () => cashEvents.filter((e) => e.type === "inflow" && e.status === "received").reduce((s, e) => s + e.amount, 0),
    [cashEvents]
  );

  if (loadingEvents) {
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
    <div className={cx(styles.pageBody, styles.reportsRoot, "rdStudioPage")}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCIAL</div>
          <h1 className={styles.pageTitle}>Cash Flow Calendar</h1>
          <div className={styles.pageSub}>Expected inflows, outflows, and 90-day projection</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Forecast</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Opening Balance", value: `R${(openingBalance / 1000).toFixed(0)}k`, color: "var(--blue)", sub: `Received invoices` },
          { label: "Expected Inflows (90d)", value: `R${(totalExpected / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "Retainers and invoices" },
          { label: "Planned Outflows (90d)", value: `R${(totalOut / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Payroll, tools, rent" },
          { label: "Overdue Receivables", value: `R${(overdue / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Needs immediate chase" }
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, "rdStudioCard")}>
            <div className={cx(styles.statLabel, "rdStudioLabel")}>{s.label}</div>
            <div className={cx(styles.statValue, "cashFlowToneText", toneClass(s.color), "rdStudioMetric", s.color === "var(--accent)" ? "rdStudioMetricPos" : s.color === "var(--red)" ? "rdStudioMetricNeg" : "")}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "90-day view" && (
          <div>
            {loadingEvents && <div className={cx("colorMuted", "text12")}>Loading cash flow data…</div>}
            <div className={cx("grid3", "gap16", "mb20")}>
              {monthData.map((m, i) => {
                const runningBal = openingBalance + monthData.slice(0, i + 1).reduce((s, md) => s + md.net, 0);
                return (
                  <div key={m.month} className={cx("card", "p20", styles.cashFlowToneBorder, toneClass(m.net >= 0 ? "var(--accent)" : "var(--red)"), "rdStudioCard")}>
                    <div className={cx("text13", "fw700", "mb16", "colorAccent", "rdStudioLabel")}>{m.month}</div>
                    <div className={cx("flexCol", "gap10")}>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb4")}>Inflows</div>
                        <div className={cx("fontMono", "fw700", "colorAccent", styles.cashFlowAmount18, "rdStudioMetric", "rdStudioMetricPos")}>+R{(m.totalIn / 1000).toFixed(0)}k</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb4")}>Outflows</div>
                        <div className={cx("fontMono", "fw700", "colorRed", styles.cashFlowAmount18, "rdStudioMetric", "rdStudioMetricNeg")}>-R{(m.totalOut / 1000).toFixed(0)}k</div>
                      </div>
                      <div className={styles.cashFlowNetBlock}>
                        <div className={cx("text10", "colorMuted", "mb4")}>Net Cash</div>
                        <div className={cx("fontMono", "fw800", styles.cashFlowAmount20, styles.cashFlowToneText, toneClass(m.net >= 0 ? "var(--accent)" : "var(--red)"), "rdStudioMetric", m.net >= 0 ? "rdStudioMetricPos" : "rdStudioMetricNeg")}>{m.net >= 0 ? "+" : ""}R{(m.net / 1000).toFixed(0)}k</div>
                      </div>
                      <div className={cx("bgBg", "p12")}>
                        <div className={cx("text10", "colorMuted", "mb3")}>Closing Balance</div>
                        <div className={cx("fontMono", "colorBlue", "fw700")}>R{(runningBal / 1000).toFixed(0)}k</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("grid2", "gap20")}>
              <div>
                <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking", "colorAccent")}>Expected Inflows</div>
                <div className={cx("flexCol", "gap8")}>
                  {inflows.map((e) => (
                    <div key={e.id} className={cx("cashFlowEventGrid", "card", "gap12", styles.cashFlowEventCard, styles.cashFlowToneBorder, toneClass(e.status === "overdue" ? "var(--red)" : "var(--accent)"))}>
                      <span className={cx("fontMono", "text11", "colorMuted")}>{e.date.slice(5)}</span>
                      <div>
                        <div className={cx("text12", "fw600")}>{e.description}</div>
                        {"overdueDays" in e && e.overdueDays ? <div className={cx("text10", "colorRed")}>{e.overdueDays}d overdue</div> : null}
                      </div>
                      <span className={cx("fontMono", "fw700", "colorAccent")}>+R{(e.amount / 1000).toFixed(0)}k</span>
                      <span className={cx("badge", styles.cashFlowStatusBadge, toneClass(statusConfig[e.status].color))}>{statusConfig[e.status].label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking", "colorRed")}>Planned Outflows</div>
                <div className={cx("flexCol", "gap8")}>
                  {outflows.map((e) => (
                    <div key={e.id} className={cx("cashFlowEventGrid", "card", "gap12", styles.cashFlowEventCard, styles.cashFlowToneBorder, "toneRed")}>
                      <span className={cx("fontMono", "text11", "colorMuted")}>{e.date.slice(5)}</span>
                      <div className={cx("text12", "fw600")}>{e.description}</div>
                      <span className={cx("fontMono", "fw700", "colorRed")}>-R{(Math.abs(e.amount) / 1000).toFixed(0)}k</span>
                      <span className={cx("badge", styles.cashFlowStatusBadge, toneClass(statusConfig[e.status].color))}>{statusConfig[e.status].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>
              {dynamicMonths[0]} — Daily View
            </div>
            <div className={styles.cashFlowCalGrid}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className={cx("textCenter", "text10", "colorMuted", "fw700", styles.cashFlowDayHead)}>{d}</div>
              ))}
              {/* Leading empty cells for first-of-month weekday offset */}
              {Array(
                (() => {
                  const firstDayDow = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
                  // Mon=0 … Sun=6
                  return firstDayDow === 0 ? 6 : firstDayDow - 1;
                })()
              ).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: CURRENT_MONTH_DAYS }, (_, i) => {
                const day = i + 1;
                const dateStr = `${CURRENT_MONTH_ISO}-${String(day).padStart(2, "0")}`;
                const dayEvents = cashEvents.filter((e) => e.date === dateStr);
                const hasInflow = dayEvents.some((e) => e.type === "inflow");
                const hasOutflow = dayEvents.some((e) => e.type === "outflow");
                const hasOverdue = dayEvents.some((e) => e.status === "overdue");
                const isToday = day === CURRENT_DAY_OF_MONTH;
                return (
                  <div key={day} className={cx("bgBg", "borderDefault", styles.cashFlowDayCell, isToday && styles.cashFlowDayToday)}>
                    <div className={cx("text11", "fontMono", "mb4", isToday ? "colorAccent" : "colorMuted")}>{day}</div>
                    {hasOverdue ? <div className={styles.cashFlowTagOverdue}>OVERDUE</div> : null}
                    {hasInflow && !hasOverdue ? <div className={styles.cashFlowTagIn}>IN</div> : null}
                    {hasOutflow ? <div className={styles.cashFlowTagOut}>OUT</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "scenario planner" && (
          <div className={cx("grid2", "gap20")}>
            {[
              { label: "Best Case", desc: "All invoices paid on time plus one new client", inflow: totalExpected + 28000, color: "var(--accent)" },
              { label: "Base Case", desc: "Invoices paid, overdue resolved by Mar", inflow: totalExpected, color: "var(--blue)" },
              { label: "Worst Case", desc: "Two largest invoices unpaid this month", inflow: totalExpected - 37000, color: "var(--amber)" },
              { label: "Crisis Case", desc: "Both clients churn and no new revenue", inflow: totalExpected - 72000, color: "var(--red)" }
            ].map((scenario) => {
              const net = scenario.inflow - totalOut;
              const closing = openingBalance + net;
              return (
                <div key={scenario.label} className={cx("card", "p24", styles.cashFlowToneBorder, toneClass(scenario.color))}>
                  <div className={cx("fw700", styles.cashFlowScenarioTitle, styles.cashFlowToneText, toneClass(scenario.color))}>{scenario.label}</div>
                  <div className={cx("text12", "colorMuted", "mb20")}>{scenario.desc}</div>
                  <div className={cx("flexCol", "gap10")}>
                    {[
                      { label: "Inflows", value: `R${(scenario.inflow / 1000).toFixed(0)}k`, color: "var(--accent)" },
                      { label: "Outflows", value: `-R${(totalOut / 1000).toFixed(0)}k`, color: "var(--red)" },
                      { label: "Net", value: `${net >= 0 ? "+" : ""}R${(net / 1000).toFixed(0)}k`, color: net >= 0 ? "var(--accent)" : "var(--red)" },
                      { label: "Closing Balance", value: `R${(closing / 1000).toFixed(0)}k`, color: scenario.color }
                    ].map((r) => (
                      <div key={r.label} className={cx("flexBetween", "text13", "py10", "borderB")}>
                        <span className={cx("colorMuted")}>{r.label}</span>
                        <span className={cx("fontMono", "fw700", styles.cashFlowToneText, toneClass(r.color))}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className={cx("mt12", "bgBg", "p12")}>
                    <div className={cx("text10", "colorMuted")}>Months of runway at closing balance</div>
                    <div className={cx("fontMono", "fw800", "mt4", styles.cashFlowAmount22, styles.cashFlowToneText, toneClass(scenario.color))}>{Math.max(0, (closing / (totalOut / 3))).toFixed(1)}mo</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
