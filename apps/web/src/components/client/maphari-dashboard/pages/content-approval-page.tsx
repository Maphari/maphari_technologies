"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalContentSubmissionsWithRefresh,
  updatePortalContentSubmissionWithRefresh,
  type PortalContentSubmission,
} from "../../../../lib/api/portal";
import { usePageToast } from "../hooks/use-page-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

type CType     = "Copywriting" | "Design" | "Video" | "Social Media" | "Email";
type CStatus   = "Awaiting Review" | "In Review" | "Approved" | "Revisions Requested";
type CPriority = "High" | "Medium" | "Low";
type CATab     = "All" | CStatus;

type CComment = { author: string; initials: string; text: string; date: string };
type CCheck   = { label: string; done: boolean };

type CAItem = {
  id:          string;
  title:       string;
  type:        CType;
  version:     string;
  date:        string;
  dueDate:     string;
  status:      CStatus;
  priority:    CPriority;
  project:     string;
  assignee:    string;
  initials:    string;
  description: string;
  notes?:      string;
  checklist:   CCheck[];
  comments:    CComment[];
};

// ── Config ─────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<CType, { icon: string; color: string }> = {
  Copywriting:    { icon: "edit",   color: "var(--lime)"   },
  Design:         { icon: "layers", color: "var(--purple)" },
  Video:          { icon: "zap",    color: "var(--red)"    },
  "Social Media": { icon: "grid",   color: "var(--cyan)"   },
  Email:          { icon: "mail",   color: "var(--amber)"  },
};

const STATUS_COLOR: Record<CStatus, string> = {
  "Awaiting Review":     "var(--amber)",
  "In Review":           "var(--blue)",
  "Approved":            "var(--lime)",
  "Revisions Requested": "var(--red)",
};

const STATUS_BADGE: Record<CStatus, string> = {
  "Awaiting Review":     "badgeAmber",
  "In Review":           "badgePurple",
  "Approved":            "badgeAccent",
  "Revisions Requested": "badgeRed",
};

const STATUS_ICON: Record<CStatus, string> = {
  "Awaiting Review":     "clock",
  "In Review":           "eye",
  "Approved":            "check",
  "Revisions Requested": "alert",
};

const PRIORITY_COLOR: Record<CPriority, string> = {
  High:   "var(--red)",
  Medium: "var(--amber)",
  Low:    "var(--muted2)",
};

const ALL_TYPES: CType[] = ["Copywriting", "Design", "Video", "Social Media", "Email"];
const TABS: CATab[]      = ["All", "Awaiting Review", "In Review", "Approved", "Revisions Requested"];

// ── Items loaded from API via loadPortalContentSubmissionsWithRefresh ────────



// ── Mapper ─────────────────────────────────────────────────────────────────────

