// ════════════════════════════════════════════════════════════════════════════
// milestone-approvals-page.tsx — Client Portal: Milestone Approvals
// Data      : GET  /milestone-approvals?projectId=:id
//             POST /milestones/:id/approval
// ════════════════════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect } from "react";
import { cx } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import {
  loadPortalMilestoneApprovalsWithRefresh,
  updatePortalMilestoneApprovalWithRefresh,
  type PortalMilestoneApproval,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

type MsStatus = "Approved" | "Awaiting Approval" | "Not Started";

// ── API → UI mapper ───────────────────────────────────────────────────────────

const API_STATUS_MAP: Record<PortalMilestoneApproval["status"], MsStatus> = {
  APPROVED: "Approved",
  PENDING:  "Awaiting Approval",
  REJECTED: "Not Started",
};

type MilestoneRow = {
  id: string;
  milestoneId: string;
  name: string;
  dueDate: string;
  criteria: string[];
  artifacts: { name: string; type: string; size: string }[];
  status: MsStatus;
  approvedAt: string | null;
  highlight: string;
};

function apiToMilestone(a: PortalMilestoneApproval): MilestoneRow {
  const dueDate = new Date(a.createdAt).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
  });
  const approvedAt = a.decidedAt
    ? new Date(a.decidedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : null;
  return {
    id:          a.milestoneId.slice(-6).toUpperCase(),
    milestoneId: a.milestoneId,
    name:        `Milestone ${a.milestoneId.slice(-4).toUpperCase()}`,
    dueDate,
    criteria:    a.comment ? [a.comment] : [],
    artifacts:   [],
    status:      API_STATUS_MAP[a.status] ?? "Not Started",
    approvedAt,
    highlight:   a.comment ?? "Pending client review.",
  };
}

// ── Cinematic review flow ─────────────────────────────────────────────────────

type ReviewStep = 0 | 1 | 2;
const REVIEW_STEPS = ["Review Artifacts", "Check Criteria", "Decision"] as const;

