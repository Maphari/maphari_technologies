"use client";

import { cx, styles } from "../style";

const stakeholders = [
  { client: "Volta Studios", contacts: [
    { name: "Sarah Chen", role: "CEO & Founder", email: "sarah@voltastudios.com", authority: "Final", engagement: "High" },
    { name: "Marcus Ellis", role: "Brand Director", email: "marcus@voltastudios.com", authority: "Design", engagement: "High" },
  ]},
  { client: "Kestrel Capital", contacts: [
    { name: "Daniel Nkosi", role: "CMO", email: "daniel@kestrelcap.co.za", authority: "Final", engagement: "Low" },
    { name: "Amara Obi", role: "Marketing Manager", email: "amara@kestrelcap.co.za", authority: "Operational", engagement: "Medium" },
  ]},
  { client: "Mira Health", contacts: [
    { name: "Dr. Lena Patel", role: "COO", email: "lena@mirahealth.com", authority: "Final", engagement: "Medium" },
    { name: "Tom Richards", role: "Product Lead", email: "tom@mirahealth.com", authority: "Technical", engagement: "High" },
  ]},
];

export function StakeholderDirectoryPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
          <h1 className={styles.pageTitle}>Stakeholder Directory</h1>
          <div className={styles.pageSub}>Client-side contacts, roles, and decision authority</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Contact</button>
      </div>
      {stakeholders.map((group) => (
        <article key={group.client} className={cx(styles.card, "mb16")}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>{group.client}</span></div>
          <div className={styles.cardInner}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Authority</th><th>Engagement</th></tr></thead>
              <tbody>
                {group.contacts.map((c) => (
                  <tr key={c.email}>
                    <td className={cx("fw600")}>{c.name}</td>
                    <td className={cx("colorMuted")}>{c.role}</td>
                    <td className={cx("fontMono", "text12", "colorMuted")}>{c.email}</td>
                    <td><span className={cx("badge", c.authority === "Final" ? "badgeRed" : "badge")}>{c.authority}</span></td>
                    <td><span className={cx("badge", c.engagement === "High" ? "badgeGreen" : c.engagement === "Medium" ? "badgeAmber" : "badgeRed")}>{c.engagement}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}
