// ════════════════════════════════════════════════════════════════════════════
// deliverable-status-page.tsx — Client Portal Deliverable Status
// Data     : loadPortalDeliverablesWithRefresh → GET /projects/:id/deliverables
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalDeliverablesWithRefresh,
  type PortalDeliverable,
} from "../../../../lib/api/portal";

type DStatus = "Ready" | "In Review" | "In Progress" | "Planned";
type DType   = "Design" | "Development" | "Document" | "Video";
type DTab    = "All" | DStatus;

const TABS: DTab[] = ["All", "Ready", "In Review", "In Progress", "Planned"];

const STATUS_META: Record<DStatus, { badge: string; icon: string }> = {
  "Ready":       { badge: "badgeGreen",  icon: "check"    },
  "In Review":   { badge: "badgeAmber",  icon: "eye"      },
  "In Progress": { badge: "badgeAccent", icon: "activity" },
  "Planned":     { badge: "badgeMuted",  icon: "calendar" },
};

// ── Mapping helpers ───────────────────────────────────────────────────────────

function mapStatus(raw: string): DStatus {
  const s = raw.toUpperCase();
  if (s === "DELIVERED" || s === "APPROVED" || s === "COMPLETE" || s === "COMPLETED") return "Ready";
  if (s === "IN_REVIEW" || s === "UNDER_REVIEW" || s === "REVIEW")                    return "In Review";
  if (s === "IN_PROGRESS" || s === "ACTIVE" || s === "WIP")                           return "In Progress";
  return "Planned";
}

function mapType(name: string): DType {
  const n = name.toLowerCase();
  if (/video|recording|reel|screencast/.test(n))                                                                              return "Video";
  if (/design|figma|ui|ux|mockup|logo|brand|identity|motion|anim|icon|visual|style|colour|color|palette/.test(n))            return "Design";
  if (/api|code|deploy|integrat|auth|build|webhook|backend|frontend|dev|implement|staging|production|component/.test(n))     return "Development";
  return "Document";
}

function typeIcon(t: DType): string {
  if (t === "Design")      return "layers";
  if (t === "Development") return "code";
  if (t === "Video")       return "play";
  return "file";
}

function typeColor(t: DType): string {
  if (t === "Design")      return "var(--purple)";
  if (t === "Development") return "var(--lime)";
  if (t === "Video")       return "var(--red)";
  return "var(--amber)";
}

