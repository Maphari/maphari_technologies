"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalSignOffsWithRefresh, type PortalSignOff } from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

type MStatus = "Approved" | "Pending Approval" | "Upcoming";
type MTab = "All" | MStatus;
type ReviewStep = 0 | 1 | 2;

type MArtifact = { name: string; type: string; size: string };
type MComment = { author: string; initials: string; text: string; when: string };

type Milestone = {
  id: string;
  name: string;
  phase: string;
  due: string;
  completedOn?: string;
  status: MStatus;
  progress: number;
  ownerName: string;
  ownerInitials: string;
  ownerRole: string;
  highlight: string;
  criteria: string[];
  artifacts: MArtifact[];
  deliverableCount: number;
  budget?: number;
  tags: string[];
  comments: MComment[];
};

const STATUS_COLOR: Record<MStatus, string> = {
  "Approved":         "var(--lime)",
  "Pending Approval": "var(--amber)",
  "Upcoming":         "var(--muted2)",
};
const STATUS_BADGE: Record<MStatus, string> = {
  "Approved":         "badgeGreen",
  "Pending Approval": "badgeAmber",
  "Upcoming":         "badgeMuted",
};
const STATUS_ICON: Record<MStatus, string> = {
  "Approved":         "check",
  "Pending Approval": "clock",
  "Upcoming":         "calendar",
};


const TABS: MTab[] = ["All", "Pending Approval", "Approved", "Upcoming"];
const REVIEW_STEPS = ["Review Artifacts", "Confirm Criteria", "Decision"] as const;
const PHASES = ["Initiation", "Discovery", "Design", "Development", "QA", "Launch"] as const;