function CinematicReview({
  ms,
  onApprove,
  onRevisions,
}: {
  ms: MilestoneRow;
  onApprove:    () => void;
  onRevisions:  (note: string) => void;
}) {
  const [step, setStep] = useState<ReviewStep>(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [decision, setDecision] = useState<"approved" | "revisions" | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const allChecked = ms.criteria.length === 0 || ms.criteria.every((c) => checked[c]);
  const toggleCheck = (c: string) => setChecked((p) => ({ ...p, [c]: !p[c] }));

  if (decision === "approved") {
    return (
      <div className={cx("textCenter", "p32x24")}>
        <div className={cx("maSuccessEmoji")}>🎉</div>
        <div className={cx("fw700", "text13", "colorAccent", "mb6")}>Milestone Approved</div>
        <p className={cx("text12", "colorMuted")}>Your approval for <strong>{ms.name}</strong> has been recorded. The team has been notified.</p>
        <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => { setDecision(null); setStep(0); setChecked({}); }}>
          ← Start over
        </button>
      </div>
    );
  }

  if (decision === "revisions") {
    return (
      <div className={cx("textCenter", "p32x24")}>
        <div className={cx("maRevEmoji")}>📝</div>
        <div className={cx("fw700", "text13", "colorAmber", "mb6")}>Revision Request Sent</div>
        <p className={cx("text12", "colorMuted")}>Your feedback has been sent to the project team. They will update the deliverables and re-submit.</p>
        {revisionNote && (
          <div className={cx("cardS2v2", "mt12", "textLeft")}>
            <div className={cx("text10", "colorMuted", "mb4")}>Your note:</div>
            <div className={cx("text12")}>{revisionNote}</div>
          </div>
        )}
        <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => { setDecision(null); setStep(0); setChecked({}); setRevisionNote(""); }}>
          ← Start over
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className={cx("flexRow", "flexCenter", "gap0", "mb24", "pb20", "borderB")}>
        {REVIEW_STEPS.map((label, i) => {
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={label} className={cx("flexRow", "flexCenter", i < REVIEW_STEPS.length - 1 && "flex1")}>
              <div className={cx("flexCol", "flexCenter", "gap4")}>
                <div
                  className={cx("maStepCircle", "dynBgColor")}
                  style={{ "--bg-color": isDone ? "var(--lime)" : isActive ? "color-mix(in oklab, var(--lime) 15%, transparent)" : "var(--s3)", "--color": isDone ? "var(--s1)" : isActive ? "var(--lime)" : "var(--muted2)", "--border-color": isActive ? "var(--lime)" : isDone ? "transparent" : "var(--b2)" } as React.CSSProperties}
                  onClick={() => isDone && setStep(i as ReviewStep)}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={cx("maStepLabel", "dynColor", isActive && "fw700")} style={{ "--color": isActive ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                  {label}
                </span>
              </div>
              {i < REVIEW_STEPS.length - 1 && (
                <div className={cx("stepConnH15", "dynBgColor", "mb20")} style={{ "--bg-color": isDone ? "var(--lime)" : "var(--b2)" } as React.CSSProperties} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 0: Review Artifacts */}
      {step === 0 && (
        <div>
          <div className={cx("fw600", "text12", "mb12")}>Review the delivered files below before proceeding.</div>
          {ms.artifacts.length === 0 ? (
            <div className={cx("text11", "colorMuted", "mb20")}>No artifacts attached to this milestone.</div>
          ) : (
            <div className={cx("flexCol", "gap8", "mb20")}>
              {ms.artifacts.map((art) => (
                <div key={art.name} className={cx("maArtifactRow")}>
                  <div className={cx("maArtifactIcon")}>
                    {art.type}
                  </div>
                  <div className={cx("flex1")}>
                    <div className={cx("fw600", "text12")}>{art.name}</div>
                    <div className={cx("text10", "colorMuted")}>{art.size}</div>
                  </div>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Preview →</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setStep(1)}>
            I&apos;ve reviewed the files — Next →
          </button>
        </div>
      )}

      {/* Step 1: Check criteria */}
      {step === 1 && (
        <div>
          <div className={cx("fw600", "text12", "mb4")}>Tick each acceptance criterion you confirm is met.</div>
          <div className={cx("text11", "colorMuted", "mb16")}>
            {ms.criteria.length > 0 ? "You must confirm all criteria before approving." : "No specific criteria defined — proceed to decision."}
          </div>
          {ms.criteria.length > 0 && (
            <div className={cx("flexCol", "gap10", "mb20")}>
              {ms.criteria.map((c) => {
                const isChecked = !!checked[c];
                return (
                  <div
                    key={c}
                    onClick={() => toggleCheck(c)}
                    className={cx("maCriteriaRow", "dynBgColor")}
                    style={{ "--bg-color": isChecked ? "color-mix(in oklab, var(--lime) 6%, transparent)" : "var(--s2)", "--border-color": isChecked ? "color-mix(in oklab, var(--lime) 40%, transparent)" : "var(--b2)" } as React.CSSProperties}
                  >
                    <div className={cx("maCriteriaCheck", "dynBgColor")} style={{ "--bg-color": isChecked ? "var(--lime)" : "transparent", "--border-color": isChecked ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}>
                      {isChecked ? "✓" : ""}
                    </div>
                    <span className={cx("fw600", "text12", "dynColor")} style={{ "--color": isChecked ? "inherit" : "var(--muted2)" } as React.CSSProperties}>{c}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className={cx("flexRow", "gap8")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(0)}>← Back</button>
            <button
              type="button"
              className={cx("btnSm", allChecked ? "btnAccent" : "btnGhost", !allChecked && "opacity40")}
              disabled={!allChecked}
              onClick={() => setStep(2)}
            >
              {allChecked
                ? "All criteria met — Next →"
                : `${ms.criteria.filter((c) => !checked[c]).length} criteria remaining`}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Decision */}
      {step === 2 && (
        <div>
          <div className={cx("fw600", "text12", "mb4")}>Final decision for <strong>{ms.name}</strong></div>
          <div className={cx("text11", "colorMuted", "mb20")}>
            {ms.criteria.length > 0 ? `All ${ms.criteria.length} criteria confirmed.` : "Ready for your decision."} Choose your action below.
          </div>
          <div className={cx("flexCol", "gap10", "mb16")}>
            <button
              type="button"
              className={cx("maApproveDecisionBtn")}
              onClick={() => { setDecision("approved"); onApprove(); }}
            >
              <span className={cx("maApproveDecisionCheck")}>✓</span>
              <div>
                <div className={cx("fw700", "text13", "colorAccent")}>Approve this milestone</div>
                <div className={cx("text11", "colorMuted")}>Marks the milestone as complete. Team is notified immediately.</div>
              </div>
            </button>
          </div>
          <div className={cx("mb8")}>
            <div className={cx("fw600", "text12", "mb8")}>Or request changes:</div>
            <textarea
              className={cx("textarea", "resizeV", "mb8")}
              rows={3}
              placeholder="Describe what needs to be revised before you can approve..."
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />
            <div className={cx("flexRow", "gap8")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(1)}>← Back</button>
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "colorAmber", "borderAmber", !revisionNote.trim() && "opacity40")}
                disabled={!revisionNote.trim()}
                onClick={() => { if (revisionNote.trim()) { setDecision("revisions"); onRevisions(revisionNote); } }}
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MilestoneApprovalsPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [localApproved, setLocalApproved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    loadPortalMilestoneApprovalsWithRefresh(session, { projectId }).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setMilestones(r.data.map(apiToMilestone));
      setLoading(false);
    });
  }, [session, projectId]);

  function handleApprove(ms: MilestoneRow) {
    setLocalApproved(p => ({ ...p, [ms.milestoneId]: true }));
    if (!session) return;
    updatePortalMilestoneApprovalWithRefresh(session, ms.milestoneId, { status: "APPROVED" }).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        setLocalApproved(p => { const next = { ...p }; delete next[ms.milestoneId]; return next; });
        notify("error", "Approval failed", r.error.message ?? "Please try again.");
      } else {
        notify("success", `"${ms.name}" approved`, "Your team has been notified and will proceed.");
      }
    });
  }

  function handleRevisions(ms: MilestoneRow, note: string) {
    if (!session) return;
    updatePortalMilestoneApprovalWithRefresh(session, ms.milestoneId, { status: "REJECTED", comment: note }).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Request failed", r.error.message ?? "Please try again.");
      } else {
        notify("success", "Revision requested", "Your feedback has been sent to the team.");
      }
    });
  }

  function getStatus(ms: MilestoneRow): MsStatus {
    if (localApproved[ms.milestoneId]) return "Approved";
    return ms.status;
  }

  const totalCount    = milestones.length;
  const approvedCount = milestones.filter(m => getStatus(m) === "Approved").length;
  const awaitingCount = milestones.filter(m => getStatus(m) === "Awaiting Approval").length;
  const overdueCount  = 0;

  const STATS = [
    { label: "Total Milestones", value: String(totalCount),    color: "statCardAccent" },
    { label: "Approved",         value: String(approvedCount), color: "statCardGreen"  },
    { label: "Awaiting Approval",value: String(awaitingCount), color: "statCardAmber"  },
    { label: "Overdue",          value: String(overdueCount),  color: "statCardRed"    },
  ];

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
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Milestones</div>
          <h1 className={cx("pageTitle")}>Milestone Approvals</h1>
          <p className={cx("pageSub")}>Review milestone deliverables and approve when acceptance criteria are met.</p>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb20")}>
        {STATS.map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {milestones.length === 0 && (
        <div className={cx("card", "p32", "textCenter")}>
          <div className={cx("text12", "colorMuted")}>No milestone approvals found for this project.</div>
        </div>
      )}

      <div className={cx("flexCol", "gap16")}>
        {milestones.map((ms) => {
          const effectiveStatus = getStatus(ms);
          return (
            <div
              key={ms.milestoneId}
              className={cx("card", "dynBorderLeft3")}
              style={{ "--color": effectiveStatus === "Awaiting Approval" ? "var(--amber)" : effectiveStatus === "Approved" ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}
            >
              <div className={cx("cardHd")}>
                <span className={cx("badge", "badgeMuted", "mr8")}>{ms.id}</span>
                <span className={cx("cardHdTitle")}>{ms.name}</span>
                <span
                  className={cx("badge", effectiveStatus === "Approved" ? "badgeGreen" : effectiveStatus === "Awaiting Approval" ? "badgeAmber" : "badgeMuted", "mlAuto")}
                >
                  {effectiveStatus}
                </span>
              </div>

              <div className={cx("cardBodyPad")}>
                <p className={cx("text12", "colorMuted", "mb12")}>{ms.highlight}</p>
                <div className={cx("text10", "colorMuted", effectiveStatus === "Awaiting Approval" && "mb20")}>
                  Due: {ms.dueDate}{ms.approvedAt ? ` · Approved: ${ms.approvedAt}` : ""}
                </div>

                {/* Completed milestone: show criteria as ticked */}
                {effectiveStatus === "Approved" && ms.criteria.length > 0 && (
                  <div className={cx("mt12")}>
                    <div className={cx("text10", "colorMuted", "mb8", "fw700")}>ACCEPTANCE CRITERIA</div>
                    <div className={cx("listGroup")}>
                      {ms.criteria.map((c) => (
                        <div key={c} className={cx("listRow", "gap10")}>
                          <span className={cx("colorAccent", "fw700", "noShrink")}>✓</span>
                          <span className={cx("text12", "colorMuted")}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not started: grayed out criteria */}
                {effectiveStatus === "Not Started" && ms.criteria.length > 0 && (
                  <div className={cx("mt12", "opacity50")}>
                    <div className={cx("text10", "colorMuted", "mb8", "fw700")}>UPCOMING CRITERIA</div>
                    <div className={cx("listGroup")}>
                      {ms.criteria.map((c) => (
                        <div key={c} className={cx("listRow", "gap10")}>
                          <span className={cx("colorBorder", "noShrink")}>○</span>
                          <span className={cx("text12", "colorMuted")}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awaiting approval: cinematic review flow */}
                {effectiveStatus === "Awaiting Approval" && (
                  <CinematicReview
                    ms={ms}
                    onApprove={() => handleApprove(ms)}
                    onRevisions={(note) => handleRevisions(ms, note)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
