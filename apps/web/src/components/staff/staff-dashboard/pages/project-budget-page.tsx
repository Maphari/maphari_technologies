"use client";

import { cx } from "../style";

const budgetItems = [
  { project: "Brand Identity System", client: "Volta Studios", budget: 28000, spent: 17325, tasks: 12, completedTasks: 8 },
  { project: "Q1 Campaign Strategy", client: "Kestrel Capital", budget: 21000, spent: 20475, tasks: 9, completedTasks: 8 },
  { project: "Website Redesign", client: "Mira Health", budget: 35000, spent: 21350, tasks: 14, completedTasks: 7 },
  { project: "Editorial Design System", client: "Dune Collective", budget: 17500, spent: 19600, tasks: 8, completedTasks: 8 },
  { project: "Annual Report 2025", client: "Okafor & Sons", budget: 14000, spent: 4725, tasks: 6, completedTasks: 2 },
];

function healthTone(pct: number) {
  if (pct >= 100) return "colorRed";
  if (pct >= 80) return "colorAmber";
  return "colorGreen";
}

function progressFillTone(pct: number) {
  if (pct >= 100) return "progressFillRed";
  if (pct >= 80) return "progressFillAmber";
  return "progressFillGreen";
}

export function ProjectBudgetPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-budget">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Project Budget</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Budget vs. actuals for your assigned projects</p>
      </div>

      <div className={cx("flexCol", "gap16")}>
        {budgetItems.map((item) => {
          const spentPct = Math.round((item.spent / item.budget) * 100);
          const remaining = item.budget - item.spent;
          const taskPct = Math.round((item.completedTasks / item.tasks) * 100);

          return (
            <div key={item.project} className={cx("card", "cardBody")}>
              <div className={cx("flexBetween", "mb12")}>
                <div>
                  <div className={cx("fw700", "text14")}>{item.project}</div>
                  <div className={cx("text11", "colorMuted")}>{item.client}</div>
                </div>
                <div className={cx("textRight")}>
                  <div className={cx("fontMono", "fw700", "text14", healthTone(spentPct))}>
                    R{item.spent.toLocaleString()} <span className={cx("colorMuted2", "fw400")}>/ R{item.budget.toLocaleString()}</span>
                  </div>
                  <div className={cx("text11", remaining < 0 ? "colorRed" : "colorGreen")}>
                    {remaining < 0 ? `R${Math.abs(remaining).toLocaleString()} over budget` : `R${remaining.toLocaleString()} remaining`}
                  </div>
                </div>
              </div>

              <div className={cx("mb8")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Budget Burn</span>
                  <span className={cx("text10", "fontMono", healthTone(spentPct))}>{spentPct}%</span>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("progressFill", progressFillTone(spentPct))} style={{ width: `${Math.min(spentPct, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Task Progress</span>
                  <span className={cx("text10", "fontMono", "colorAccent")}>{item.completedTasks}/{item.tasks} ({taskPct}%)</span>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("progressFill", "progressFillGreen")} style={{ width: `${taskPct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
