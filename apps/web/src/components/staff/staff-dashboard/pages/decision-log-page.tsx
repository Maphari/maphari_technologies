// ════════════════════════════════════════════════════════════════════════════
// decision-log-page.tsx — Staff Decision Log
// Data : getStaffAllDecisions    → GET  /staff/decisions
// Mut  : createStaffProjectDecision → POST /projects/:id/decisions
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffAllDecisions,
  createStaffProjectDecision,
  type StaffDecision,
} from "../../../../lib/api/staff/governance";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff/projects";

// ── Types ─────────────────────────────────────────────────────────────────────

type Impact = "Design" | "Strategy" | "Scope & Finance" | "Technical" | "Finance";

type DecisionRow = {
  id:         string;
  projectId:  string;
  clientId:   string;
  clientName: string;
  date:       string;
  title:      string;
  context:    string;
  madeBy:     string;
  recordedBy: string;
  impact:     Impact;
  tags:       string[];
  linked:     string | null;
};

type ProjectOption = {
  id:         string;  // projectId
  clientId:   string;
  clientName: string;
  projectName: string;
  avatar:     string;
};

const impactToneClass: Record<Impact, string> = {
  Design:            "dlImpactDesign",
  Strategy:          "dlImpactStrategy",
  "Scope & Finance": "dlImpactScope",
  Technical:         "dlImpactTechnical",
  Finance:           "dlImpactFinance"
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDecisionDate(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  } catch {
    return fallback;
  }
}

function buildInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mapDecision(d: StaffDecision): DecisionRow {
  return {
    id:         d.id,
    projectId:  d.projectId,
    clientId:   d.clientId,
    clientName: d.clientName,
    date:       formatDecisionDate(d.decidedAt, formatDecisionDate(d.createdAt, "Unknown")),
    title:      d.title,
    context:    d.context ?? "",
    madeBy:     d.decidedByName ?? "Unknown",
    recordedBy: d.decidedByRole ?? "Staff",
    impact:     "Design",  // impact not stored in backend; default
    tags:       [],
    linked:     null
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DecisionLogPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientFilter, setClientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    projectId: "",
    title: "",
    context: "",
    madeBy: "",
    impact: "Design" as Impact,
    tags: ""
  });

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void Promise.all([
      getStaffAllDecisions(session),
      getStaffProjects(session)
    ]).then(([decisionsRes, projectsRes]) => {
      if (cancelled) return;
      if (decisionsRes.nextSession) saveSession(decisionsRes.nextSession);
      if (projectsRes.nextSession) saveSession(projectsRes.nextSession);
      if (!decisionsRes.error && decisionsRes.data) {
        setDecisions(decisionsRes.data.map(mapDecision));
      }
      if (!projectsRes.error && projectsRes.data) {
        const opts: ProjectOption[] = projectsRes.data.map((p: StaffProject) => ({
          id:          p.id,
          clientId:    p.clientId,
          clientName:  p.name,  // use project name as display (no clientName in StaffProject)
          projectName: p.name,
          avatar:      buildInitials(p.name)
        }));
        setProjects(opts);
        if (opts[0]) setDraft((d) => ({ ...d, projectId: opts[0]!.id }));
      }
    }).catch(() => {
      // keep previous state on error
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // Unique clients (project options act as the "client" grouping)
  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    return decisions.reduce<Array<{ id: string; name: string; avatar: string; project: string }>>((acc, d) => {
      if (!seen.has(d.clientId)) {
        seen.add(d.clientId);
        acc.push({
          id:      d.clientId,
          name:    d.clientName,
          avatar:  buildInitials(d.clientName),
          project: ""
        });
      }
      return acc;
    }, []);
  }, [decisions]);

  const filtered = useMemo(() => {
    return decisions
      .filter((d) => clientFilter === "all" || d.clientId === clientFilter)
      .filter((d) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.context.toLowerCase().includes(q) ||
          d.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      });
  }, [clientFilter, decisions, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, DecisionRow[]>>((acc, d) => {
      const key = d.clientName || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {});
  }, [filtered]);

  const current = selected ? decisions.find((d) => d.id === selected) ?? null : null;

  const handleAdd = async () => {
    if (!session || saving || !draft.projectId) return;
    const selectedProject = projects.find((p) => p.id === draft.projectId);
    if (!selectedProject) return;
    setSaving(true);
    const r = await createStaffProjectDecision(session, draft.projectId, {
      clientId:      selectedProject.clientId,
      title:         draft.title,
      context:       draft.context,
      decidedByName: draft.madeBy || undefined
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) {
      const newDecision: DecisionRow = {
        id:         r.data.id,
        projectId:  r.data.projectId,
        clientId:   r.data.clientId,
        clientName: selectedProject.clientName,
        date:       formatDecisionDate(r.data.createdAt, "Today"),
        title:      r.data.title,
        context:    r.data.context ?? draft.context,
        madeBy:     r.data.decidedByName ?? draft.madeBy,
        recordedBy: "You",
        impact:     draft.impact,
        tags:       draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        linked:     null
      };
      setDecisions((prev) => [newDecision, ...prev]);
      setSelected(newDecision.id);
    }
    setSaving(false);
    setAdding(false);
    setDraft({ projectId: projects[0]?.id ?? "", title: "", context: "", madeBy: "", impact: "Design", tags: "" });
  };

  const canSave = draft.title.trim() && draft.context.trim() && draft.madeBy.trim() && !saving;

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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-decision-log">
      <div className={cx("pageHeaderBar", "mb20")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
            <h1 className={cx("pageTitleText")}>Decision Log</h1>
          </div>
          <div className={cx("flexRow", "gap16")}>
            <div className={cx("flexRow", "gap20")}>
              {[
                { label: "Total",    value: decisions.length },
                { label: "Projects", value: [...new Set(decisions.map((d) => d.projectId))].length }
              ].map((stat) => (
                <div key={stat.label} className={cx("textRight")}>
                  <div className={cx("statLabelNew")}>{stat.label}</div>
                  <div className={cx("statValueNew", "colorMuted")}>{loading ? "…" : stat.value}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={cx("button", "buttonBlue", "dlAddBtn")}
              onClick={() => {
                setAdding(true);
                setSelected(null);
              }}
            >
              + Log decision
            </button>
          </div>
        </div>

        <div className={cx("flexBetween", "gap10")}>
          <div className={cx("flexRow", "gap10")}>
            <input
              className={cx("fieldInput", "dlSearchInput")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions..."
            />
            <div className={cx("dlDividerV")} />
            <select
              className={cx("fieldInput", "fieldSelect", "dlClientSelect")}
              aria-label="Filter decisions by client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All clients</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <span className={cx("text11", "colorMuted2")}>{filtered.length} decisions</span>
        </div>
      </div>

      <div className={cx("dlShell", (current || adding) && "dlShellWithPanel")}>
        <div className={cx("dlListPane", (current || adding) && "dlListPaneWithPanel")}>
          {Object.entries(grouped).length === 0 ? (
            <div className={cx("dlEmpty")}>No decisions match your filters.</div>
          ) : (
            Object.entries(grouped).map(([clientName, clientDecisions]) => (
              <div key={clientName} className={cx("mb28")}>
                <div className={cx("dlGroupHead")}>
                  <div className={cx("dlGroupAvatar")}>{buildInitials(clientName)}</div>
                  <span className={cx("text12", "colorMuted", "fw600")}>{clientName}</span>
                  <div className={cx("dlGroupLine")} />
                  <span className={cx("text10", "colorMuted2")}>{clientDecisions.length}</span>
                </div>

                <div className={cx("flexCol", "gap6")}>
                  {clientDecisions.map((decision) => {
                    const isSelected = selected === decision.id;
                    return (
                      <button
                        key={decision.id}
                        type="button"
                        className={cx(
                          "dlDecisionRow",
                          "dlDecisionCard",
                          `dlDecisionBorder${decision.impact.replace(/\s|&/g, "")}`,
                          isSelected && "dlDecisionCardSelected"
                        )}
                        onClick={() => {
                          setSelected(isSelected ? null : decision.id);
                          setAdding(false);
                        }}
                      >
                        <div className={cx("flexBetween", "gap12")}>
                          <div className={cx("flex1", "minW0")}>
                            <div className={cx("text13", "colorText", "mb6", "truncate")}>{decision.title}</div>
                            <div className={cx("text11", "colorMuted2", "truncate", "mb8")}>{decision.context}</div>
                            <div className={cx("flexRow", "gap6", "flexWrap")}>
                              <span className={cx("dlImpactChip", impactToneClass[decision.impact])}>{decision.impact}</span>
                              {decision.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className={cx("dlTagChip")}>{tag}</span>
                              ))}
                            </div>
                          </div>
                          <div className={cx("textRight", "noShrink")}>
                            <div className={cx("text10", "colorMuted2")}>{decision.date}</div>
                            <div className={cx("text10", "dlRecordedBy")}>by {decision.recordedBy}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add panel */}
        {adding ? (
          <div className={cx("dlPanel")}>
            <div className={cx("dlPanelTitle", "mb4")}>Log a Decision</div>
            <div className={cx("text11", "colorMuted2", "mb16")}>Record what was decided, by whom, and why - so nothing is lost.</div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Project</label>
              <select
                className={cx("fieldInput", "fieldSelect")}
                aria-label="Decision project"
                value={draft.projectId}
                onChange={(e) => setDraft((p) => ({ ...p, projectId: e.target.value }))}
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.projectName}</option>
                ))}
              </select>
            </div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Decision title</label>
              <input
                className={cx("fieldInput")}
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Typography changed to Syne + DM Mono"
              />
            </div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Context & rationale</label>
              <textarea
                className={cx("fieldInput", "dlContextArea")}
                value={draft.context}
                onChange={(e) => setDraft((p) => ({ ...p, context: e.target.value }))}
                placeholder="What led to this decision? What were the alternatives? What was agreed?"
              />
            </div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Decision made by</label>
              <input
                className={cx("fieldInput")}
                value={draft.madeBy}
                onChange={(e) => setDraft((p) => ({ ...p, madeBy: e.target.value }))}
                placeholder="e.g. Client / Both on call / Internal"
              />
            </div>

            <div className={cx("formGrid2", "mb16")}>
              <div>
                <label className={cx("fieldLabel")}>Impact area</label>
                <select
                  className={cx("fieldInput", "fieldSelect")}
                  aria-label="Decision impact"
                  value={draft.impact}
                  onChange={(e) => setDraft((p) => ({ ...p, impact: e.target.value as Impact }))}
                >
                  {Object.keys(impactToneClass).map((impact) => (
                    <option key={impact} value={impact}>{impact}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cx("fieldLabel")}>Tags</label>
                <input
                  className={cx("fieldInput")}
                  value={draft.tags}
                  onChange={(e) => setDraft((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="colour, scope, UX..."
                />
              </div>
            </div>

            <div className={cx("flexRow", "gap10", "mt4")}>
              <button
                type="button"
                className={cx("button", "buttonBlue", "dlSaveBtn")}
                disabled={!canSave}
                onClick={() => void handleAdd()}
              >
                {saving ? "Saving…" : "Save decision"}
              </button>
              <button
                type="button"
                className={cx("button", "buttonGhost", "dlCancelBtn")}
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {/* Detail panel */}
        {current && !adding ? (
          <div className={cx("dlPanel", "overflowAuto")}>
            <div className={cx("mb16")}>
              <div className={cx("flexRow", "gap8", "mb10", "flexWrap")}>
                <span className={cx("dlImpactChip", impactToneClass[current.impact])}>{current.impact}</span>
                <span className={cx("dlDateChip")}>{current.date}</span>
              </div>
              <div className={cx("dlPanelTitle", "mb6")}>{current.title}</div>
              <div className={cx("text11", "colorMuted2")}>{current.clientName}</div>
            </div>

            <div className={cx("cardSurface", "mb10")}>
              <div className={cx("sectionLabel", "mb8")}>Context & rationale</div>
              <div className={cx("text13", "colorMuted", "dlContextBody")}>{current.context}</div>
            </div>

            <div className={cx("formGrid2", "mb10")}>
              <div className={cx("cardSurfaceSm")}>
                <div className={cx("sectionLabel", "mb4")}>Decision by</div>
                <div className={cx("text12", "colorMuted")}>{current.madeBy}</div>
              </div>
              <div className={cx("cardSurfaceSm")}>
                <div className={cx("sectionLabel", "mb4")}>Recorded by</div>
                <div className={cx("text12", "colorMuted")}>{current.recordedBy}</div>
              </div>
            </div>

            {current.linked ? (
              <div className={cx("dlLinkedCard", "mb10")}>
                <div className={cx("text9", "dlLinkedLabel", "uppercase", "mb4")}>Linked to</div>
                <div className={cx("text12", "dlLinkedValue")}>↗ {current.linked}</div>
              </div>
            ) : null}

            <div>
              <div className={cx("sectionLabel", "mb8")}>Tags</div>
              <div className={cx("flexRow", "gap6", "flexWrap")}>
                {current.tags.length > 0
                  ? current.tags.map((tag) => (
                      <span key={tag} className={cx("dlTagChip")}>{tag}</span>
                    ))
                  : <span className={cx("text11", "colorMuted2")}>No tags</span>
                }
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
