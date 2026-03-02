"use client";

import { cx } from "../style";

type FeedbackItem = {
  id: string;
  client: string;
  avatar: string;
  project: string;
  type: "CSAT" | "NPS" | "Comment" | "Complaint" | "Praise";
  rating: number | null;
  message: string;
  receivedAt: string;
  acknowledged: boolean;
};

const feedbackItems: FeedbackItem[] = [
  { id: "FB-001", client: "Okafor & Sons", avatar: "OS", project: "Annual Report 2025", type: "Praise", rating: null, message: "The data visualisations are exceptional — exactly what we needed for the board presentation.", receivedAt: "Feb 20, 2026", acknowledged: false },
  { id: "FB-002", client: "Kestrel Capital", avatar: "KC", project: "Q1 Campaign Strategy", type: "Complaint", rating: null, message: "We expected the content calendar deliverable two weeks ago. This delay is impacting our Q1 launch.", receivedAt: "Feb 19, 2026", acknowledged: false },
  { id: "FB-003", client: "Volta Studios", avatar: "VS", project: "Brand Identity System", type: "CSAT", rating: 4, message: "Good progress on the brand guidelines. Minor concerns about colour consistency across print.", receivedAt: "Feb 18, 2026", acknowledged: true },
  { id: "FB-004", client: "Mira Health", avatar: "MH", project: "Website Redesign", type: "NPS", rating: 8, message: "We'd recommend Maphari to other health-tech companies for design work.", receivedAt: "Feb 17, 2026", acknowledged: true },
  { id: "FB-005", client: "Dune Collective", avatar: "DC", project: "Editorial Design System", type: "Complaint", rating: null, message: "The project went over budget and the final deliverable had revision issues. Need to discuss.", receivedAt: "Feb 15, 2026", acknowledged: false },
  { id: "FB-006", client: "Volta Studios", avatar: "VS", project: "Brand Identity System", type: "Comment", rating: null, message: "Can we schedule a workshop to walk through the typography decisions?", receivedAt: "Feb 14, 2026", acknowledged: true },
];

function typeTone(type: string) {
  if (type === "Praise") return "badgeGreen";
  if (type === "Complaint") return "badgeRed";
  if (type === "CSAT" || type === "NPS") return "badgeAmber";
  return "badge";
}

export function FeedbackInboxPage({ isActive }: { isActive: boolean }) {
  const unacknowledged = feedbackItems.filter((f) => !f.acknowledged).length;
  const complaints = feedbackItems.filter((f) => f.type === "Complaint").length;
  const avgCSAT = feedbackItems.filter((f) => f.type === "CSAT" && f.rating != null);
  const csatAvg = avgCSAT.length > 0 ? (avgCSAT.reduce((s, f) => s + (f.rating ?? 0), 0) / avgCSAT.length).toFixed(1) : "—";

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-feedback-inbox">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
        <h1 className={cx("pageTitleText")}>Feedback Inbox</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Aggregated client feedback on your deliverables</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Unread", value: String(unacknowledged), tone: unacknowledged > 0 ? "colorAmber" : "colorGreen" },
          { label: "Complaints", value: String(complaints), tone: complaints > 0 ? "colorRed" : "colorGreen" },
          { label: "Avg CSAT", value: String(csatAvg), tone: "colorAccent" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("flexCol", "gap12")}>
        {feedbackItems.map((item) => (
          <div key={item.id} className={cx("card", "cardBody")} style={{ borderLeft: item.acknowledged ? "3px solid var(--border)" : "3px solid var(--accent)" }}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("flex", "gap12", "alignCenter")}>
                <div className={cx("profileCircle", "profileCircleSm")}>{item.avatar}</div>
                <div>
                  <div className={cx("fw700", "text12")}>{item.client}</div>
                  <div className={cx("text11", "colorMuted")}>{item.project}</div>
                </div>
              </div>
              <div className={cx("flex", "gap8", "alignCenter")}>
                <span className={cx("badge", typeTone(item.type))}>{item.type}{item.rating != null ? `: ${item.rating}/10` : ""}</span>
                <span className={cx("text10", "colorMuted2")}>{item.receivedAt}</span>
              </div>
            </div>
            <p className={cx("text12", "colorText")} style={{ margin: 0, lineHeight: 1.5 }}>{item.message}</p>
            {!item.acknowledged && (
              <div className={cx("mt8")}>
                <button type="button" className={cx("button", "buttonGhost", "buttonSmall")}>Acknowledge</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
