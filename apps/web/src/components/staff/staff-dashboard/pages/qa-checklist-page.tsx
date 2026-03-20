// ════════════════════════════════════════════════════════════════════════════
// qa-checklist-page.tsx — QA Checklist
// Data     : getStaffProjects       → GET /staff/projects
//            getStaffDeliverables   → GET /staff/projects/:id/deliverables
//            Deliverable status maps: PENDING → Open, IN_REVIEW → In Progress,
//            APPROVED → Resolved, REJECTED → Open (regression)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffProjects, getStaffDeliverables, type StaffDeliverable } from "../../../../lib/api/staff";

type QAStatus = "Open" | "In Progress" | "Resolved" | "Won't Fix";

type QAItem = {
  id: string;
  title: string;
  project: string;
  category: "Functionality" | "Visual" | "Performance" | "Accessibility" | "Content";
  severity: "Critical" | "Major" | "Minor" | "Info";
  status: QAStatus;
  createdAt: string;
  isLocal?: true;
};

const FILTER_OPTS = [
  { value: "all",         label: "All"         },
  { value: "Open",        label: "Open"        },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved",    label: "Resolved"    },
  { value: "Won't Fix",   label: "Won't Fix"   },
] as const;

type FilterValue = typeof FILTER_OPTS[number]["value"];

// Map deliverable status to QA status
function mapStatus(deliverableStatus: string): QAStatus {
  switch (deliverableStatus) {
    case "APPROVED":   return "Resolved";
    case "IN_REVIEW":  return "In Progress";
    case "REJECTED":   return "Open";
    case "CANCELLED":  return "Won't Fix";
    default:           return "Open"; // PENDING, DRAFT, etc.
  }
}

// Derive a QA severity from deliverable status
function mapSeverity(deliverableStatus: string): QAItem["severity"] {
  if (deliverableStatus === "REJECTED") return "Critical";
  if (deliverableStatus === "IN_REVIEW") return "Major";
  if (deliverableStatus === "APPROVED") return "Info";
  return "Minor";
}

