"use client";

import { cx } from "../style";

const clients = [
  { name: "Volta Studios", avatar: "VS", healthScore: 88, trend: "up" as const, sentiment: "Positive", responseTime: "2.4h", portalLogins: 18, lastContact: "Today", milestoneCompletion: 75, paymentStatus: "Current" },
  { name: "Kestrel Capital", avatar: "KC", healthScore: 42, trend: "down" as const, sentiment: "Negative", responseTime: "8.1h", portalLogins: 3, lastContact: "5 days ago", milestoneCompletion: 89, paymentStatus: "Overdue" },
  { name: "Mira Health", avatar: "MH", healthScore: 72, trend: "stable" as const, sentiment: "Neutral", responseTime: "3.6h", portalLogins: 11, lastContact: "Yesterday", milestoneCompletion: 50, paymentStatus: "Current" },
  { name: "Dune Collective", avatar: "DC", healthScore: 31, trend: "down" as const, sentiment: "Negative", responseTime: "12.3h", portalLogins: 1, lastContact: "8 days ago", milestoneCompletion: 100, paymentStatus: "Overdue" },
  { name: "Okafor & Sons", avatar: "OS", healthScore: 95, trend: "up" as const, sentiment: "Positive", responseTime: "1.2h", portalLogins: 24, lastContact: "Today", milestoneCompletion: 34, paymentStatus: "Current" },
];

function healthColor(score: number) {
  if (score >= 80) return "colorGreen";
  if (score >= 60) return "colorAmber";
  return "colorRed";
}

function healthBadge(score: number) {
  if (score >= 80) return { label: "Healthy", tone: "badgeGreen" as const };
  if (score >= 60) return { label: "Moderate", tone: "badgeAmber" as const };
  return { label: "At Risk", tone: "badgeRed" as const };
}

function trendIcon(trend: string) {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function sentimentTone(s: string) {
  if (s === "Positive") return "badgeGreen";
  if (s === "Negative") return "badgeRed";
  return "badgeAmber";
}

export function ClientHealthSummaryPage({ isActive }: { isActive: boolean }) {
  const avgHealth = Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length);
  const atRisk = clients.filter((c) => c.healthScore < 60).length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-health-summary">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
        <h1 className={cx("pageTitleText")}>Client Health Summary</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Health badges and key indicators for assigned clients</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Avg Health Score", value: String(avgHealth), tone: healthColor(avgHealth) },
          { label: "At Risk", value: String(atRisk), tone: atRisk > 0 ? "colorRed" : "colorGreen" },
          { label: "Total Clients", value: String(clients.length), tone: "colorAccent" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("flexCol", "gap16")}>
        {clients.sort((a, b) => a.healthScore - b.healthScore).map((client) => {
          const badge = healthBadge(client.healthScore);
          return (
            <div key={client.name} className={cx("card", "cardBody")}>
              <div className={cx("flexBetween", "mb12")}>
                <div className={cx("flex", "gap12", "alignCenter")}>
                  <div className={cx("profileCircle", "profileCircleSm")}>{client.avatar}</div>
                  <div>
                    <div className={cx("fw700", "text14")}>{client.name}</div>
                    <div className={cx("text11", "colorMuted")}>Last contact: {client.lastContact}</div>
                  </div>
                </div>
                <div className={cx("flex", "gap8", "alignCenter")}>
                  <span className={cx("fontDisplay", "fw800", "text20", healthColor(client.healthScore))}>
                    {client.healthScore}
                    <span className={cx("text12", client.trend === "up" ? "colorGreen" : client.trend === "down" ? "colorRed" : "colorMuted")}> {trendIcon(client.trend)}</span>
                  </span>
                  <span className={cx("badge", badge.tone)}>{badge.label}</span>
                </div>
              </div>

              <div className={cx("stats", "stats4")}>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Sentiment</div>
                  <span className={cx("badge", sentimentTone(client.sentiment))}>{client.sentiment}</span>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Response Time</div>
                  <div className={cx("fontMono", "fw600", "text12")}>{client.responseTime}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Portal Activity</div>
                  <div className={cx("fontMono", "fw600", "text12")}>{client.portalLogins} logins</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Milestones</div>
                  <div className={cx("fontMono", "fw600", "text12")}>{client.milestoneCompletion}% done</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
