"use client";

import { cx } from "../style";

const integrations = [
  { name: "Google Calendar", category: "Calendar", status: "Connected" as const, lastSync: "2 min ago", description: "Sync meetings and availability" },
  { name: "Slack", category: "Communication", status: "Connected" as const, lastSync: "Live", description: "Notifications and status updates" },
  { name: "Figma", category: "Design", status: "Connected" as const, lastSync: "15 min ago", description: "Design file activity tracking" },
  { name: "GitHub", category: "Development", status: "Not Connected" as const, lastSync: "—", description: "Code commits and PR tracking" },
  { name: "Notion", category: "Documentation", status: "Not Connected" as const, lastSync: "—", description: "Knowledge base sync" },
  { name: "Harvest", category: "Time Tracking", status: "Connected" as const, lastSync: "1 hr ago", description: "Automatic time entry import" },
];

function statusTone(s: string) { return s === "Connected" ? "badgeGreen" : "badge"; }

export function MyIntegrationsPage({ isActive }: { isActive: boolean }) {
  const connected = integrations.filter((i) => i.status === "Connected").length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-integrations">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Settings</div>
        <h1 className={cx("pageTitleText")}>My Integrations</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal tool connections (calendar, IDE, etc.)</p>
      </div>

      <div className={cx("stats", "stats2", "mb28")}>
        {[
          { label: "Connected", value: String(connected), tone: "colorGreen" },
          { label: "Available", value: String(integrations.length - connected), tone: "colorMuted" },
        ].map((s) => (
          <div key={s.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("flexCol", "gap12")}>
        {integrations.map((i) => (
          <div key={i.name} className={cx("card", "cardBody")}>
            <div className={cx("flexBetween")}>
              <div>
                <div className={cx("fw700", "text14")}>{i.name}</div>
                <div className={cx("text11", "colorMuted")}>{i.description}</div>
                <div className={cx("flex", "gap12", "mt4", "text10", "colorMuted2")}>
                  <span>{i.category}</span>
                  {i.lastSync !== "—" && <span>Last sync: {i.lastSync}</span>}
                </div>
              </div>
              <div className={cx("flex", "gap8", "alignCenter")}>
                <span className={cx("badge", statusTone(i.status))}>{i.status}</span>
                <button type="button" className={cx("button", i.status === "Connected" ? "buttonGhost" : "buttonAccent", "buttonSmall")}>
                  {i.status === "Connected" ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
