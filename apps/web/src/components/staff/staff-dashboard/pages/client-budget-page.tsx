"use client";

import { cx } from "../style";

const clientBudgets = [
  { client: "Volta Studios", avatar: "VS", totalBudget: 84000, totalSpent: 52000, projects: 3, activeProjects: 2, retainerHours: 80, hoursUsed: 49.5, healthScore: 88 },
  { client: "Kestrel Capital", avatar: "KC", totalBudget: 63000, totalSpent: 58500, projects: 3, activeProjects: 1, retainerHours: 60, hoursUsed: 58.5, healthScore: 42 },
  { client: "Mira Health", avatar: "MH", totalBudget: 105000, totalSpent: 61000, projects: 2, activeProjects: 2, retainerHours: 100, hoursUsed: 61, healthScore: 72 },
  { client: "Dune Collective", avatar: "DC", totalBudget: 52500, totalSpent: 56000, projects: 2, activeProjects: 1, retainerHours: 50, hoursUsed: 56, healthScore: 31 },
  { client: "Okafor & Sons", avatar: "OS", totalBudget: 42000, totalSpent: 13500, projects: 1, activeProjects: 1, retainerHours: 40, hoursUsed: 13.5, healthScore: 95 },
];

function healthBadge(score: number) {
  if (score >= 80) return { label: "Healthy", tone: "badgeGreen" as const };
  if (score >= 60) return { label: "Moderate", tone: "badgeAmber" as const };
  return { label: "At Risk", tone: "badgeRed" as const };
}

export function ClientBudgetPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-budget">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Client Budget Awareness</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Budget health indicators for assigned clients</p>
      </div>

      <div className={cx("flexCol", "gap16")}>
        {clientBudgets.map((client) => {
          const spentPct = Math.round((client.totalSpent / client.totalBudget) * 100);
          const hoursPct = Math.round((client.hoursUsed / client.retainerHours) * 100);
          const remaining = client.totalBudget - client.totalSpent;
          const badge = healthBadge(client.healthScore);

          return (
            <div key={client.client} className={cx("card", "cardBody")}>
              <div className={cx("flexBetween", "mb16")}>
                <div className={cx("flex", "gap12", "alignCenter")}>
                  <div className={cx("profileCircle", "profileCircleSm")}>{client.avatar}</div>
                  <div>
                    <div className={cx("fw700", "text14")}>{client.client}</div>
                    <div className={cx("text11", "colorMuted")}>{client.activeProjects} active of {client.projects} projects</div>
                  </div>
                </div>
                <span className={cx("badge", badge.tone)}>{badge.label}</span>
              </div>

              <div className={cx("stats", "stats4", "mb12")}>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Total Budget</div>
                  <div className={cx("fontMono", "fw700", "text12")}>R{client.totalBudget.toLocaleString()}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Spent</div>
                  <div className={cx("fontMono", "fw700", "text12", spentPct >= 100 ? "colorRed" : "colorAccent")}>R{client.totalSpent.toLocaleString()}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Remaining</div>
                  <div className={cx("fontMono", "fw700", "text12", remaining < 0 ? "colorRed" : "colorGreen")}>
                    {remaining < 0 ? `-R${Math.abs(remaining).toLocaleString()}` : `R${remaining.toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Hours Burned</div>
                  <div className={cx("fontMono", "fw700", "text12", hoursPct >= 90 ? "colorRed" : hoursPct >= 70 ? "colorAmber" : "colorAccent")}>
                    {client.hoursUsed}h / {client.retainerHours}h
                  </div>
                </div>
              </div>

              <div className={cx("progressTrack")}>
                <div
                  className={cx("progressFill", spentPct >= 100 ? "progressFillRed" : spentPct >= 80 ? "progressFillAmber" : "progressFillGreen")}
                  style={{ width: `${Math.min(spentPct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
