"use client";

import { cx } from "../style";

const incidents = [
  { id: "INC-001", title: "Email delivery delays — 30 min queue backlog", severity: "Medium", status: "Active" as const, startedAt: "Feb 19, 2026 14:30", role: "Monitor", action: "Track client email delivery for campaign-related sends" },
  { id: "INC-002", title: "AI service latency spike — suggestions slow", severity: "Low", status: "Resolved" as const, startedAt: "Feb 10, 2026 09:15", role: "None", action: "No action required" },
  { id: "INC-003", title: "Database failover drill — read-only for 5 min", severity: "Info", status: "Scheduled" as const, startedAt: "Mar 1, 2026 02:00", role: "Aware", action: "Avoid saving work between 02:00-02:05 on Mar 1" },
];

function severityTone(s: string) { if (s === "High" || s === "Critical") return "badgeRed"; if (s === "Medium") return "badgeAmber"; return "badge"; }
function statusTone(s: string) { if (s === "Active") return "badgeRed"; if (s === "Resolved") return "badgeGreen"; return "badgeAmber"; }

export function IncidentAlertsPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-incident-alerts">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>Incident Alerts</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Crisis role assignments and required actions</p>
      </div>
      <div className={cx("flexCol", "gap12")}>
        {incidents.map((i) => (
          <div key={i.id} className={cx("card", "cardBody")} style={{ borderLeft: i.status === "Active" ? "3px solid var(--error)" : "3px solid var(--border)" }}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("fw700", "text14")}>{i.title}</div>
              <div className={cx("flex", "gap8")}>
                <span className={cx("badge", severityTone(i.severity))}>{i.severity}</span>
                <span className={cx("badge", statusTone(i.status))}>{i.status}</span>
              </div>
            </div>
            <div className={cx("flex", "gap16", "text11")}>
              <span><span className={cx("colorMuted2")}>Started: </span>{i.startedAt}</span>
              <span><span className={cx("colorMuted2")}>Your Role: </span><span className={cx("fw600")}>{i.role}</span></span>
            </div>
            <div className={cx("text12", "mt8")} style={{ padding: "8px 12px", background: "var(--bg-surface)", borderRadius: "6px" }}>
              <span className={cx("fw600", "colorAccent")}>Action: </span>{i.action}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
