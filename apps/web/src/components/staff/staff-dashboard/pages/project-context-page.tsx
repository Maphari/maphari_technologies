"use client";

import { useState } from "react";
import { cx } from "../style";

type ProjectStatus = "active" | "at_risk" | "critical";

type ProjectContext = {
  id: number;
  client: string;
  project: string;
  avatar: string;
  status: ProjectStatus;
  phase: string;
  startDate: string;
  deadline: string;
  staffLead: string;
  pinned: boolean;
  timezone: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  responseTime: string;
  preferences: string[];
  constraints: string[];
  credentials: Array<{ label: string; value: string; hidden: boolean }>;
  decisions: Array<{ date: string; text: string }>;
  notes: string;
};

const projects: ProjectContext[] = [
  {
    id: 1,
    client: "Volta Studios",
    project: "Brand Identity System",
    avatar: "VS",
    status: "active",
    phase: "Design",
    startDate: "Jan 6, 2026",
    deadline: "Mar 14, 2026",
    staffLead: "You",
    pinned: true,
    timezone: "GMT+2 (SAST)",
    contactName: "Lena Muller",
    contactRole: "Creative Director",
    contactEmail: "lena@voltastudios.co",
    responseTime: "Usually replies within 2-4 hours",
    preferences: [
      "Prefers visual references over written briefs",
      "Hates Comic Sans (obviously) - and anything overly corporate",
      "Wants 3 concepts minimum per design deliverable",
      "Async-first; doesn't like unscheduled calls"
    ],
    constraints: [
      "Budget approved at R285,000 - no overruns without written sign-off",
      "All assets must be delivered in both RGB and CMYK",
      "No direct contact with the CEO - all feedback through Lena"
    ],
    credentials: [
      { label: "Brand Drive", value: "drive.google.com/volta-brand", hidden: false },
      { label: "Figma workspace", value: "figma.com/team/volta", hidden: false },
      { label: "Slack channel", value: "#client-volta", hidden: false }
    ],
    decisions: [
      {
        date: "Feb 18",
        text: "Agreed to go with Concept B direction - warmer amber secondary instead of original cool grey."
      },
      {
        date: "Feb 10",
        text: "Scope extended to include brand animation guidelines - added R18,000 to invoice."
      },
      {
        date: "Jan 22",
        text: "Typography: settled on Syne + DM Mono pairing after Lena rejected the original serif options."
      }
    ],
    notes:
      "Lena is particular but communicates well. If she goes quiet for more than 48 hours, follow up - she tends to lose track of Slack. The CEO (Tobias) has strong opinions; if he ever shows up on a call, loop in the account manager."
  },
  {
    id: 2,
    client: "Kestrel Capital",
    project: "Q1 Campaign Strategy",
    avatar: "KC",
    status: "at_risk",
    phase: "Strategy",
    startDate: "Jan 20, 2026",
    deadline: "Feb 28, 2026",
    staffLead: "You",
    pinned: true,
    timezone: "GMT+1 (CET)",
    contactName: "Marcus Rehn",
    contactRole: "Head of Marketing",
    contactEmail: "m.rehn@kestrelcapital.com",
    responseTime: "Slow to respond - average 24-48h. Always follows up eventually.",
    preferences: [
      "Data-first mindset - always back recommendations with numbers",
      "Prefers executive-style decks (10 slides max)",
      "Wants to be CC'd on all internal milestone emails"
    ],
    constraints: [
      "Compliance team must review any financial claims before publication",
      "Competitor names cannot appear in any external materials",
      "All comms must be in English - no Afrikaans or colloquial language"
    ],
    credentials: [
      { label: "Shared Drive", value: "drive.kestrelcapital.com/agency", hidden: false },
      { label: "Brand Portal", value: "brand.kestrelcapital.com", hidden: false },
      { label: "Invoice email", value: "ap@kestrelcapital.com", hidden: false }
    ],
    decisions: [
      { date: "Feb 12", text: "Decided to focus Q1 campaign on EMEA market only - US rollout pushed to Q2." },
      { date: "Feb 3", text: "KPI framework approved with CAC and LTV as primary metrics." },
      {
        date: "Jan 28",
        text: "Channel strategy: LinkedIn primary, Instagram secondary. Paid search de-prioritised per Marcus."
      }
    ],
    notes:
      "Marcus is difficult to reach but trustworthy when he does respond. The invoice issue is not his fault - it's stuck in their AP department. Don't escalate directly to Marcus about payment; speak to the account manager who has a relationship with their CFO."
  },
  {
    id: 3,
    client: "Mira Health",
    project: "Website Redesign",
    avatar: "MH",
    status: "active",
    phase: "UX Design",
    startDate: "Dec 15, 2025",
    deadline: "Apr 4, 2026",
    staffLead: "You",
    pinned: false,
    timezone: "GMT+2 (SAST)",
    contactName: "Dr. Amara Nkosi",
    contactRole: "Chief Digital Officer",
    contactEmail: "amara.nkosi@mirahealth.org",
    responseTime: "Responds fastest on mornings before 10 AM",
    preferences: [
      "Clinical, clean aesthetic - heavily accessibility focused (WCAG AAA)",
      "Wants all patient-facing copy reviewed by their internal clinical team",
      "Responsive-first: mobile is primary, desktop secondary"
    ],
    constraints: [
      "POPIA compliant - no user data stored client-side",
      "All images must be licensed or original - no stock with identifiable faces",
      "Colour palette must pass contrast tests with a minimum 7:1 ratio"
    ],
    credentials: [
      { label: "Dev environment", value: "dev.mirahealth.org", hidden: false },
      { label: "CMS access", value: "cms.mirahealth.org/admin", hidden: true },
      { label: "Analytics", value: "analytics.mirahealth.org", hidden: false }
    ],
    decisions: [
      { date: "Feb 15", text: "Booking flow will use a 4-step wizard - simplified from original 7-step model." },
      { date: "Jan 30", text: "Navigation labels changed from medical jargon to patient-friendly language." },
      { date: "Jan 12", text: "Decided on Framer for build - their team has in-house Framer skills for handover." }
    ],
    notes:
      "Dr. Nkosi is brilliant but time-poor. Keep all briefs under 1 page. The clinical review loop adds 5-7 business days to any copy deliverable - factor this into timelines."
  },
  {
    id: 4,
    client: "Dune Collective",
    project: "Editorial Design System",
    avatar: "DC",
    status: "critical",
    phase: "Delivery",
    startDate: "Nov 3, 2025",
    deadline: "Feb 10, 2026",
    staffLead: "You",
    pinned: false,
    timezone: "GMT+1 (WAT)",
    contactName: "Kofi Asante",
    contactRole: "Editor-in-Chief",
    contactEmail: "kofi@dunecollective.com",
    responseTime: "Unpredictable - sometimes instant, sometimes 2 weeks silent.",
    preferences: [
      "High editorial standards - influenced by Kinfolk and 032c aesthetics",
      "Dislikes digital-first design thinking; always think print-ready",
      "Wants work presented as physical mockups, not just Figma screens"
    ],
    constraints: [
      "All type at minimum 8pt in final print files",
      "Budget is tight - no scope additions without explicit written approval",
      "Deadline is firm - publication goes to print regardless"
    ],
    credentials: [
      { label: "File server", value: "files.dunecollective.com", hidden: false },
      { label: "Printer portal", value: "printportal.dune.com", hidden: true }
    ],
    decisions: [
      { date: "Jan 20", text: "Settled on 12-column grid at 8pt baseline - matched to their existing Quark templates." },
      { date: "Dec 18", text: "Kofi rejected original type scale - too digital. Reworked to reflect editorial rhythm." },
      { date: "Nov 20", text: "Decided to deliver as InDesign package, not Figma. Their team uses CC exclusively." }
    ],
    notes:
      "This project is overdue and at serious risk. Kofi goes silent then appears with urgent demands. The print deadline is real - if we miss it they lose an entire issue. Escalate to account manager if no response within 24 hours."
  }
];

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" },
  at_risk: { label: "At Risk", color: "#f5c518", bg: "rgba(245,197,24,0.1)" },
  critical: { label: "Critical", color: "#ff4444", bg: "rgba(255,68,68,0.1)" }
};

