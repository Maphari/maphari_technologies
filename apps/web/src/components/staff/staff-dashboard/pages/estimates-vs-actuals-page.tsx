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

export function EstimatesVsActualsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ week: string; estimated: number; actual: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; estimated: number; actual: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [tab, setTab] = useState<"milestones" | "weekly" | "category">("milestones");
  const [sort, setSort] = useState<"variance" | "client" | "estimated">("variance");

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
      const [tasksR, timeR, projectsR] = await Promise.all([
        getMyTasks(session),
        getMyTimeEntries(session),
        getStaffProjects(session),
      ]);
      if (cancelled) return;
      if (tasksR.nextSession) saveSession(tasksR.nextSession);
      if (timeR.nextSession) saveSession(timeR.nextSession);
      if (projectsR.nextSession) saveSession(projectsR.nextSession);

      const tasks: StaffTask[] = tasksR.data ?? [];
      const timeEntries: StaffTimeEntry[] = timeR.data ?? [];
      const projects: StaffProject[] = projectsR.data ?? [];

      // Build lookup maps
      const projectMap = new Map<string, StaffProject>();
      projects.forEach((p) => projectMap.set(p.id, p));

      // Accumulate actual minutes per task (by taskLabel matching task title)
      const actualMinutesByProject = new Map<string, number>();
      timeEntries.forEach((entry) => {
        actualMinutesByProject.set(entry.projectId, (actualMinutesByProject.get(entry.projectId) ?? 0) + entry.minutes);
      });

      // Build per-task actual minutes by matching taskLabel to task title
      const actualMinutesByTask = new Map<string, number>();
      timeEntries.forEach((entry) => {
        const label = (entry.taskLabel ?? "").toLowerCase();
        // Try to match to a task
        const matchedTask = tasks.find((t) => t.title.toLowerCase() === label || t.id === label);
        if (matchedTask) {
          actualMinutesByTask.set(matchedTask.id, (actualMinutesByTask.get(matchedTask.id) ?? 0) + entry.minutes);
        }
      });

      // Build milestones from tasks that have estimates
      const derivedMilestones: Milestone[] = tasks
        .filter((t) => t.estimateMinutes && t.estimateMinutes > 0)
        .map((t) => {
          const project = projectMap.get(t.projectId);
          const estimatedHours = (t.estimateMinutes ?? 0) / 60;
          const actualHours = (actualMinutesByTask.get(t.id) ?? 0) / 60;
          return {
            id: t.id,
            clientId: project?.clientId ?? "",
            title: t.title,
            category: "Admin" as MilestoneCategory,
            estimated: Math.round(estimatedHours * 10) / 10,
            actual: Math.round(actualHours * 10) / 10,
            status: (t.status === "DONE" ? "delivered" : "in_progress") as MilestoneStatus,
          };
        });
      setMilestones(derivedMilestones);

      // Build weekly trend data from time entries
      const weekMap = new Map<string, { estimated: number; actual: number }>();
      timeEntries.forEach((entry) => {
        const d = new Date(entry.loggedAt);
        // ISO week label
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay() + 1);
        const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        const existing = weekMap.get(label) ?? { estimated: 0, actual: 0 };
        existing.actual += entry.minutes / 60;
        weekMap.set(label, existing);
      });
      // Add estimated from tasks with due dates in each week
      tasks.forEach((t) => {
        if (!t.dueAt || !t.estimateMinutes) return;
        const d = new Date(t.dueAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay() + 1);
        const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
          actual: Math.round(data.actual * 10) / 10,
        }));
      setWeeklyData(sortedWeeks);

      // Build category breakdown (using task category or project-based grouping)
      const catMap = new Map<string, { estimated: number; actual: number }>();
      derivedMilestones.forEach((m) => {
        const cat = m.category;
        const existing = catMap.get(cat) ?? { estimated: 0, actual: 0 };
        existing.estimated += m.estimated;
        existing.actual += m.actual;
        catMap.set(cat, existing);
      });
      // Also add un-matched time entries as "General"
      const matchedTaskIds = new Set(actualMinutesByTask.keys());
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
          actual: Math.round(data.actual * 10) / 10,
        }))
      );

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const filtered = milestones.filter((milestone) => clientFilter === "all" || milestone.clientId === clientFilter);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "variance") return Math.abs(variance(b.estimated, b.actual)) - Math.abs(variance(a.estimated, a.actual));
    if (sort === "client") return a.clientId.localeCompare(b.clientId);
    return b.estimated - a.estimated;
  });

  const totalEst = filtered.reduce((sum, milestone) => sum + milestone.estimated, 0);
  const totalAct = filtered.reduce((sum, milestone) => sum + milestone.actual, 0);
  const totalVar = totalAct - totalEst;
  const accuracy = totalEst === 0 ? 100 : Math.max(0, Math.round((1 - Math.abs(totalVar) / totalEst) * 100));
  const overCount = filtered.filter((milestone) => variance(milestone.estimated, milestone.actual) > 0).length;
  const underCount = filtered.filter((milestone) => variance(milestone.estimated, milestone.actual) < 0).length;

  const weeklyMax = weeklyData.length > 0 ? Math.max(...weeklyData.flatMap((row) => [row.estimated, row.actual]), 1) : 1;
  const categoryMax = categoryData.length > 0 ? Math.max(...categoryData.flatMap((row) => [row.estimated, row.actual]), 1) : 1;

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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-estimates-vs-actuals">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "evaHeaderTop")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Performance</div>
            <h1 className={cx("pageTitleText")}>Estimates vs Actuals</h1>
          </div>

          <div className={cx("evaTopStats")}>
            {[
              { label: "Accuracy", value: `${accuracy}%`, toneClass: accuracyToneClass(accuracy) },
              { label: "Over budget", value: overCount, toneClass: overCount > 0 ? "evaToneBad" : "evaToneMuted" },
              { label: "Under budget", value: underCount, toneClass: underCount > 0 ? "evaToneGood" : "evaToneMuted" },
              {
                label: "Total variance",
                value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`,
                toneClass: varianceToneClass(totalVar)
              }
            ].map((stat) => (
              <div key={stat.label} className={cx("snStatCard")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("flexBetween", "evaTabsRow")}>
          <div className={cx("flexRow", "evaTabStrip")}>
            {[
              { key: "milestones" as const, label: "By milestone" },
              { key: "weekly" as const, label: "Weekly trend" },
              { key: "category" as const, label: "By category" }
            ].map((tabItem) => (
              <button
                key={tabItem.key}
                type="button"
                className={cx("evaTabBtn", tab === tabItem.key && "evaTabBtnActive")}
                onClick={() => setTab(tabItem.key)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          <div className={cx("evaClientFilters", "filterRow")}>
            <select
              className={cx("filterSelect")}
              aria-label="Filter client"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
            >
              <option value="all">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cx("evaContent")}>
        {tab === "milestones" ? (
          <div className={cx("evaLayout")}>
            <div>
              <div className={cx("evaSortRow")}>
                <span className={cx("evaSortLabel")}>Sort</span>
                <select
                  className={cx("filterSelect")}
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
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No milestone data</div>
                  <div className={cx("emptyStateSub")}>Tracking appears once projects are active.</div>
                </div>
              ) : sorted.map((milestone) => {
                const varianceHours = variance(milestone.estimated, milestone.actual);
                const variancePercent = variancePct(milestone.estimated, milestone.actual);
                const toneClass = varianceToneClass(varianceHours);
                const maxHours = Math.max(milestone.estimated, milestone.actual);
                const client = clients.find((entry) => entry.id === milestone.clientId);

                return (
                  <div key={milestone.id} className={cx("cardSurface", "mb14")}>
                    <div className={cx("flexBetween", "mb10", "evaMilestoneHead")}>
                      <div>
                        <div className={cx("text13", "colorText", "mb4")}>{milestone.title}</div>
                        <div className={cx("evaMilestoneMeta")}>
                          <span className={cx("text10", "evaClientLabel")} data-client-id={milestone.clientId}>
                            {client?.name ?? "Unknown"}
                          </span>
                          <span className={cx("text10", "colorMuted2")}>{milestone.category}</span>
                          {milestone.status === "in_progress" ? <span className={cx("evaStatusChip")}>In progress</span> : null}
                        </div>
                      </div>

                      <div className={cx("textRight")}>
                        <div className={cx("text14", "fw600", toneClass)}>
                          {varianceHours > 0 ? "+" : ""}
                          {Math.round(varianceHours * 10) / 10}h
                        </div>
                        <div className={cx("text10", toneClass)}>
                          {variancePercent > 0 ? "+" : ""}
                          {variancePercent}%
                        </div>
                      </div>
                    </div>

                    <div className={cx("flexCol", "gap6")}>
                      {[
                        { label: "Est", value: milestone.estimated, toneClass: "evaHoursProgressEstimated" },
                        { label: "Act", value: milestone.actual, toneClass }
                      ].map((bar) => (
                        <div key={bar.label} className={cx("evaHoursRow")}>
                          <span className={cx("text10", "colorMuted2", "noShrink", "evaHoursLabel")}>{bar.label}</span>
                          <progress className={cx("evaHoursProgress", bar.toneClass)} max={maxHours * 1.2} value={bar.value} />
                          <span className={cx("text10", "colorMuted", "noShrink", "textRight", "evaHoursValue")}>{bar.value}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("flexCol", "gap16")}>
              <div className={cx("cardSurface")}>
                <div className={cx("sectionLabel", "mb12")}>Portfolio summary</div>
                {[
                  { label: "Total estimated", value: `${totalEst}h`, toneClass: "evaToneMuted" },
                  { label: "Total actual", value: `${Math.round(totalAct * 10) / 10}h`, toneClass: "evaToneMuted" },
                  {
                    label: "Net variance",
                    value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`,
                    toneClass: varianceToneClass(totalVar)
                  },
                  { label: "Estimate accuracy", value: `${accuracy}%`, toneClass: accuracyToneClass(accuracy) }
                ].map((row) => (
                  <div key={row.label} className={cx("dividerRow")}>
                    <span className={cx("text11", "colorMuted2")}>{row.label}</span>
                    <span className={cx("text12", "fw600", row.toneClass)}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className={cx("cardSurface")}>
                <div className={cx("sectionLabel", "mb12")}>By client</div>
                {clients
                  .filter((client) => filtered.some((milestone) => milestone.clientId === client.id))
                  .map((client) => {
                    const clientMilestones = filtered.filter((milestone) => milestone.clientId === client.id);
                    const clientEst = clientMilestones.reduce((sum, milestone) => sum + milestone.estimated, 0);
                    const clientAct = clientMilestones.reduce((sum, milestone) => sum + milestone.actual, 0);
                    const clientVar = clientAct - clientEst;
                    const ratio = clientEst > 0 ? Math.min((clientAct / clientEst) * 100, 150) : 0;
                    const toneClass = varianceToneClass(clientVar);

                    return (
                      <div key={client.id} className={cx("evaClientSummaryRow")}>
                        <span className={cx("text10", "noShrink", "evaClientLabel", "evaClientLabelShort")} data-client-id={client.id}>
                          {client.name.split(" ")[0]}
                        </span>
                        <progress className={cx("evaClientProgress", toneClass)} max={150} value={ratio} />
                        <span className={cx("text10", "noShrink", "textRight", "evaClientDelta", toneClass)}>
                          {clientVar > 0 ? "+" : ""}
                          {Math.round(clientVar * 10) / 10}h
                        </span>
                      </div>
                    );
                  })}
                {filtered.length === 0 && (
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
                    <div className={cx("emptyStateTitle")}>No estimate data yet</div>
                    <div className={cx("emptyStateSub")}>Log time against tasks to see estimates vs actuals.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "weekly" ? (
          <div className={cx("evaWeeklyChart")}>
            <div className={cx("text12", "colorMuted2", "mb20")}>Estimated vs actual hours logged per week - last 7 weeks</div>
            {weeklyData.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="trending-up" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No weekly data yet</div>
                <div className={cx("emptyStateSub")}>Weekly trend data will appear once time entries are logged.</div>
              </div>
            ) : (
              <>
                <div className={cx("cardSurface", "p16", "evaWeeklyCard")}>
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
                </div>
                <div className={cx("evaWeekLabels")}>
                  {weeklyData.map((row) => (
                    <div key={row.week} className={cx("text10", "colorMuted2", "textCenter", "evaWeekLabel")}>
                      {row.week}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === "category" ? (
          <div className={cx("evaCategoryView")}>
            <div className={cx("text12", "colorMuted2", "mb20")}>Estimated vs actual hours by work category - all time</div>
            {categoryData.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="pie-chart" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No category data yet</div>
                <div className={cx("emptyStateSub")}>Category breakdown will appear once time entries are categorised.</div>
              </div>
            ) : (
              <div className={cx("flexCol", "gap10")}>
                {categoryData.map((category) => {
                  const varianceHours = category.actual - category.estimated;
                  const variancePercent = variancePct(category.estimated, category.actual);
                  const toneClass = varianceToneClass(varianceHours);

                  return (
                    <div key={category.name} className={cx("cardSurface")}>
                      <div className={cx("flexRow", "gap14", "mb8", "evaCategoryTop")}>
                        <span className={cx("text12", "colorText", "evaCategoryName")}>{category.name}</span>
                        <span className={cx("text11", "colorMuted2")}>Est {category.estimated}h</span>
                        <span className={cx("text11", "colorMuted2")}>Act {category.actual}h</span>
                        <span className={cx("text12", "fw600", "evaMlAuto", toneClass)}>
                          {varianceHours > 0 ? "+" : ""}
                          {Math.round(varianceHours * 10) / 10}h ({variancePercent > 0 ? "+" : ""}
                          {variancePercent}%)
                        </span>
                      </div>

                      <div className={cx("flexRow", "gap10")}>
                        <div className={cx("flex1")}>
                          <div className={cx("text10", "colorMuted2", "mb4", "evaMiniLabel")}>Estimated</div>
                          <progress className={cx("evaCategoryProgress", "evaHoursProgressEstimated")} max={categoryMax} value={category.estimated} />
                        </div>
                        <div className={cx("flex1")}>
                          <div className={cx("text10", "colorMuted2", "mb4", "evaMiniLabel")}>Actual</div>
                          <progress className={cx("evaCategoryProgress", toneClass)} max={categoryMax} value={category.actual} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
