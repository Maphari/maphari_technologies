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

const statusConfig: Record<ProjectStatus, { label: string; dotClass: string; badgeClass: string }> = {
  active: { label: "Active", dotClass: "pcStatusDotActive", badgeClass: "pcStatusBadgeActive" },
  at_risk: { label: "At Risk", dotClass: "pcStatusDotAtRisk", badgeClass: "pcStatusBadgeAtRisk" },
  critical: { label: "Critical", dotClass: "pcStatusDotCritical", badgeClass: "pcStatusBadgeCritical" }
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
    <div className={cx("pcCredentialRow")}>
      <div className={cx("flex1", "minW0")}>
        <div className={cx("pcCredentialLabel")}>{label}</div>
        <div className={cx("pcCredentialValue", hidden && !revealed ? "pcCredentialValueHidden" : "pcCredentialValueVisible")}>
          {hidden && !revealed ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : value}
        </div>
      </div>
      <div className={cx("flexRow", "gap6", "noShrink")}>
        {hidden ? (
          <button type="button"
            onClick={() => setRevealed((previous) => !previous)}
            className={cx("pcCredentialBtn")}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        ) : null}
        <button
          onClick={handleCopy}
          type="button"
          className={cx("pcCredentialBtn", copied ? "pcCredentialBtnCopied" : "pcCredentialBtnIdle")}
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-context">
      <div className={cx("pcLayout")}>
        <div className={cx("pcSidebar")}>
          <div className={cx("pageHeaderBar", "pcSidebarHeader")}>
            <div className={cx("pageEyebrow", "mb6")}>
              Staff Dashboard
            </div>
            <h1 className={cx("pageTitle", "pcSidebarTitle")}>
              Project Context
            </h1>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects..."
              className={cx("pcSearchInput")}
            />
          </div>

          {filtered.some((project) => project.pinned) ? (
            <div className={cx("pcSidebarSection")}>
              <div className={cx("pcSidebarGroupLabel")}>
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
                      className={cx("pcProjectItem", isSelected && "pcProjectItemActive")}
                      onClick={() => {
                        setSelected(project.id);
                        setActiveTab("overview");
                      }}
                    >
                      <div className={cx("flexRow", "gap8", "mb4")}>
                        <div className={cx("pcProjectAvatar")}>
                          {project.avatar}
                        </div>
                        <span className={cx("pcProjectName", isSelected ? "pcProjectNameActive" : "pcProjectNameIdle")}>
                          {project.client}
                        </span>
                        <div className={cx("pcStatusDot", status.dotClass)} />
                      </div>
                      <div className={cx("pcProjectSub")}>
                        {project.project}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}

          <div className={cx("pcSidebarSectionAll")}>
            <div className={cx("pcSidebarGroupLabel", "mt8")}>
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
                    className={cx("pcProjectItem", isSelected && "pcProjectItemActive")}
                    onClick={() => {
                      setSelected(project.id);
                      setActiveTab("overview");
                    }}
                  >
                    <div className={cx("flexRow", "gap8", "mb4")}>
                      <div className={cx("pcProjectAvatar")}>
                        {project.avatar}
                      </div>
                      <span className={cx("pcProjectName", isSelected ? "pcProjectNameActive" : "pcProjectNameIdle")}>
                        {project.client}
                      </span>
                      <div className={cx("pcStatusDot", status.dotClass)} />
                    </div>
                    <div className={cx("pcProjectSub")}>
                      {project.project}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {current ? (
          <div className={cx("flexCol", "overflowAuto")}>
            <div className={cx("pcDetailHeader")}>
              <div className={cx("flexBetween", "mb16")}>
                <div>
                  <div className={cx("flexRow", "gap10", "mb6")}>
                    <div className={cx("pcDetailAvatar")}>
                      {current.avatar}
                    </div>
                    <div>
                      <div className={cx("fontDisplay", "fw800", "colorText", "pcDetailClientName")}>{current.client}</div>
                      <div className={cx("text11", "colorMuted2")}>{current.project}</div>
                    </div>
                  </div>
                </div>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("pcStatusBadge", statusConfig[current.status].badgeClass)}>
                    {statusConfig[current.status].label}
                  </span>
                  <span className={cx("pcPhaseBadge")}>
                    {current.phase}
                  </span>
                  {current.pinned ? <span className={cx("text12", "colorAccent")}>&loz;</span> : null}
                </div>
              </div>

              <div className={cx("flexRow", "gap24", "mb16")}>
                {[
                  { label: "Timezone", value: current.timezone },
                  { label: "Started", value: current.startDate },
                  { label: "Deadline", value: current.deadline },
                  { label: "Contact", value: current.contactName },
                  { label: "Lead", value: current.staffLead }
                ].map((meta) => (
                  <div key={meta.label}>
                    <div className={cx("pcMetaLabel")}>
                      {meta.label}
                    </div>
                    <div className={cx("text11", "colorMuted")}>{meta.value}</div>
                  </div>
                ))}
              </div>

              <div className={cx("flexRow")}>
                {[
                  { key: "overview", label: "Overview" },
                  { key: "preferences", label: "Preferences" },
                  { key: "constraints", label: "Constraints" },
                  { key: "credentials", label: "Credentials" },
                  { key: "decisions", label: "Decisions" }
                ].map((tab) => (
                  <button type="button"
                    key={tab.key}
                    className={cx("pcTabBtn", activeTab === tab.key && "pcTabBtnActive")}
                    onClick={() => setActiveTab(tab.key as "overview" | "preferences" | "constraints" | "credentials" | "decisions")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cx("pcTabContent")}>
              {activeTab === "overview" ? (
                <div className={cx("grid2", "gap24")}>
                  <div>
                    <div className={cx("pcSectionLabel", "mb14")}>
                      Primary Contact
                    </div>
                    <div className={cx("pcContactCard")}>
                      <div className={cx("fontDisplay", "fw700", "colorText", "pcContactName")}>
                        {current.contactName}
                      </div>
                      <div className={cx("text11", "colorMuted2", "mb10")}>{current.contactRole}</div>
                      <div className={cx("text11", "colorMuted", "mb6")}>&hearts; {current.contactEmail}</div>
                      <div className={cx("text11", "colorMuted")}>&loz; {current.responseTime}</div>
                    </div>

                    <div className={cx("pcSectionLabel", "mb10")}>
                      Staff Notes
                    </div>
                    <div className={cx("pcNotesCard")}>
                      {current.notes}
                    </div>
                  </div>

                  <div>
                    <div className={cx("pcSectionLabel", "mb14")}>
                      Key Preferences
                    </div>
                    <div className={cx("mb20")}>
                      {current.preferences.slice(0, 3).map((preference, index) => (
                        <div key={index} className={cx("pcPrefRow")}>
                          <span className={cx("colorAccent", "text12", "noShrink", "pcArrowTight")}>&rarr;</span>
                          <span className={cx("text12", "colorMuted", "pcCopyTight")}>{preference}</span>
                        </div>
                      ))}
                    </div>

                    <div className={cx("pcSectionLabel", "mb14")}>
                      Latest Decision
                    </div>
                    {current.decisions[0] ? (
                      <div className={cx("pcDecisionCard")}>
                        <div className={cx("text10", "colorMuted2", "mb6")}>{current.decisions[0].date}</div>
                        <div className={cx("text12", "colorMuted", "pcCopyTight")}>{current.decisions[0].text}</div>
                      </div>
                    ) : null}

                    {current.status === "critical" ? (
                      <div className={cx("pcCriticalBanner")}>
                        <div className={cx("text11", "colorRed", "mb4")}>&loz; Critical status</div>
                        <div className={cx("text11", "colorMuted")}>This project requires immediate attention. Review notes and escalate if needed.</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeTab === "preferences" ? (
                <div className={cx("pcListWrap")}>
                  <div className={cx("pcSectionLabel", "mb16")}>
                    Working Preferences - {current.client}
                  </div>
                  {current.preferences.map((preference, index) => (
                    <div key={index} className={cx("pcListRow")}>
                      <span className={cx("colorAccent", "text14", "noShrink", "pcArrowTight")}>&rarr;</span>
                      <span className={cx("text13", "colorMuted", "pcCopyRelaxed")}>{preference}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "constraints" ? (
                <div className={cx("pcListWrap")}>
                  <div className={cx("pcSectionLabel", "mb16")}>
                    Constraints & Rules - {current.client}
                  </div>
                  {current.constraints.map((constraint, index) => (
                    <div key={index} className={cx("pcListRow")}>
                      <span className={cx("colorRed", "text12", "noShrink", "pcSquareTight")}>&squf;</span>
                      <span className={cx("text13", "colorMuted", "pcCopyRelaxed")}>{constraint}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "credentials" ? (
                <div className={cx("pcCredentialsWrap")}>
                  <div className={cx("pcSectionLabel", "mb6")}>
                    Credentials & Links
                  </div>
                  <div className={cx("text11", "colorMuted2", "mb16")}>
                    Sensitive credentials are hidden by default. Click Show to reveal.
                  </div>
                  <div className={cx("flexCol", "gap8")}>
                    {current.credentials.map((credential, index) => (
                      <CopyableField key={index} label={credential.label} value={credential.value} hidden={credential.hidden} />
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "decisions" ? (
                <div className={cx("pcListWrap")}>
                  <div className={cx("pcSectionLabel", "mb16")}>
                    Decision Log - {current.client}
                  </div>
                  {current.decisions.map((decision, index) => (
                    <div key={index} className={cx("pcDecisionRow")}>
                      <div className={cx("pcDecisionDate")}>
                        <span className={cx("text10", "colorMuted2")}>{decision.date}</span>
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("text13", "colorMuted", "pcCopyRelaxed")}>{decision.text}</div>
                      </div>
                    </div>
                  ))}
                  <div className={cx("pcAddDecision")}>
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
