// ════════════════════════════════════════════════════════════════════════════
// my-learning-page.tsx — Staff My Learning
// Data     : loadMyTrainingWithRefresh → GET /training
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadMyTrainingWithRefresh, type StaffTrainingRecord } from "../../../../lib/api/staff";
import { saveSession } from "../../../../lib/auth/session";

type Status = "Completed" | "In Progress" | "Not Started";

function categoryCls(c: string) {
  if (c === "Design")      return "mllCatDesign";
  if (c === "Soft Skills") return "mllCatSoftSkills";
  if (c === "Compliance")  return "mllCatCompliance";
  return "mllCatOps";
}

function statusCls(s: Status) {
  if (s === "Completed")   return "mllStatusDone";
  if (s === "In Progress") return "mllStatusProgress";
  return "mllStatusNotStarted";
}

function progressFillCls(s: Status) {
  if (s === "Completed")   return "mllFillGreen";
  if (s === "In Progress") return "mllFillAmber";
  return "";
}

function progressPctCls(s: Status) {
  if (s === "Completed")   return "colorGreen";
  if (s === "In Progress") return "colorAmber";
  return "colorMuted2";
}

function mapApiStatus(s: string): Status {
  const u = s.toUpperCase();
  if (u === "COMPLETED") return "Completed";
  if (u === "IN_PROGRESS" || u === "IN-PROGRESS") return "In Progress";
  return "Not Started";
}

export function MyLearningPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [apiTraining, setApiTraining] = useState<StaffTrainingRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void loadMyTrainingWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        setLoading(false);
        return;
      }
      setApiTraining(r.data);
      setError(null);
      setLoading(false);
    });
  }, [session?.accessToken]);

  const courses = useMemo(() =>
    apiTraining.map((t, idx) => {
      const status = mapApiStatus(t.status);
      const progress = status === "Completed" ? 100 : status === "In Progress" ? 50 : 0;
      const completedAt = t.completedAt
        ? new Date(t.completedAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
        : null;
      return {
        id:          idx + 1,
        title:       t.courseName,
        category:    t.category ?? "General",
        progress,
        duration:    "—",
        status,
        completedAt,
      };
    }),
  [apiTraining]);

  const completedCount  = courses.filter((c) => c.status === "Completed").length;
  const inProgressCount = courses.filter((c) => c.status === "In Progress").length;
  const notStartedCount = courses.filter((c) => c.status === "Not Started").length;
  const totalHours      = 0; // hours not stored in API yet

  const STATUS_ORDER: Record<Status, number> = { "In Progress": 0, "Not Started": 1, "Completed": 2 };
  const sorted = [...courses].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-learning">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Learning</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Course catalog, enrollments, and certifications</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("mllStatGrid")}>

        <div className={cx("mllStatCard")}>
          <div className={cx("mllStatCardTop")}>
            <div className={cx("mllStatLabel")}>Completed</div>
            <div className={cx("mllStatValue", "colorGreen")}>{completedCount}</div>
          </div>
          <div className={cx("mllStatCardDivider")} />
          <div className={cx("mllStatCardBottom")}>
            <span className={cx("mllStatDot", "dotBgGreen")} />
            <span className={cx("mllStatMeta")}>courses finished</span>
          </div>
        </div>

        <div className={cx("mllStatCard")}>
          <div className={cx("mllStatCardTop")}>
            <div className={cx("mllStatLabel")}>In Progress</div>
            <div className={cx("mllStatValue", "colorAmber")}>{inProgressCount}</div>
          </div>
          <div className={cx("mllStatCardDivider")} />
          <div className={cx("mllStatCardBottom")}>
            <span className={cx("mllStatDot", "dotBgAmber")} />
            <span className={cx("mllStatMeta")}>currently active</span>
          </div>
        </div>

        <div className={cx("mllStatCard")}>
          <div className={cx("mllStatCardTop")}>
            <div className={cx("mllStatLabel")}>Not Started</div>
            <div className={cx("mllStatValue")}>{notStartedCount}</div>
          </div>
          <div className={cx("mllStatCardDivider")} />
          <div className={cx("mllStatCardBottom")}>
            <span className={cx("mllStatDot", "dotBgMuted2")} />
            <span className={cx("mllStatMeta")}>yet to begin</span>
          </div>
        </div>

        <div className={cx("mllStatCard")}>
          <div className={cx("mllStatCardTop")}>
            <div className={cx("mllStatLabel")}>Total Hours</div>
            <div className={cx("mllStatValue", "colorAccent")}>{totalHours}h</div>
          </div>
          <div className={cx("mllStatCardDivider")} />
          <div className={cx("mllStatCardBottom")}>
            <span className={cx("mllStatDot", "dotBgAccent")} />
            <span className={cx("mllStatMeta")}>learning content</span>
          </div>
        </div>

      </div>

      {/* ── Course list ───────────────────────────────────────────────────── */}
      <div className={cx("mllSection")}>

        <div className={cx("mllSectionHeader")}>
          <div className={cx("mllSectionTitle")}>All Courses</div>
          <span className={cx("mllSectionMeta")}>{apiTraining.length} COURSES</span>
        </div>

        <div className={cx("mllCourseList")}>
          {sorted.map((course, idx) => (
            <div key={course.id} className={cx("mllCourseCard", idx === sorted.length - 1 && "mllCourseCardLast")}>

              {/* Head: title | status badge */}
              <div className={cx("mllCourseHead")}>
                <div className={cx("mllCourseTitle")}>{course.title}</div>
                <span className={cx("mllStatusBadge", statusCls(course.status))}>{course.status}</span>
              </div>

              {/* Meta: category badge + duration chip */}
              <div className={cx("mllCourseMeta")}>
                <span className={cx("mllCatBadge", categoryCls(course.category))}>{course.category}</span>
                <span className={cx("mllDuration")}>{course.duration}</span>
              </div>

              {/* Progress bar */}
              <div className={cx("mllProgressWrap")}>
                <div className={cx("mllProgressMeta")}>
                  <span className={cx("mllProgressLabel")}>Progress</span>
                  <span className={cx("mllProgressPct", progressPctCls(course.status))}>{course.progress}%</span>
                </div>
                <div className={cx("mllProgressTrack")}>
                  {course.progress > 0 && (
                    <div
                      className={cx("mllProgressFill", progressFillCls(course.status))}
                      style={{ '--pct': `${course.progress}%` } as React.CSSProperties}
                    />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={cx("mllCourseFooter")}>
                {course.status === "Completed" && course.completedAt && (
                  <span className={cx("mllCompletedAt")}>Completed {course.completedAt}</span>
                )}
                {course.status === "In Progress" && (
                  <span className={cx("mllInProgressText")}>{course.progress}% complete</span>
                )}
                {course.status === "Not Started" && (
                  <span className={cx("mllNotStartedText")}>Not yet started</span>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
