"use client";

import { cx } from "../style";

const teams = [
  { client: "Volta Studios", avatar: "VS", contacts: [
    { name: "Sarah Chen", role: "CEO & Founder", email: "sarah@voltastudios.com", decisionAuthority: "Final", lastContact: "Feb 20, 2026" },
    { name: "Marcus Ellis", role: "Brand Director", email: "marcus@voltastudios.com", decisionAuthority: "Design", lastContact: "Feb 22, 2026" },
  ]},
  { client: "Kestrel Capital", avatar: "KC", contacts: [
    { name: "Daniel Nkosi", role: "CMO", email: "daniel@kestrelcap.co.za", decisionAuthority: "Final", lastContact: "Feb 15, 2026" },
    { name: "Amara Obi", role: "Marketing Manager", email: "amara@kestrelcap.co.za", decisionAuthority: "Operational", lastContact: "Feb 18, 2026" },
  ]},
  { client: "Mira Health", avatar: "MH", contacts: [
    { name: "Dr. Lena Patel", role: "COO", email: "lena@mirahealth.com", decisionAuthority: "Final", lastContact: "Feb 21, 2026" },
    { name: "Tom Richards", role: "Product Lead", email: "tom@mirahealth.com", decisionAuthority: "Technical", lastContact: "Feb 19, 2026" },
    { name: "Jade Mthembu", role: "Project Coordinator", email: "jade@mirahealth.com", decisionAuthority: "Operational", lastContact: "Feb 22, 2026" },
  ]},
];

export function ClientTeamPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-team">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Client Team</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Client stakeholders and decision authorities</p>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {teams.map((team) => (
          <div key={team.client} className={cx("card")}>
            <div className={cx("flex", "gap12", "alignCenter", "mb8")} style={{ padding: "16px 20px 0" }}>
              <div className={cx("profileCircle", "profileCircleSm")}>{team.avatar}</div>
              <div className={cx("sectionLabel")}>{team.client}</div>
            </div>
            <div className={cx("tableWrap")}>
              <table className={cx("table")}>
                <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Authority</th><th>Last Contact</th></tr></thead>
                <tbody>
                  {team.contacts.map((c) => (
                    <tr key={c.email}>
                      <td className={cx("fw600")}>{c.name}</td>
                      <td className={cx("colorMuted")}>{c.role}</td>
                      <td className={cx("fontMono", "text12", "colorMuted")}>{c.email}</td>
                      <td><span className={cx("badge", c.decisionAuthority === "Final" ? "badgeRed" : "badge")}>{c.decisionAuthority}</span></td>
                      <td className={cx("text12", "colorMuted")}>{c.lastContact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
