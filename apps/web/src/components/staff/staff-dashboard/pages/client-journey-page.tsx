"use client";

import { cx } from "../style";

const journeys = [
  { client: "Volta Studios", avatar: "VS", stage: "Active", since: "Aug 2024", projects: 4, totalRevenue: "R336,000", nps: 9, milestones: ["Onboarded", "First Project", "Retainer Signed", "Year 1 Renewal"] },
  { client: "Kestrel Capital", avatar: "KC", stage: "At Risk", since: "Jan 2026", projects: 1, totalRevenue: "R63,000", nps: 5, milestones: ["Onboarded", "First Project"] },
  { client: "Mira Health", avatar: "MH", stage: "Growing", since: "Nov 2025", projects: 2, totalRevenue: "R105,000", nps: 8, milestones: ["Onboarded", "First Project", "Retainer Signed"] },
  { client: "Dune Collective", avatar: "DC", stage: "Offboarding", since: "Sep 2025", projects: 2, totalRevenue: "R52,500", nps: 4, milestones: ["Onboarded", "First Project", "Project Complete"] },
  { client: "Okafor & Sons", avatar: "OS", stage: "Active", since: "Feb 2026", projects: 1, totalRevenue: "R42,000", nps: 10, milestones: ["Onboarded", "First Project"] },
];

function stageTone(s: string) { if (s === "Active" || s === "Growing") return "badgeGreen"; if (s === "At Risk") return "badgeRed"; if (s === "Offboarding") return "badgeAmber"; return "badge"; }

export function ClientJourneyPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-journey">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Client Journey</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Lifecycle stage visualization per client</p>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {journeys.map((j) => (
          <div key={j.client} className={cx("card", "cardBody")}>
            <div className={cx("flexBetween", "mb12")}>
              <div className={cx("flex", "gap12", "alignCenter")}>
                <div className={cx("profileCircle", "profileCircleSm")}>{j.avatar}</div>
                <div>
                  <div className={cx("fw700", "text14")}>{j.client}</div>
                  <div className={cx("text11", "colorMuted")}>Since {j.since} · {j.projects} projects · NPS: {j.nps}</div>
                </div>
              </div>
              <span className={cx("badge", stageTone(j.stage))}>{j.stage}</span>
            </div>
            <div className={cx("flex", "gap8", "flexWrap")}>
              {j.milestones.map((m, i) => (
                <div key={m} className={cx("flex", "gap4", "alignCenter")}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                  <span className={cx("text10", "colorMuted")}>{m}</span>
                  {i < j.milestones.length - 1 && <span className={cx("text10", "colorMuted2")}>→</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
