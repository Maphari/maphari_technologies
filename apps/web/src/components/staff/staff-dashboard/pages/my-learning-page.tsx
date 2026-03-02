"use client";

import { cx } from "../style";

const courses = [
  { id: 1, title: "Advanced Figma Techniques", category: "Design", progress: 100, duration: "4h", status: "Completed" as const, completedAt: "Jan 2026" },
  { id: 2, title: "Design Systems at Scale", category: "Design", progress: 65, duration: "6h", status: "In Progress" as const, completedAt: null },
  { id: 3, title: "Client Communication Masterclass", category: "Soft Skills", progress: 30, duration: "3h", status: "In Progress" as const, completedAt: null },
  { id: 4, title: "Accessibility Standards (WCAG 2.2)", category: "Compliance", progress: 0, duration: "5h", status: "Not Started" as const, completedAt: null },
  { id: 5, title: "Motion Design Principles", category: "Design", progress: 100, duration: "3h", status: "Completed" as const, completedAt: "Dec 2025" },
  { id: 6, title: "Project Estimation Workshop", category: "Operations", progress: 0, duration: "2h", status: "Not Started" as const, completedAt: null },
];

function statusTone(s: string) {
  if (s === "Completed") return "badgeGreen";
  if (s === "In Progress") return "badgeAmber";
  return "badge";
}

export function MyLearningPage({ isActive }: { isActive: boolean }) {
  const completed = courses.filter((c) => c.status === "Completed").length;
  const totalHours = courses.reduce((s, c) => s + parseInt(c.duration), 0);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-learning">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Learning</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Course catalog, enrollments, and certifications</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Completed", value: String(completed), tone: "colorGreen" },
          { label: "In Progress", value: String(courses.filter((c) => c.status === "In Progress").length), tone: "colorAmber" },
          { label: "Total Hours", value: `${totalHours}h`, tone: "colorAccent" },
        ].map((s) => (
          <div key={s.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("flexCol", "gap12")}>
        {courses.map((course) => (
          <div key={course.id} className={cx("card", "cardBody")}>
            <div className={cx("flexBetween", "mb8")}>
              <div>
                <div className={cx("fw700", "text14")}>{course.title}</div>
                <div className={cx("text11", "colorMuted")}>{course.category} · {course.duration}</div>
              </div>
              <span className={cx("badge", statusTone(course.status))}>{course.status}</span>
            </div>
            {course.progress > 0 && course.progress < 100 && (
              <div className={cx("progressTrack")}>
                <div className={cx("progressFill", "progressFillAmber")} style={{ width: `${course.progress}%` }} />
              </div>
            )}
            {course.completedAt && <div className={cx("text10", "colorGreen", "mt4")}>Completed {course.completedAt}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
