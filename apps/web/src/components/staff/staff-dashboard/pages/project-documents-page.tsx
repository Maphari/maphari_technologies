"use client";

import { cx } from "../style";

const documents = [
  { id: "DOC-001", name: "Project Brief - Brand Identity", project: "Brand Identity System", client: "Volta Studios", type: "Brief", size: "2.4MB", uploadedAt: "Nov 2025", uploadedBy: "PM" },
  { id: "DOC-002", name: "Brand Guidelines v3.2", project: "Brand Identity System", client: "Volta Studios", type: "Deliverable", size: "18MB", uploadedAt: "Feb 2026", uploadedBy: "Senior Designer" },
  { id: "DOC-003", name: "Campaign Strategy Deck", project: "Q1 Campaign Strategy", client: "Kestrel Capital", type: "Deliverable", size: "8.6MB", uploadedAt: "Feb 2026", uploadedBy: "Strategist" },
  { id: "DOC-004", name: "Audience Research Report", project: "Q1 Campaign Strategy", client: "Kestrel Capital", type: "Research", size: "3.2MB", uploadedAt: "Jan 2026", uploadedBy: "Researcher" },
  { id: "DOC-005", name: "Wireframes - Mobile", project: "Website Redesign", client: "Mira Health", type: "Design", size: "5.1MB", uploadedAt: "Feb 2026", uploadedBy: "UX Designer" },
  { id: "DOC-006", name: "Component Library Spec", project: "Editorial Design System", client: "Dune Collective", type: "Spec", size: "4.8MB", uploadedAt: "Jan 2026", uploadedBy: "Designer" },
  { id: "DOC-007", name: "Data Visualisation Concepts", project: "Annual Report 2025", client: "Okafor & Sons", type: "Design", size: "6.2MB", uploadedAt: "Feb 2026", uploadedBy: "Designer" },
  { id: "DOC-008", name: "Client Meeting Notes - Feb", project: "Website Redesign", client: "Mira Health", type: "Notes", size: "120KB", uploadedAt: "Feb 2026", uploadedBy: "PM" },
];

export function ProjectDocumentsPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-documents">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Project Documents</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Project-scoped document vault</p>
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Name</th><th>Project</th><th>Type</th><th>Size</th><th>Uploaded</th><th>By</th><th>Action</th></tr></thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className={cx("fw600")}>{doc.name}</td>
                  <td className={cx("colorMuted")}>{doc.project}</td>
                  <td><span className={cx("badge")}>{doc.type}</span></td>
                  <td className={cx("fontMono", "text12", "colorMuted")}>{doc.size}</td>
                  <td className={cx("text12", "colorMuted")}>{doc.uploadedAt}</td>
                  <td className={cx("text12")}>{doc.uploadedBy}</td>
                  <td><button type="button" className={cx("button", "buttonGhost", "buttonSmall")}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
