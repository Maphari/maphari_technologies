"use client";

import { cx } from "../style";

const deliverables = [
  { id: "DEL-001", name: "Brand Guidelines PDF v3.2", milestone: "Phase 2 — Guidelines", format: "PDF", status: "Ready" as const, deliveredAt: "Feb 18, 2026" },
  { id: "DEL-002", name: "Logo Suite — Primary, Secondary, Icon", milestone: "Phase 1 — Identity", format: "SVG/PNG", status: "Ready" as const, deliveredAt: "Jan 28, 2026" },
  { id: "DEL-003", name: "Dashboard High-Fidelity Mockups", milestone: "Phase 3 — UI Design", format: "Figma", status: "In Progress" as const, deliveredAt: "—" },
  { id: "DEL-004", name: "Motion Language Specifications", milestone: "Phase 2 — Guidelines", format: "PDF", status: "In Progress" as const, deliveredAt: "—" },
  { id: "DEL-005", name: "Icon Library — 48 Icons", milestone: "Phase 2 — Guidelines", format: "SVG", status: "Pending" as const, deliveredAt: "—" },
];

export function DeliverableStatusPage() {
  const ready = deliverables.filter((d) => d.status === "Ready").length;
  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Deliverables</div>
          <h1 className={cx("pageTitle")}>Deliverables</h1>
          <p className={cx("pageSub")}>Track deliverable status and download completed items.</p>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Ready to Download", value: String(ready), color: "var(--accent)" },
          { label: "In Progress", value: String(deliverables.filter((d) => d.status === "In Progress").length), color: "var(--amber)" },
          { label: "Pending", value: String(deliverables.filter((d) => d.status === "Pending").length), color: "var(--muted)" },
        ].map((s) => (
          <div key={s.label} className={cx("card", "p16")}>
            <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800")} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("card")}>
        <table className={cx("table")}>
          <thead><tr><th>Deliverable</th><th>Milestone</th><th>Format</th><th>Delivered</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {deliverables.map((d) => (
              <tr key={d.id}>
                <td className={cx("fw600")}>{d.name}</td>
                <td className={cx("text12", "colorMuted")}>{d.milestone}</td>
                <td className={cx("fontMono", "text12")}>{d.format}</td>
                <td className={cx("text12", "colorMuted")}>{d.deliveredAt}</td>
                <td><span className={cx("badge", d.status === "Ready" ? "badgeGreen" : d.status === "In Progress" ? "badgeAmber" : "badge")}>{d.status}</span></td>
                <td>{d.status === "Ready" && <button type="button" className={cx("btnSm", "btnAccent")}>Download</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
