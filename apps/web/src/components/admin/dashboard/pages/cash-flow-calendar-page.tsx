"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

const cashEvents = [
  { id: "CF-001", type: "inflow", category: "Retainer", client: "Volta Studios", clientColor: "var(--accent)", amount: 28000, date: "2026-02-28", status: "expected", description: "Feb retainer - Volta Studios" },
  { id: "CF-002", type: "inflow", category: "Retainer", client: "Mira Health", clientColor: "var(--blue)", amount: 21600, date: "2026-02-28", status: "expected", description: "Feb retainer - Mira Health" },
  { id: "CF-003", type: "inflow", category: "Retainer", client: "Okafor & Sons", clientColor: "var(--amber)", amount: 12000, date: "2026-02-25", status: "received", description: "Feb retainer - Okafor" },
  { id: "CF-004", type: "inflow", category: "Invoice", client: "Kestrel Capital", clientColor: "var(--accent)", amount: 21000, date: "2026-02-28", status: "overdue", description: "INV-0039 - overdue", overdueDays: 12 },
  { id: "CF-005", type: "inflow", category: "Invoice", client: "Dune Collective", clientColor: "var(--amber)", amount: 16000, date: "2026-03-01", status: "expected", description: "INV-0040 - project milestone" },
  { id: "CF-006", type: "inflow", category: "Retainer", client: "Volta Studios", clientColor: "var(--accent)", amount: 28000, date: "2026-03-31", status: "forecast", description: "Mar retainer - Volta Studios" },
  { id: "CF-007", type: "inflow", category: "Retainer", client: "Mira Health", clientColor: "var(--blue)", amount: 21600, date: "2026-03-31", status: "forecast", description: "Mar retainer - Mira Health" },
  { id: "CF-008", type: "inflow", category: "Retainer", client: "Okafor & Sons", clientColor: "var(--amber)", amount: 12000, date: "2026-03-25", status: "forecast", description: "Mar retainer - Okafor" },
  { id: "CF-009", type: "inflow", category: "Retainer", client: "Kestrel Capital", clientColor: "var(--accent)", amount: 21000, date: "2026-03-31", status: "forecast", description: "Mar retainer - Kestrel" },
  { id: "CF-010", type: "inflow", category: "Retainer", client: "Dune Collective", clientColor: "var(--amber)", amount: 16000, date: "2026-03-31", status: "forecast", description: "Mar retainer - Dune" },
  { id: "CF-011", type: "outflow", category: "Payroll", client: null, clientColor: "var(--muted)", amount: -142000, date: "2026-02-25", status: "scheduled", description: "Feb payroll - all staff" },
  { id: "CF-012", type: "outflow", category: "Tools", client: null, clientColor: "var(--muted)", amount: -5500, date: "2026-02-28", status: "scheduled", description: "Monthly SaaS subscriptions" },
  { id: "CF-013", type: "outflow", category: "Freelancer", client: null, clientColor: "var(--muted)", amount: -18000, date: "2026-03-01", status: "scheduled", description: "Studio Outpost - Dune scope" },
  { id: "CF-014", type: "outflow", category: "Payroll", client: null, clientColor: "var(--muted)", amount: -142000, date: "2026-03-25", status: "forecast", description: "Mar payroll - all staff" },
  { id: "CF-015", type: "outflow", category: "Tools", client: null, clientColor: "var(--muted)", amount: -5500, date: "2026-03-31", status: "forecast", description: "Mar SaaS subscriptions" },
  { id: "CF-016", type: "outflow", category: "Rent", client: null, clientColor: "var(--muted)", amount: -22000, date: "2026-03-01", status: "scheduled", description: "Studio rent - Q1 quarter" }
] as const;

const statusConfig = {
  received: { color: "var(--accent)", label: "Received" },
  expected: { color: "var(--blue)", label: "Expected" },
  overdue: { color: "var(--red)", label: "Overdue" },
  forecast: { color: "var(--muted)", label: "Forecast" },
  scheduled: { color: "var(--amber)", label: "Scheduled" }
} as const;

const tabs = ["90-day view", "calendar", "scenario planner"] as const;
type Tab = (typeof tabs)[number];
const months = ["Feb 2026", "Mar 2026", "Apr 2026"] as const;