function mapSubmissionToItem(s: PortalContentSubmission): CAItem {
  const TYPE_MAP: Record<string, CType> = {
    COPYWRITING: "Copywriting", DESIGN: "Design", VIDEO: "Video",
    SOCIAL: "Social Media", EMAIL: "Email",
  };
  const STATUS_MAP: Record<string, CStatus> = {
    PENDING: "Awaiting Review", UNDER_REVIEW: "In Review",
    APPROVED: "Approved", REVISIONS_REQUESTED: "Revisions Requested",
  };
  return {
    id:          s.id,
    title:       s.title,
    type:        TYPE_MAP[(s.type ?? "").toUpperCase()] ?? "Copywriting",
    version:     "v1",
    date:        new Date(s.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    dueDate:     "—",
    status:      STATUS_MAP[(s.status ?? "").toUpperCase()] ?? "Awaiting Review",
    priority:    "Medium",
    project:     s.projectId ?? "—",
    assignee:    s.submittedByName ?? "—",
    initials:    (s.submittedByName ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    description: s.notes ?? "",
    checklist:   [],
    comments:    [],
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ContentApprovalPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();
  const [items,               setItems]              = useState<CAItem[]>([]);
  const [tab,                 setTab]                = useState<CATab>("All");
  const [search,              setSearch]             = useState("");
  const [expanded,            setExpanded]           = useState<string | null>(null);
  const [approved,            setApproved]           = useState<Record<string, boolean>>({});
  const [revised,             setRevised]            = useState<Record<string, boolean>>({});
  const [requestingRevision,  setRequestingRevision] = useState<string | null>(null);
  const [feedback,            setFeedback]           = useState<Record<string, string>>({});
  const [feedbackSent,        setFeedbackSent]       = useState<Record<string, boolean>>({});
  const [actionLoading,       setActionLoading]      = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!session) return;
    void loadPortalContentSubmissionsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setItems(r.data.map(mapSubmissionToItem));
    });
  }, [session]);

  const resolvedStatus = (item: CAItem): CStatus => {
    if (approved[item.id]) return "Approved";
    if (revised[item.id])  return "Revisions Requested";
    return item.status;
  };

  const filtered = useMemo(() => {
    let list = tab === "All"
      ? items
      : items.filter(i => {
          const s: CStatus = approved[i.id] ? "Approved" : revised[i.id] ? "Revisions Requested" : i.status;
          return s === tab;
        });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q)  ||
        i.project.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, tab, search, approved, revised]);

  // Counts
  const total     = items.length;
  const awaiting  = items.filter(i => resolvedStatus(i) === "Awaiting Review").length;
  const inReview  = items.filter(i => resolvedStatus(i) === "In Review").length;
  const nApproved = items.filter(i => resolvedStatus(i) === "Approved").length;
  const revisions = items.filter(i => resolvedStatus(i) === "Revisions Requested").length;

  // Approval performance
  const decided     = nApproved + revisions;
  const approvalPct = decided > 0 ? Math.round((nApproved / decided) * 100) : 0;
  const highPending = items.filter(i => i.priority === "High" && resolvedStatus(i) !== "Approved").length;

  // Type breakdown
  const typeCounts = ALL_TYPES.map(t => ({ type: t, count: items.filter(i => i.type === t).length }));

  const statusBreakdown: Array<[CStatus, number, string]> = [
    ["Awaiting Review",     awaiting,  "Awaiting"],
    ["In Review",           inReview,  "In Review"],
    ["Approved",            nApproved, "Approved"],
    ["Revisions Requested", revisions, "Revisions"],
  ];

  const doApprove = async (id: string) => {
    if (!session || actionLoading[id]) return;
    // Optimistic update
    setApproved(p => ({ ...p, [id]: true }));
    setRevised(p  => ({ ...p, [id]: false }));
    setRequestingRevision(null);
    setExpanded(null);
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      const r = await updatePortalContentSubmissionWithRefresh(session, id, { status: "APPROVED" });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        setApproved(p => ({ ...p, [id]: false }));
        notify("error", "Approval failed", r.error.message);
      } else {
        notify("success", "Content approved", "The item has been marked as approved.");
      }
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const doRequestRevision = (id: string) => {
    setRequestingRevision(id);
    setExpanded(id);
  };

  const doSendFeedback = async (id: string) => {
    if (!session || actionLoading[id]) return;
    const notes = (feedback[id] ?? "").trim();
    if (!notes) {
      notify("error", "Feedback required", "Please describe the revisions needed before sending.");
      return;
    }
    // Optimistic update
    setRevised(p => ({ ...p, [id]: true }));
    setFeedbackSent(p => ({ ...p, [id]: true }));
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      const r = await updatePortalContentSubmissionWithRefresh(session, id, {
        status: "REVISIONS_REQUESTED",
        notes,
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        setRevised(p => ({ ...p, [id]: false }));
        setFeedbackSent(p => ({ ...p, [id]: false }));
        notify("error", "Could not send feedback", r.error.message);
      } else {
        notify("success", "Feedback sent", "Revision notes have been submitted.");
        setTimeout(() => {
          setFeedbackSent(p => ({ ...p, [id]: false }));
          setRequestingRevision(null);
          setExpanded(null);
        }, 1800);
      }
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Content</div>
          <h1 className={cx("pageTitle")}>Content Approvals</h1>
          <p className={cx("pageSub")}>Review, approve, or request revisions on all content deliverables — copy, design, and video assets.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} title="Upload not yet available" disabled>
            <Ic n="upload" sz={13} /> Upload Content
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} title="Export not yet available" disabled>
            <Ic n="download" sz={13} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Items",     value: total,     color: "statCard",      icon: "file",  ic: "var(--muted2)" },
          { label: "Awaiting Review", value: awaiting,  color: "statCardAmber", icon: "clock", ic: "var(--amber)"  },
          { label: "Approved",        value: nApproved, color: "statCardGreen", icon: "check", ic: "var(--lime)"   },
          { label: "Revisions",       value: revisions, color: "statCardRed",   icon: "alert", ic: "var(--red)"    },
        ].map(s => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{s.label}</div>
              <Ic n={s.icon} sz={14} c={s.ic} />
            </div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Overview row ─────────────────────────────────────────────────────── */}
      <div className={cx("grid2", "mb16")}>

        {/* Content Pipeline */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Content Pipeline</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{total} items</span>
          </div>

          {/* Type rows */}
          <div className={cx("flexCol", "gap8", "mb14")}>
            {typeCounts.map(({ type, count }) => {
              const tc  = TYPE_CFG[type];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={type} className={cx("flexRow", "gap10")}>
                  <div className={cx("rrCatIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${tc.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${tc.color} 20%, transparent)` } as React.CSSProperties}>
                    <Ic n={tc.icon} sz={11} c={tc.color} />
                  </div>
                  <span className={cx("text11", "flex1", "minW0")}>{type}</span>
                  <div className={cx("trackW80h4")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": tc.color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "text10", "colorMuted2", "w40", "textRight")}>
                    {count} <span className={cx("fs06")}>{pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Composition bar */}
          <div className={cx("trackH8Flex")}>
            {typeCounts.filter(t => t.count > 0).map(({ type, count }) => (
              <div key={type} className={cx("dynFlex", "dynBgColor")} style={{ "--flex": count, "--bg-color": TYPE_CFG[type].color } as React.CSSProperties} />
            ))}
          </div>
          <div className={cx("flexRow", "flexWrap", "gapR5x12", "mt8")}>
            {typeCounts.filter(t => t.count > 0).map(({ type }) => (
              <span key={type} className={cx("flexRow", "gap4")}>
                <span className={cx("dot6", "inlineBlock")} style={{ "--bg-color": TYPE_CFG[type].color } as React.CSSProperties} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>{type}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Approval Performance */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Approval Performance</span>
          </div>

          {/* Circular rate + metrics */}
          <div className={cx("flexRow", "flexAlignStart", "gap20", "mb16")}>
            {/* Donut */}
            <div className={cx("caDonut")} style={{ "--pct": `${approvalPct}%` } as React.CSSProperties}>
              <div className={cx("iconCircle52")}>
                <span className={cx("fontMono", "fw800", "caDonutPct")}>{approvalPct}%</span>
                <span className={cx("fontMono", "caDonutLabel")}>RATE</span>
              </div>
            </div>

            {/* Metrics */}
            <div className={cx("flex1", "flexCol", "gap9")}>
              {([
                { icon: "clock", label: "Pending Action",  value: `${awaiting + revisions} items`, color: "var(--amber)" },
                { icon: "alert", label: "High Priority",   value: `${highPending} pending`,         color: "var(--red)"   },
                { icon: "eye",   label: "In Review",       value: `${inReview} item${inReview !== 1 ? "s" : ""}`, color: "var(--blue)" },
              ] as { icon: string; label: string; value: string; color: string }[]).map(m => (
                <div key={m.label} className={cx("flexRow", "gap8")}>
                  <Ic n={m.icon} sz={12} c={m.color} />
                  <span className={cx("text11", "colorMuted", "flex1")}>{m.label}</span>
                  <span className={cx("fontMono", "fw600", "text11")}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div className={cx("borderT", "pt12", "flexRow", "flexWrap", "gap6_14")}>
            {statusBreakdown.map(([st, n, label]) => (
              <span key={st} className={cx("flexRow", "gap5")}>
                <span className={cx("dot7", "inlineBlock")} style={{ "--bg-color": STATUS_COLOR[st] } as React.CSSProperties} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>{n} {label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── High-priority alert ───────────────────────────────────────────────── */}
      {highPending > 0 && (
        <div className={cx("caHighPriorityAlert")}>
          <Ic n="alert" sz={15} c="var(--red)" />
          <span className={cx("text11")}>
            <strong className={cx("fontMono")}>{highPending} high-priority item{highPending > 1 ? "s" : ""}</strong>
            <span className={cx("colorMuted")}> awaiting action — review urgently to keep projects on schedule.</span>
          </span>
        </div>
      )}

      {/* ── Search + tabs ─────────────────────────────────────────────────────── */}
      <div className={cx("flexBetween", "gap10", "mb10")}>
        <div className={cx("pillTabs", "mb0")}>
          {TABS.map(t => (
            <button key={t} type="button" className={cx("pillTab", tab === t ? "pillTabActive" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w220", "h36")}
          placeholder="Filter by title, type, project…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Content list ─────────────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {/* Column headers */}
        {filtered.length > 0 && (
          <div className={cx("caListHeader")}>
            {["", "Content", "Priority", "Due Date", "Status", ""].map((h, i) => (
              <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="check" sz={32} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No items</div>
            <div className={cx("text12", "colorMuted")}>
              {search ? `No results for "${search}"` : "No content in this category."}
            </div>
            {search && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Items */}
        {filtered.map((item, idx) => {
          const status     = resolvedStatus(item);
          const sc         = STATUS_COLOR[status];
          const tc         = TYPE_CFG[item.type];
          const isOpen     = expanded === item.id;
          const isRevReq   = requestingRevision === item.id;
          const isActionable = (status === "Awaiting Review" || status === "In Review") && !approved[item.id];
          const checkDone  = item.checklist.filter(c => c.done).length;

          return (
            <div
              key={item.id}
              className={cx("dynBorderLeft3", idx < filtered.length - 1 && "borderB")}
              style={{ "--color": sc } as React.CSSProperties}
            >
              {/* Row trigger */}
              <button
                type="button"
                aria-expanded={isOpen}
                className={cx("gridRowBtn6colV4")}
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                {/* Type icon box */}
                <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${tc.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${tc.color} 25%, transparent)` } as React.CSSProperties}>
                  <Ic n={tc.icon} sz={15} c={tc.color} />
                </div>

                {/* Title + meta */}
                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate")}>{item.title}</div>
                  <div className={cx("flexRow", "flexCenter", "gap6", "mt2", "flexWrap")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{item.id}</span>
                    <span className={cx("caTypePill", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${tc.color} 10%, var(--s3))`, "--color": tc.color } as React.CSSProperties}>{item.type}</span>
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{item.version}</span>
                    <Av initials={item.initials} size={16} />
                    <span className={cx("text10", "colorMuted2", "truncate", "maxW130")}>{item.assignee}</span>
                  </div>
                </div>

                {/* Priority */}
                <div className={cx("flexRow", "gap5")}>
                  <div className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": PRIORITY_COLOR[item.priority] } as React.CSSProperties} />
                  <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": PRIORITY_COLOR[item.priority] } as React.CSSProperties}>{item.priority}</span>
                </div>

                {/* Due date */}
                <span className={cx("fontMono", "text10", "colorMuted2")}>{item.dueDate}</span>

                {/* Status badge */}
                <span className={cx("badge", STATUS_BADGE[status], "flexRow", "gap4")}>
                  <Ic n={STATUS_ICON[status]} sz={9} c="currentColor" />
                  {status}
                </span>

                {/* Chevron */}
                <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                  <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                </span>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className={cx("dynBgColor", "borderT")} style={{ "--bg-color": `color-mix(in oklab, ${sc} 4%, var(--s2))` } as React.CSSProperties}>
                  <div className={cx("caExpandGrid")}>

                    {/* Left: description + checklist + actions */}
                    <div className={cx("panelL")}>

                      {/* Description */}
                      <div className={cx("text11", "colorMuted", "lineH165", "mb14")}>{item.description}</div>

                      {/* Checklist */}
                      <div className={cx("mb14")}>
                        <div className={cx("flexBetween", "mb8")}>
                          <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Checklist</span>
                          <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": checkDone === item.checklist.length ? "var(--lime)" : "var(--amber)" } as React.CSSProperties}>
                            {checkDone}/{item.checklist.length} done
                          </span>
                        </div>
                        <div className={cx("flexCol", "gap6")}>
                          {item.checklist.map((c, i) => (
                            <div key={i} className={cx("flexRow", "gap8")}>
                              <div className={cx("rrStepCheck", "dynBgColor")} style={{ "--bg-color": c.done ? "color-mix(in oklab, var(--lime) 15%, var(--s2))" : "var(--s3)", "--border-color": c.done ? "color-mix(in oklab, var(--lime) 30%, transparent)" : "var(--b2)" } as React.CSSProperties}>
                                {c.done && <Ic n="check" sz={10} c="var(--lime)" />}
                              </div>
                              <span className={cx("text11", "dynColor")} style={{ "--color": c.done ? "inherit" : "var(--muted2)" } as React.CSSProperties}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Revision notes */}
                      {item.notes && status === "Revisions Requested" && !approved[item.id] && (
                        <div className={cx("caRevisionNote")}>
                          <div className={cx("flexRow", "flexCenter", "gap6", "mb5")}>
                            <Ic n="alert" sz={12} c="var(--red)" />
                            <span className={cx("fw600", "text11", "colorRed")}>Revision Feedback</span>
                          </div>
                          <div className={cx("text11", "colorMuted", "lineH16")}>{item.notes}</div>
                        </div>
                      )}

                      {/* Inline revision form */}
                      {isRevReq && (
                        <div className={cx("caRevisionForm")}>
                          <div className={cx("flexRow", "flexCenter", "gap6", "mb8")}>
                            <Ic n="edit" sz={13} c="var(--amber)" />
                            <span className={cx("fw600", "text11", "colorAmber")}>Revision Notes</span>
                          </div>
                          <textarea
                            className={cx("input", "wFull", "resizeV", "mb8")}
                            rows={3}
                            placeholder="Describe the changes needed — be specific about sections, wording, or design elements…"
                            value={feedback[item.id] ?? ""}
                            onChange={e => setFeedback(p => ({ ...p, [item.id]: e.target.value }))}
                          />
                          <div className={cx("flexRow", "gap8")}>
                            <button
                              type="button"
                              className={cx("btnSm", feedbackSent[item.id] ? "btnGhost" : "btnAccent", feedbackSent[item.id] && "colorGreen")}
                              onClick={() => doSendFeedback(item.id)}
                              disabled={actionLoading[item.id]}
                            >
                              {actionLoading[item.id]
                                ? "Sending…"
                                : feedbackSent[item.id]
                                  ? <><Ic n="check" sz={11} c="var(--green)" />&nbsp;Sent</>
                                  : "Send Feedback"}
                            </button>
                            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setRequestingRevision(null)} disabled={actionLoading[item.id]}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isRevReq && (
                        <div className={cx("flexRow", "gap8", "flexWrap")}>
                          {isActionable && (
                            <>
                              <button type="button" className={cx("btnSm", "btnAccent", "flexRow", "gap5")} onClick={() => doApprove(item.id)} disabled={actionLoading[item.id]}>
                                <Ic n="check" sz={11} c="var(--bg)" /> {actionLoading[item.id] ? "Approving…" : "Approve"}
                              </button>
                              <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} onClick={() => doRequestRevision(item.id)} disabled={actionLoading[item.id]}>
                                <Ic n="edit" sz={11} c="var(--muted2)" /> Request Revisions
                              </button>
                            </>
                          )}
                          {status === "Approved" && (
                            <span className={cx("text11", "flexRow", "gap5", "colorAccent")}>
                              <Ic n="check" sz={12} c="var(--lime)" /> Approved
                            </span>
                          )}
                          {status === "Revisions Requested" && (
                            <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} onClick={() => doApprove(item.id)} disabled={actionLoading[item.id]}>
                              <Ic n="check" sz={11} c="var(--green)" /> {actionLoading[item.id] ? "Approving…" : "Approve Instead"}
                            </button>
                          )}
                          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} title="Preview not yet available" disabled>
                            <Ic n="eye" sz={11} c="var(--muted2)" /> Preview
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: assignee + comments */}
                    <div className={cx("sectionPanelL")}>

                      {/* Assignee card */}
                      <div>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb8")}>Assignee</div>
                        <div className={cx("infoChip")}>
                          <Av initials={item.initials} size={32} />
                          <div>
                            <div className={cx("fw600", "text12")}>{item.assignee}</div>
                            <div className={cx("text10", "colorMuted2")}>{item.project}</div>
                            <div className={cx("fontMono", "text10", "colorMuted2")}>Submitted {item.date}</div>
                          </div>
                        </div>
                      </div>

                      {/* Comments */}
                      {item.comments.length > 0 && (
                        <div>
                          <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb8")}>
                            Comments <span className={cx("colorMuted2")}>({item.comments.length})</span>
                          </div>
                          <div className={cx("flexCol", "gap8")}>
                            {item.comments.map((c, i) => (
                              <div key={i} className={cx("flexRow", "flexAlignStart", "gap8")}>
                                <Av initials={c.initials} size={24} />
                                <div className={cx("flex1", "caCommentBubble")}>
                                  <div className={cx("flexBetween", "mb3")}>
                                    <span className={cx("fw600", "text10")}>{c.author.split(" ")[0]}</span>
                                    <span className={cx("fontMono", "fs06", "colorMuted2")}>{c.date}</span>
                                  </div>
                                  <div className={cx("text10", "colorMuted", "lineH15")}>{c.text}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Version badge */}
                      <div className={cx("borderT", "pt12", "flexRow", "gap8")}>
                        <span className={cx("badge", "badgeMuted")}>{item.type}</span>
                        <span className={cx("badge", "badgeMuted")}>{item.version}</span>
                        <span className={cx("badge", "badgeMuted", "dynColor")} style={{ "--color": PRIORITY_COLOR[item.priority] } as React.CSSProperties}>{item.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