function CopyableField({ label, value, hidden }: { label: string; value: string; hidden: boolean }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 3,
        gap: 12
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 9,
            color: "var(--muted2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 2
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 11, color: hidden && !revealed ? "#333344" : "#a0a0b0", fontFamily: "'DM Mono', monospace" }}>
          {hidden && !revealed ? "••••••••••••" : value}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {hidden ? (
          <button
            onClick={() => setRevealed((previous) => !previous)}
            type="button"
            style={{ fontSize: 10, color: "var(--muted2)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        ) : null}
        <button
          onClick={handleCopy}
          type="button"
          style={{
            fontSize: 10,
            color: copied ? "var(--accent)" : "var(--muted2)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function ProjectContextPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState(projects[0].id);
  const [activeTab, setActiveTab] = useState<"overview" | "preferences" | "constraints" | "credentials" | "decisions">("overview");
  const [search, setSearch] = useState("");

  const filtered = projects.filter(
    (project) =>
      project.client.toLowerCase().includes(search.toLowerCase()) ||
      project.project.toLowerCase().includes(search.toLowerCase())
  );
  const current = projects.find((project) => project.id === selected);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-context">
      <style>{`
        .context-proj-item { transition: all 0.12s ease; cursor: pointer; }
        .context-proj-item:hover { background: color-mix(in srgb, var(--accent) 4%, transparent) !important; }
        .context-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
      `}</style>

      <div style={{ minHeight: "calc(100vh - 220px)", display: "grid", gridTemplateColumns: "280px 1fr" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
              Staff Dashboard
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
              Project Context
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects..."
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3,
                color: "var(--text)",
                fontSize: 11
              }}
            />
          </div>

          {filtered.some((project) => project.pinned) ? (
            <div style={{ padding: "12px 20px 6px" }}>
              <div style={{ fontSize: 9, color: "#333344", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                Pinned
              </div>
              {filtered
                .filter((project) => project.pinned)
                .map((project) => {
                  const isSelected = selected === project.id;
                  const status = statusConfig[project.status];
                  return (
                    <div
                      key={project.id}
                      className="context-proj-item"
                      onClick={() => {
                        setSelected(project.id);
                        setActiveTab("overview");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 3,
                        marginBottom: 4,
                        background: isSelected ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                        border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "transparent"}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 8,
                            color: "#a0a0b0"
                          }}
                        >
                          {project.avatar}
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: isSelected ? "#fff" : "#a0a0b0",
                            fontWeight: isSelected ? 500 : 400,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {project.client}
                        </span>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, flexShrink: 0 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#333344", paddingLeft: 30, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {project.project}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}

          <div style={{ padding: "6px 20px 20px", flex: 1 }}>
            <div style={{ fontSize: 9, color: "#333344", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, marginTop: 8 }}>
              All Projects
            </div>
            {filtered
              .filter((project) => !project.pinned)
              .map((project) => {
                const isSelected = selected === project.id;
                const status = statusConfig[project.status];
                return (
                  <div
                    key={project.id}
                    className="context-proj-item"
                    onClick={() => {
                      setSelected(project.id);
                      setActiveTab("overview");
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 3,
                      marginBottom: 4,
                      background: isSelected ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                      border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "transparent"}`
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 2,
                          background: "rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          color: "#a0a0b0"
                        }}
                      >
                        {project.avatar}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: isSelected ? "#fff" : "#a0a0b0",
                          fontWeight: isSelected ? 500 : 400,
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {project.client}
                      </span>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, flexShrink: 0 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#333344", paddingLeft: 30, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {project.project}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {current ? (
          <div style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "16px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#a0a0b0"
                      }}
                    >
                      {current.avatar}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>{current.client}</div>
                      <div style={{ fontSize: 11, color: "var(--muted2)" }}>{current.project}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 2,
                      background: statusConfig[current.status].bg,
                      color: statusConfig[current.status].color,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase"
                    }}
                  >
                    {statusConfig[current.status].label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.04)",
                      color: "#a0a0b0",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase"
                    }}
                  >
                    {current.phase}
                  </span>
                  {current.pinned ? <span style={{ fontSize: 12, color: "var(--accent)" }}>◈</span> : null}
                </div>
              </div>

              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                {[
                  { label: "Timezone", value: current.timezone },
                  { label: "Started", value: current.startDate },
                  { label: "Deadline", value: current.deadline },
                  { label: "Contact", value: current.contactName },
                  { label: "Lead", value: current.staffLead }
                ].map((meta) => (
                  <div key={meta.label}>
                    <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#a0a0b0" }}>{meta.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 0 }}>
                {[
                  { key: "overview", label: "Overview" },
                  { key: "preferences", label: "Preferences" },
                  { key: "constraints", label: "Constraints" },
                  { key: "credentials", label: "Credentials" },
                  { key: "decisions", label: "Decisions" }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className="context-tab-btn"
                    onClick={() => setActiveTab(tab.key as "overview" | "preferences" | "constraints" | "credentials" | "decisions")}
                    type="button"
                    style={{
                      padding: "10px 18px",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      background: "transparent",
                      color: activeTab === tab.key ? "var(--accent)" : "var(--muted2)",
                      borderBottom: `2px solid ${activeTab === tab.key ? "var(--accent)" : "transparent"}`,
                      marginBottom: -1
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "24px", flex: 1 }}>
              {activeTab === "overview" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                      Primary Contact
                    </div>
                    <div
                      style={{
                        padding: 16,
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.01)",
                        marginBottom: 16
                      }}
                    >
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                        {current.contactName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 10 }}>{current.contactRole}</div>
                      <div style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 6 }}>✉ {current.contactEmail}</div>
                      <div style={{ fontSize: 11, color: "#a0a0b0" }}>◷ {current.responseTime}</div>
                    </div>

                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                      Staff Notes
                    </div>
                    <div
                      style={{
                        padding: "14px 16px",
                        background: "rgba(167,139,250,0.05)",
                        border: "1px solid rgba(167,139,250,0.15)",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#a0a0b0",
                        lineHeight: 1.7
                      }}
                    >
                      {current.notes}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                      Key Preferences
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      {current.preferences.slice(0, 3).map((preference, index) => (
                        <div
                          key={index}
                          style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        >
                          <span style={{ color: "var(--accent)", fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                          <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{preference}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                      Latest Decision
                    </div>
                    {current.decisions[0] ? (
                      <div style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                        <div style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 6 }}>{current.decisions[0].date}</div>
                        <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{current.decisions[0].text}</div>
                      </div>
                    ) : null}

                    {current.status === "critical" ? (
                      <div style={{ marginTop: 16, padding: "12px 14px", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 4, background: "rgba(255,68,68,0.06)" }}>
                        <div style={{ fontSize: 11, color: "#ff4444", marginBottom: 4 }}>⚠ Critical status</div>
                        <div style={{ fontSize: 11, color: "#a0a0b0" }}>This project requires immediate attention. Review notes and escalate if needed.</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeTab === "preferences" ? (
                <div style={{ maxWidth: 580 }}>
                  <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                    Working Preferences - {current.client}
                  </div>
                  {current.preferences.map((preference, index) => (
                    <div key={index} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "var(--accent)", fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
                      <span style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.6 }}>{preference}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "constraints" ? (
                <div style={{ maxWidth: 580 }}>
                  <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                    Constraints & Rules - {current.client}
                  </div>
                  {current.constraints.map((constraint, index) => (
                    <div key={index} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "#ff4444", fontSize: 12, flexShrink: 0, marginTop: 2 }}>⚑</span>
                      <span style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.6 }}>{constraint}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "credentials" ? (
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                    Credentials & Links
                  </div>
                  <div style={{ fontSize: 11, color: "#333344", marginBottom: 16 }}>
                    Sensitive credentials are hidden by default. Click Show to reveal.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {current.credentials.map((credential, index) => (
                      <CopyableField key={index} label={credential.label} value={credential.value} hidden={credential.hidden} />
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "decisions" ? (
                <div style={{ maxWidth: 580 }}>
                  <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                    Decision Log - {current.client}
                  </div>
                  {current.decisions.map((decision, index) => (
                    <div key={index} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 60, flexShrink: 0, paddingTop: 2 }}>
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>{decision.date}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.6 }}>{decision.text}</div>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      border: "1px dashed rgba(255,255,255,0.1)",
                      borderRadius: 3,
                      fontSize: 11,
                      color: "#333344",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    + Log a new decision
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