// ── API mapper ─────────────────────────────────────────────────────────────────
function mapSignOffToMilestone(s: PortalSignOff): Milestone {
  const statusMap: Record<string, MStatus> = {
    SIGNED:  "Approved",
    PENDING: "Pending Approval",
  };
  const mStatus: MStatus = statusMap[s.status?.toUpperCase()] ?? "Upcoming";
  const initials = (s.signedByName ?? "—")
    .split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "—";
  return {
    id:              s.id,
    name:            s.name,
    phase:           "—",
    due:             s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—",
    completedOn:     s.signedAt  ? new Date(s.signedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : undefined,
    status:          mStatus,
    progress:        mStatus === "Approved" ? 100 : mStatus === "Pending Approval" ? 75 : 0,
    ownerName:       s.signedByName ?? "—",
    ownerInitials:   initials,
    ownerRole:       "—",
    highlight:       s.description ?? "No additional details provided.",
    criteria:        [],
    artifacts:       [],
    deliverableCount: 0,
    tags:            [],
    comments:        [],
  };
}

export function MilestonesPage() {
  const { session, projectId } = useProjectLayer();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState<MTab>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !projectId) return;
    setDataLoading(true);
    loadPortalSignOffsWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setMilestones(r.data.map(mapSignOffToMilestone));
    }).finally(() => setDataLoading(false));
  }, [session, projectId]);

  const [approvedSet, setApprovedSet]       = useState<Record<string, boolean>>({});
  const [reviewStarted, setReviewStarted]   = useState<Record<string, boolean>>({});
  const [reviewStep, setReviewStep]         = useState<Record<string, ReviewStep>>({});
  const [checked, setChecked]               = useState<Record<string, Record<string, boolean>>>({});
  const [revNote, setRevNote]               = useState<Record<string, string>>({});
  const [outcome, setOutcome]               = useState<Record<string, "approved" | "revisions" | null>>({});
  const [newComment, setNewComment]         = useState<Record<string, string>>({});
  const [extraComments, setExtraComments]   = useState<Record<string, MComment[]>>({});

  function getStatus(m: Milestone): MStatus {
    if (approvedSet[m.id]) return "Approved";
    return m.status;
  }

  const totalCount    = milestones.length;
  const approvedCount = milestones.filter(m => getStatus(m) === "Approved").length;
  const pendingCount  = milestones.filter(m => getStatus(m) === "Pending Approval").length;
  const upcomingCount = milestones.filter(m => getStatus(m) === "Upcoming").length;
  const completionPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const filtered = useMemo(() => {
    let list = tab === "All" ? milestones : milestones.filter(m => m.status === tab);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(m =>
      m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.phase.toLowerCase().includes(q)
    );
    return list;
  }, [tab, search, milestones]);

  function toggleChecked(mid: string, criterion: string) {
    setChecked(p => ({ ...p, [mid]: { ...p[mid], [criterion]: !p[mid]?.[criterion] } }));
  }

  function getStep(id: string): ReviewStep { return reviewStep[id] ?? 0; }
  function setStep(id: string, s: ReviewStep) { setReviewStep(p => ({ ...p, [id]: s })); }
  function getOutcome(id: string) { return outcome[id] ?? null; }

  function finishApprove(id: string) {
    setApprovedSet(p => ({ ...p, [id]: true }));
    setReviewStarted(p => ({ ...p, [id]: false }));
    setOutcome(p => ({ ...p, [id]: null }));
    setExpanded(null);
  }

  function resetReview(id: string) {
    setReviewStarted(p => ({ ...p, [id]: false }));
    setReviewStep(p => ({ ...p, [id]: 0 }));
    setChecked(p => ({ ...p, [id]: {} }));
    setRevNote(p => ({ ...p, [id]: "" }));
    setOutcome(p => ({ ...p, [id]: null }));
  }

  function addComment(mid: string) {
    const text = (newComment[mid] ?? "").trim();
    if (!text) return;
    setExtraComments(p => ({ ...p, [mid]: [...(p[mid] ?? []), { author: "You", initials: "ME", text, when: "Just now" }] }));
    setNewComment(p => ({ ...p, [mid]: "" }));
  }

  // Donut ring maths: r=28 → circumference ≈ 175.9
  const dashArray = `${(completionPct * 1.759).toFixed(1)} 175.9`;

  return (
    <div className={cx("pageBody")}>
      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Milestones</div>
          <h1 className={cx("pageTitle")}>Milestones & Approvals</h1>
          <p className={cx("pageSub")}>Track project milestones, review acceptance criteria, and record your formal approvals.</p>
        </div>
        <div className={cx("flexRow", "gap8", "noShrink")}>
          <button type="button" className={cx("btnGhost")}>
            <Ic n="download" sz={14} /> Export Timeline
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={cx("topCardsStack", "mb20")}>
        {([
          ["Total Milestones", totalCount,    "statCardAccent"],
          ["Approved",         approvedCount, "statCardGreen"],
          ["Pending Approval", pendingCount,  "statCardAmber"],
          ["Upcoming",         upcomingCount, "statCardBlue"],
        ] as [string, number, string][]).map(([label, value, color]) => (
          <div key={label} className={cx("statCard", color)}>
            <div className={cx("statLabel")}>{label}</div>
            <div className={cx("statValue")}>{value}</div>
          </div>
        ))}
      </div>

      {/* Loading / empty state */}
      {dataLoading && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateSub")}>Loading milestones…</div>
        </div>
      )}
      {!dataLoading && milestones.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="flag" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No milestones yet</div>
          <div className={cx("emptyStateSub")}>Milestones will appear here once your project has been set up by your team.</div>
        </div>
      )}

      {/* Overview Grid + full content — only when data is ready */}
      {!dataLoading && milestones.length > 0 && (<>
      <div className={cx("grid2", "mb20")}>

        {/* Left — Project Timeline */}
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <Ic n="calendar" sz={14} c="var(--accent)" />
            <span className={cx("cardHdTitle", "ml8")}>Project Timeline</span>
            <span className={cx("badge", "badgeMuted", "mlAuto")}>{completionPct}% complete</span>
          </div>
          <div className={cx("cardBodyPad")}>
            {/* Completion bar */}
            <div className={cx("trackH6Mb22")}>
              <div style={{ '--pct': `${completionPct}%` } as React.CSSProperties} />
            </div>

            {/* Vertical timeline */}
            <div className={cx("relative", "pl28")}>
              <div className={cx("timelineLineL9")} />
              <div className={cx("flexCol", "gap0")}>
                {milestones.map((m, i) => {
                  const st  = getStatus(m);
                  const col = STATUS_COLOR[st];
                  return (
                    <div key={m.id} className={cx("flexAlignStart", "gap10", "relative", i < milestones.length - 1 && "pb16")}>
                      {/* dot */}
                      <div className={cx("milestoneTimelineDot", "dynBgColor")} style={{ "--bg-color": st === "Upcoming" ? "var(--s3)" : `color-mix(in oklab, ${col} 15%, transparent)`, "--border-color": st === "Upcoming" ? "var(--b2)" : col } as React.CSSProperties}>
                        <Ic n={STATUS_ICON[st]} sz={9} c={st === "Upcoming" ? "var(--muted2)" : col} />
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("flexRow", "flexCenter", "gap6", "mb1")}>
                          <span className={cx("fw600", "text12")}>{m.name}</span>
                          <span className={cx("badge", STATUS_BADGE[st], "fs06", "badgeSm2")}>
                            {st === "Approved" ? "Done" : st === "Pending Approval" ? "Pending" : "Soon"}
                          </span>
                        </div>
                        <div className={cx("text10", "colorMuted")}>
                          {m.phase} · {st === "Approved" && m.completedOn ? `Completed ${m.completedOn}` : `Due ${m.due}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right — Approval Summary */}
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <Ic n="check" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>Approval Summary</span>
          </div>
          <div className={cx("cardBodyPad")}>
            {/* Donut + legend */}
            <div className={cx("flexRow", "flexCenter", "gap20", "mb22")}>
              <div className={cx("relative", "w72h72", "noShrink")}>
                <svg viewBox="0 0 72 72" className={cx("rotate90neg", "w72h72")}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="var(--s3)" strokeWidth="10" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke="var(--lime)" strokeWidth="10"
                    strokeDasharray={dashArray} strokeLinecap="round" />
                </svg>
                <div className={cx("absInset", "flexCol", "flexCenter", "justifyCenter")}>
                  <span className={cx("fw700", "fs11rem", "lineH1")}>{completionPct}%</span>
                  <span className={cx("text10", "colorMuted")}>done</span>
                </div>
              </div>
              <div className={cx("flex1", "flexCol", "gap8")}>
                {([
                  ["Approved", approvedCount, "var(--lime)"],
                  ["Pending",  pendingCount,  "var(--amber)"],
                  ["Upcoming", upcomingCount, "var(--muted2)"],
                ] as [string, number, string][]).map(([label, count, color]) => (
                  <div key={label} className={cx("flexRow", "gap8")}>
                    <div className={cx("wh8", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                    <span className={cx("text12", "flex1")}>{label}</span>
                    <span className={cx("fw700", "text12")}>{count}</span>
                    <div className={cx("trackW56h4")}>
                      <div className={cx("pctFillR2", "dynBgColor")} style={{ '--pct': `${(count / totalCount) * 100}%`, "--bg-color": color } as React.CSSProperties} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase breakdown */}
            <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls008", "mb10")}>Phase Breakdown</div>
            <div className={cx("flexCol", "gap7")}>
              {PHASES.map(phase => {
                const pms  = milestones.filter(m => m.phase === phase);
                if (!pms.length) return null;
                const done = pms.filter(m => getStatus(m) === "Approved").length;
                const pct  = (done / pms.length) * 100;
                return (
                  <div key={phase} className={cx("flexRow", "gap10")}>
                    <span className={cx("text11", "w88", "noShrink")}>{phase}</span>
                    <div className={cx("trackH5", "flex1")}>
                      <div className={cx("pctFillR25", "dynBgColor")} style={{ '--pct': `${pct}%`, "--bg-color": pct === 100 ? "var(--lime)" : "var(--amber)" } as React.CSSProperties} />
                    </div>
                    <span className={cx("text10", "colorMuted", "noShrink")}>{done}/{pms.length}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className={cx("amberWarnBanner")}>
          <Ic n="alert" sz={16} c="var(--amber)" />
          <div className={cx("flex1")}>
            <span className={cx("fw600", "text12", "colorAmber")}>
              {pendingCount} milestone{pendingCount > 1 ? "s" : ""} awaiting your approval
            </span>
            <span className={cx("text12", "colorMuted")}> · Review and sign off to keep the project on track.</span>
          </div>
        </div>
      )}

      {/* Tabs + Search */}
      <div className={cx("flexRow", "flexCenter", "gap12", "mb16")}>
        <div className={cx("flexRow", "h36")}>
          <div className={cx("pillTabs")}>
            {TABS.map(t => (
              <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className={cx("mlAuto", "relative")}>
          <div className={cx("searchIconWrap")}>
            <Ic n="filter" sz={13} c="var(--muted2)" />
          </div>
          <input
            className={cx("inputSm", "pl30", "w200")}
            placeholder="Search milestones…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List Card */}
      <div className={cx("card")}>
        {/* Column headers */}
        <div className={cx("msColHd")}>
          <div />
          <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Milestone</div>
          <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Phase</div>
          <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Status</div>
          <div />
        </div>

        {filtered.map((m, idx) => {
          const st            = getStatus(m);
          const col           = STATUS_COLOR[st];
          const isExpanded    = expanded === m.id;
          const isPending     = st === "Pending Approval";
          const isApproved    = st === "Approved";
          const started       = reviewStarted[m.id] ?? false;
          const step          = getStep(m.id);
          const mo            = getOutcome(m.id);
          const allCriteriaMet = m.criteria.every(c => checked[m.id]?.[c]);
          const allComments   = [...m.comments, ...(extraComments[m.id] ?? [])];

          return (
            <div key={m.id}>
              {/* Row header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : m.id)}
                className={cx("msRowHd", "dynBorderLeft3", "dynBgColor")} style={{ "--color": col, "--bg-color": isExpanded ? "var(--s2)" : "transparent" } as React.CSSProperties}
              >
                <div className={cx("iconBox40")} style={{ "--bg-color": `color-mix(in oklab, ${col} 12%, transparent)`, "--color": `color-mix(in oklab, ${col} 25%, transparent)` } as React.CSSProperties}>
                  <Ic n={STATUS_ICON[st]} sz={16} c={col} />
                </div>
                <div>
                  <div className={cx("flexRow", "flexCenter", "gap8", "mb2")}>
                    <span className={cx("badge", "badgeMuted")}>{m.id}</span>
                    <span className={cx("fw600", "text13")}>{m.name}</span>
                  </div>
                  <div className={cx("text11", "colorMuted")}>
                    Due {m.due}{m.completedOn ? ` · Completed ${m.completedOn}` : ""} · {m.deliverableCount} deliverable{m.deliverableCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <span className={cx("badge", "badgeMuted")}>{m.phase}</span>
                <span className={cx("badge", STATUS_BADGE[st])}>{isApproved ? "Approved" : st}</span>
                <div className={cx("chevronIcon", isExpanded ? "chevronMuted2Rotated" : "chevronMuted2")}>
                  <Ic n="chevronDown" sz={14} c="var(--muted2)" />
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className={cx("msExpandBody", "dynBorderLeft3")} style={{ "--color": col } as React.CSSProperties}>

                  {/* Left column */}
                  <div className={cx("flexCol", "gap18")}>

                    {/* Highlight */}
                    <p className={cx("text12", "colorMuted", "m0")}>{m.highlight}</p>

                    {/* Progress bar */}
                    {m.progress > 0 && m.progress < 100 && (
                      <div>
                        <div className={cx("flexBetween", "mb4")}>
                          <span className={cx("text11", "colorMuted")}>Completion</span>
                          <span className={cx("text11", "fw600", "dynColor")} style={{ "--color": col } as React.CSSProperties}>{m.progress}%</span>
                        </div>
                        <div className={cx("trackH5")}>
                          <div className={cx("pctFillR25", "dynBgColor")} style={{ '--pct': `${m.progress}%`, "--bg-color": col } as React.CSSProperties} />
                        </div>
                      </div>
                    )}

                    {/* Acceptance Criteria */}
                    <div>
                      <div className={cx("text10", "fw600", "colorMuted", "uppercase", "ls007", "mb8")}>Acceptance Criteria</div>
                      <div className={cx("flexCol", "gap6")}>
                        {m.criteria.map(c => (
                          <div key={c} className={cx("flexRow", "flexAlignStart", "gap8")}>
                            <div className={cx("mt1", "noShrink")}>
                              <Ic n={isApproved ? "check" : "clock"} sz={12} c={isApproved ? "var(--lime)" : "var(--muted2)"} />
                            </div>
                            <span className={cx("text12", "dynColor")} style={{ "--color": isApproved ? "inherit" : "var(--muted2)" } as React.CSSProperties}>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Artifacts */}
                    {m.artifacts.length > 0 && (
                      <div>
                        <div className={cx("text10", "fw600", "colorMuted", "uppercase", "ls007", "mb8")}>Artifacts</div>
                        <div className={cx("flexCol", "gap6")}>
                          {m.artifacts.map(art => (
                            <div key={art.name} className={cx("listChip")}>
                              <div className={cx("msArtIconBox")}>
                                {art.type}
                              </div>
                              <div className={cx("flex1")}>
                                <div className={cx("fw600", "text12")}>{art.name}</div>
                                <div className={cx("text10", "colorMuted")}>{art.size}</div>
                              </div>
                              <button type="button" className={cx("btnSm", "btnGhost")}>
                                <Ic n="eye" sz={12} /> Preview
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Review Flow — Pending only */}
                    {isPending && (
                      <div className={cx("msReviewBox")}>
                        <div className={cx("msReviewBoxHd")}>
                          <Ic n="alert" sz={13} c="var(--amber)" />
                          <span className={cx("fw600", "text12", "colorAmber")}>Approval Required</span>
                        </div>
                        <div className={cx("py14_px", "px16_px")}>

                          {/* Not started, no outcome */}
                          {!started && !mo && (
                            <div className={cx("flexRow", "gap10")}>
                              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setReviewStarted(p => ({ ...p, [m.id]: true }))}>
                                Start Review →
                              </button>
                              <span className={cx("text11", "colorMuted")}>{m.criteria.length} criteria · {m.artifacts.length} artifact{m.artifacts.length !== 1 ? "s" : ""}</span>
                            </div>
                          )}

                          {/* Stepper active */}
                          {started && !mo && (
                            <div>
                              {/* Step indicators */}
                              <div className={cx("msStepRow")}>
                                {REVIEW_STEPS.map((label, i) => {
                                  const isActive = step === i;
                                  const isDone   = step > i;
                                  return (
                                    <div key={label} className={cx("flexRow", "flexCenter", i < REVIEW_STEPS.length - 1 && "flex1")}>
                                      <div className={cx("flexCol", "flexCenter", "gap2")}>
                                        <div
                                          onClick={() => isDone && setStep(m.id, i as ReviewStep)}
                                          className={cx("msStepCircle", "dynBgColor")} style={{ "--bg-color": isDone ? "var(--lime)" : isActive ? "color-mix(in oklab, var(--lime) 15%, transparent)" : "var(--s3)", "--color": isDone ? "var(--s1)" : isActive ? "var(--lime)" : "var(--muted2)", "--border-color": isActive ? "var(--lime)" : isDone ? "transparent" : "var(--b2)" } as React.CSSProperties}
                                        >
                                          {isDone ? "✓" : i + 1}
                                        </div>
                                        <span className={cx("msStepLabel", "dynColor")} style={{ "--color": isActive ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>{label}</span>
                                      </div>
                                      {i < REVIEW_STEPS.length - 1 && (
                                        <div className={cx("stepConnH15sm", "dynBgColor", "mb14")} style={{ "--bg-color": isDone ? "var(--lime)" : "var(--b2)" } as React.CSSProperties} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Step 0: Artifacts */}
                              {step === 0 && (
                                <div>
                                  <div className={cx("text12", "fw600", "mb10")}>Review the delivered files before proceeding.</div>
                                  {m.artifacts.length === 0
                                    ? <div className={cx("text11", "colorMuted", "mb12")}>No artifacts uploaded yet for this milestone.</div>
                                    : (
                                      <div className={cx("flexCol", "gap6", "mb12")}>
                                        {m.artifacts.map(art => (
                                          <div key={art.name} className={cx("listChip")}>
                                            <div className={cx("msArtIconBoxSm")}>
                                              {art.type}
                                            </div>
                                            <div className={cx("flex1")}>
                                              <div className={cx("fw600", "text12")}>{art.name}</div>
                                              <div className={cx("text10", "colorMuted")}>{art.size}</div>
                                            </div>
                                            <button type="button" className={cx("btnSm", "btnGhost")}>Preview</button>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  }
                                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setStep(m.id, 1)}>Files reviewed — Next →</button>
                                </div>
                              )}

                              {/* Step 1: Criteria */}
                              {step === 1 && (
                                <div>
                                  <div className={cx("text12", "fw600", "mb3")}>Confirm each acceptance criterion is met.</div>
                                  <div className={cx("text11", "colorMuted", "mb12")}>All criteria must be ticked to proceed.</div>
                                  <div className={cx("flexCol", "gap6", "mb12")}>
                                    {m.criteria.map(c => {
                                      const isChk = !!checked[m.id]?.[c];
                                      return (
                                        <div
                                          key={c}
                                          onClick={() => toggleChecked(m.id, c)}
                                          className={cx("msCriteriaRow", "dynBgColor", "dynBorderLeft3")} style={{ "--bg-color": isChk ? "color-mix(in oklab, var(--lime) 6%, transparent)" : "var(--s1)", "--color": isChk ? "color-mix(in oklab, var(--lime) 40%, transparent)" : "var(--b2)" } as React.CSSProperties}
                                        >
                                          <div className={cx("customChk", "dynBgColor")} style={{ "--bg-color": isChk ? "var(--lime)" : "transparent", "--border-color": isChk ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}>
                                            {isChk ? "✓" : ""}
                                          </div>
                                          <span className={cx("text12", "dynColor")} style={{ "--color": isChk ? "inherit" : "var(--muted2)" } as React.CSSProperties}>{c}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className={cx("flexRow", "gap8")}>
                                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(m.id, 0)}>← Back</button>
                                    <button
                                      type="button"
                                      className={cx("btnSm", allCriteriaMet ? "btnAccent" : "btnGhost", !allCriteriaMet && "opacity40")}
                                      disabled={!allCriteriaMet}
                                      onClick={() => allCriteriaMet && setStep(m.id, 2)}
                                    >
                                      {allCriteriaMet ? "All met — Next →" : `${m.criteria.filter(c => !checked[m.id]?.[c]).length} remaining`}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Step 2: Decision */}
                              {step === 2 && (
                                <div>
                                  <div className={cx("text12", "fw600", "mb3")}>Final decision for <strong>{m.name}</strong></div>
                                  <div className={cx("text11", "colorMuted", "mb14")}>All {m.criteria.length} criteria confirmed. Choose your action.</div>
                                  <button
                                    type="button"
                                    className={cx("msApproveBtn")}
                                    onClick={() => setOutcome(p => ({ ...p, [m.id]: "approved" }))}
                                  >
                                    <Ic n="check" sz={16} c="var(--lime)" />
                                    <div>
                                      <div className={cx("fw700", "text12", "colorAccent")}>Approve this milestone</div>
                                      <div className={cx("text11", "colorMuted")}>Marks complete. Team notified immediately.</div>
                                    </div>
                                  </button>
                                  <div className={cx("text12", "fw600", "mb6")}>Or request revisions:</div>
                                  <textarea
                                    className={cx("textarea", "resizeV", "mb8", "fs075")} rows={2}
                                    placeholder="Describe what needs to change…"
                                    value={revNote[m.id] ?? ""}
                                    onChange={e => setRevNote(p => ({ ...p, [m.id]: e.target.value }))}
                                  />
                                  <div className={cx("flexRow", "gap8")}>
                                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(m.id, 1)}>← Back</button>
                                    <button
                                      type="button"
                                      className={cx("btnSm", "btnGhost", "colorAmber", "borderAmber", !(revNote[m.id] ?? "").trim() && "opacity40")}
                                      disabled={!(revNote[m.id] ?? "").trim()}
                                      onClick={() => (revNote[m.id] ?? "").trim() && setOutcome(p => ({ ...p, [m.id]: "revisions" }))}
                                    >
                                      Send Revision Request
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Outcome: Approved */}
                          {mo === "approved" && (
                            <div className={cx("textCenter", "py16_0")}>
                              <div className={cx("outcomeCircle")} style={{ "--bg-color": "color-mix(in oklab, var(--lime) 15%, transparent)", "--color": "var(--lime)" } as React.CSSProperties}>
                                <Ic n="check" sz={18} c="var(--lime)" />
                              </div>
                              <div className={cx("outcomeTitle", "dynColor")} style={{ "--color": "var(--lime)" } as React.CSSProperties}>Milestone Approved!</div>
                              <p className={cx("text12", "colorMuted", "mb14")}>Your approval for <strong>{m.name}</strong> has been recorded. The team has been notified.</p>
                              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => finishApprove(m.id)}>Done ✓</button>
                            </div>
                          )}

                          {/* Outcome: Revisions */}
                          {mo === "revisions" && (
                            <div className={cx("textCenter", "py16_0")}>
                              <div className={cx("outcomeCircle")} style={{ "--bg-color": "color-mix(in oklab, var(--amber) 15%, transparent)", "--color": "var(--amber)" } as React.CSSProperties}>
                                <Ic n="edit" sz={16} c="var(--amber)" />
                              </div>
                              <div className={cx("outcomeTitle", "dynColor")} style={{ "--color": "var(--amber)" } as React.CSSProperties}>Revision Request Sent</div>
                              <p className={cx("text12", "colorMuted", "mb14")}>Your feedback has been sent to the project team. They will revise and re-submit.</p>
                              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => resetReview(m.id)}>← Start Over</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    <div>
                      <div className={cx("text10", "fw600", "colorMuted", "uppercase", "ls007", "mb8")}>Comments ({allComments.length})</div>
                      {allComments.length > 0 && (
                        <div className={cx("flexCol", "gap8", "mb10")}>
                          {allComments.map((c, i) => (
                            <div key={i} className={cx("flexRow", "flexAlignStart", "gap10")}>
                              <Av initials={c.initials} size={26} />
                              <div className={cx("commentBubble")}>
                                <div className={cx("flexRow", "flexCenter", "gap6", "mb3")}>
                                  <span className={cx("fw600", "text11")}>{c.author}</span>
                                  <span className={cx("text10", "colorMuted")}>{c.when}</span>
                                </div>
                                <span className={cx("text12")}>{c.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={cx("commentTextAreaRow")}>
                        <textarea
                          className={cx("textarea", "commentTextAreaFlex")} rows={1}
                          placeholder="Add a comment…"
                          value={newComment[m.id] ?? ""}
                          onChange={e => setNewComment(p => ({ ...p, [m.id]: e.target.value }))}
                        />
                        <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => addComment(m.id)}>
                          <Ic n="send" sz={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className={cx("flexCol", "gap12")}>

                    {/* Owner */}
                    <div className={cx("cardS1v2", "p14")}>
                      <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb10")}>Milestone Owner</div>
                      <div className={cx("flexRow", "gap10")}>
                        <Av initials={m.ownerInitials} size={36} />
                        <div>
                          <div className={cx("fw600", "text12")}>{m.ownerName}</div>
                          <div className={cx("text11", "colorMuted")}>{m.ownerRole}</div>
                        </div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className={cx("cardS1v2", "p12x14")}>
                      <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb10")}>Details</div>
                      <div className={cx("grid2Cols", "gap8")}>
                        {([
                          ["Phase",        m.phase],
                          ["Due",          m.due],
                          ["Deliverables", String(m.deliverableCount)],
                          ["Budget",       m.budget != null ? `R ${m.budget.toLocaleString()}` : "—"],
                          ["Criteria",     String(m.criteria.length)],
                          ["Artifacts",    String(m.artifacts.length)],
                        ] as [string, string][]).map(([label, value]) => (
                          <div key={label}>
                            <div className={cx("text10", "colorMuted", "mb1")}>{label}</div>
                            <div className={cx("fw600", "text12")}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    {m.tags.length > 0 && (
                      <div>
                        <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb6")}>Tags</div>
                        <div className={cx("flexRow", "gap4", "flexWrap")}>
                          {m.tags.map(tag => (
                            <span key={tag} className={cx("badge", "badgeMuted")}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={cx("flexCol", "gap6", "mtAuto")}>
                      {isApproved && (
                        <button type="button" className={cx("btnSm", "btnGhost", "wFull", "justifyCenter")} onClick={() => window.print()}>
                          <Ic n="download" sz={12} /> Download Report
                        </button>
                      )}
                      {m.artifacts.length > 0 && (
                        <button type="button" className={cx("btnSm", "btnGhost", "wFull", "justifyCenter")}>
                          <Ic n="paperclip" sz={12} /> View All Artifacts
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className={cx("emptyPad40x16", "textCenter")}>
            <Ic n="flag" sz={24} c="var(--muted2)" />
            <div className={cx("text12", "colorMuted", "mt8")}>No milestones match your filter.</div>
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}
