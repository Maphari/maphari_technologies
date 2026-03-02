"use client";

import { cx } from "../style";

const risks = [
  { id: "RSK-001", project: "Q1 Campaign Strategy", title: "Content calendar delay impacting Q1 launch", probability: "High", impact: "Critical", mitigation: "Fast-track remaining content items", owner: "You", status: "Open" as const },
  { id: "RSK-002", project: "Website Redesign", title: "Accessibility audit may reveal significant rework", probability: "Medium", impact: "High", mitigation: "Run audit early in next sprint", owner: "You", status: "Mitigating" as const },
  { id: "RSK-003", project: "Brand Identity System", title: "Print colour inconsistency across vendors", probability: "Low", impact: "Medium", mitigation: "Request proof prints from all vendors", owner: "You", status: "Open" as const },
  { id: "RSK-004", project: "Annual Report 2025", title: "Pending financial data from client", probability: "Medium", impact: "High", mitigation: "Follow up weekly; use placeholder structure", owner: "You", status: "Mitigating" as const },
];

function probTone(p: string) { if (p === "High") return "badgeRed"; if (p === "Medium") return "badgeAmber"; return "badgeGreen"; }
function impactTone(i: string) { if (i === "Critical") return "badgeRed"; if (i === "High") return "badgeAmber"; return "badge"; }
function statusTone(s: string) { if (s === "Mitigating") return "badgeAmber"; return "badgeRed"; }

export function MyRisksPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-risks">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>My Risks</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Risk entries for your assigned projects</p>
      </div>
      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>ID</th><th>Risk</th><th>Project</th><th>Probability</th><th>Impact</th><th>Mitigation</th><th>Status</th></tr></thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.id}>
                  <td className={cx("fontMono", "text12")}>{r.id}</td>
                  <td className={cx("fw600")}>{r.title}</td>
                  <td className={cx("colorMuted")}>{r.project}</td>
                  <td><span className={cx("badge", probTone(r.probability))}>{r.probability}</span></td>
                  <td><span className={cx("badge", impactTone(r.impact))}>{r.impact}</span></td>
                  <td className={cx("text12", "colorMuted")}>{r.mitigation}</td>
                  <td><span className={cx("badge", statusTone(r.status))}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
