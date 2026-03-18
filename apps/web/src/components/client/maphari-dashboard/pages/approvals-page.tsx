"use client";

// ── ApprovalsPage ─────────────────────────────────────────────────────────────
// Wired to real API:
//   milestones  → GET /projects/:id  (detail.milestones)
//   changes     → GET /change-requests?projectId=:id
//   approve/decline → PATCH /change-requests/:id  { status: CLIENT_APPROVED / CLIENT_REJECTED }

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalProjectDetailWithRefresh,
  loadPortalChangeRequestsWithRefresh,
  updatePortalChangeRequestWithRefresh,
} from "../../../../lib/api/portal/projects";
import type { PortalProjectMilestone, PortalProjectChangeRequest } from "../../../../lib/api/portal/types";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

type TopTab = "Milestones" | "Change Requests";
type ChangeTab = "All" | "Pending" | "Approved" | "Declined";
type ChangeStatus = "pending" | "approved" | "declined";
type ChangeType = "Scope" | "Timeline";
type MilestoneStatus = "Approved" | "Awaiting Approval" | "Not Started";

type ChangeItem = {
  id: string;
  title: string;
  type: ChangeType;
  requestedBy: string;
  date: string;
  status: ChangeStatus;
  approvedBy?: string;
  impact: { budget: string; timeline: string };
  reason: string;
};

