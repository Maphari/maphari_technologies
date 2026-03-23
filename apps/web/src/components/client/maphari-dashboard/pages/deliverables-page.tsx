"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalDeliverablesWithRefresh, approvePortalDeliverableWithRefresh, requestChangesPortalDeliverableWithRefresh, reviewPortalDeliverableWithRefresh, type PortalDeliverable } from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { CommentThread } from "../../../shared/ui/comment-thread";
import {
  getPortalAnnotationsWithRefresh,
  createPortalAnnotationWithRefresh,
  resolvePortalAnnotationWithRefresh,
  type PortalAnnotation,
} from "../../../../lib/api/portal/annotations";

// ── Types ──────────────────────────────────────────────────────────────────────

type DType     = "Figma" | "PDF" | "Video" | "Prototype" | "Spec";
type DStatus   = "Accepted" | "Pending Review" | "In Progress" | "Upcoming";
type DCategory = "Design" | "Development" | "QA" | "Documentation";
type DTab      = "All" | DStatus;

type DVersion = { ver: number; date: string; note: string };

type Deliverable = {
  id:             string;
  name:           string;
  milestone:      string;
  date:           string;
  type:           DType;
  category:       DCategory;
  status:         DStatus;
  description:    string;
  notes:          string;
  ownerName:      string;
  ownerInitials:  string;
  ownerRole:      string;
  versions:       DVersion[];
  tags:           string[];
};

// ── Config ─────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<DType, { icon: string; color: string }> = {
  Figma:     { icon: "layers",  color: "var(--purple)" },
  PDF:       { icon: "file",    color: "var(--blue)"   },
  Video:     { icon: "video",   color: "var(--red)"    },
  Prototype: { icon: "monitor", color: "var(--green)"  },
  Spec:      { icon: "code",    color: "var(--lime)"   },
};

const STATUS_COLOR: Record<DStatus, string> = {
  "Accepted":       "var(--lime)",
  "Pending Review": "var(--amber)",
  "In Progress":    "var(--cyan)",
  "Upcoming":       "var(--muted2)",
};
const STATUS_BADGE: Record<DStatus, string> = {
  "Accepted":       "badgeAccent",
  "Pending Review": "badgeAmber",
  "In Progress":    "badgeCyan",
  "Upcoming":       "badgeMuted",
};
const STATUS_ICON: Record<DStatus, string> = {
  "Accepted":       "check",
  "Pending Review": "clock",
  "In Progress":    "activity",
  "Upcoming":       "lock",
};

const CAT_CFG: Record<DCategory, { icon: string; color: string }> = {
  Design:        { icon: "layers",     color: "var(--purple)" },
  Development:   { icon: "code",       color: "var(--lime)"   },
  QA:            { icon: "shieldCheck",color: "var(--green)"  },
  Documentation: { icon: "file",       color: "var(--blue)"   },
};

const TABS: DTab[] = ["All", "Pending Review", "In Progress", "Accepted", "Upcoming"];

// ── API mapping ────────────────────────────────────────────────────────────────

function apiStatusToUi(status: string): DStatus {
  switch (status) {
    case "ACCEPTED":           return "Accepted";
    case "DELIVERED":
    case "PENDING_REVIEW":     return "Pending Review";
    case "IN_PROGRESS":        return "In Progress";
    case "CHANGES_REQUESTED":  return "Pending Review";
    default:                   return "Upcoming";
  }
}

