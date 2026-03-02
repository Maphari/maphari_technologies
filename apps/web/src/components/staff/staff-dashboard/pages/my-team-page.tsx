"use client";

import { cx } from "../style";

const team = [
  { name: "Thabo Mokoena", role: "Senior Designer", department: "Creative", reportsTo: "Naledi Mthembu", status: "Active" },
  { name: "Naledi Mthembu", role: "Creative Director", department: "Creative", reportsTo: "Sipho Ndlovu", status: "Active" },
  { name: "Lerato Dlamini", role: "UX Designer", department: "Creative", reportsTo: "Naledi Mthembu", status: "Active" },
  { name: "James Okonkwo", role: "Frontend Developer", department: "Engineering", reportsTo: "Naledi Mthembu", status: "Active" },
  { name: "Sipho Ndlovu", role: "CEO", department: "Leadership", reportsTo: "—", status: "Active" },
  { name: "Fatima Al-Rashid", role: "Project Manager", department: "Operations", reportsTo: "Sipho Ndlovu", status: "On Leave" },
];

const escalation = [
  { level: 1, role: "Project Manager", contact: "Fatima Al-Rashid", method: "Slack / Email" },
  { level: 2, role: "Creative Director", contact: "Naledi Mthembu", method: "Direct Call" },
  { level: 3, role: "CEO", contact: "Sipho Ndlovu", method: "Emergency Line" },
];

export function MyTeamPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-team">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>My Team</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Team hierarchy and escalation paths</p>
      </div>

      <div className={cx("card", "mb24")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Team Members</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Reports To</th><th>Status</th></tr></thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.name}>
                  <td className={cx("fw600")}>{m.name}</td>
                  <td className={cx("colorMuted")}>{m.role}</td>
                  <td><span className={cx("badge")}>{m.department}</span></td>
                  <td className={cx("text12")}>{m.reportsTo}</td>
                  <td><span className={cx("badge", m.status === "Active" ? "badgeGreen" : "badgeAmber")}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Escalation Path</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Level</th><th>Role</th><th>Contact</th><th>Method</th></tr></thead>
            <tbody>
              {escalation.map((e) => (
                <tr key={e.level}>
                  <td className={cx("fontMono", "fw600")}>L{e.level}</td>
                  <td className={cx("fw600")}>{e.role}</td>
                  <td>{e.contact}</td>
                  <td className={cx("colorMuted")}>{e.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
