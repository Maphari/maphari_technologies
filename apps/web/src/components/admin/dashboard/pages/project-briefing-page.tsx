"use client";

import { cx, styles } from "../style";

const projects = [
  { name: "Brand Identity System", client: "Volta Studios", pm: "Fatima Al-Rashid", phase: "Phase 2 – Guidelines", health: 85, budget: "R112K / R150K (75%)", team: ["Thabo", "Lerato"], keyRisk: "Print vendor colour matching", nextMilestone: "Guidelines v3 Delivery — Mar 15" },
  { name: "Q1 Campaign Strategy", client: "Kestrel Capital", pm: "Kira Bosman", phase: "Execution", health: 45, budget: "R42K / R63K (67%)", team: ["Kira", "Tapiwa"], keyRisk: "Content calendar slippage", nextMilestone: "Campaign Launch — Feb 28" },
  { name: "Website Redesign", client: "Mira Health", pm: "Fatima Al-Rashid", phase: "UX Design", health: 78, budget: "R28K / R80K (35%)", team: ["James", "Lerato"], keyRisk: "Accessibility compliance", nextMilestone: "Wireframe Sign-off — Mar 7" },
];

export function ProjectBriefingPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Project Briefing</h1>
          <div className={styles.pageSub}>One-page context view per project for quick executive review</div>
        </div>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {projects.map((p) => (
          <article key={p.name} className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>{p.name} <span className={cx("text11", "colorMuted", "fw400")}>· {p.client}</span></span>
              <span className={cx("fontMono", "fw700", p.health >= 70 ? "colorGreen" : p.health >= 50 ? "colorAmber" : "colorRed")}>{p.health}%</span>
            </div>
            <div className={styles.cardInner}>
              <div className={cx("grid3", "gap16", "mb12")}>
                <div><div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Phase</div><div className={cx("text12")}>{p.phase}</div></div>
                <div><div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>PM</div><div className={cx("text12")}>{p.pm}</div></div>
                <div><div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Budget</div><div className={cx("text12", "fontMono")}>{p.budget}</div></div>
              </div>
              <div className={cx("grid3", "gap16")}>
                <div><div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Team</div><div className={cx("text12")}>{p.team.join(", ")}</div></div>
                <div><div className={cx("text10", "uppercase", "tracking", "colorRed", "fw700", "mb4")}>Key Risk</div><div className={cx("text12")}>{p.keyRisk}</div></div>
                <div><div className={cx("text10", "uppercase", "tracking", "colorAccent", "fw700", "mb4")}>Next Milestone</div><div className={cx("text12")}>{p.nextMilestone}</div></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
