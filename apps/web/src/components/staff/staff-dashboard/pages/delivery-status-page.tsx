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
};

type DeliveryStatus = "On Track" | "At Risk" | "Minor Delay";

type DeliveryItem = {
  projectId: string;
  project: string;
  client: string;
  phase: string;
  readiness: number;
  blockers: number;
  launchDate: string;
  status: DeliveryStatus;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const DONE_STATUSES = new Set(["APPROVED", "COMPLETE", "COMPLETED", "DONE"]);
const WIP_STATUSES = new Set(["IN_REVIEW", "IN_PROGRESS"]);

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

function statusBadgeCls(s: DeliveryStatus): string {
  if (s === "On Track") return "dsvStatusOnTrack";
  if (s === "At Risk") return "dsvStatusAtRisk";
  return "dsvStatusMinorDelay";
}

function statusStripCls(s: DeliveryStatus): string {
  if (s === "At Risk") return "dsvCardAtRisk";
  if (s === "Minor Delay") return "dsvCardMinorDelay";
  return "dsvCardOnTrack";
}

function readinessBarCls(r: number): string {
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

// ── Component ─────────────────────────────────────────────────────────────────

export function DeliveryStatusPage({ isActive, session, onNotify, onGoTasks }: PageProps) {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
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
        setLoading(false);
        return;
      }

      const projectList = (projectsResult.data ?? []).filter(
        (p) => p.status !== "COMPLETED" && p.status !== "DONE" && p.status !== "ARCHIVED"
      );
      const clientMap = new Map<string, StaffClient>(
        (clientsResult.data ?? []).map((c) => [c.id, c])
      );

      // Fetch deliverables for each project in parallel
      const deliverableResults = await Promise.all(
        projectList.map((p) => getStaffDeliverables(session, p.id))
      );

      if (cancelled) return;

      const built: DeliveryItem[] = projectList.map((p, i) => {
        const dlResult = deliverableResults[i];
        if (dlResult?.nextSession) saveSession(dlResult.nextSession);
        const deliverables = dlResult?.data ?? [];

        const readiness = computeReadiness(deliverables);
        const status = deriveStatus(p, readiness);
        const phase = derivePhase(p, deliverables);
        const inReview = deliverables.filter(
          (d) => WIP_STATUSES.has(d.status.toUpperCase())
        ).length;

        return {
          projectId: p.id,
          project: p.name,
          client: clientMap.get(p.clientId)?.name ?? p.clientId,
          phase,
          readiness,
          blockers: inReview,
          launchDate: p.dueAt
            ? new Date(p.dueAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "TBD",
          status,
        };
      });

      setItems(built);
      setLoading(false);
    };

    void load();
    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  const totalProjects = items.length;
  const onTrackCount = items.filter((d) => d.status === "On Track").length;
  const flaggedCount = items.filter(
    (d) => d.status === "At Risk" || d.status === "Minor Delay"
  ).length;
  const totalBlockers = items.reduce((s, d) => s + d.blockers, 0);

  const sorted = [...items].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );

  if (!isActive) return null;

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
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-delivery-status"
    >
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Delivery Status</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          Launch readiness view for active projects
        </p>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className={cx("dsvSection")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Failed to load data.</div>
            <div className={cx("emptyStateSub")}>{error}</div>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      {!error && (
        <div className={cx("dsvStatGrid")}>

          <div className={cx("dsvStatCard")}>
            <div className={cx("dsvStatCardTop")}>
              <div className={cx("dsvStatLabel")}>Projects</div>
              <div className={cx("dsvStatValue", "colorAccent")}>{totalProjects}</div>
            </div>
            <div className={cx("dsvStatCardDivider")} />
            <div className={cx("dsvStatCardBottom")}>
              <span className={cx("dsvStatDot", "dotBgAccent")} />
              <span className={cx("dsvStatMeta")}>being tracked</span>
            </div>
          </div>

          <div className={cx("dsvStatCard")}>
            <div className={cx("dsvStatCardTop")}>
              <div className={cx("dsvStatLabel")}>On Track</div>
              <div className={cx("dsvStatValue", "colorGreen")}>{onTrackCount}</div>
            </div>
            <div className={cx("dsvStatCardDivider")} />
            <div className={cx("dsvStatCardBottom")}>
              <span className={cx("dsvStatDot", "dotBgGreen")} />
              <span className={cx("dsvStatMeta")}>healthy delivery</span>
            </div>
          </div>

          <div className={cx("dsvStatCard")}>
            <div className={cx("dsvStatCardTop")}>
              <div className={cx("dsvStatLabel")}>Flagged</div>
              <div
                className={cx("dsvStatValue", flaggedCount > 0 ? "colorRed" : "colorGreen")}
              >
                {flaggedCount}
              </div>
            </div>
            <div className={cx("dsvStatCardDivider")} />
            <div className={cx("dsvStatCardBottom")}>
              <span
                className={cx("dsvStatDot", "dynBgColor")} style={{ "--bg-color": flaggedCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties}
              />
              <span className={cx("dsvStatMeta")}>
                {flaggedCount > 0 ? "at risk or delayed" : "none flagged"}
              </span>
            </div>
          </div>

          <div className={cx("dsvStatCard")}>
            <div className={cx("dsvStatCardTop")}>
              <div className={cx("dsvStatLabel")}>In Review</div>
              <div
                className={cx(
                  "dsvStatValue",
                  totalBlockers > 0 ? "colorAmber" : "colorGreen"
                )}
              >
                {totalBlockers}
              </div>
            </div>
            <div className={cx("dsvStatCardDivider")} />
            <div className={cx("dsvStatCardBottom")}>
              <span
                className={cx("dsvStatDot", "dynBgColor")}
                style={{ "--bg-color": totalBlockers > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties}
              />
              <span className={cx("dsvStatMeta")}>
                {totalBlockers > 0 ? "deliverables in review" : "none in review"}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ── Delivery list ─────────────────────────────────────────────── */}
      {!error && (
        <div className={cx("dsvSection")}>
          <div className={cx("dsvSectionHeader")}>
            <div className={cx("dsvSectionTitle")}>All Projects</div>
            <span className={cx("dsvSectionMeta")}>{items.length} PROJECTS</span>
          </div>

          {items.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No active projects found</div>
              <div className={cx("emptyStateSub")}>
                Completed or archived projects are not shown here.
              </div>
            </div>
          ) : (
            <div className={cx("dsvList")}>
              {sorted.map((d, idx) => (
                <div
                  key={d.projectId}
                  className={cx(
                    "dsvCard",
                    statusStripCls(d.status),
                    idx === sorted.length - 1 && "dsvCardLast"
                  )}
                >
                  {/* Head */}
                  <div className={cx("dsvCardHead")}>
                    <div className={cx("dsvProjectName")}>{d.project}</div>
                    <span className={cx("dsvStatusBadge", statusBadgeCls(d.status))}>
                      {d.status}
                    </span>
                  </div>

                  {/* Client · phase */}
                  <div className={cx("dsvClientPhase")}>
                    {d.client}
                    <span className={cx("dsvPhaseSep")}> · </span>
                    {d.phase}
                  </div>

                  {/* Readiness bar */}
                  <div className={cx("dsvReadinessWrap")}>
                    <div className={cx("dsvReadinessMeta")}>
                      <span className={cx("dsvReadinessLabel")}>Launch Readiness</span>
                      <span className={cx("dsvReadinessPct", readinessPctCls(d.readiness))}>
                        {d.readiness}%
                      </span>
                    </div>
                    <div className={cx("dsvReadinessTrack")}>
                      <div
                        className={cx("dsvReadinessFill", readinessBarCls(d.readiness))}
                        style={{ '--pct': `${d.readiness}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={cx("dsvCardFooter")}>
                    <div className={cx("dsvFooterCell")}>
                      <span className={cx("dsvFooterLabel")}>Due Date</span>
                      <span className={cx("dsvFooterValue")}>{d.launchDate}</span>
                    </div>
                    <div className={cx("dsvFooterDivider")} />
                    <div className={cx("dsvFooterCell")}>
                      <span className={cx("dsvFooterLabel")}>In Review</span>
                      <span
                        className={cx(
                          "dsvFooterValue",
                          d.blockers > 0 ? "colorAmber" : "colorGreen"
                        )}
                      >
                        {d.blockers}
                      </span>
                    </div>
                    {onGoTasks && (
                      <>
                        <div className={cx("dsvFooterDivider")} />
                        <button
                          type="button"
                          className={cx("dsvViewTasksBtn")}
                          onClick={() => onGoTasks(d.projectId)}
                        >
                          View tasks →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