type Milestone = {
  id: string;
  name: string;
  dueDate: string;
  criteria: string[];
  status: MilestoneStatus;
  approvedAt: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TOP_TABS: TopTab[] = ["Milestones", "Change Requests"];
const CHANGE_TABS: ChangeTab[] = ["All", "Pending", "Approved", "Declined"];

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapApiMilestone(m: PortalProjectMilestone): Milestone {
  const isApproved = m.status === "APPROVED" || m.status === "SIGNED_OFF";
  const isAwaiting = m.status === "AWAITING_APPROVAL" || m.status === "SUBMITTED";
  return {
    id: m.id,
    name: m.title,
    dueDate: m.dueAt ? new Date(m.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "TBD",
    criteria: [],
    status: isApproved ? "Approved" : isAwaiting ? "Awaiting Approval" : "Not Started",
    approvedAt: isApproved && m.updatedAt
      ? new Date(m.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
      : null,
  };
}

function mapApiChangeRequest(cr: PortalProjectChangeRequest): ChangeItem {
  const status: ChangeStatus =
    cr.status === "CLIENT_APPROVED" || cr.status === "ADMIN_APPROVED" ? "approved" :
    cr.status === "CLIENT_REJECTED" || cr.status === "ADMIN_REJECTED" ? "declined" :
    "pending";

  const budgetImpact = cr.estimatedCostCents != null
    ? cr.estimatedCostCents > 0 ? `+R ${(cr.estimatedCostCents / 100).toLocaleString()}` : cr.estimatedCostCents < 0 ? `-R ${Math.abs(cr.estimatedCostCents / 100).toLocaleString()}` : "No change"
    : "No change";

  const timelineImpact = cr.estimatedHours != null
    ? cr.estimatedHours > 0 ? `+${Math.round(cr.estimatedHours / 8)}d` : cr.estimatedHours < 0 ? `-${Math.round(Math.abs(cr.estimatedHours) / 8)}d` : "No change"
    : "No change";

  return {
    id: cr.id,
    title: cr.title,
    type: "Scope",
    requestedBy: cr.requestedByName ?? "Team",
    date: new Date(cr.requestedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
    status,
    approvedBy: cr.clientDecidedByName ?? cr.adminDecidedByName ?? undefined,
    impact: { budget: budgetImpact, timeline: timelineImpact },
    reason: cr.description ?? cr.reason ?? "",
  };
}

function impactTone(value: string): string {
  if (value.startsWith("+")) return "var(--amber)";
  if (value.startsWith("-")) return "var(--green)";
  return "var(--muted)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ApprovalsPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [topTab, setTopTab] = useState<TopTab>("Milestones");
  const [changeTab, setChangeTab] = useState<ChangeTab>("All");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [declineModalId, setDeclineModalId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  useEffect(() => {
    if (!session || !projectId) return;
    setLoading(true);
    void Promise.all([
      loadPortalProjectDetailWithRefresh(session, projectId),
      loadPortalChangeRequestsWithRefresh(session, { projectId }),
    ]).then(([detailResult, crResult]) => {
      if (detailResult.nextSession) saveSession(detailResult.nextSession);
      if (crResult.nextSession) saveSession(crResult.nextSession);
      if (detailResult.data?.milestones && detailResult.data.milestones.length > 0) {
        setMilestones(detailResult.data.milestones.map(mapApiMilestone));
      }
      if (crResult.data && crResult.data.length > 0) {
        setChanges(crResult.data.map(mapApiChangeRequest));
      }
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  const pendingChanges = useMemo(() => changes.filter((c) => c.status === "pending"), [changes]);
  const pendingMilestones = useMemo(() => milestones.filter((m) => m.status === "Awaiting Approval"), [milestones]);

  const filteredChanges = useMemo(
    () => changeTab === "All" ? changes : changes.filter((c) => c.status === changeTab.toLowerCase()),
    [changes, changeTab],
  );

  async function approve(id: string): Promise<void> {
    setChanges((prev) => prev.map((item) => item.id === id ? { ...item, status: "approved", approvedBy: "You" } : item));
    if (session) {
      const result = await updatePortalChangeRequestWithRefresh(session, id, { status: "CLIENT_APPROVED" });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setChanges((prev) => prev.map((item) => item.id === id ? { ...item, status: "pending", approvedBy: undefined } : item));
        notify("error", "Approval failed", result.error.message ?? "Please try again.");
        return;
      }
    }
    notify("success", "Change approved", "Team has been notified and will proceed");
  }

  async function decline(id: string): Promise<void> {
    setChanges((prev) => prev.map((item) => item.id === id ? { ...item, status: "declined" } : item));
    if (session) {
      const result = await updatePortalChangeRequestWithRefresh(session, id, { status: "CLIENT_REJECTED", clientDecisionNote: declineNote || undefined });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setChanges((prev) => prev.map((item) => item.id === id ? { ...item, status: "pending" } : item));
        notify("error", "Decline failed", result.error.message ?? "Please try again.");
        setDeclineModalId(null);
        setDeclineNote("");
        return;
      }
    }
    setDeclineModalId(null);
    setDeclineNote("");
    notify("success", "Change declined", "Team has been notified");
  }

  const totalPending = pendingChanges.length + pendingMilestones.length;

  // "Minor" = no meaningful budget impact (no additional cost)
  const minorPendingChanges = useMemo(
    () => pendingChanges.filter(
      (c) => c.impact.budget === "No change" || c.impact.budget === "+R 0"
    ),
    [pendingChanges]
  );

  return (
    <div className={cx("pageBody")}>
      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Approvals</div>
          <h1 className={cx("pageTitle")}>Approvals</h1>
          <p className={cx("pageSub")}>Review milestone deliverables and manage scope change requests in one place.</p>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className={cx("card", "p12")}>
          <span className={cx("text12", "colorMuted")}>Loading approvals data…</span>
        </div>
      )}

      {/* Automation: approve minor changes in one click */}
      {!loading && minorPendingChanges.length > 0 && (
        <AutomationBanner
          show={true}
          variant="info"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 8.5l3.5 3.5 7.5-7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          title={`${minorPendingChanges.length} minor change${minorPendingChanges.length > 1 ? "s" : ""} with no budget impact`}
          description="These changes don't affect your budget. Approve all at once to keep the team unblocked."
          actionLabel="Approve all minor"
          onAction={async () => {
            for (const c of minorPendingChanges) {
              await approve(c.id);
            }
          }}
          dismissKey={`client:approvals-minor:${minorPendingChanges.map((c) => c.id).sort().join(",")}`}
        />
      )}

      {/* Pending alert — items needing review */}
      {!loading && totalPending > minorPendingChanges.length && (
        <div className={cx("card", "p12", "borderLeftAmber")}>
          <span className={cx("text12", "fw600")}>
            You have {totalPending - minorPendingChanges.length} item{totalPending - minorPendingChanges.length > 1 ? "s" : ""} awaiting your review.
          </span>
        </div>
      )}

      {/* Top-level tabs */}
      <div className={cx("pillTabs", "mb16")}>
        {TOP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={cx("pillTab", topTab === t && "pillTabActive")}
            onClick={() => setTopTab(t)}
          >
            {t}
            {t === "Milestones" && pendingMilestones.length > 0 && (
              <span className={cx("badge", "badgeAmber", "ml6")}>{pendingMilestones.length}</span>
            )}
            {t === "Change Requests" && pendingChanges.length > 0 && (
              <span className={cx("badge", "badgeAmber", "ml6")}>{pendingChanges.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Milestones tab ──────────────────────────────────────────────────── */}
      {topTab === "Milestones" && (
        <div className={cx("flexCol", "gap16")}>
          {milestones.length === 0 && !loading && (
            <div className={cx("card", "p24", "textCenter", "colorMuted")}>No milestones found for this project.</div>
          )}
          {milestones.map((ms) => (
            <div
              key={ms.id}
              className={cx(
                "card",
                ms.status === "Awaiting Approval" ? "borderLeftAmber" : ms.status === "Approved" ? "borderLeftAccent" : "borderLeftBorder",
              )}
            >
              <div className={cx("cardHd")}>
                <span className={cx("cardHdTitle")}>{ms.name}</span>
                <span className={cx("badge", ms.status === "Approved" ? "badgeGreen" : ms.status === "Awaiting Approval" ? "badgeAmber" : "badge")}>
                  {ms.status}
                </span>
              </div>
              <div className={cx("cardBodyPad")}>
                <div className={cx("text12", "colorMuted", "mb12")}>
                  Due: {ms.dueDate}{ms.approvedAt ? ` · Approved: ${ms.approvedAt}` : ""}
                </div>
                {ms.criteria.length > 0 && (
                  <>
                    <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8")}>Acceptance Criteria</div>
                    <div className={cx("listGroup")}>
                      {ms.criteria.map((c) => (
                        <div key={c} className={cx("listRow")}>
                          <span className={cx(ms.status === "Approved" ? "colorAccent" : "colorBorder")}>
                            {ms.status === "Approved" ? "✓" : "○"}
                          </span>
                          <span className={cx("text12", ms.status === "Approved" ? "colorMuted" : "")}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {ms.status === "Awaiting Approval" && (
                  <div className={cx("flex", "gap8", "mt12")}>
                    <button type="button" className={cx("btnSm", "btnAccent")}>Approve Milestone</button>
                    <button type="button" className={cx("btnSm", "btnGhost")}>Request Changes</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Change Requests tab ─────────────────────────────────────────────── */}
      {topTab === "Change Requests" && (
        <>
          <div className={cx("pillTabs", "mb16")}>
            {CHANGE_TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={cx("pillTab", changeTab === t && "pillTabActive")}
                onClick={() => setChangeTab(t)}
              >
                {t}
                {t === "Pending" && pendingChanges.length > 0 && (
                  <span className={cx("badge", "badgeAmber", "ml6")}>{pendingChanges.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className={cx("flexCol", "gap16")}>
            {filteredChanges.map((item) => (
              <div
                key={item.id}
                className={cx(
                  "card",
                  item.status === "pending" ? "borderLeftAmber" : item.status === "approved" ? "borderLeftAccent" : "borderLeftBorder",
                )}
              >
                <div className={cx("cardHd")}>
                  <div>
                    <div className={cx("fw700", "text14")}>{item.title}</div>
                    <div className={cx("text11", "colorMuted")}>
                      Requested by {item.requestedBy} · {item.date} · {item.type} change
                    </div>
                  </div>
                  <span className={cx("badge", item.status === "approved" ? "badgeGreen" : item.status === "pending" ? "badgeAmber" : "badgeRed")}>
                    {item.status === "approved" ? "Approved" : item.status === "pending" ? "Awaiting Approval" : "Declined"}
                  </span>
                </div>

                <div className={cx("cardBodyPad")}>
                  <div className={cx("flexRow", "gap16", "mb12")}>
                    <div className={cx("card", "p12", "flex1")}>
                      <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Budget Impact</div>
                      <div className={cx("fw700", "dynColor")} style={{ "--color": impactTone(item.impact.budget) } as React.CSSProperties}>{item.impact.budget}</div>
                    </div>
                    <div className={cx("card", "p12", "flex1")}>
                      <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Timeline Impact</div>
                      <div className={cx("fw700", "dynColor")} style={{ "--color": impactTone(item.impact.timeline) } as React.CSSProperties}>{item.impact.timeline}</div>
                    </div>
                  </div>

                  <div className={cx("text12", "colorMuted", "mb12")}>{item.reason}</div>

                  {item.status === "approved" && (
                    <div className={cx("text11", "colorAccent")}>Approved by {item.approvedBy}</div>
                  )}

                  {item.status === "pending" && (
                    <div className={cx("flexRow", "gap8")}>
                      <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void approve(item.id)}>
                        Approve Change
                      </button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setDeclineModalId(item.id)}>
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredChanges.length === 0 && !loading && (
              <div className={cx("card", "p24", "textCenter", "colorMuted")}>
                No {changeTab.toLowerCase()} change requests.
              </div>
            )}
          </div>
        </>
      )}

      {/* Decline modal */}
      {declineModalId !== null && (
        <div className={styles.changeHistModalBackdrop} onClick={() => setDeclineModalId(null)}>
          <div className={styles.changeHistModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.changeHistModalHeader}>
              <span className={styles.changeHistModalTitle}>Decline Change</span>
              <button type="button" className={styles.changeHistModalClose} aria-label="Close dialog" onClick={() => setDeclineModalId(null)}>✕</button>
            </div>
            <div className={styles.changeHistModalBody}>
              <div className={styles.changeHistModalText}>
                Let the team know why you are declining so they can propose an alternative.
              </div>
              <textarea
                className={styles.changeHistTextarea}
                placeholder="Reason for declining (optional but helpful)..."
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
              />
            </div>
            <div className={styles.changeHistModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setDeclineModalId(null)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void decline(declineModalId)}>
                Decline Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
