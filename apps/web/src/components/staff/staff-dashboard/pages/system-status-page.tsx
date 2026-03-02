"use client";

import { cx } from "../style";

const services = [
  { name: "Web Application", status: "Operational" as const, uptime: "99.98%", lastIncident: "Jan 15, 2026" },
  { name: "API Gateway", status: "Operational" as const, uptime: "99.99%", lastIncident: "Dec 20, 2025" },
  { name: "File Storage (S3)", status: "Operational" as const, uptime: "100%", lastIncident: "None" },
  { name: "Email Service", status: "Degraded" as const, uptime: "99.7%", lastIncident: "Feb 19, 2026" },
  { name: "Database (Primary)", status: "Operational" as const, uptime: "99.99%", lastIncident: "Nov 2, 2025" },
  { name: "AI Service", status: "Operational" as const, uptime: "99.5%", lastIncident: "Feb 10, 2026" },
];

function statusTone(s: string) { if (s === "Operational") return "badgeGreen"; if (s === "Degraded") return "badgeAmber"; return "badgeRed"; }

export function SystemStatusPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-system-status">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>System Status</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Platform uptime and known issues</p>
      </div>
      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Overall Status", value: services.every((s) => s.status === "Operational") ? "All Clear" : "Degraded", tone: services.every((s) => s.status === "Operational") ? "colorGreen" : "colorAmber" },
          { label: "Services Up", value: `${services.filter((s) => s.status === "Operational").length}/${services.length}`, tone: "colorAccent" },
          { label: "Avg Uptime", value: (services.reduce((s, sv) => s + parseFloat(sv.uptime), 0) / services.length).toFixed(2) + "%", tone: "colorGreen" },
        ].map((s) => (
          <div key={s.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Service</th><th>Status</th><th>Uptime</th><th>Last Incident</th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.name}>
                  <td className={cx("fw600")}>{s.name}</td>
                  <td><span className={cx("badge", statusTone(s.status))}>{s.status}</span></td>
                  <td className={cx("fontMono", "fw600")}>{s.uptime}</td>
                  <td className={cx("colorMuted", "text12")}>{s.lastIncident}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
