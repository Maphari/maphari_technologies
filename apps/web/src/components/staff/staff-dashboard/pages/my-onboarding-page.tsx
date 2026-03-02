"use client";

import { cx } from "../style";

const checklistItems = [
  { id: 1, title: "Sign employment contract", category: "Legal", completed: true, dueAt: "Day 1" },
  { id: 2, title: "Set up company email & Slack", category: "IT Setup", completed: true, dueAt: "Day 1" },
  { id: 3, title: "Complete security awareness training", category: "Compliance", completed: true, dueAt: "Week 1" },
  { id: 4, title: "Review brand guidelines", category: "Knowledge", completed: true, dueAt: "Week 1" },
  { id: 5, title: "Set up Figma & Adobe accounts", category: "IT Setup", completed: true, dueAt: "Week 1" },
  { id: 6, title: "Meet team leads (1:1 introductions)", category: "Culture", completed: true, dueAt: "Week 1" },
  { id: 7, title: "Complete design system walkthrough", category: "Knowledge", completed: false, dueAt: "Week 2" },
  { id: 8, title: "Shadow 3 client calls", category: "Training", completed: false, dueAt: "Week 2" },
  { id: 9, title: "Submit first peer review request", category: "Training", completed: false, dueAt: "Week 3" },
  { id: 10, title: "Complete time tracking setup", category: "Operations", completed: false, dueAt: "Week 2" },
  { id: 11, title: "Read knowledge base essentials", category: "Knowledge", completed: false, dueAt: "Week 3" },
  { id: 12, title: "30-day check-in with manager", category: "Culture", completed: false, dueAt: "Month 1" },
];

export function MyOnboardingPage({ isActive }: { isActive: boolean }) {
  const completed = checklistItems.filter((i) => i.completed).length;
  const progress = Math.round((completed / checklistItems.length) * 100);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-onboarding">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Onboarding</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal onboarding checklist and progress</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Progress", value: `${progress}%`, tone: "colorAccent" },
          { label: "Completed", value: `${completed}/${checklistItems.length}`, tone: "colorGreen" },
          { label: "Remaining", value: String(checklistItems.length - completed), tone: "colorAmber" },
        ].map((s) => (
          <div key={s.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card", "cardBody")}>
        <div className={cx("mb12")}>
          <div className={cx("progressTrack")}>
            <div className={cx("progressFill", "progressFillGreen")} style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className={cx("flexCol", "gap8")}>
          {checklistItems.map((item) => (
            <div key={item.id} className={cx("flexBetween")} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className={cx("flex", "gap12", "alignCenter")}>
                <input type="checkbox" checked={item.completed} readOnly style={{ accentColor: "var(--accent)" }} />
                <div>
                  <div className={cx("text12", item.completed ? "colorMuted" : "fw600")} style={item.completed ? { textDecoration: "line-through" } : {}}>{item.title}</div>
                  <div className={cx("text10", "colorMuted2")}>{item.category}</div>
                </div>
              </div>
              <span className={cx("badge", item.completed ? "badgeGreen" : "badge")}>{item.dueAt}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
