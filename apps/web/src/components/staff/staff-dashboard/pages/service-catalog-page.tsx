"use client";

import { cx } from "../style";

const services = [
  { name: "Brand Identity Design", category: "Design", startingPrice: "R35,000", timeline: "6-8 weeks", description: "Logo, visual language, guidelines, and asset delivery" },
  { name: "Website Design & Development", category: "Digital", startingPrice: "R80,000", timeline: "8-12 weeks", description: "Full responsive website with CMS integration" },
  { name: "Campaign Strategy", category: "Strategy", startingPrice: "R25,000", timeline: "4-6 weeks", description: "Audience research, messaging, content plan, and creative direction" },
  { name: "Design System", category: "Design", startingPrice: "R45,000", timeline: "6-10 weeks", description: "Component library, tokens, documentation, and governance" },
  { name: "Annual Report Design", category: "Print", startingPrice: "R30,000", timeline: "4-6 weeks", description: "Data viz, layout, photography direction, and print-ready files" },
  { name: "Social Media Management", category: "Digital", startingPrice: "R12,000/month", timeline: "Ongoing", description: "Content creation, scheduling, community management, and reporting" },
  { name: "UX Audit & Research", category: "Strategy", startingPrice: "R18,000", timeline: "2-3 weeks", description: "Heuristic evaluation, user testing, and improvement roadmap" },
  { name: "Motion & Animation", category: "Design", startingPrice: "R15,000", timeline: "2-4 weeks", description: "Explainer videos, UI animations, and brand motion language" },
];

export function ServiceCatalogPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-service-catalog">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Service Catalog</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Client-facing service offerings reference (read-only)</p>
      </div>

      <div className={cx("flexCol", "gap12")}>
        {services.map((s) => (
          <div key={s.name} className={cx("card", "cardBody")}>
            <div className={cx("flexBetween", "mb8")}>
              <div>
                <div className={cx("fw700", "text14")}>{s.name}</div>
                <div className={cx("text11", "colorMuted")}>{s.description}</div>
              </div>
              <span className={cx("badge")}>{s.category}</span>
            </div>
            <div className={cx("flex", "gap16", "text11")}>
              <span><span className={cx("colorMuted2")}>From </span><span className={cx("fontMono", "fw600", "colorAccent")}>{s.startingPrice}</span></span>
              <span><span className={cx("colorMuted2")}>Timeline: </span><span className={cx("fw600")}>{s.timeline}</span></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
