"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import { getMyTasks, type StaffTask } from "../../../../lib/api/staff/tasks";
import { getMyTimeEntries, type StaffTimeEntry } from "../../../../lib/api/staff/time";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff/projects";

type ClientRow = { id: string; name: string; avatar: string };
type MilestoneStatus = "delivered" | "in_progress";
type MilestoneCategory = "Design" | "Strategy" | "Comms" | "Admin";
type Milestone = {
  id: string;
  clientId: string;
  title: string;
  category: MilestoneCategory;
  estimated: number;
  actual: number;
  status: MilestoneStatus;
};

function buildInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function variance(estimated: number, actual: number) {
  return actual - estimated;
}

function variancePct(estimated: number, actual: number) {
  return Math.round(((actual - estimated) / estimated) * 100);
}

function varianceToneClass(value: number) {
  if (value > 2) return "evaToneBad";
  if (value > 0) return "evaToneWarn";
  return "evaToneGood";
}

function accuracyToneClass(value: number) {
  if (value >= 85) return "evaToneGood";
  if (value >= 70) return "evaToneWarn";
  return "evaToneBad";
}

// Map tone class → staffMetricBlockSm color class
function toneToMetricCls(tone: string): string {
  if (tone === "evaToneGood") return "colorGreen";
  if (tone === "evaToneWarn") return "colorAmber";
  if (tone === "evaToneBad")  return "colorRed";
  return "";
}

// Map tone class → staffBarFill variant
function toneToFillCls(tone: string): string {
  if (tone === "evaToneGood") return "evaFillGreen";
  if (tone === "evaToneWarn") return "evaFillAmber";
  return "evaFillRed";
}

