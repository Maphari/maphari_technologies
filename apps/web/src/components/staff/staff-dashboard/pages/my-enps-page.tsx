"use client";

import { cx } from "../style";

export function MyEnpsPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-enps">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Feedback (eNPS)</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Submit pulse survey responses and view your feedback history</p>
      </div>

      <div className={cx("card", "cardBody", "mb24")}>
        <div className={cx("sectionLabel", "mb16")}>Current Pulse Survey — February 2026</div>
        <div className={cx("flexCol", "gap16")}>
          <div>
            <div className={cx("fw600", "text12", "mb8")}>How likely are you to recommend Maphari as a workplace? (0-10)</div>
            <div className={cx("flex", "gap4")}>
              {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button key={n} type="button" className={cx("button", "buttonGhost", "buttonSmall")} style={{ minWidth: "32px" }}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <div className={cx("fw600", "text12", "mb8")}>What's working well?</div>
            <textarea className={cx("input")} rows={3} placeholder="Share what you appreciate..." />
          </div>
          <div>
            <div className={cx("fw600", "text12", "mb8")}>What could be improved?</div>
            <textarea className={cx("input")} rows={3} placeholder="Share constructive feedback..." />
          </div>
          <button type="button" className={cx("button", "buttonAccent")}>Submit Response</button>
        </div>
      </div>

      <div className={cx("card", "cardBody")}>
        <div className={cx("sectionLabel", "mb12")}>Previous Responses</div>
        <div className={cx("flexCol", "gap8")}>
          {[
            { month: "January 2026", score: 8, comment: "Great team culture, would love more learning opportunities." },
            { month: "December 2025", score: 7, comment: "Solid work-life balance. Tooling could be better." },
            { month: "November 2025", score: 9, comment: "Excellent leadership support and project variety." },
          ].map((r) => (
            <div key={r.month} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className={cx("flexBetween", "mb4")}>
                <span className={cx("fw600", "text12")}>{r.month}</span>
                <span className={cx("badge", r.score >= 8 ? "badgeGreen" : "badgeAmber")}>Score: {r.score}/10</span>
              </div>
              <div className={cx("text11", "colorMuted")}>{r.comment}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