// Derive a QA category — cycle through categories for variety
const CATEGORIES: QAItem["category"][] = [
  "Functionality", "Visual", "Performance", "Accessibility", "Content",
];
function categoryFromIdx(idx: number): QAItem["category"] {
  return CATEGORIES[idx % CATEGORIES.length];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function categoryCls(c: string) {
  if (c === "Functionality") return "qaCatFunctionality";
  if (c === "Visual")        return "qaCatVisual";
  if (c === "Performance")   return "qaCatPerformance";
  if (c === "Accessibility") return "qaCatAccessibility";
  return "qaCatContent";
}

function severityCls(s: string) {
  if (s === "Critical") return "qaSevCritical";
  if (s === "Major")    return "qaSevMajor";
  if (s === "Minor")    return "qaSevMinor";
  return "qaSevInfo";
}

function statusCls(s: string) {
  if (s === "Resolved")    return "qaStatusResolved";
  if (s === "In Progress") return "qaStatusProgress";
  if (s === "Open")        return "qaStatusOpen";
  return "qaStatusWontFix";
}

function deliverableToQA(d: StaffDeliverable, projectName: string, idx: number): QAItem {
  return {
    id: `QA-${d.id.slice(0, 6).toUpperCase()}`,
    title: d.title,
    project: projectName,
    category: categoryFromIdx(idx),
    severity: mapSeverity(d.status),
    status: mapStatus(d.status),
    createdAt: formatDate(d.createdAt),
  };
}

const EMPTY_FORM = {
  title: "",
  severity: "Minor" as QAItem["severity"],
  category: "Functionality" as QAItem["category"],
};

export function QAChecklistPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [items, setItems]         = useState<QAItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterValue>("all");
  const [localItems, setLocalItems] = useState<QAItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    setLoading(true);

    void (async () => {
      try {
        const projectsResult = await getStaffProjects(session);
        if (projectsResult.nextSession) saveSession(projectsResult.nextSession);

        const projects = projectsResult.data ?? [];

        // Load deliverables for all projects in parallel (up to 5)
        const slice = projects.slice(0, 5);
        const delivResults = await Promise.all(
          slice.map((p) => getStaffDeliverables(session, p.id))
        );

        const allItems: QAItem[] = [];
        let globalIdx = 0;
        for (let i = 0; i < slice.length; i++) {
          const result = delivResults[i];
          if (result?.nextSession) saveSession(result.nextSession);
          const deliverables = result?.data ?? [];
          const projectName = slice[i]?.name ?? `Project ${i + 1}`;
          for (const d of deliverables) {
            allItems.push(deliverableToQA(d, projectName, globalIdx++));
          }
        }

        setItems(allItems);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.accessToken, isActive]);

  const allItems = [...localItems, ...items];

  const open       = allItems.filter((i) => i.status === "Open").length;
  const inProgress = allItems.filter((i) => i.status === "In Progress").length;
  const resolved   = allItems.filter((i) => i.status === "Resolved").length;

  const filtered = filter === "all" ? allItems : allItems.filter((i) => i.status === filter);

  function handleAddIssue() {
    if (!addForm.title.trim()) return;
    const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    const newItem: QAItem = {
      id: `QA-LOCAL-${Date.now().toString(36).toUpperCase()}`,
      title: addForm.title.trim(),
      project: "Local (unsaved)",
      category: addForm.category,
      severity: addForm.severity,
      status: "Open",
      createdAt: today,
      isLocal: true,
    };
    setLocalItems((prev) => [newItem, ...prev]);
    setAddForm(EMPTY_FORM);
    setShowAddModal(false);
  }

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-qa-checklist">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-qa-checklist">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Quality</div>
        <h1 className={cx("pageTitleText")}>QA Checklist</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Quality review checklist and defect tracking</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("qaStatGrid")}>

        <div className={cx("qaStatCard")}>
          <div className={cx("qaStatCardTop")}>
            <div className={cx("qaStatLabel")}>Open</div>
            <div className={cx("qaStatValue", "colorRed")}>{loading ? "…" : open}</div>
          </div>
          <div className={cx("qaStatCardDivider")} />
          <div className={cx("qaStatCardBottom")}>
            <span className={cx("qaStatDot", "dotBgRed")} />
            <span className={cx("qaStatMeta")}>needs attention</span>
          </div>
        </div>

        <div className={cx("qaStatCard")}>
          <div className={cx("qaStatCardTop")}>
            <div className={cx("qaStatLabel")}>In Progress</div>
            <div className={cx("qaStatValue", "colorAmber")}>{loading ? "…" : inProgress}</div>
          </div>
          <div className={cx("qaStatCardDivider")} />
          <div className={cx("qaStatCardBottom")}>
            <span className={cx("qaStatDot", "dotBgAmber")} />
            <span className={cx("qaStatMeta")}>being addressed</span>
          </div>
        </div>

        <div className={cx("qaStatCard")}>
          <div className={cx("qaStatCardTop")}>
            <div className={cx("qaStatLabel")}>Resolved</div>
            <div className={cx("qaStatValue", "colorGreen")}>{loading ? "…" : resolved}</div>
          </div>
          <div className={cx("qaStatCardDivider")} />
          <div className={cx("qaStatCardBottom")}>
            <span className={cx("qaStatDot", "dotBgGreen")} />
            <span className={cx("qaStatMeta")}>fixed &amp; closed</span>
          </div>
        </div>

        <div className={cx("qaStatCard")}>
          <div className={cx("qaStatCardTop")}>
            <div className={cx("qaStatLabel")}>Total Issues</div>
            <div className={cx("qaStatValue", "colorAccent")}>{loading ? "…" : items.length}</div>
          </div>
          <div className={cx("qaStatCardDivider")} />
          <div className={cx("qaStatCardBottom")}>
            <span className={cx("qaStatDot", "dotBgAccent")} />
            <span className={cx("qaStatMeta")}>across all projects</span>
          </div>
        </div>

      </div>

      {/* ── Issue list ────────────────────────────────────────────────────── */}
      <div className={cx("qaSection")}>

        {/* Filter header */}
        <div className={cx("qaSectionHeader")}>
          <div className={cx("qaFilterRow")}>
            {FILTER_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cx("qaFilterPill", filter === opt.value ? "qaFilterPillActive" : "qaFilterPillIdle")}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <span className={cx("qaFilterCount")}>{filtered.length} issue{filtered.length !== 1 ? "s" : ""}</span>
            <button
              type="button"
              className={cx("qaAddIssueBtn")}
              onClick={() => setShowAddModal(true)}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add Issue
            </button>
          </div>
        </div>

        {/* Add Issue Modal */}
        {showAddModal && (
          <div className={cx("qaModalOverlay")} onClick={() => setShowAddModal(false)}>
            <div
              className={cx("qaModal")}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Add QA issue"
            >
              <div className={cx("qaModalHeader")}>
                <span className={cx("qaModalTitle")}>Add QA Issue</span>
                <button
                  type="button"
                  className={cx("qaModalClose")}
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >✕</button>
              </div>
              <div className={cx("qaModalForm")}>
                <label className={cx("qaModalLabel")}>
                  Title <span className={cx("qaModalLabelMeta")}>Required</span>
                </label>
                <input
                  className={cx("qaModalInput")}
                  type="text"
                  placeholder="Describe the issue…"
                  value={addForm.title}
                  onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddIssue(); if (e.key === "Escape") setShowAddModal(false); }}
                />
                <div className={cx("qaModalRow")}>
                  <div className={cx("qaModalFieldGroup")}>
                    <label className={cx("qaModalLabel")}>Severity</label>
                    <select
                      className={cx("qaModalSelect")}
                      value={addForm.severity}
                      onChange={(e) => setAddForm((f) => ({ ...f, severity: e.target.value as QAItem["severity"] }))}
                    >
                      <option>Critical</option>
                      <option>Major</option>
                      <option>Minor</option>
                      <option>Info</option>
                    </select>
                  </div>
                  <div className={cx("qaModalFieldGroup")}>
                    <label className={cx("qaModalLabel")}>Category</label>
                    <select
                      className={cx("qaModalSelect")}
                      value={addForm.category}
                      onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as QAItem["category"] }))}
                    >
                      <option>Functionality</option>
                      <option>Visual</option>
                      <option>Performance</option>
                      <option>Accessibility</option>
                      <option>Content</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={cx("qaModalFooter")}>
                <button type="button" className={cx("qaModalCancel")} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button
                  type="button"
                  className={cx("qaModalSubmit")}
                  onClick={handleAddIssue}
                  disabled={!addForm.title.trim()}
                >
                  Add Issue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issue cards */}
        <div className={cx("qaIssueList")}>
          {loading ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateText")}>Loading deliverables…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No issues found</div>
              <div className={cx("emptyStateSub")}>No issues match the selected filter. Try a different status or add a new issue.</div>
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div key={item.id} className={cx("qaIssueCard", idx === filtered.length - 1 && "qaIssueCardLast")}>

                {/* Head: ID + category + severity + status */}
                <div className={cx("qaIssueHead")}>
                  <div className={cx("qaIssueLeft")}>
                    <span className={cx("qaIssueId")}>{item.id}</span>
                    <span className={cx("qaIssueCat", categoryCls(item.category))}>{item.category}</span>
                    {item.isLocal && (
                      <span className={cx("qaLocalBadge")}>Local</span>
                    )}
                  </div>
                  <div className={cx("qaIssueBadges")}>
                    <span className={cx("qaIssueSev", severityCls(item.severity))}>{item.severity}</span>
                    <span className={cx("qaIssueStatus", statusCls(item.status))}>{item.status}</span>
                  </div>
                </div>

                {/* Title */}
                <div className={cx("qaIssueTitle")}>{item.title}</div>

                {/* Footer: project · date */}
                <div className={cx("qaIssueFooter")}>
                  <span className={cx("qaIssueMeta")}>{item.project}</span>
                  <span className={cx("qaIssueFooterSep")} />
                  <span className={cx("qaIssueMeta")}>{item.createdAt}</span>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

    </section>
  );
}
