"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import {
  fetchCashFlowEvents,
  loadCashFlowScenariosWithRefresh,
  createCashFlowScenarioWithRefresh,
  deleteCashFlowScenarioWithRefresh,
  type CashFlowEvent,
  type CashFlowScenario
} from "../../../../lib/api/admin/billing";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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
  const [scenarios, setScenarios] = useState<CashFlowScenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [newScenarioDesc, setNewScenarioDesc] = useState("");
  const [savingScenario, setSavingScenario] = useState(false);

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

  const loadScenarios = useCallback(async () => {
    if (!session) return;
    const result = await loadCashFlowScenariosWithRefresh(session);
    if (result.data) setScenarios(result.data);
  }, [session]);

  useEffect(() => {
    void loadCashEvents();
    void loadScenarios();
  }, [loadCashEvents, loadScenarios]);

  const handleSaveScenario = useCallback(async () => {
    if (!session || !newScenarioName.trim()) return;
    setSavingScenario(true);
    const result = await createCashFlowScenarioWithRefresh(session, {
      name: newScenarioName.trim(),
      description: newScenarioDesc.trim() || undefined,
    });
    if (result.data) {
      setScenarios((prev) => [result.data!, ...prev]);
      setNewScenarioName("");
      setNewScenarioDesc("");
    }
    setSavingScenario(false);
  }, [session, newScenarioName, newScenarioDesc]);

  const handleDeleteScenario = useCallback(async (id: string) => {
    if (!session) return;
    await deleteCashFlowScenarioWithRefresh(session, id);
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, [session]);

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

  const netThisMonth = useMemo(() => (monthData[0]?.net ?? 0), [monthData]);

  // ── Widget data ────────────────────────────────────────────────────────────
  const chartData = monthData.map((m) => ({
    label: m.month,
    inflow: Math.round(m.totalIn / 1000),
    outflow: Math.round(m.totalOut / 1000),
  }));

  const statusCounts = Object.entries(statusConfig).map(([status, cfg]) => ({
    label: cfg.label,
    count: cashEvents.filter((e) => e.status === status).length,
    total: cashEvents.length || 1,
    color: cfg.color === "var(--accent)" ? "#34d98b" : cfg.color === "var(--red)" ? "#ff5f5f" : cfg.color === "var(--amber)" ? "#f5a623" : cfg.color === "var(--blue)" ? "#5fb3ff" : "#888",
  }));

  const tableRows = cashEvents.slice(0, 50).map((e) => ({
    date: e.date.slice(5),
    description: e.description,
    type: e.type,
    amount: `${e.type === "inflow" ? "+" : "-"}R${(Math.abs(e.amount) / 1000).toFixed(1)}k`,
    status: e.status,
  })) as Record<string, unknown>[];

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
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>FINANCE / CASH FLOW CALENDAR</div>
          <h1 className={styles.pageTitle}>Cash Flow Calendar</h1>
          <div className={styles.pageSub}>Expected inflows, outflows, and 90-day projection</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Forecast</button>
        </div>
      </div>

      {/* ── Row 1: KPI stats ── */}
      <WidgetGrid>
        <StatWidget
          label="Current Balance"
          value={`R${(openingBalance / 1000).toFixed(0)}k`}
          sub="Received inflows"
          tone="accent"
        />
        <StatWidget
          label="Expected Inflows (90d)"
          value={`R${(totalExpected / 1000).toFixed(0)}k`}
          sub="Retainers and invoices"
          tone="green"
        />
        <StatWidget
          label="Planned Outflows (90d)"
          value={`R${(totalOut / 1000).toFixed(0)}k`}
          sub="Payroll, tools, rent"
          tone="red"
        />
        <StatWidget
          label="Net This Month"
          value={`${netThisMonth >= 0 ? "+" : ""}R${(netThisMonth / 1000).toFixed(0)}k`}
          sub={overdue > 0 ? `R${(overdue / 1000).toFixed(0)}k overdue` : "On track"}
          tone={netThisMonth >= 0 ? "green" : "red"}
        />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Inflow vs Outflow (3 months)"
          data={chartData.length > 0 ? chartData : [{ label: "No data", inflow: 0, outflow: 0 }]}
          dataKey={["inflow", "outflow"]}
          type="bar"
          color={["#34d98b", "#ff5f5f"]}
          legend={[
            { key: "inflow", label: "Inflow (Rk)" },
            { key: "outflow", label: "Outflow (Rk)" },
          ]}
          xKey="label"
        />
        <PipelineWidget
          label="Events by Status"
          stages={statusCounts.filter((s) => s.count > 0)}
        />
      </WidgetGrid>

      {/* ── Row 3: Transactions table ── */}
      <WidgetGrid>
        <TableWidget
          label="Cash Flow Events"
          rows={tableRows}
          rowKey="description"
          emptyMessage="No cash flow events found."
          columns={[
            { key: "date",        header: "Date",        align: "left" },
            { key: "description", header: "Description", align: "left" },
            { key: "type",        header: "Type",        align: "left", render: (val) => (
              <span className={cx(String(val) === "inflow" ? "badgeGreen" : "badgeRed")}>{String(val)}</span>
            )},
            { key: "amount",      header: "Amount",      align: "right" },
            { key: "status",      header: "Status",      align: "left", render: (val) => {
              const cfg = statusConfig[val as keyof typeof statusConfig];
              const badgeClass = val === "received" ? "badgeGreen" : val === "overdue" ? "badgeRed" : val === "scheduled" ? "badgeAmber" : "badgeMuted";
              return <span className={cx(badgeClass)}>{cfg?.label ?? String(val)}</span>;
            }},
          ]}
        />
      </WidgetGrid>

      {/* ── Tab views below widgets ── */}
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
          <div className={cx("flexCol", "gap20")}>
            {/* ── Create new scenario form ─────────────────────────────── */}
            <div className={cx("card", "p20")}>
              <div className={cx("fw600", "text14", "mb12")}>Save a scenario</div>
              <div className={cx("flexCol", "gap10")}>
                <input
                  type="text"
                  placeholder="Scenario name (e.g. Best Case)"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className={cx("inputSm")}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newScenarioDesc}
                  onChange={(e) => setNewScenarioDesc(e.target.value)}
                  className={cx("inputSm")}
                />
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={savingScenario || !newScenarioName.trim()}
                  onClick={() => void handleSaveScenario()}
                >
                  {savingScenario ? "Saving…" : "Save scenario"}
                </button>
              </div>
            </div>

            {/* ── Persisted scenarios list ─────────────────────────────── */}
            {scenarios.length === 0 ? (
              <div className={cx("card", "p24", "textCenter", "colorMuted", "text13")}>
                No saved scenarios yet. Create one above.
              </div>
            ) : (
              <div className={cx("grid2", "gap20")}>
                {scenarios.map((scenario, idx) => {
                  const colors = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--red)", "var(--purple)"];
                  const color = colors[idx % colors.length]!;
                  return (
                    <div key={scenario.id} className={cx("card", "p24", styles.cashFlowToneBorder, toneClass(color))}>
                      <div className={cx("flexBetween", "mb4")}>
                        <div className={cx("fw700", styles.cashFlowScenarioTitle, styles.cashFlowToneText, toneClass(color))}>{scenario.name}</div>
                        <button
                          type="button"
                          className={cx("btnXs", "btnGhost")}
                          onClick={() => void handleDeleteScenario(scenario.id)}
                          title="Delete scenario"
                        >
                          ×
                        </button>
                      </div>
                      {scenario.description && (
                        <div className={cx("text12", "colorMuted", "mb12")}>{scenario.description}</div>
                      )}
                      <div className={cx("text11", "colorMuted")}>
                        Saved {new Date(scenario.createdAt).toLocaleDateString("en-ZA")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
