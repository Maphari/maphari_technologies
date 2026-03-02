"use client";

import { useState } from "react";
import { cx } from "../style";

type QAItem = {
  id: string;
  title: string;
  project: string;
  category: "Functionality" | "Visual" | "Performance" | "Accessibility" | "Content";
  severity: "Critical" | "Major" | "Minor" | "Info";
  status: "Open" | "In Progress" | "Resolved" | "Won't Fix";
  assignee: string;
  createdAt: string;
};

const qaItems: QAItem[] = [
  { id: "QA-001", title: "Button contrast ratio below 4.5:1 on mobile nav", project: "Website Redesign", category: "Accessibility", severity: "Critical", status: "Open", assignee: "You", createdAt: "Feb 18, 2026" },
  { id: "QA-002", title: "Hero image loads at 4.2MB on slow connections", project: "Website Redesign", category: "Performance", severity: "Major", status: "In Progress", assignee: "You", createdAt: "Feb 16, 2026" },
  { id: "QA-003", title: "Logo spacing inconsistent between mobile and desktop", project: "Brand Identity System", category: "Visual", severity: "Minor", status: "In Progress", assignee: "You", createdAt: "Feb 15, 2026" },
  { id: "QA-004", title: "Campaign CTA links to staging environment", project: "Q1 Campaign Strategy", category: "Functionality", severity: "Critical", status: "Open", assignee: "You", createdAt: "Feb 20, 2026" },
  { id: "QA-005", title: "Typographic scale docs missing font fallbacks", project: "Editorial Design System", category: "Content", severity: "Minor", status: "Resolved", assignee: "You", createdAt: "Feb 10, 2026" },
  { id: "QA-006", title: "Dark mode colour tokens undefined for alerts", project: "Brand Identity System", category: "Visual", severity: "Major", status: "Open", assignee: "You", createdAt: "Feb 19, 2026" },
  { id: "QA-007", title: "Chart legend overlaps data labels at 320px", project: "Annual Report 2025", category: "Visual", severity: "Minor", status: "Won't Fix", assignee: "You", createdAt: "Feb 12, 2026" },
];

function severityTone(s: string) {
  if (s === "Critical") return "badgeRed";
  if (s === "Major") return "badgeAmber";
  return "badge";
}

function statusTone(s: string) {
  if (s === "Resolved") return "badgeGreen";
  if (s === "In Progress") return "badgeAmber";
  if (s === "Open") return "badgeRed";
  return "badge";
}

export function QAChecklistPage({ isActive }: { isActive: boolean }) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? qaItems : qaItems.filter((i) => i.status === filter);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-qa-checklist">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Quality</div>
        <h1 className={cx("pageTitleText")}>QA Checklist</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Quality review checklist and defect tracking</p>
      </div>

      <div className={cx("stats", "stats4", "mb28")}>
        {[
          { label: "Open", value: String(qaItems.filter((i) => i.status === "Open").length), tone: "colorRed" },
          { label: "In Progress", value: String(qaItems.filter((i) => i.status === "In Progress").length), tone: "colorAmber" },
          { label: "Resolved", value: String(qaItems.filter((i) => i.status === "Resolved").length), tone: "colorGreen" },
          { label: "Total Issues", value: String(qaItems.length), tone: "colorAccent" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("filterBar", "mb20")}>
        {["all", "Open", "In Progress", "Resolved", "Won't Fix"].map((f) => (
          <button key={f} type="button" className={cx("filterChip", filter === f && "filterChipActive")} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Issue</th>
                <th>Project</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className={cx("fontMono", "text12")}>{item.id}</td>
                  <td className={cx("fw600")}>{item.title}</td>
                  <td className={cx("colorMuted")}>{item.project}</td>
                  <td><span className={cx("badge")}>{item.category}</span></td>
                  <td><span className={cx("badge", severityTone(item.severity))}>{item.severity}</span></td>
                  <td><span className={cx("badge", statusTone(item.status))}>{item.status}</span></td>
                  <td className={cx("colorMuted", "text12")}>{item.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
