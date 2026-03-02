"use client";

import { cx, styles } from "../style";

const articles = [
  { id: "KB-001", title: "Client Onboarding Playbook", category: "Process", status: "Published" as const, author: "Naledi Mthembu", views: 312, lastUpdated: "Feb 10, 2026" },
  { id: "KB-002", title: "Brand Guidelines v3.2", category: "Brand", status: "Published" as const, author: "Sipho Ndlovu", views: 487, lastUpdated: "Jan 28, 2026" },
  { id: "KB-003", title: "Design System Documentation", category: "Development", status: "Draft" as const, author: "Thabo Mokoena", views: 0, lastUpdated: "Feb 18, 2026" },
  { id: "KB-004", title: "Expense Reimbursement Policy", category: "HR", status: "Published" as const, author: "Leilani September", views: 198, lastUpdated: "Dec 15, 2025" },
  { id: "KB-005", title: "Remote Work Guidelines", category: "HR", status: "Under Review" as const, author: "Fatima Al-Rashid", views: 0, lastUpdated: "Feb 22, 2026" },
  { id: "KB-006", title: "Client Communication Templates", category: "Process", status: "Published" as const, author: "Kira Bosman", views: 245, lastUpdated: "Jan 5, 2026" },
];

export function KnowledgeBaseAdminPage() {
  const published = articles.filter((a) => a.status === "Published").length;
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Knowledge Base Admin</h1>
          <div className={styles.pageSub}>Curate, organize, and moderate knowledge base articles</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Article</button>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Published", value: String(published), color: "var(--accent)" },
          { label: "Drafts", value: String(articles.filter((a) => a.status === "Draft").length), color: "var(--amber)" },
          { label: "Under Review", value: String(articles.filter((a) => a.status === "Under Review").length), color: "var(--blue)" },
          { label: "Total Views", value: String(articles.reduce((s, a) => s + a.views, 0)), color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>All Articles</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Views</th><th>Updated</th><th>Status</th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className={cx("fw600")}>{a.title}</td>
                  <td><span className={cx("badge")}>{a.category}</span></td>
                  <td className={cx("colorMuted")}>{a.author}</td>
                  <td className={cx("fontMono")}>{a.views}</td>
                  <td className={cx("text12", "colorMuted")}>{a.lastUpdated}</td>
                  <td><span className={cx("badge", a.status === "Published" ? "badgeGreen" : a.status === "Draft" ? "badgeAmber" : "badgeBlue")}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
