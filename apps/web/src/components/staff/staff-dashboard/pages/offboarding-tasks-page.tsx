"use client";

import { cx } from "../style";

const tasks = [
  { id: 1, task: "Export final brand assets to shared drive", client: "Dune Collective", dueAt: "Feb 25, 2026", status: "Pending" as const },
  { id: 2, task: "Transfer Figma project ownership", client: "Dune Collective", dueAt: "Feb 26, 2026", status: "Pending" as const },
  { id: 3, task: "Document design decisions & rationale", client: "Dune Collective", dueAt: "Feb 27, 2026", status: "Done" as const },
  { id: 4, task: "Hand over CMS credentials", client: "Dune Collective", dueAt: "Feb 28, 2026", status: "Pending" as const },
  { id: 5, task: "Final client retrospective meeting", client: "Dune Collective", dueAt: "Mar 1, 2026", status: "Pending" as const },
];

function statusTone(s: string) { if (s === "Done") return "badgeGreen"; return "badgeAmber"; }

export function OffboardingTasksPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-offboarding-tasks">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Offboarding Tasks</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal offboarding action items</p>
      </div>
      <div className={cx("card", "cardBody")}>
        <div className={cx("flexCol", "gap8")}>
          {tasks.map((t) => (
            <div key={t.id} className={cx("flexBetween")} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className={cx("flex", "gap12", "alignCenter")}>
                <input type="checkbox" checked={t.status === "Done"} readOnly style={{ accentColor: "var(--accent)" }} />
                <div>
                  <div className={cx("text12", t.status === "Done" ? "colorMuted" : "fw600")} style={t.status === "Done" ? { textDecoration: "line-through" } : {}}>{t.task}</div>
                  <div className={cx("text10", "colorMuted2")}>{t.client}</div>
                </div>
              </div>
              <div className={cx("flex", "gap8", "alignCenter")}>
                <span className={cx("text10", "colorMuted")}>{t.dueAt}</span>
                <span className={cx("badge", statusTone(t.status))}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