function initials(name: string | null): string {
  if (!name) return "—";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DeliverableStatusPage() {
  const { session, projectId }   = useProjectLayer();
  const [items,   setItems]      = useState<PortalDeliverable[]>([]);
  const [loading, setLoading]    = useState(true);
  const [tab,     setTab]        = useState<DTab>("All");
  const [query,   setQuery]      = useState("");

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    void loadPortalDeliverablesWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setItems(r.data);
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  const mapped = useMemo(() =>
    items.map((d) => ({ ...d, displayStatus: mapStatus(d.status), dtype: mapType(d.name) })),
  [items]);

  const counts = useMemo(() => ({
    ready:      mapped.filter((d) => d.displayStatus === "Ready").length,
    inReview:   mapped.filter((d) => d.displayStatus === "In Review").length,
    inProgress: mapped.filter((d) => d.displayStatus === "In Progress").length,
    planned:    mapped.filter((d) => d.displayStatus === "Planned").length,
  }), [mapped]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? mapped : mapped.filter((d) => d.displayStatus === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    return list;
  }, [mapped, tab, query]);

  return (
    <div className={cx("pageBody")}>

      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Deliverables</div>
          <h1 className={cx("pageTitle")}>Deliverable Status</h1>
          <p className={cx("pageSub")}>Track every project deliverable — design, development, and documentation — from in-progress to ready for download.</p>
        </div>
      </div>

      {/* Stats bar */}
      {loading ? (
        <div className={cx("skeletonBlock", "skeleH72", "mb18")} />
      ) : (
        <div className={cx("dsStatBar")}>
          {([
            { val: items.length,       lbl: "Total",       c: "var(--lime)"   },
            { val: counts.ready,       lbl: "Ready",        c: "var(--green)"  },
            { val: counts.inReview,    lbl: "In Review",    c: "var(--amber)"  },
            { val: counts.inProgress,  lbl: "In Progress",  c: "var(--lime)"   },
            { val: counts.planned,     lbl: "Planned",      c: "var(--muted2)" },
          ] as const).map((s, i) => (
            <div key={s.lbl} className={cx("dsStatCell", i < 4 && "dsStatCellBorderR")}>
              <div className={cx("dsStatVal", "dynColor")} style={{ "--color": s.c } as React.CSSProperties}>{s.val}</div>
              <div className={cx("dsStatLbl")}>{s.lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className={cx("relative", "mb14")}>
        <span className={cx("searchIconWrapL10")}>
          <Ic n="filter" sz={13} c="var(--muted2)" />
        </span>
        <input className={cx("input", "pl32")} placeholder="Search deliverables..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Tabs */}
      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t ? "pillTabActive" : "")} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className={cx("card", "p0", "overflowHidden")}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cx("dsSkeleRow")}>
              <div className={cx("skeletonBlock", "img36", "noShrink")} />
              <div className={cx("flex1")}>
                <div className={cx("skeletonLine", "w60p", "mb8")} />
                <div className={cx("skeletonLine", "w40p")} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty / no-match state */}
      {!loading && filtered.length === 0 && (
        <div className={cx("card", "emptyPad40x20", "textCenter")}>
          <Ic n={items.length === 0 ? "layers" : "filter"} sz={20} c="var(--muted2)" />
          <div className={cx("text12", "colorMuted", "mt10")}>
            {items.length === 0
              ? "No deliverables have been created for this project yet."
              : "No deliverables match your search."}
          </div>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className={cx("card", "p0", "overflowHidden")}>
          {filtered.map((d, idx) => {
            const meta  = STATUS_META[d.displayStatus];
            const icon  = typeIcon(d.dtype);
            const color = typeColor(d.dtype);
            return (
              <div
                key={d.id}
                className={cx("dsListRow", idx < filtered.length - 1 && "borderB")}
              >
                {/* Type icon */}
                <div className={cx("dsTypeIcon", "dynBgColor", "dynBorderColor")} style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, transparent)`, "--border-color": `color-mix(in oklab, ${color} 22%, transparent)` } as React.CSSProperties}>
                  <Ic n={icon} sz={16} c={color} />
                </div>

                {/* Info */}
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("flexRow", "gap6", "alignCenter", "mb3", "flexWrap")}>
                    <span className={cx("badge", "badgeMuted", "fs9")}>{d.dtype}</span>
                  </div>
                  <div className={cx("fw700", "text13", "colorText")}>{d.name}</div>
                  <div className={cx("text10", "colorMuted", "mt2")}>
                    {initials(d.ownerName)}
                    {d.dueAt       ? ` · Due ${fmtDate(d.dueAt)}`              : ""}
                    {d.deliveredAt ? ` · Delivered ${fmtDate(d.deliveredAt)}` : ""}
                  </div>
                </div>

                {/* Status + action */}
                <div className={cx("flexRow", "gap8", "noShrink")}>
                  <span className={cx("badge", meta.badge, "fs9")}>
                    <Ic n={meta.icon} sz={9} c="currentColor" />
                    &nbsp;{d.displayStatus}
                  </span>
                  {d.displayStatus === "Ready" && (
                    <button type="button" className={cx("btnSm", "btnAccent")}>
                      <Ic n="download" sz={11} c="var(--bg)" />
                      Download
                    </button>
                  )}
                  {d.displayStatus === "In Review" && (
                    <button type="button" className={cx("btnSm", "btnGhost")}>
                      <Ic n="eye" sz={11} c="var(--muted2)" />
                      Review
                    </button>
                  )}
                  {(d.displayStatus === "In Progress" || d.displayStatus === "Planned") && (
                    <button type="button" className={cx("btnSm", "btnGhost")} disabled>In progress</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
