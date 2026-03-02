"use client";

import { cx, styles } from "../style";

const services = [
  { id: "SVC-001", name: "Brand Identity Design", category: "Design", price: "R35,000", timeline: "6-8 weeks", status: "Active" as const, projectsUsing: 3 },
  { id: "SVC-002", name: "Website Design & Development", category: "Digital", price: "R80,000", timeline: "8-12 weeks", status: "Active" as const, projectsUsing: 2 },
  { id: "SVC-003", name: "Campaign Strategy", category: "Strategy", price: "R25,000", timeline: "4-6 weeks", status: "Active" as const, projectsUsing: 1 },
  { id: "SVC-004", name: "Design System", category: "Design", price: "R45,000", timeline: "6-10 weeks", status: "Active" as const, projectsUsing: 1 },
  { id: "SVC-005", name: "Social Media Management", category: "Digital", price: "R12,000/mo", timeline: "Ongoing", status: "Draft" as const, projectsUsing: 0 },
  { id: "SVC-006", name: "UX Audit & Research", category: "Strategy", price: "R18,000", timeline: "2-3 weeks", status: "Active" as const, projectsUsing: 1 },
];

export function ServiceCatalogManagerPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Service Catalog Manager</h1>
          <div className={styles.pageSub}>Manage client-facing service offerings, pricing, and timelines</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Service</button>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Service Offerings</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>Service</th><th>Category</th><th>Starting Price</th><th>Timeline</th><th>Active Projects</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td className={cx("fw600")}>{s.name}</td>
                  <td><span className={cx("badge")}>{s.category}</span></td>
                  <td className={cx("fontMono", "fw600")}>{s.price}</td>
                  <td className={cx("text12", "colorMuted")}>{s.timeline}</td>
                  <td className={cx("fontMono")}>{s.projectsUsing}</td>
                  <td><span className={cx("badge", s.status === "Active" ? "badgeGreen" : "badgeAmber")}>{s.status}</span></td>
                  <td><button type="button" className={cx("btnSm", "btnGhost")}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