function mapApiDeliverable(d: PortalDeliverable, idx: number): Deliverable {
  const initials = (d.ownerName ?? "—")
    .split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "—";
  return {
    id:             d.id,
    name:           d.name,
    milestone:      d.milestoneId ? d.milestoneId.slice(-4).toUpperCase() : `M${idx + 1}`,
    date:           d.dueAt ? new Date(d.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—",
    type:           "PDF",
    category:       "Development",
    status:         apiStatusToUi(d.status),
    description:    "",
    notes:          "",
    ownerName:      d.ownerName ?? "Team",
    ownerInitials:  initials,
    ownerRole:      "Team Member",
    versions:       [],
    tags:           [],
  };
}

// ── Fallback data ────────────────────────────────────────────────────────────

const EMPTY_DATA: Deliverable[] = [];

// ── Component ──────────────────────────────────────────────────────────────────

export function DeliverablesPage() {
  // ── Project layer: real API data ──────────────────────────────────────────
  const { session, projectId } = useProjectLayer();
  const [DATA, setData] = useState<Deliverable[]>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadPortalDeliverablesWithRefresh(session, projectId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error.message ?? "Failed to load."); return; }
      if (result.data && result.data.length > 0) {
        setData(result.data.map((d, i) => mapApiDeliverable(d, i)));
      }
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab,           setTab]           = useState<DTab>("All");
  const [search,        setSearch]        = useState("");
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [accepted,      setAccepted]      = useState<Record<string, boolean>>({});
  const [revised,       setRevised]       = useState<Record<string, boolean>>({});
  const [submitting,    setSubmitting]    = useState<Record<string, boolean>>({});
  const [feedbackText,  setFeedbackText]  = useState<Record<string, string>>({});

  // ── Annotations per deliverable ────────────────────────────────────────────
  const [annotations,     setAnnotations]     = useState<Record<string, PortalAnnotation[]>>({});
  const [annotLoading,    setAnnotLoading]    = useState<Record<string, boolean>>({});
  const [annotComment,    setAnnotComment]    = useState<Record<string, string>>({});
  const [annotPage,       setAnnotPage]       = useState<Record<string, string>>({});
  const [annotSubmitting, setAnnotSubmitting] = useState<Record<string, boolean>>({});

  async function handleApprove(d: Deliverable): Promise<void> {
    if (!session || !projectId || submitting[d.id]) return;
    setSubmitting(p => ({ ...p, [d.id]: true }));
    setAccepted(p => ({ ...p, [d.id]: true })); // optimistic
    try {
      const reviewerName = session.user?.email?.split("@")[0];
      const feedback = feedbackText[d.id]?.trim() || undefined;
      // Use new review endpoint (stores clientFeedback, reviewedAt, reviewedByName)
      const result = await reviewPortalDeliverableWithRefresh(session, d.id, "APPROVED", feedback, reviewerName);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        // Fall back to legacy approve endpoint
        const fallback = await approvePortalDeliverableWithRefresh(session, projectId, d.id);
        if (fallback.nextSession) saveSession(fallback.nextSession);
        if (fallback.error) {
          setAccepted(p => ({ ...p, [d.id]: false }));
        }
      }
    } finally {
      setSubmitting(p => ({ ...p, [d.id]: false }));
    }
  }

  async function handleRequestChanges(d: Deliverable): Promise<void> {
    if (!session || !projectId || submitting[d.id]) return;
    setSubmitting(p => ({ ...p, [d.id]: true }));
    setRevised(p => ({ ...p, [d.id]: true })); // optimistic
    try {
      const reviewerName = session.user?.email?.split("@")[0];
      const feedback = feedbackText[d.id]?.trim() || undefined;
      // Use new review endpoint (stores clientFeedback, reviewedAt, reviewedByName)
      const result = await reviewPortalDeliverableWithRefresh(session, d.id, "CHANGES_REQUESTED", feedback, reviewerName);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        // Fall back to legacy request-changes endpoint
        const fallback = await requestChangesPortalDeliverableWithRefresh(session, projectId, d.id, feedback);
        if (fallback.nextSession) saveSession(fallback.nextSession);
        if (fallback.error) {
          setRevised(p => ({ ...p, [d.id]: false }));
        }
      }
    } finally {
      setSubmitting(p => ({ ...p, [d.id]: false }));
    }
  }

  async function loadAnnotations(deliverableId: string): Promise<void> {
    if (!session || annotations[deliverableId] !== undefined || annotLoading[deliverableId]) return;
    setAnnotLoading(p => ({ ...p, [deliverableId]: true }));
    const r = await getPortalAnnotationsWithRefresh(session, deliverableId);
    if (r.nextSession) saveSession(r.nextSession);
    setAnnotations(p => ({ ...p, [deliverableId]: r.data ?? [] }));
    setAnnotLoading(p => ({ ...p, [deliverableId]: false }));
  }

  async function handleAddAnnotation(deliverableId: string): Promise<void> {
    const comment = annotComment[deliverableId]?.trim();
    if (!session || !comment || annotSubmitting[deliverableId]) return;
    const rawPage = annotPage[deliverableId]?.trim();
    const pageNumber = rawPage ? parseInt(rawPage, 10) : undefined;
    setAnnotSubmitting(p => ({ ...p, [deliverableId]: true }));
    const r = await createPortalAnnotationWithRefresh(session, deliverableId, {
      comment,
      ...(pageNumber && !isNaN(pageNumber) ? { pageNumber } : {}),
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setAnnotations(p => ({ ...p, [deliverableId]: [...(p[deliverableId] ?? []), r.data!] }));
      setAnnotComment(p => ({ ...p, [deliverableId]: "" }));
      setAnnotPage(p => ({ ...p, [deliverableId]: "" }));
    }
    setAnnotSubmitting(p => ({ ...p, [deliverableId]: false }));
  }

  async function handleResolveAnnotation(deliverableId: string, annotationId: string): Promise<void> {
    if (!session) return;
    const r = await resolvePortalAnnotationWithRefresh(session, annotationId);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setAnnotations(p => ({
        ...p,
        [deliverableId]: (p[deliverableId] ?? []).map(a =>
          a.id === annotationId ? { ...a, resolvedAt: r.data!.resolvedAt } : a,
        ),
      }));
    }
  }

  const MILESTONES = useMemo(() =>
    [...new Set(DATA.map((d) => d.milestone))].sort(),
    [DATA]
  );

  const filtered = useMemo(() => {
    let list = tab === "All" ? DATA : DATA.filter(d => d.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q)      ||
        d.id.toLowerCase().includes(q)        ||
        d.milestone.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)  ||
        d.tags.some(t => t.includes(q))
      );
    }
    return list;
  }, [tab, search, DATA]);

  // Derived counts
  const totalAccepted = DATA.filter(d => d.status === "Accepted").length;
  const totalPending  = DATA.filter(d => d.status === "Pending Review").length;
  const totalProgress = DATA.filter(d => d.status === "In Progress").length;
  const totalUpcoming = DATA.filter(d => d.status === "Upcoming").length;
  const acceptanceRate = DATA.length > 0 ? Math.round((totalAccepted / DATA.length) * 100) : 0;

  const statusBreakdown: Array<[DStatus, number, string]> = [
    ["Accepted",       totalAccepted, "var(--lime)"   ],
    ["Pending Review", totalPending,  "var(--amber)"  ],
    ["In Progress",    totalProgress, "var(--cyan)"   ],
    ["Upcoming",       totalUpcoming, "var(--muted2)" ],
  ];

  const milestoneRows = MILESTONES.map(m => {
    const items    = DATA.filter(d => d.milestone === m);
    const approved = items.filter(d => d.status === "Accepted").length;
    return { m, total: items.length, approved };
  });

  const resolvedStatus = (d: Deliverable): DStatus => {
    if (accepted[d.id]) return "Accepted";
    if (revised[d.id])  return "Pending Review";
    return d.status;
  };

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
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Deliverables</div>
          <h1 className={cx("pageTitle")}>Deliverables</h1>
          <p className={cx("pageSub")}>Every file and output handed off across your milestones — review, comment, and approve from here.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} title="Export not yet available" disabled>
            <Ic n="download" sz={13} /> Export List
          </button>
          <button type="button" className={cx("btnSm", "btnAccent", "flexRow", "gap6")} title="Upload not yet available" disabled>
            <Ic n="upload" sz={13} c="var(--bg)" /> Upload File
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total",          value: DATA.length,   color: "statCard",      icon: "layers",   ic: "var(--muted2)" },
          { label: "Accepted",       value: totalAccepted, color: "statCardGreen", icon: "check",    ic: "var(--lime)"   },
          { label: "Pending Review", value: totalPending,  color: "statCardAmber", icon: "clock",    ic: "var(--amber)"  },
          { label: "In Progress",    value: totalProgress, color: "statCard",      icon: "activity", ic: "var(--cyan)"   },
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

        {/* Delivery Progress */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Delivery Progress</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{acceptanceRate}% accepted</span>
          </div>
          <div className={cx("flexCol", "gap10", "mb14")}>
            {statusBreakdown.map(([status, count, color]) => {
              const pct = DATA.length > 0 ? Math.round((count / DATA.length) * 100) : 0;
              return (
                <div key={status} className={cx("flexRow", "gap10")}>
                  <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("text11", "w112")}>{status}</span>
                  <div className={cx("progressTrack")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "fw700", "text11", "w20", "textRight", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("progressTrackFlex")}>
            {statusBreakdown.filter(([, c]) => c > 0).map(([status, count, color]) => (
              <div key={status} className={cx("dynFlex", "dynBgColor")} style={{ "--flex": count, "--bg-color": color } as React.CSSProperties} />
            ))}
          </div>
        </div>

        {/* Milestone Coverage */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Milestone Coverage</span>
          </div>
          <div className={cx("flexCol", "gap10", "mb14")}>
            {milestoneRows.map(({ m, total, approved }) => {
              const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
              const barColor = pct === 100 ? "var(--lime)" : pct > 50 ? "var(--cyan)" : "var(--amber)";
              return (
                <div key={m} className={cx("flexRow", "gap10")}>
                  <span className={cx("badge", "badgeMuted", "w32", "textCenter", "justifyCenter", "noShrink")}>{m}</span>
                  <div className={cx("progressTrack")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": barColor } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "text10", "colorMuted2", "w54", "textRight")}>
                    {approved}/{total} <span className={cx("fs06")}>({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className={cx("borderT", "pt12", "flexRow", "gap12", "flexWrap")}>
            {(["Figma", "PDF", "Spec", "Video", "Prototype"] as DType[]).map(t => {
              const cnt = DATA.filter(d => d.type === t).length;
              if (!cnt) return null;
              const cfg = TYPE_CFG[t];
              return (
                <span key={t} className={cx("flexRow", "gap4")}>
                  <Ic n={cfg.icon} sz={9} c={cfg.color} />
                  <span className={cx("fontMono", "text10", "colorMuted2")}>{cnt} {t}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Pending review alert ──────────────────────────────────────────────── */}
      {totalPending > 0 && (
        <div className={cx("delivPendingAlert")}>
          <Ic n="clock" sz={14} c="var(--amber)" />
          <span className={cx("text12", "colorAmber")}>
            <strong>{totalPending} deliverable{totalPending > 1 ? "s" : ""}</strong> awaiting your review — expand a row below to approve or request changes.
          </span>
        </div>
      )}

      {/* ── Search + tabs ─────────────────────────────────────────────────────── */}
      <div className={cx("flexBetween", "mb12")}>
        <div className={cx("pillTabs", "mb0")}>
          {TABS.map(t => (
            <button key={t} type="button" className={cx("pillTab", tab === t ? "pillTabActive" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w220", "h36")}
          placeholder="Search deliverables…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {/* Column headers */}
        {filtered.length > 0 && (
          <div className={cx("delivColHd")}>
            {["", "Deliverable", "Type", "Milestone", "Status", ""].map((h, i) => (
              <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="layers" sz={28} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No deliverables found</div>
            <div className={cx("text12", "colorMuted")}>{search ? `No results for "${search}"` : "Nothing in this category yet."}</div>
            {search && <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>Clear search</button>}
          </div>
        )}

        {/* Rows */}
        {filtered.map((d, idx) => {
          const isOpen      = expanded === d.id;
          const status      = resolvedStatus(d);
          const cfg         = TYPE_CFG[d.type];
          const catCfg      = CAT_CFG[d.category];
          const latestVer   = d.versions.length > 0 ? d.versions[d.versions.length - 1] : null;
          const isClickable = d.status !== "Upcoming";

          return (
            <div key={d.id} className={cx("dynBorderLeft3", idx < filtered.length - 1 && "borderB")} style={{ "--color": STATUS_COLOR[status] } as React.CSSProperties}>

              {/* Row trigger */}
              <button
                type="button"
                aria-expanded={isOpen}
                disabled={!isClickable}
                className={cx("gridRowBtn6colV5", !isClickable && "opacity60", isClickable && "cursorPointer")}
                onClick={() => {
                  if (!isClickable) return;
                  const nextOpen = !isOpen;
                  setExpanded(nextOpen ? d.id : null);
                  if (nextOpen) void loadAnnotations(d.id);
                }}
              >
                {/* Type icon box */}
                <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${cfg.color} 25%, transparent)` } as React.CSSProperties}>
                  <Ic n={cfg.icon} sz={15} c={cfg.color} />
                </div>

                {/* Title */}
                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate")}>{d.name}</div>
                  <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{d.id}</span>
                    <span className={cx("badge", "badgeMuted", "fs06")}>{d.category}</span>
                    {latestVer && (
                      <span className={cx("delivVerBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 12%, var(--s2))`, "--color": cfg.color, "--border-color": `color-mix(in oklab, ${cfg.color} 25%, transparent)` } as React.CSSProperties}>
                        v{latestVer.ver}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div className={cx("flexRow", "gap5")}>
                  <Ic n={cfg.icon} sz={10} c={cfg.color} />
                  <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": cfg.color } as React.CSSProperties}>{d.type}</span>
                </div>

                {/* Milestone */}
                <span className={cx("badge", "badgeMuted")}>{d.milestone}</span>

                {/* Status */}
                <span className={cx("badge", STATUS_BADGE[status], "flexRow", "gap4")}>
                  <Ic n={STATUS_ICON[status]} sz={9} c="currentColor" />{status}
                </span>

                {/* Chevron */}
                <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                  <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                </span>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <div className={cx("borderT", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${STATUS_COLOR[status]} 4%, var(--s2))` } as React.CSSProperties}>
                  <div className={cx("grid2Cols260")}>

                    {/* ── Left col ── */}
                    <div className={cx("panelLWide")}>

                      {/* Description */}
                      <div className={cx("mb14")}>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb6")}>Description</div>
                        <div className={cx("text12", "colorMuted", "lineH17")}>{d.description}</div>
                      </div>

                      {/* Author notes */}
                      <div className={cx("delivAuthorNote")}>
                        <div className={cx("flexRow", "flexCenter", "gap5", "mb5")}>
                          <Ic n="info" sz={10} c="var(--lime)" />
                          <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>
                            Author Notes{latestVer ? ` · v${latestVer.ver}` : ""}
                          </span>
                        </div>
                        <div className={cx("text11", "colorMuted", "lineH165")}>{d.notes}</div>
                      </div>

                      {/* Version history */}
                      {d.versions.length > 0 && (
                        <div className={cx("mb14")}>
                          <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb8")}>Version History</div>
                          <div className={cx("flexCol", "gap8")}>
                            {[...d.versions].reverse().map(v => (
                              <div key={v.ver} className={cx("flexRow", "flexAlignStart", "gap10")}>
                                <span className={cx("delivVerTag", "dynBgColor", "dynColor")} style={{ "--bg-color": v.ver === (latestVer?.ver ?? 0) ? `color-mix(in oklab, ${cfg.color} 14%, transparent)` : "var(--s3)", "--color": v.ver === (latestVer?.ver ?? 0) ? cfg.color : "var(--muted2)", "--border-color": v.ver === (latestVer?.ver ?? 0) ? `color-mix(in oklab, ${cfg.color} 30%, transparent)` : "var(--b2)" } as React.CSSProperties}>
                                  v{v.ver}
                                </span>
                                <div>
                                  <div className={cx("fontMono", "text10", "colorMuted2", "mb1")}>{v.date}</div>
                                  <div className={cx("text11", "colorMuted")}>{v.note}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      <CommentThread
                        entityType="deliverable"
                        entityId={d.id}
                        session={session}
                        currentUserName={session?.user?.email?.split("@")[0] ?? "You"}
                        compact
                      />

                      {/* Annotations */}
                      <div className={cx("borderT", "pt14", "mt14")}>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb10")}>
                          Annotations
                        </div>

                        {/* Annotation list */}
                        {annotLoading[d.id] ? (
                          <div className={cx("text11", "colorMuted")}>Loading…</div>
                        ) : (annotations[d.id] ?? []).length === 0 ? (
                          <div className={cx("text11", "colorMuted", "mb10")}>No annotations yet.</div>
                        ) : (
                          <div className={cx("flexCol", "gap8", "mb12")}>
                            {(annotations[d.id] ?? []).map(ann => (
                              <div key={ann.id} className={cx("cardRowS1", "p10x12")}>
                                <div className={cx("flexCol", "gap4", "flex1")}>
                                  <div className={cx("text11", "lineH165")}>{ann.comment}</div>
                                  <div className={cx("flexRow", "gap8")}>
                                    {ann.pageNumber !== null && (
                                      <span className={cx("fontMono", "text10", "colorMuted2")}>
                                        p.{ann.pageNumber}
                                      </span>
                                    )}
                                    <span className={cx("fontMono", "text10", "colorMuted2")}>
                                      {new Date(ann.createdAt).toLocaleDateString("en-ZA", {
                                        day: "numeric", month: "short", year: "numeric"
                                      })}
                                    </span>
                                    {ann.resolvedAt && (
                                      <span className={cx("badge", "badgeAccent", "fs06")}>Resolved</span>
                                    )}
                                  </div>
                                </div>
                                {!ann.resolvedAt && (
                                  <button
                                    type="button"
                                    className={cx("btnSm", "btnGhost")}
                                    onClick={() => void handleResolveAnnotation(d.id, ann.id)}
                                    title="Mark as resolved"
                                  >
                                    <Ic n="check" sz={11} c="var(--lime)" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add annotation form */}
                        <div className={cx("flexCol", "gap6")}>
                          <textarea
                            className={cx("input")}
                            placeholder="Add a comment or annotation…"
                            value={annotComment[d.id] ?? ""}
                            onChange={e => setAnnotComment(p => ({ ...p, [d.id]: e.target.value }))}
                            rows={2}
                            title="Annotation comment"
                          />
                          <div className={cx("flexRow", "gap6")}>
                            <input
                              className={cx("input")}
                              type="number"
                              min={1}
                              placeholder="Page #"
                              value={annotPage[d.id] ?? ""}
                              onChange={e => setAnnotPage(p => ({ ...p, [d.id]: e.target.value }))}
                              title="Optional page number"
                            />
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent")}
                              onClick={() => void handleAddAnnotation(d.id)}
                              disabled={annotSubmitting[d.id] || !(annotComment[d.id]?.trim())}
                            >
                              {annotSubmitting[d.id] ? "Saving…" : "Add Comment"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Right col ── */}
                    <div className={cx("p16x20x16x16", "flexCol", "gap14")}>

                      {/* Type icon card */}
                      <div className={cx("cardRowS1", "p14x16")}>
                        <div className={cx("delivTypeIconBox44", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${cfg.color} 14%, var(--s2))`, "--color": `color-mix(in oklab, ${cfg.color} 25%, transparent)` } as React.CSSProperties}>
                          <Ic n={cfg.icon} sz={22} c={cfg.color} />
                        </div>
                        <div>
                          <div className={cx("fw700", "text12")}>{d.type}</div>
                          <div className={cx("flexRow", "flexCenter", "gap5", "mt2")}>
                            <Ic n={catCfg.icon} sz={9} c={catCfg.color} />
                            <span className={cx("text10", "colorMuted2")}>{d.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Owner */}
                      <div>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb6")}>Prepared By</div>
                        <div className={cx("infoChip")}>
                          <Av initials={d.ownerInitials} size={32} />
                          <div>
                            <div className={cx("fw600", "text12")}>{d.ownerName}</div>
                            <div className={cx("text10", "colorMuted2")}>{d.ownerRole}</div>
                          </div>
                        </div>
                      </div>

                      {/* Meta grid */}
                      <div className={cx("grid2Cols", "gap7")}>
                        {[
                          { label: "Milestone", value: d.milestone  },
                          { label: "Date",      value: d.date       },
                          { label: "Category",  value: d.category   },
                          { label: "Versions",  value: d.versions.length > 0 ? `${d.versions.length} version${d.versions.length !== 1 ? "s" : ""}` : "—" },
                        ].map(m => (
                          <div key={m.label} className={cx("infoChipSm")}>
                            <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{m.label}</div>
                            <div className={cx("fw600", "text11")}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      <div className={cx("flexRow", "flexWrap", "gap5")}>
                        {d.tags.map(t => (
                          <span key={t} className={cx("tagPill", "fontMono", "text10", "colorMuted2")}>#{t}</span>
                        ))}
                      </div>

                      {/* Actions */}
                      {status === "Accepted" ? (
                        <div className={cx("delivAcceptedBanner")}>
                          <Ic n="check" sz={12} c="var(--lime)" />
                          <span className={cx("fontMono", "fw700", "text11", "colorAccent")}>Accepted</span>
                        </div>
                      ) : status === "Pending Review" ? (
                        <div className={cx("flexCol", "gap7")}>
                          <textarea
                            className={cx("input")}
                            placeholder="Optional feedback…"
                            rows={2}
                            title="Feedback for this review decision"
                            value={feedbackText[d.id] ?? ""}
                            onChange={e => setFeedbackText(p => ({ ...p, [d.id]: e.target.value }))}
                          />
                          <div className={cx("flexCol", "gap7")}>
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent", "flexRow", "flexCenter", "justifyCenter", "gap6")}
                              onClick={() => { void handleApprove(d); }}
                              disabled={submitting[d.id]}
                            >
                              <Ic n="check" sz={11} c="var(--bg)" /> {submitting[d.id] ? "Saving…" : "Approve"}
                            </button>
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "justifyCenter", "gap6")}
                              onClick={() => { void handleRequestChanges(d); }}
                              disabled={submitting[d.id]}
                            >
                              <Ic n="edit" sz={11} /> {submitting[d.id] ? "Saving…" : "Request Changes"}
                            </button>
                          </div>
                        </div>
                      ) : status === "In Progress" ? (
                        <div className={cx("delivInProgressBanner")}>
                          <Ic n="activity" sz={12} c="var(--cyan)" />
                          <span className={cx("fontMono", "fw700", "text11", "colorCyan")}>In Progress</span>
                        </div>
                      ) : null}

                      {d.versions.length > 0 && (
                        <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "justifyCenter", "gap6")} title="Download not yet available" disabled>
                          <Ic n="download" sz={11} /> Download Latest
                        </button>
                      )}
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
