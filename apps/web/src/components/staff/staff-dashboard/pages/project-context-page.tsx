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
import { loadStaffAuditEventsWithRefresh, type StaffAuditEvent } from "../../../../lib/api/staff/audit";

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

const statusDotCls: Record<ProjectStatus, string> = {
  active:   "staffDotGreen",
  at_risk:  "staffDotAmber",
  critical: "staffDotRed",
};

const statusChipCls: Record<ProjectStatus, string> = {
  active:   "staffChipGreen",
  at_risk:  "staffChipAmber",
  critical: "staffChipRed",
};

const statusLabel: Record<ProjectStatus, string> = {
  active:   "Active",
  at_risk:  "At Risk",
  critical: "Critical",
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

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectContextPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [projects,    setProjects]    = useState<ProjectContext[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<"overview" | "phase" | "activity">("overview");
  const [search,      setSearch]      = useState("");
  const [auditEvents, setAuditEvents] = useState<StaffAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    getStaffProjects(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        const mapped = r.data.map(toProjectContext);
        setProjects(mapped);
        setSelected((prev) => prev ?? (mapped[0]?.id ?? null));
      }
    }).catch(() => {
      // ignore
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  // ── Audit events: load when "Activity" tab is active ──────────────────────
  useEffect(() => {
    if (!session || !selected || activeTab !== "activity") return;
    setAuditLoading(true);
    setAuditEvents([]);
    loadStaffAuditEventsWithRefresh(session, selected, { limit: 50 }).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setAuditEvents(r.data);
    }).catch(() => {
      // ignore — staff may not be collaborator; empty state shown
    }).finally(() => {
      setAuditLoading(false);
    });
  }, [session, selected, activeTab]);

  const filtered = projects.filter(
    (p) => p.client.toLowerCase().includes(search.toLowerCase()) || p.project.toLowerCase().includes(search.toLowerCase())
  );
  const current = projects.find((p) => p.id === selected) ?? null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-context">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-context">
      <div className={cx("staffSplitShell")}>

        {/* Left: project selector */}
        <div className={cx("pcSidePanel")}>
          <div className={cx("pageHeaderBar", "pcSideHeader")}>
            <div className={cx("pageEyebrow", "mb6")}>Staff Dashboard</div>
            <h1 className={cx("pageTitle", "pcSideTitle")}>Project Context</h1>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className={cx("staffFilterInput")}
            />
          </div>

          {filtered.length === 0 ? (
            <div className={cx("staffEmpty")}>
              <div className={cx("staffEmptyTitle")}>No projects found</div>
            </div>
          ) : (
            <>
              {filtered.some((p) => p.pinned) && (
                <div className={cx("pcGroupSection")}>
                  <div className={cx("pcGroupLabel")}>Pinned</div>
                  {filtered.filter((p) => p.pinned).map((p) => (
                    <div
                      key={p.id}
                      className={cx("staffListRow", selected === p.id && "staffClientToneAccent")}
                      onClick={() => { setSelected(p.id); setActiveTab("overview"); }}
                      style={{ cursor: "pointer" }}
                    >
                      <span className={cx("staffDot", statusDotCls[p.status])} />
                      <div className={cx("pcClientInfo")}>
                        <div className={cx("pcClientName")}>{p.client}</div>
                        <div className={cx("pcClientSub")}>{p.project}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className={cx("pcGroupSection")}>
                <div className={cx("pcGroupLabel")}>All Projects</div>
                {filtered.filter((p) => !p.pinned).map((p) => (
                  <div
                    key={p.id}
                    className={cx("staffListRow", selected === p.id && "staffClientToneAccent")}
                    onClick={() => { setSelected(p.id); setActiveTab("overview"); }}
                    style={{ cursor: "pointer" }}
                  >
                    <span className={cx("staffDot", statusDotCls[p.status])} />
                    <div className={cx("pcClientInfo")}>
                      <div className={cx("pcClientName")}>{p.client}</div>
                      <div className={cx("pcClientSub")}>{p.project}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: detail */}
        {current ? (
          <div className={cx("staffCard", "pcDetailCard")}>
            {/* Header */}
            <div className={cx("staffSectionHd", "pcDetailHead")}>
              <div className={cx("pcDetailAvatar")}>{current.avatar}</div>
              <div className={cx("pcDetailHeadInfo")}>
                <div className={cx("pcDetailClientName")}>{current.client}</div>
                <div className={cx("pcDetailProject")}>{current.project}</div>
              </div>
              <div className={cx("pcDetailBadges")}>
                <span className={cx("staffChip", statusChipCls[current.status])}>{statusLabel[current.status]}</span>
                <span className={cx("staffChip")}>{current.phase}</span>
              </div>
            </div>

            {/* Metadata rows */}
            <div className={cx("staffListRow", "pcMetaRow")}>
              <span className={cx("pcMetaLabel")}>Started</span>
              <span className={cx("pcMetaValue")}>{current.startDate}</span>
            </div>
            <div className={cx("staffListRow", "pcMetaRow")}>
              <span className={cx("pcMetaLabel")}>Deadline</span>
              <span className={cx("pcMetaValue")}>{current.deadline}</span>
            </div>
            <div className={cx("staffListRow", "pcMetaRow")}>
              <span className={cx("pcMetaLabel")}>Lead</span>
              <span className={cx("pcMetaValue")}>{current.staffLead}</span>
            </div>

            {/* Tabs */}
            <div className={cx("staffSegControl", "pcTabs")}>
              {[{ key: "overview", label: "Overview" }, { key: "phase", label: "Phase" }, { key: "activity", label: "Activity Log" }].map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  className={cx("staffSegBtn", activeTab === tab.key && "staffSegBtnActive")}
                  onClick={() => setActiveTab(tab.key as "overview" | "phase" | "activity")}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className={cx("staffProse", "pcProseContent")}>
                <p>
                  <strong>{current.client}</strong> — {current.project}
                </p>
                <p>
                  Current phase: {current.phase}
                  {" "}· Lead: {current.staffLead}
                </p>
                {current.status === "critical" && (
                  <p style={{ color: "var(--red)" }}>
                    This project is in a critical state. Review notes and escalate if needed.
                  </p>
                )}
              </div>
            )}

            {/* Tab: Phase */}
            {activeTab === "phase" && (
              <div className={cx("staffProse", "pcProseContent")}>
                <p>Current Phase: <strong>{current.phase}</strong></p>
                <p>Started: {current.startDate}</p>
                <p>Deadline: {current.deadline}</p>
              </div>
            )}

            {/* Tab: Activity Log */}
            {activeTab === "activity" && (
              <div className={cx("pcProseContent")}>
                {auditLoading ? (
                  <div className={cx("staffEmpty")}>
                    <div className={cx("staffEmptyTitle")}>Loading activity…</div>
                  </div>
                ) : auditEvents.length === 0 ? (
                  <div className={cx("staffEmpty")}>
                    <div className={cx("staffEmptyTitle")}>No activity recorded</div>
                    <div className={cx("staffEmptySub")}>Project-level audit events will appear here once actions are taken on this project.</div>
                  </div>
                ) : (
                  <div className={cx("staffActivityList")}>
                    {auditEvents.map((event) => (
                      <div key={event.id} className={cx("staffListRow", "staffActivityRow")}>
                        <div className={cx("staffActivityDot")} />
                        <div className={cx("staffActivityInfo")}>
                          <div className={cx("staffActivityAction")}>
                            {event.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                          </div>
                          {event.actorName && (
                            <div className={cx("staffActivityMeta")}>
                              by {event.actorName}{event.actorRole ? ` (${event.actorRole})` : ""}
                            </div>
                          )}
                          {event.details && (
                            <div className={cx("staffActivityMeta")}>{event.details}</div>
                          )}
                        </div>
                        <div className={cx("staffActivityDate")}>
                          {new Date(event.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={cx("staffEmpty")}>
            <div className={cx("staffEmptyTitle")}>Select a project to view context.</div>
          </div>
        )}
      </div>
    </section>
  );
}