export function CashFlowCalendarPage() {
  const [activeTab, setActiveTab] = useState<Tab>("90-day view");

  const inflows = cashEvents.filter((e) => e.type === "inflow");
  const outflows = cashEvents.filter((e) => e.type === "outflow");
  const totalExpected = inflows.reduce((s, e) => s + e.amount, 0);
  const totalOut = Math.abs(outflows.reduce((s, e) => s + e.amount, 0));
  const overdue = cashEvents.filter((e) => e.status === "overdue").reduce((s, e) => s + e.amount, 0);

  const monthData = useMemo(
    () =>
      months.map((m) => {
        const [mon, yr] = m.split(" ");
        const monNum = ({ Feb: "02", Mar: "03", Apr: "04" } as const)[mon as "Feb" | "Mar" | "Apr"];
        const prefix = `${yr}-${monNum}`;
        const monInflows = cashEvents.filter((e) => e.date.startsWith(prefix) && e.type === "inflow");
        const monOutflows = cashEvents.filter((e) => e.date.startsWith(prefix) && e.type === "outflow");
        const totalIn = monInflows.reduce((s, e) => s + e.amount, 0);
        const monthOut = Math.abs(monOutflows.reduce((s, e) => s + e.amount, 0));
        return { month: m, totalIn, totalOut: monthOut, net: totalIn - monthOut };
      }),
    []
  );

  const openingBalance = 285000;

  return (
    <div className={cx(styles.pageBody, styles.reportsRoot)}>
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
          { label: "Opening Balance", value: `R${(openingBalance / 1000).toFixed(0)}k`, color: "var(--blue)", sub: "As at Feb 23" },
          { label: "Expected Inflows (90d)", value: `R${(totalExpected / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "Retainers and invoices" },
          { label: "Planned Outflows (90d)", value: `R${(totalOut / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Payroll, tools, rent" },
          { label: "Overdue Receivables", value: `R${(overdue / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Needs immediate chase" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "cashFlowToneText", toneClass(s.color))}>{s.value}</div>
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
            <div className={cx("grid3", "gap16", "mb20")}>
              {monthData.map((m, i) => {
                const runningBal = openingBalance + monthData.slice(0, i + 1).reduce((s, md) => s + md.net, 0);
                return (
                  <div key={m.month} className={cx("card", "p20", styles.cashFlowToneBorder, toneClass(m.net >= 0 ? "var(--accent)" : "var(--red)"))}>
                    <div className={cx("text13", "fw700", "mb16", "colorAccent")}>{m.month}</div>
                    <div className={cx("flexCol", "gap10")}>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb4")}>Inflows</div>
                        <div className={cx("fontMono", "fw700", "colorAccent", styles.cashFlowAmount18)}>+R{(m.totalIn / 1000).toFixed(0)}k</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb4")}>Outflows</div>
                        <div className={cx("fontMono", "fw700", "colorRed", styles.cashFlowAmount18)}>-R{(m.totalOut / 1000).toFixed(0)}k</div>
                      </div>
                      <div className={styles.cashFlowNetBlock}>
                        <div className={cx("text10", "colorMuted", "mb4")}>Net Cash</div>
                        <div className={cx("fontMono", "fw800", styles.cashFlowAmount20, styles.cashFlowToneText, toneClass(m.net >= 0 ? "var(--accent)" : "var(--red)"))}>{m.net >= 0 ? "+" : ""}R{(m.net / 1000).toFixed(0)}k</div>
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
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>February 2026 - Daily View</div>
            <div className={styles.cashFlowCalGrid}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className={cx("textCenter", "text10", "colorMuted", "fw700", styles.cashFlowDayHead)}>{d}</div>
              ))}
              {Array(6).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: 28 }, (_, i) => {
                const day = i + 1;
                const dateStr = `2026-02-${String(day).padStart(2, "0")}`;
                const dayEvents = cashEvents.filter((e) => e.date === dateStr);
                const hasInflow = dayEvents.some((e) => e.type === "inflow");
                const hasOutflow = dayEvents.some((e) => e.type === "outflow");
                const hasOverdue = dayEvents.some((e) => e.status === "overdue");
                const isToday = day === 23;
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
              { label: "Worst Case", desc: "Kestrel and Dune don't pay this month", inflow: totalExpected - 37000, color: "var(--amber)" },
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
