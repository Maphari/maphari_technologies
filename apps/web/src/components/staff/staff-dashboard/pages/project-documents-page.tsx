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

function docIconContent(type: string): string {
  if (type === "Brief")       return "BR";
  if (type === "Research")    return "RS";
  if (type === "Design")      return "DS";
  if (type === "Spec")        return "SP";
  if (type === "Notes")       return "NT";
  return "DL";
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
  const [projects, setProjects] = useState<StaffProject[]>([]);
  const [docRows,  setDocRows]  = useState<DocRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const projRes = await getStaffProjects(session!);
        if (projRes.nextSession) saveSession(projRes.nextSession);
        if (cancelled) return;

        const projList = projRes.data ?? [];
        setProjects(projList);

        if (projList.length === 0) {
          setDocRows([]);
          return;
        }

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

  const projectNames  = useMemo(() => [...new Set(docRows.map((d) => d.project))], [docRows]);
  const thisMonth     = currentMonthLabel();
  const recentCount   = useMemo(() => docRows.filter((d) => d.uploadedAt === thisMonth).length, [docRows, thisMonth]);
  const totalDocs     = docRows.length;
  const totalProjects = projectNames.length;

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

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "mb20")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Documents</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{totalDocs}</div>
          <div className={cx("staffKpiSub")}>files in vault</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Projects</div>
          <div className={cx("staffKpiValue")}>{totalProjects}</div>
          <div className={cx("staffKpiSub")}>active folders</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Total Size</div>
          <div className={cx("staffKpiValue", "colorMuted2")}>—</div>
          <div className={cx("staffKpiSub")}>combined storage</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>This Month</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{recentCount}</div>
          <div className={cx("staffKpiSub")}>{thisMonth}</div>
        </div>
      </div>

      {/* ── Drop zone hint ─────────────────────────────────────────────── */}
      <div className={cx("staffDropzone", "mb20")}>
        Upload area — drag &amp; drop files here (coming soon)
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {docRows.length === 0 ? (
        <div className={cx("staffEmpty")}>
          <div className={cx("staffEmptyIcon")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className={cx("staffEmptyTitle")}>No documents yet</div>
          <div className={cx("staffEmptyNote")}>
            {projects.length === 0
              ? "No projects assigned"
              : `${projects.length} project${projects.length !== 1 ? "s" : ""} loaded, no deliverables found`}
          </div>
        </div>
      ) : null}

      {/* ── Project sections ────────────────────────────────────────────── */}
      {projectNames.map((project) => {
        const docs = docRows.filter((d) => d.project === project);
        return (
          <div key={project} className={cx("staffCard", "mb12")}>

            <div className={cx("staffSectionHd")}>
              <span className={cx("staffSectionTitle")}>{project}</span>
              <span className={cx("staffChip")}>{docs.length} doc{docs.length !== 1 ? "s" : ""}</span>
            </div>

            {docs.map((doc) => (
              <div key={doc.id} className={cx("staffListRow", "pdocDocRow")}>
                <div className={cx("staffDocIcon")}>{docIconContent(doc.type)}</div>
                <div className={cx("pdocDocMain")}>
                  <span className={cx("pdocDocName")}>{doc.name}</span>
                  <span className={cx("pdocDocMeta")}>{doc.uploadedBy} · {doc.uploadedAt}</span>
                </div>
                <span className={cx("staffChip")}>{doc.type}</span>
                <button type="button" className={cx("pdocViewBtn")} disabled title="Coming soon">
                  View
                </button>
              </div>
            ))}

          </div>
        );
      })}

    </section>
  );
}
