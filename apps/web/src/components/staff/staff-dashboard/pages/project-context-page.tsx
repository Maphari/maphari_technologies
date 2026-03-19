// ════════════════════════════════════════════════════════════════════════════
// project-context-page.tsx — Staff Project Context
// Data     : getStaffProjects → GET /staff/projects
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapStatus(raw: string): "active" | "at_risk" | "critical" {
  const s = raw.toUpperCase();
  if (s === "AT_RISK" || s === "ON_HOLD") return "at_risk";
  if (s === "CRITICAL" || s === "OVERDUE") return "critical";
  return "active";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ProjectStatus = "active" | "at_risk" | "critical";

type ProjectContext = {
  id: string;
  client: string;
  project: string;
  avatar: string;
  status: ProjectStatus;
  phase: string;
  startDate: string;
  deadline: string;
  staffLead: string;
  pinned: boolean;
};

const statusConfig: Record<ProjectStatus, { label: string; dotClass: string; badgeClass: string }> = {
  active:   { label: "Active",   dotClass: "pcStatusDotActive",   badgeClass: "pcStatusBadgeActive"   },
  at_risk:  { label: "At Risk",  dotClass: "pcStatusDotAtRisk",   badgeClass: "pcStatusBadgeAtRisk"   },
  critical: { label: "Critical", dotClass: "pcStatusDotCritical", badgeClass: "pcStatusBadgeCritical" },
};

function toProjectContext(p: StaffProject): ProjectContext {
  return {
    id:        p.id,
    client:    p.name,
    project:   p.description ?? p.name,
    avatar:    initials(p.name),
    status:    mapStatus(p.status),
    phase:     p.status.replace(/_/g, " "),
    startDate: formatDate(p.startAt),
    deadline:  formatDate(p.dueAt),
    staffLead: p.ownerName ?? "—",
    pinned:    false,
  };
}

function ProjectItem({ p, isSelected, onSelect }: { p: ProjectContext; isSelected: boolean; onSelect: () => void }) {
  const status = statusConfig[p.status];
  return (
    <div className={cx("pcProjectItem", isSelected && "pcProjectItemActive")} onClick={onSelect}>
      <div className={cx("flexRow", "gap8", "mb4")}>
        <div className={cx("pcProjectAvatar")}>{p.avatar}</div>
        <span className={cx("pcProjectName", isSelected ? "pcProjectNameActive" : "pcProjectNameIdle")}>{p.client}</span>
        <div className={cx("pcStatusDot", status.dotClass)} />
      </div>
      <div className={cx("pcProjectSub")}>{p.project}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectContextPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "phase">("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getStaffProjects(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        const mapped = r.data.map(toProjectContext);
        setProjects(mapped);
        setSelected((prev) => prev ?? (mapped[0]?.id ?? null));
      }
      setLoading(false);
    });
  }, [session]);

  const filtered = projects.filter(
    (p) => p.client.toLowerCase().includes(search.toLowerCase()) || p.project.toLowerCase().includes(search.toLowerCase())
  );
  const current = projects.find((p) => p.id === selected) ?? null;

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-context">
      <div className={cx("pcLayout")}>
        <div className={cx("pcSidebar")}>
          <div className={cx("pageHeaderBar", "pcSidebarHeader")}>
            <div className={cx("pageEyebrow", "mb6")}>Staff Dashboard</div>
            <h1 className={cx("pageTitle", "pcSidebarTitle")}>Project Context</h1>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className={cx("pcSearchInput")} />
          </div>

          {filtered.length === 0 ? (
            <div className={cx("pcSidebarSection")}><div className={cx("pcSidebarGroupLabel")}>No projects found</div></div>
          ) : (
            <>
              {filtered.some((p) => p.pinned) ? (
                <div className={cx("pcSidebarSection")}>
                  <div className={cx("pcSidebarGroupLabel")}>Pinned</div>
                  {filtered.filter((p) => p.pinned).map((p) => (
                    <ProjectItem key={p.id} p={p} isSelected={selected === p.id} onSelect={() => { setSelected(p.id); setActiveTab("overview"); }} />
                  ))}
                </div>
              ) : null}
              <div className={cx("pcSidebarSectionAll")}>
                <div className={cx("pcSidebarGroupLabel", "mt8")}>All Projects</div>
                {filtered.filter((p) => !p.pinned).map((p) => (
                  <ProjectItem key={p.id} p={p} isSelected={selected === p.id} onSelect={() => { setSelected(p.id); setActiveTab("overview"); }} />
                ))}
              </div>
            </>
          )}
        </div>

        {current ? (
          <div className={cx("flexCol", "overflowAuto")}>
            <div className={cx("pcDetailHeader")}>
              <div className={cx("flexBetween", "mb16")}>
                <div className={cx("flexRow", "gap10", "mb6")}>
                  <div className={cx("pcDetailAvatar")}>{current.avatar}</div>
                  <div>
                    <div className={cx("fontDisplay", "fw800", "colorText", "pcDetailClientName")}>{current.client}</div>
                    <div className={cx("text11", "colorMuted2")}>{current.project}</div>
                  </div>
                </div>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("pcStatusBadge", statusConfig[current.status].badgeClass)}>{statusConfig[current.status].label}</span>
                  <span className={cx("pcPhaseBadge")}>{current.phase}</span>
                  {current.pinned ? <span className={cx("text12", "colorAccent")}>&loz;</span> : null}
                </div>
              </div>

              <div className={cx("flexRow", "gap24", "mb16")}>
                {[{ label: "Started", value: current.startDate }, { label: "Deadline", value: current.deadline }, { label: "Lead", value: current.staffLead }].map((meta) => (
                  <div key={meta.label}>
                    <div className={cx("pcMetaLabel")}>{meta.label}</div>
                    <div className={cx("text11", "colorMuted")}>{meta.value}</div>
                  </div>
                ))}
              </div>

              <div className={cx("flexRow")}>
                {[{ key: "overview", label: "Overview" }, { key: "phase", label: "Phase" }].map((tab) => (
                  <button type="button" key={tab.key} className={cx("pcTabBtn", activeTab === tab.key && "pcTabBtnActive")} onClick={() => setActiveTab(tab.key as "overview" | "phase")}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cx("pcTabContent")}>
              {activeTab === "overview" ? (
                <div className={cx("grid2", "gap24")}>
                  <div>
                    <div className={cx("pcSectionLabel", "mb14")}>Project Details</div>
                    <div className={cx("pcContactCard")}>
                      <div className={cx("fontDisplay", "fw700", "colorText", "pcContactName")}>{current.client}</div>
                      <div className={cx("text11", "colorMuted2", "mb10")}>{current.project}</div>
                      <div className={cx("text11", "colorMuted", "mb6")}>&loz; {current.phase}</div>
                      <div className={cx("text11", "colorMuted")}>&rarr; {current.staffLead}</div>
                    </div>
                  </div>
                  <div>
                    <div className={cx("pcSectionLabel", "mb14")}>Timeline</div>
                    <div className={cx("pcContactCard")}>
                      <div className={cx("text11", "colorMuted", "mb6")}>Started: {current.startDate}</div>
                      <div className={cx("text11", "colorMuted")}>Deadline: {current.deadline}</div>
                    </div>
                    {current.status === "critical" ? (
                      <div className={cx("pcCriticalBanner")}>
                        <div className={cx("text11", "colorRed", "mb4")}>&loz; Critical status</div>
                        <div className={cx("text11", "colorMuted")}>This project requires immediate attention. Review notes and escalate if needed.</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeTab === "phase" ? (
                <div className={cx("pcListWrap")}>
                  <div className={cx("pcSectionLabel", "mb16")}>Current Phase</div>
                  <div className={cx("pcListRow")}>
                    <span className={cx("colorAccent", "text14", "noShrink", "pcArrowTight")}>&rarr;</span>
                    <span className={cx("text13", "colorMuted", "pcCopyRelaxed")}>{current.phase}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={cx("flexCol", "p24")}>
            <div className={cx("text13", "colorMuted2")}>Select a project to view context.</div>
          </div>
        )}
      </div>
    </section>
  );
}
