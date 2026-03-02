"use client";

import { cx, styles } from "../style";

const drafts = [
  { id: "UPD-001", client: "Volta Studios", project: "Brand Identity System", generatedAt: "Feb 22, 2026 14:30", draft: "Hi Sarah — Phase 2 is progressing well with brand guidelines at 72% completion. Three key deliverables finalized this week...", confidence: 91, status: "Pending Review" as const },
  { id: "UPD-002", client: "Mira Health", project: "Website Redesign", generatedAt: "Feb 22, 2026 14:30", draft: "Dr. Patel — Our UX team completed wireframes for 8 of 12 key pages this sprint. User testing is scheduled for next week...", confidence: 85, status: "Pending Review" as const },
  { id: "UPD-003", client: "Kestrel Capital", project: "Q1 Campaign Strategy", generatedAt: "Feb 22, 2026 14:30", draft: "Daniel — Campaign execution is underway. Content calendar for March is 45% populated. We've identified 2 potential blockers...", confidence: 78, status: "Pending Review" as const },
  { id: "UPD-004", client: "Volta Studios", project: "Social Media", generatedAt: "Feb 21, 2026 14:30", draft: "Marcus — February engagement metrics show a 12% increase in reach across platforms...", confidence: 88, status: "Approved" as const },
];

export function UpdateQueueManagerPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / AI &amp; ML</div>
          <h1 className={styles.pageTitle}>Update Queue Manager</h1>
          <div className={styles.pageSub}>Review and approve AI-drafted client updates before sending</div>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Pending Review", value: String(drafts.filter((d) => d.status === "Pending Review").length), color: "var(--amber)" },
          { label: "Approved Today", value: String(drafts.filter((d) => d.status === "Approved").length), color: "var(--accent)" },
          { label: "Avg Confidence", value: Math.round(drafts.reduce((s, d) => s + d.confidence, 0) / drafts.length) + "%", color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("flexCol", "gap16")}>
        {drafts.map((d) => (
          <article key={d.id} className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>{d.client} — {d.project}</span>
              <span className={cx("badge", d.status === "Approved" ? "badgeGreen" : "badgeAmber")}>{d.status}</span>
            </div>
            <div className={styles.cardInner}>
              <div className={cx("text12", "mb12", "p12")} style={{ background: "var(--bg)", borderRadius: "6px", fontStyle: "italic" }}>{d.draft}</div>
              <div className={cx("flexBetween")}>
                <div className={cx("flex", "gap12", "text11", "colorMuted")}>
                  <span>Generated: {d.generatedAt}</span>
                  <span>Confidence: <strong className={cx("fontMono", d.confidence >= 85 ? "colorGreen" : "colorAmber")}>{d.confidence}%</strong></span>
                </div>
                {d.status === "Pending Review" && (
                  <div className={cx("flex", "gap4")}>
                    <button type="button" className={cx("btnSm", "btnAccent")}>Approve & Send</button>
                    <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
