// ════════════════════════════════════════════════════════════════════════════
// project-documents-page.tsx — Staff Project Documents
// Data     : getStaffProjects        → GET /staff/projects
//            getStaffDeliverables    → GET /staff/projects/:id/deliverables
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffProjects,
  getStaffDeliverables,
  type StaffProject,
  type StaffDeliverable,
} from "../../../../lib/api/staff";

// ── Local types ───────────────────────────────────────────────────────────────

/** Flattened document row used by the UI */
interface DocRow {
  id: string;
  name: string;
  project: string;
  projectId: string;
  type: string;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferDocType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("brief"))       return "Brief";
  if (t.includes("deliverable")) return "Deliverable";
  if (t.includes("research"))    return "Research";
  if (t.includes("design"))      return "Design";
  if (t.includes("spec"))        return "Spec";
  if (t.includes("note"))        return "Notes";
  return "Deliverable";
}

function typeCls(t: string): string {
  if (t === "Brief")       return "pdocTypeBrief";
  if (t === "Deliverable") return "pdocTypeDeliverable";
  if (t === "Research")    return "pdocTypeResearch";
  if (t === "Design")      return "pdocTypeDesign";
  if (t === "Spec")        return "pdocTypeSpec";
  if (t === "Notes")       return "pdocTypeNotes";
  return "";
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectDocumentsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [projects,  setProjects]  = useState<StaffProject[]>([]);
  const [docRows,   setDocRows]   = useState<DocRow[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Fetch projects + deliverables ─────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        // 1. Fetch projects
        const projRes = await getStaffProjects(session!);
        if (projRes.nextSession) saveSession(projRes.nextSession);
        if (cancelled) return;

        const projList = projRes.data ?? [];
        setProjects(projList);

        if (projList.length === 0) {
          setDocRows([]);
          return;
        }

        // 2. Fetch deliverables for every project in parallel
        const delivResults = await Promise.all(
          projList.map((p) => getStaffDeliverables(session!, p.id))
        );

        if (cancelled) return;

        const rows: DocRow[] = [];
        for (let i = 0; i < projList.length; i++) {
          const r = delivResults[i];
          if (r.nextSession) saveSession(r.nextSession);
          const deliverables = r.data ?? [];
          const project = projList[i];
          for (const d of deliverables) {
            rows.push({
              id:         d.id,
              name:       d.title,
              project:    project.name,
              projectId:  project.id,
              type:       inferDocType(d.title),
              status:     d.status,
              uploadedAt: formatShortDate(d.createdAt),
              uploadedBy: project.ownerName ?? "Staff",
            });
          }
        }

        setDocRows(rows);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived stats ─────────────────────────────────────────────────────────
  const projectNames = useMemo(() => [...new Set(docRows.map((d) => d.project))], [docRows]);
  const thisMonth    = currentMonthLabel();
  const recentCount  = useMemo(() => docRows.filter((d) => d.uploadedAt === thisMonth).length, [docRows, thisMonth]);
  const totalDocs    = docRows.length;
  const totalProjects = projectNames.length;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-documents">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-documents">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Project Documents</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Project-scoped document vault</p>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className={cx("pdocStatGrid")}>

        <div className={cx("pdocStatCard")}>
          <div className={cx("pdocStatCardTop")}>
            <div className={cx("pdocStatLabel")}>Documents</div>
            <div className={cx("pdocStatValue", "colorAccent")}>{loading ? "--" : totalDocs}</div>
          </div>
          <div className={cx("pdocStatCardDivider")} />
          <div className={cx("pdocStatCardBottom")}>
            <span className={cx("pdocStatDot", "dotBgAccent")} />
            <span className={cx("pdocStatMeta")}>files in vault</span>
          </div>
        </div>

        <div className={cx("pdocStatCard")}>
          <div className={cx("pdocStatCardTop")}>
            <div className={cx("pdocStatLabel")}>Projects</div>
            <div className={cx("pdocStatValue", "colorMuted2")}>{loading ? "--" : totalProjects}</div>
          </div>
          <div className={cx("pdocStatCardDivider")} />
          <div className={cx("pdocStatCardBottom")}>
            <span className={cx("pdocStatDot", "dotBgMuted2")} />
            <span className={cx("pdocStatMeta")}>active folders</span>
          </div>
        </div>

        <div className={cx("pdocStatCard")}>
          <div className={cx("pdocStatCardTop")}>
            <div className={cx("pdocStatLabel")}>Total Size</div>
            <div className={cx("pdocStatValue", "colorMuted2")}>--</div>
          </div>
          <div className={cx("pdocStatCardDivider")} />
          <div className={cx("pdocStatCardBottom")}>
            <span className={cx("pdocStatDot", "dotBgMuted2")} />
            <span className={cx("pdocStatMeta")}>combined storage</span>
          </div>
        </div>

        <div className={cx("pdocStatCard")}>
          <div className={cx("pdocStatCardTop")}>
            <div className={cx("pdocStatLabel")}>This Month</div>
            <div className={cx("pdocStatValue", "colorAccent")}>{loading ? "--" : recentCount}</div>
          </div>
          <div className={cx("pdocStatCardDivider")} />
          <div className={cx("pdocStatCardBottom")}>
            <span className={cx("pdocStatDot", "dotBgAccent")} />
            <span className={cx("pdocStatMeta")}>{thisMonth} uploads</span>
          </div>
        </div>

      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!loading && docRows.length === 0 ? (
        <div className={cx("pdocSection")}>
          <div className={cx("pdocSectionHeader")}>
            <div className={cx("pdocSectionLeft")}>
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className={cx("emptyStateTitle")}>No documents yet</div>
                <div className={cx("emptyStateSub")}>
                  {projects.length === 0
                    ? "No projects assigned"
                    : `${projects.length} project${projects.length !== 1 ? "s" : ""} loaded, no deliverables found`}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Project sections ────────────────────────────────────────────────── */}
      {!loading && projectNames.map((project) => {
        const docs = docRows.filter((d) => d.project === project);
        return (
          <div key={project} className={cx("pdocSection")}>

            <div className={cx("pdocSectionHeader")}>
              <div className={cx("pdocSectionLeft")}>
                <div className={cx("pdocProjectName")}>{project}</div>
              </div>
              <span className={cx("pdocSectionMeta")}>{docs.length} DOC{docs.length !== 1 ? "S" : ""}</span>
            </div>

            <div className={cx("pdocDocList")}>
              {docs.map((doc, idx) => (
                <div key={doc.id} className={cx("pdocDocRow", idx === docs.length - 1 && "pdocDocRowLast")}>
                  <span className={cx("pdocTypeBadge", typeCls(doc.type))}>{doc.type}</span>
                  <span className={cx("pdocDocName")}>{doc.name}</span>
                  <span className={cx("pdocUploader")}>{doc.uploadedBy}</span>
                  <span className={cx("pdocDate")}>{doc.uploadedAt}</span>
                  <button type="button" className={cx("pdocViewBtn")} disabled title="Coming soon">View</button>
                </div>
              ))}
            </div>

          </div>
        );
      })}

    </section>
  );
}