export function EstimatesVsActualsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [clients,      setClients]      = useState<ClientRow[]>([]);
  const [milestones,   setMilestones]   = useState<Milestone[]>([]);
  const [weeklyData,   setWeeklyData]   = useState<{ week: string; estimated: number; actual: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; estimated: number; actual: number }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [tab,          setTab]          = useState<"milestones" | "weekly" | "category">("milestones");
  const [sort,         setSort]         = useState<"variance" | "client" | "estimated">("variance");

  // ── Load clients ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void getStaffClients(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setClients(r.data.map((c) => ({ id: c.id, name: c.name, avatar: buildInitials(c.name) })));
      }
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Load tasks + time entries + projects and derive milestone data ─────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [tasksR, timeR, projectsR] = await Promise.all([
          getMyTasks(session),
          getMyTimeEntries(session),
          getStaffProjects(session),
        ]);
        if (cancelled) return;
        if (tasksR.nextSession)    saveSession(tasksR.nextSession);
        if (timeR.nextSession)     saveSession(timeR.nextSession);
        if (projectsR.nextSession) saveSession(projectsR.nextSession);

        const tasks: StaffTask[]             = tasksR.data ?? [];
        const timeEntries: StaffTimeEntry[]  = timeR.data ?? [];
        const projects: StaffProject[]       = projectsR.data ?? [];

        const projectMap = new Map<string, StaffProject>();
        projects.forEach((p) => projectMap.set(p.id, p));

        const actualMinutesByTask = new Map<string, number>();
        timeEntries.forEach((entry) => {
          const label = (entry.taskLabel ?? "").toLowerCase();
          const matchedTask = tasks.find((t) => t.title.toLowerCase() === label || t.id === label);
          if (matchedTask) {
            actualMinutesByTask.set(matchedTask.id, (actualMinutesByTask.get(matchedTask.id) ?? 0) + entry.minutes);
          }
        });

        const derivedMilestones: Milestone[] = tasks
          .filter((t) => t.estimateMinutes && t.estimateMinutes > 0)
          .map((t) => {
            const project        = projectMap.get(t.projectId);
            const estimatedHours = (t.estimateMinutes ?? 0) / 60;
            const actualHours    = (actualMinutesByTask.get(t.id) ?? 0) / 60;
            return {
              id:        t.id,
              clientId:  project?.clientId ?? "",
              title:     t.title,
              category:  "Admin" as MilestoneCategory,
              estimated: Math.round(estimatedHours * 10) / 10,
              actual:    Math.round(actualHours * 10) / 10,
              status:    (t.status === "DONE" ? "delivered" : "in_progress") as MilestoneStatus,
            };
          });
        setMilestones(derivedMilestones);

        // Weekly trend
        const weekMap = new Map<string, { estimated: number; actual: number }>();
        timeEntries.forEach((entry) => {
          const d = new Date(entry.loggedAt);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay() + 1);
          const label    = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          const existing = weekMap.get(label) ?? { estimated: 0, actual: 0 };
          existing.actual += entry.minutes / 60;
          weekMap.set(label, existing);
        });
        tasks.forEach((t) => {
          if (!t.dueAt || !t.estimateMinutes) return;
          const d = new Date(t.dueAt);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay() + 1);
          const label    = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          const existing = weekMap.get(label) ?? { estimated: 0, actual: 0 };
          existing.estimated += t.estimateMinutes / 60;
          weekMap.set(label, existing);
        });
        const sortedWeeks = Array.from(weekMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-7)
          .map(([week, data]) => ({
            week,
            estimated: Math.round(data.estimated * 10) / 10,
            actual:    Math.round(data.actual * 10) / 10,
          }));
        setWeeklyData(sortedWeeks);

        // Category breakdown
        const catMap = new Map<string, { estimated: number; actual: number }>();
        derivedMilestones.forEach((m) => {
          const cat      = m.category;
          const existing = catMap.get(cat) ?? { estimated: 0, actual: 0 };
          existing.estimated += m.estimated;
          existing.actual    += m.actual;
          catMap.set(cat, existing);
        });
        const unmatchedMinutes = timeEntries
          .filter((e) => {
            const label = (e.taskLabel ?? "").toLowerCase();
            return !tasks.some((t) => t.title.toLowerCase() === label || t.id === label);
          })
          .reduce((sum, e) => sum + e.minutes, 0);
        if (unmatchedMinutes > 0) {
          const gen = catMap.get("General") ?? { estimated: 0, actual: 0 };
          gen.actual += unmatchedMinutes / 60;
          catMap.set("General", gen);
        }
        setCategoryData(
          Array.from(catMap.entries()).map(([name, data]) => ({
            name,
            estimated: Math.round(data.estimated * 10) / 10,
            actual:    Math.round(data.actual * 10) / 10,
          }))
        );
      } catch {
        // keep previous state on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const filtered  = milestones.filter((m) => clientFilter === "all" || m.clientId === clientFilter);
  const sorted    = [...filtered].sort((a, b) => {
    if (sort === "variance") return Math.abs(variance(b.estimated, b.actual)) - Math.abs(variance(a.estimated, a.actual));
    if (sort === "client")   return a.clientId.localeCompare(b.clientId);
    return b.estimated - a.estimated;
  });

  const totalEst  = filtered.reduce((sum, m) => sum + m.estimated, 0);
  const totalAct  = filtered.reduce((sum, m) => sum + m.actual, 0);
  const totalVar  = totalAct - totalEst;
  const accuracy  = totalEst === 0 ? 100 : Math.max(0, Math.round((1 - Math.abs(totalVar) / totalEst) * 100));
  const overCount = filtered.filter((m) => variance(m.estimated, m.actual) > 0).length;
  const underCount = filtered.filter((m) => variance(m.estimated, m.actual) < 0).length;

  const weeklyMax   = weeklyData.length > 0 ? Math.max(...weeklyData.flatMap((r) => [r.estimated, r.actual]), 1) : 1;
  const categoryMax = categoryData.length > 0 ? Math.max(...categoryData.flatMap((r) => [r.estimated, r.actual]), 1) : 1;

  const pointsEstimated = useMemo(() => {
    if (weeklyData.length < 2) return "";
    const xStep = 100 / (weeklyData.length - 1);
    return weeklyData.map((row, index) => `${index * xStep},${100 - (row.estimated / weeklyMax) * 100}`).join(" ");
  }, [weeklyMax]);

  const pointsActual = useMemo(() => {
    if (weeklyData.length < 2) return "";
    const xStep = 100 / (weeklyData.length - 1);
    return weeklyData.map((row, index) => `${index * xStep},${100 - (row.actual / weeklyMax) * 100}`).join(" ");
  }, [weeklyMax]);

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-estimates-vs-actuals">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-estimates-vs-actuals">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Performance</div>
        <h1 className={cx("pageTitleText")}>Estimates vs Actuals</h1>
      </div>

      {/* ── KPI strip ── */}
      <div className={cx("staffKpiStrip", "mb20")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Accuracy</div>
          <div className={cx("staffKpiValue", toneToMetricCls(accuracyToneClass(accuracy)))}>{accuracy}%</div>
          <div className={cx("staffKpiSub")}>estimate quality</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Over budget</div>
          <div className={cx("staffKpiValue", overCount > 0 ? "colorRed" : "colorGreen")}>{overCount}</div>
          <div className={cx("staffKpiSub")}>milestones</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Under budget</div>
          <div className={cx("staffKpiValue", underCount > 0 ? "colorGreen" : "")}>{underCount}</div>
          <div className={cx("staffKpiSub")}>milestones</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Net variance</div>
          <div className={cx("staffKpiValue", toneToMetricCls(varianceToneClass(totalVar)))}>
            {totalVar > 0 ? "+" : ""}{Math.round(totalVar * 10) / 10}h
          </div>
          <div className={cx("staffKpiSub")}>total</div>
        </div>
      </div>

      {/* ── Tab strip + client filter ── */}
      <div className={cx("evaTabsRow", "mb16")}>
        <div className={cx("staffSegControl")}>
          {([
            { key: "milestones" as const, label: "By milestone" },
            { key: "weekly"     as const, label: "Weekly trend" },
            { key: "category"   as const, label: "By category"  },
          ] as const).map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              className={cx("staffSegBtn", tab === tabItem.key && "staffSegBtnActive")}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        <select
          className={cx("staffFilterInput", "evaClientSelect")}
          aria-label="Filter client"
          value={clientFilter}
          onChange={(event) => setClientFilter(event.target.value)}
        >
          <option value="all">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {/* ══ MILESTONES TAB ══ */}
      {tab === "milestones" && (
        <div className={cx("evaLayout")}>
          <div>
            <div className={cx("evaSortRow", "mb12")}>
              <span className={cx("evaSortLabel")}>Sort</span>
              <select
                className={cx("staffFilterInput")}
                aria-label="Sort milestones"
                value={sort}
                onChange={(event) => setSort(event.target.value as "variance" | "estimated" | "client")}
              >
                <option value="variance">Biggest variance</option>
                <option value="estimated">Largest job</option>
                <option value="client">By client</option>
              </select>
            </div>

            {sorted.length === 0 ? (
              <div className={cx("staffEmpty")}>
                <div className={cx("staffEmptyIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
                <div className={cx("staffEmptyTitle")}>No milestone data</div>
                <div className={cx("staffEmptyNote")}>Tracking appears once projects are active.</div>
              </div>
            ) : sorted.map((milestone) => {
              const varianceHours   = variance(milestone.estimated, milestone.actual);
              const variancePercent = variancePct(milestone.estimated, milestone.actual);
              const tone            = varianceToneClass(varianceHours);
              const maxHours        = Math.max(milestone.estimated, milestone.actual);
              const client          = clients.find((entry) => entry.id === milestone.clientId);

              return (
                <div key={milestone.id} className={cx("staffCard", "mb12")}>
                  <div className={cx("staffSectionHd", "evaMilestoneHead")}>
                    <div>
                      <div className={cx("evaMilestoneTitle")}>{milestone.title}</div>
                      <div className={cx("evaMilestoneMeta")}>
                        <span className={cx("evaClientLabel")}>{client?.name ?? "Unknown"}</span>
                        <span className={cx("evaCategory")}>{milestone.category}</span>
                        {milestone.status === "in_progress" && (
                          <span className={cx("staffChip", "staffChipAccent")}>In progress</span>
                        )}
                      </div>
                    </div>
                    <div className={cx("staffMetricBlockSm", toneToMetricCls(tone))}>
                      {varianceHours > 0 ? "+" : ""}{Math.round(varianceHours * 10) / 10}h
                      <span className={cx("evaVariancePct")}>
                        ({variancePercent > 0 ? "+" : ""}{variancePercent}%)
                      </span>
                    </div>
                  </div>

                  <div className={cx("staffListRow", "evaBarRow")}>
                    <span className={cx("evaBarLabel")}>Est</span>
                    <div className={cx("staffBar")}>
                      <div
                        className={cx("staffBarFill", "evaFillMuted")}
                        style={{ "--fill-pct": `${maxHours > 0 ? (milestone.estimated / (maxHours * 1.2)) * 100 : 0}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("evaBarValue")}>{milestone.estimated}h</span>
                  </div>
                  <div className={cx("staffListRow", "evaBarRow")}>
                    <span className={cx("evaBarLabel")}>Act</span>
                    <div className={cx("staffBar")}>
                      <div
                        className={cx("staffBarFill", toneToFillCls(tone))}
                        style={{ "--fill-pct": `${maxHours > 0 ? (milestone.actual / (maxHours * 1.2)) * 100 : 0}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("evaBarValue")}>{milestone.actual}h</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Portfolio summary sidebar */}
          <div className={cx("flexCol", "gap16")}>
            <div className={cx("staffCard")}>
              <div className={cx("staffSectionHd")}>
                <span className={cx("staffSectionTitle")}>Portfolio summary</span>
              </div>
              {[
                { label: "Total estimated", value: `${totalEst}h`,         tone: "evaToneMuted" },
                { label: "Total actual",    value: `${Math.round(totalAct * 10) / 10}h`, tone: "evaToneMuted" },
                { label: "Net variance",    value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`, tone: varianceToneClass(totalVar) },
                { label: "Accuracy",        value: `${accuracy}%`,          tone: accuracyToneClass(accuracy) },
              ].map((row) => (
                <div key={row.label} className={cx("staffListRow", "evaSummaryRow")}>
                  <span className={cx("evaSummaryLabel")}>{row.label}</span>
                  <span className={cx("staffMetricBlockSm", toneToMetricCls(row.tone))}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className={cx("staffCard")}>
              <div className={cx("staffSectionHd")}>
                <span className={cx("staffSectionTitle")}>By client</span>
              </div>
              {clients
                .filter((client) => filtered.some((m) => m.clientId === client.id))
                .map((client) => {
                  const clientMilestones = filtered.filter((m) => m.clientId === client.id);
                  const clientEst  = clientMilestones.reduce((s, m) => s + m.estimated, 0);
                  const clientAct  = clientMilestones.reduce((s, m) => s + m.actual, 0);
                  const clientVar  = clientAct - clientEst;
                  const ratio      = clientEst > 0 ? Math.min((clientAct / clientEst) * 100, 100) : 0;
                  const tone       = varianceToneClass(clientVar);

                  return (
                    <div key={client.id} className={cx("staffListRow", "evaClientRow")}>
                      <span className={cx("evaClientName")}>{client.name.split(" ")[0]}</span>
                      <div className={cx("staffBar", "evaClientBar")}>
                        <div
                          className={cx("staffBarFill", toneToFillCls(tone))}
                          style={{ "--fill-pct": `${ratio}%` } as React.CSSProperties}
                        />
                      </div>
                      <span className={cx("staffMetricBlockSm", toneToMetricCls(tone))}>
                        {clientVar > 0 ? "+" : ""}{Math.round(clientVar * 10) / 10}h
                      </span>
                    </div>
                  );
                })}
              {filtered.length === 0 && (
                <div className={cx("staffEmpty")}>
                  <div className={cx("staffEmptyTitle")}>No estimate data yet</div>
                  <div className={cx("staffEmptyNote")}>Log time against tasks to see estimates vs actuals.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ WEEKLY TAB ══ */}
      {tab === "weekly" && (
        <div className={cx("staffCard", "evaWeeklyCard")}>
          <div className={cx("staffSectionHd")}>
            <span className={cx("staffSectionTitle")}>Weekly trend</span>
            <span className={cx("staffChip")}>last 7 weeks</span>
          </div>
          {weeklyData.length === 0 ? (
            <div className={cx("staffEmpty")}>
              <div className={cx("staffEmptyIcon")}><Ic n="trending-up" sz={22} c="var(--muted2)" /></div>
              <div className={cx("staffEmptyTitle")}>No weekly data yet</div>
              <div className={cx("staffEmptyNote")}>Weekly trend data will appear once time entries are logged.</div>
            </div>
          ) : (
            <>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cx("evaWeeklySvg")}>
                <polyline fill="none" stroke="color-mix(in srgb, var(--text) 20%, transparent)" strokeWidth="1.8" points={pointsEstimated} />
                <polyline fill="none" stroke="var(--accent)" strokeWidth="1.8" points={pointsActual} />
                {weeklyData.map((row, index) => {
                  const xStep = 100 / (weeklyData.length - 1);
                  const x = index * xStep;
                  const y = 100 - (row.actual / weeklyMax) * 100;
                  return <circle key={row.week} cx={x} cy={y} r="1.5" fill="var(--accent)" />;
                })}
              </svg>
              <div className={cx("evaWeekLabels")}>
                {weeklyData.map((row) => (
                  <div key={row.week} className={cx("evaWeekLabel")}>{row.week}</div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ CATEGORY TAB ══ */}
      {tab === "category" && (
        <div className={cx("staffCard")}>
          <div className={cx("staffSectionHd")}>
            <span className={cx("staffSectionTitle")}>By category</span>
            <span className={cx("staffChip")}>all time</span>
          </div>
          {categoryData.length === 0 ? (
            <div className={cx("staffEmpty")}>
              <div className={cx("staffEmptyIcon")}><Ic n="pie-chart" sz={22} c="var(--muted2)" /></div>
              <div className={cx("staffEmptyTitle")}>No category data yet</div>
              <div className={cx("staffEmptyNote")}>Category breakdown will appear once time entries are categorised.</div>
            </div>
          ) : (
            categoryData.map((category) => {
              const varianceHours   = category.actual - category.estimated;
              const variancePercent = variancePct(category.estimated, category.actual);
              const tone            = varianceToneClass(varianceHours);

              return (
                <div key={category.name} className={cx("staffListRow", "evaCategoryRow")}>
                  <span className={cx("evaCategoryName")}>{category.name}</span>
                  <div className={cx("evaCategoryBars")}>
                    <div className={cx("evaMiniBarsRow")}>
                      <span className={cx("evaMiniLabel")}>Est</span>
                      <div className={cx("staffBar")}>
                        <div
                          className={cx("staffBarFill", "evaFillMuted")}
                          style={{ "--fill-pct": `${categoryMax > 0 ? (category.estimated / categoryMax) * 100 : 0}%` } as React.CSSProperties}
                        />
                      </div>
                      <span className={cx("evaMiniVal")}>{category.estimated}h</span>
                    </div>
                    <div className={cx("evaMiniBarsRow")}>
                      <span className={cx("evaMiniLabel")}>Act</span>
                      <div className={cx("staffBar")}>
                        <div
                          className={cx("staffBarFill", toneToFillCls(tone))}
                          style={{ "--fill-pct": `${categoryMax > 0 ? (category.actual / categoryMax) * 100 : 0}%` } as React.CSSProperties}
                        />
                      </div>
                      <span className={cx("evaMiniVal")}>{category.actual}h</span>
                    </div>
                  </div>
                  <div className={cx("staffMetricBlockSm", toneToMetricCls(tone))}>
                    {varianceHours > 0 ? "+" : ""}{Math.round(varianceHours * 10) / 10}h
                    <span className={cx("evaVariancePct")}>({variancePercent > 0 ? "+" : ""}{variancePercent}%)</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
