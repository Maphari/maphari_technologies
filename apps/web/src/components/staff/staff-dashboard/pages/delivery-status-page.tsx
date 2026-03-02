"use client";

import { cx } from "../style";

const deliveryItems = [
  { project: "Brand Identity System", client: "Volta Studios", phase: "Phase 2 – Guidelines", readiness: 72, blockers: 0, launchDate: "Mar 15, 2026", status: "On Track" as const },
  { project: "Q1 Campaign Strategy", client: "Kestrel Capital", phase: "Execution", readiness: 45, blockers: 2, launchDate: "Feb 28, 2026", status: "At Risk" as const },
  { project: "Website Redesign", client: "Mira Health", phase: "UX Design", readiness: 38, blockers: 0, launchDate: "Apr 30, 2026", status: "On Track" as const },
  { project: "Annual Report 2025", client: "Okafor & Sons", phase: "Data Collection", readiness: 25, blockers: 1, launchDate: "May 20, 2026", status: "Minor Delay" as const },
];

function statusTone(s: string) { if (s === "On Track") return "badgeGreen"; if (s === "At Risk") return "badgeRed"; return "badgeAmber"; }

export function DeliveryStatusPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-delivery-status">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Delivery Status</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Launch readiness view for active projects</p>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {deliveryItems.map((d) => (
          <div key={d.project} className={cx("card", "cardBody")}>
            <div className={cx("flexBetween", "mb12")}>
              <div>
                <div className={cx("fw700", "text14")}>{d.project}</div>
                <div className={cx("text11", "colorMuted")}>{d.client} · {d.phase}</div>
              </div>
              <span className={cx("badge", statusTone(d.status))}>{d.status}</span>
            </div>
            <div className={cx("mb8")}>
              <div className={cx("flexBetween", "mb4")}>
                <span className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Launch Readiness</span>
                <span className={cx("fontMono", "text10", "colorAccent")}>{d.readiness}%</span>
              </div>
              <div className={cx("progressTrack")}>
                <div className={cx("progressFill", d.readiness >= 60 ? "progressFillGreen" : "progressFillAmber")} style={{ width: `${d.readiness}%` }} />
              </div>
            </div>
            <div className={cx("flex", "gap16", "text11")}>
              <span><span className={cx("colorMuted2")}>Launch: </span><span className={cx("fw600")}>{d.launchDate}</span></span>
              <span><span className={cx("colorMuted2")}>Blockers: </span><span className={cx("fw600", d.blockers > 0 ? "colorRed" : "colorGreen")}>{d.blockers}</span></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
