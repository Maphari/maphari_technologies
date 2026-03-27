// ════════════════════════════════════════════════════════════════════════════
// delivery-status-page.tsx — Staff: delivery / launch-readiness view
// Data     : getStaffProjects + getStaffDeliverables per project
// Logic    : readiness = approved+complete / total deliverables × 100
//            status derived from project.status + deliverable completion
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffProjects,
  getStaffDeliverables,
  type StaffProject,
  type StaffDeliverable,
} from "../../../../lib/api/staff/projects";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
  onGoTasks?: (projectId: string) => void;
  onGoDeliverables?: () => void;
};

type DeliveryStatus = "On Track" | "At Risk" | "Minor Delay";

type DeliveryItem = {
  projectId:        string;
  project:          string;
  client:           string;
  phase:            string;
  readiness:        number;
  blockers:         number;
  launchDate:       string;
  status:           DeliveryStatus;
  deliverablesDone:  number;
  deliverablesTotal: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const DONE_STATUSES = new Set(["APPROVED", "COMPLETE", "COMPLETED", "DONE"]);
const WIP_STATUSES  = new Set(["IN_REVIEW", "IN_PROGRESS"]);

function computeReadiness(deliverables: StaffDeliverable[]): number {
  if (deliverables.length === 0) return 0;
  const done = deliverables.filter((d) => DONE_STATUSES.has(d.status.toUpperCase())).length;
  return Math.round((done / deliverables.length) * 100);
}

function deriveStatus(project: StaffProject, readiness: number): DeliveryStatus {
  const s = project.status.toUpperCase();
  if (s === "ON_HOLD" || s === "BLOCKED") return "At Risk";
  if (readiness >= 70) return "On Track";
  if (readiness >= 40) return "Minor Delay";
  return "At Risk";
}

function derivePhase(project: StaffProject, deliverables: StaffDeliverable[]): string {
  const wip = deliverables.find((d) => WIP_STATUSES.has(d.status.toUpperCase()));
  if (wip) return wip.title;
  if (project.status === "IN_PROGRESS") return "In Progress";
  return project.status;
}

function statusChipCls(s: DeliveryStatus): string {
  if (s === "On Track") return "staffChipGreen";
  if (s === "At Risk") return "staffChipRed";
  return "staffChipAmber";
}

function statusDotCls(s: DeliveryStatus): string {
  if (s === "On Track") return "staffDotGreen";
  if (s === "At Risk") return "staffDotRed";
  return "staffDotAmber";
}

function readinessFillCls(r: number): string {
  if (r >= 70) return "dsvFillGreen";
  if (r >= 40) return "dsvFillAmber";
  return "dsvFillRed";
}

function readinessPctCls(r: number): string {
  if (r >= 70) return "colorGreen";
  if (r >= 40) return "colorAmber";
  return "colorRed";
}

const STATUS_ORDER: Record<string, number> = {
  "At Risk": 0,
  "Minor Delay": 1,
  "On Track": 2,
};

function accentCls(s: DeliveryStatus): string {
  if (s === "On Track") return "dsvAccentGreen";
  if (s === "At Risk")  return "dsvAccentRed";
  return "dsvAccentAmber";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DeliveryStatusPage({ isActive, session, onNotify, onGoTasks, onGoDeliverables }: PageProps) {
  const [items, setItems]   = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  useEffect(() => {
    if (!isActive || !session) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const [projectsResult, clientsResult] = await Promise.all([
          getStaffProjects(session),
          getStaffClients(session),
        ]);

        if (cancelled) return;

        if (projectsResult.nextSession) saveSession(projectsResult.nextSession);
        if (clientsResult.nextSession) saveSession(clientsResult.nextSession);

        if (projectsResult.error) {
          setError(projectsResult.error.message);
          onNotify?.("error", "Unable to load projects.");
          return;
        }

        const projectList = (projectsResult.data ?? []).filter(
          (p) => p.status !== "COMPLETED" && p.status !== "DONE" && p.status !== "ARCHIVED"
        );
        const clientMap = new Map<string, StaffClient>(
          (clientsResult.data ?? []).map((c) => [c.id, c])
        );

        const deliverableResults = await Promise.all(
          projectList.map((p) => getStaffDeliverables(session, p.id))
        );

        if (cancelled) return;

        const built: DeliveryItem[] = projectList.map((p, i) => {
          const dlResult     = deliverableResults[i];
          if (dlResult?.nextSession) saveSession(dlResult.nextSession);
          const deliverables = dlResult?.data ?? [];

          const readiness = computeReadiness(deliverables);
          const status    = deriveStatus(p, readiness);
          const phase     = derivePhase(p, deliverables);
          const inReview  = deliverables.filter(
            (d) => WIP_STATUSES.has(d.status.toUpperCase())
          ).length;

          return {
            projectId:        p.id,
            project:          p.name,
            client:           clientMap.get(p.clientId)?.name ?? p.clientId,
            phase,
            readiness,
            blockers:         inReview,
            launchDate:       p.dueAt
              ? new Date(p.dueAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : "TBD",
            status,
            deliverablesDone:  deliverables.filter((d) => DONE_STATUSES.has(d.status.toUpperCase())).length,
            deliverablesTotal: deliverables.length,
          };
        });

        setItems(built);
      } catch (err) {
        const msg = (err as Error)?.message ?? "Failed to load delivery status";
        setError(msg);
        onNotify?.("error", msg);
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  const totalProjects  = items.length;
  const onTrackCount   = items.filter((d) => d.status === "On Track").length;
  const flaggedCount   = items.filter((d) => d.status === "At Risk" || d.status === "Minor Delay").length;
  const totalBlockers  = items.reduce((s, d) => s + d.blockers, 0);

  const sorted = [...items].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );

  if (!isActive) return null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-delivery-status">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-delivery-status">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Delivery Status</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Launch readiness view for active projects</p>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className={cx("staffEmpty")}>
          <div className={cx("staffEmptyTitle")}>Failed to load data.</div>
          <div className={cx("staffEmptyNote")}>{error}</div>
        </div>
      )}

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      {!error && (
        <div className={cx("staffKpiStrip", "mb20")}>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>Projects</div>
            <div className={cx("staffKpiValue", "colorAccent")}>{totalProjects}</div>
            <div className={cx("staffKpiSub")}>being tracked</div>
          </div>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>On Track</div>
            <div className={cx("staffKpiValue", "colorGreen")}>{onTrackCount}</div>
            <div className={cx("staffKpiSub")}>healthy delivery</div>
          </div>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>Flagged</div>
            <div className={cx("staffKpiValue", flaggedCount > 0 ? "colorRed" : "colorGreen")}>{flaggedCount}</div>
            <div className={cx("staffKpiSub")}>{flaggedCount > 0 ? "at risk or delayed" : "none flagged"}</div>
          </div>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>In Review</div>
            <div className={cx("staffKpiValue", totalBlockers > 0 ? "colorAmber" : "colorGreen")}>{totalBlockers}</div>
            <div className={cx("staffKpiSub")}>{totalBlockers > 0 ? "deliverables in review" : "none in review"}</div>
          </div>
        </div>
      )}

      {/* ── Project list ──────────────────────────────────────────────── */}
      {!error && (
        <div className={cx("staffCard")}>
          <div className={cx("staffSectionHd")}>
            <span className={cx("staffSectionTitle")}>All Projects</span>
            <span className={cx("staffChip")}>{items.length} projects</span>
          </div>

          {items.length === 0 ? (
            <div className={cx("staffEmpty")}>
              <div className={cx("staffEmptyIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={cx("staffEmptyTitle")}>No active projects found</div>
              <div className={cx("staffEmptyNote")}>Completed or archived projects are not shown here.</div>
            </div>
          ) : (
            sorted.map((d) => (
              <div key={d.projectId} className={cx("staffListRow", "dsvProjectRow")}>
                <span className={cx("staffDot", statusDotCls(d.status))} />
                <div className={cx("dsvProjectMain")}>
                  <div className={cx("dsvProjectName")}>{d.project}</div>
                  <div className={cx("dsvProjectMeta")}>
                    {d.client}
                    <span className={cx("dsvPhaseSep")}> · </span>
                    {d.phase}
                  </div>
                  <div className={cx("dsvReadinessWrap")}>
                    <div className={cx("staffBar")}>
                      <div
                        className={cx("staffBarFill", readinessFillCls(d.readiness))}
                        style={{ "--fill-pct": `${d.readiness}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("dsvReadinessPct", readinessPctCls(d.readiness))}>{d.readiness}%</span>
                  </div>
                </div>
                <div className={cx("dsvProjectRight")}>
                  <span className={cx("staffChip", statusChipCls(d.status))}>{d.status}</span>
                  <span className={cx("staffChip", d.blockers > 0 ? "staffChipRed" : "staffChipGreen")}>
                    {d.blockers} in review
                  </span>
                  <span className={cx("dsvDueDate")}>{d.launchDate}</span>
                  {onGoTasks && (
                    <button
                      type="button"
                      className={cx("dsvViewTasksBtn")}
                      onClick={() => onGoTasks(d.projectId)}
                    >
                      Tasks →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
