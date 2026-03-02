"use client";

import { cx, styles } from "../style";

const retainers = [
  { project: "Brand Identity System", totalHours: 80, usedHours: 52, period: "Feb 2026", ratePerHour: "R350", burnRate: "6.5h/week", projected: "On Track" as const },
  { project: "Website Support", totalHours: 20, usedHours: 18, period: "Feb 2026", ratePerHour: "R400", burnRate: "4.5h/week", projected: "At Risk" as const },
];

export function RetainerUsagePage() {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Finance</div>
          <h1 className={cx("pageTitle")}>Retainer Usage</h1>
          <p className={cx("pageSub")}>Track retainer hours used, remaining, and projected burn rate for your agreements.</p>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {retainers.map((r) => {
          const pct = Math.round((r.usedHours / r.totalHours) * 100);
          return (
            <div key={r.project} className={cx("card", "p20")}>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb8")}>{r.project}</div>
              <div className={cx("flexBetween", "mb6")}>
                <span className={cx("fontDisplay", "fw800", "text20")} style={{ color: pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--amber)" : "var(--accent)" }}>{r.usedHours}h / {r.totalHours}h</span>
                <span className={cx("badge", r.projected === "On Track" ? "badgeGreen" : "badgeRed")}>{r.projected}</span>
              </div>
              <progress max={100} value={pct} style={{ width: "100%", height: "6px", accentColor: pct >= 90 ? "var(--red)" : "var(--accent)" }} />
              <div className={cx("flex", "gap16", "mt8", "text11", "colorMuted")}>
                <span>Burn: {r.burnRate}</span>
                <span>Rate: {r.ratePerHour}/h</span>
                <span>Period: {r.period}</span>
                <span>Remaining: {r.totalHours - r.usedHours}h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
