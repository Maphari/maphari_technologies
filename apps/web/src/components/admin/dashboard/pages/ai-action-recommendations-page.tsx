"use client";

import { cx, styles } from "../style";

const recommendations = [
  { id: "AI-001", type: "Revenue", title: "Upsell opportunity: Volta Studios — motion design add-on", confidence: 87, estimatedValue: "R15,000", reasoning: "Client recently discussed animation needs; high NPS score supports expansion.", action: "Propose" },
  { id: "AI-002", type: "Risk", title: "Kestrel Capital — engagement declining, schedule a check-in", confidence: 92, estimatedValue: "—", reasoning: "Response time increased 40% over 2 weeks; satisfaction score dropped.", action: "Alert Team" },
  { id: "AI-003", type: "Efficiency", title: "Consolidate Mira Health projects to reduce context-switching", confidence: 75, estimatedValue: "R8,400 saved", reasoning: "Three overlapping timelines for same client; merge into single sprint cadence.", action: "Review" },
  { id: "AI-004", type: "Revenue", title: "Okafor & Sons — retainer conversion opportunity", confidence: 68, estimatedValue: "R28,000/mo", reasoning: "Second project requested within 3 months; strong advocacy signals.", action: "Propose" },
  { id: "AI-005", type: "Capacity", title: "Design team at 94% utilization — hire or outsource", confidence: 81, estimatedValue: "—", reasoning: "Sustained high utilization for 4+ weeks risks burnout and missed deadlines.", action: "Review" },
];

export function AIActionRecommendationsPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / AI &amp; ML</div>
          <h1 className={styles.pageTitle}>AI Action Recommendations</h1>
          <div className={styles.pageSub}>Organization-wide AI-powered suggestions for revenue, risk, and efficiency</div>
        </div>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {recommendations.map((r) => (
          <article key={r.id} className={styles.card}>
            <div className={cx(styles.cardHd)}>
              <span className={styles.cardHdTitle}>{r.title}</span>
              <span className={cx("badge", r.type === "Risk" ? "badgeRed" : r.type === "Revenue" ? "badgeGreen" : "badgeAmber")}>{r.type}</span>
            </div>
            <div className={styles.cardInner}>
              <div className={cx("text12", "colorMuted", "mb12")}>{r.reasoning}</div>
              <div className={cx("flexBetween")}>
                <div className={cx("flex", "gap16", "text11")}>
                  <span>Confidence: <strong className={cx("fontMono", r.confidence >= 80 ? "colorGreen" : "colorAmber")}>{r.confidence}%</strong></span>
                  {r.estimatedValue !== "—" && <span>Est. Value: <strong className={cx("fontMono")}>{r.estimatedValue}</strong></span>}
                </div>
                <button type="button" className={cx("btnSm", "btnAccent")}>{r.action}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
