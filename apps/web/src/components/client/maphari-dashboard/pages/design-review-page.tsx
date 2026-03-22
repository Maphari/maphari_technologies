// ════════════════════════════════════════════════════════════════════════════
// design-review-page.tsx — Client Portal: Design Review
// Data      : GET /projects/:id/design-reviews  (via getPortalDesignReviewsWithRefresh)
//             PATCH /design-reviews/:id/resolve  (via approvePortalDesignReviewWithRefresh)
// ════════════════════════════════════════════════════════════════════════════
"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  getPortalDesignReviewsWithRefresh,
  approvePortalDesignReviewWithRefresh,
  type PortalDesignReview,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

type DRStatus = "Awaiting Feedback" | "Approved" | "Revisions Requested";
type DRTab    = "All" | "Awaiting Feedback" | "Approved" | "Revisions Requested";

// ── API → UI mappers ──────────────────────────────────────────────────────────

const API_STATUS_MAP: Record<PortalDesignReview["status"], DRStatus> = {
  PENDING:           "Awaiting Feedback",
  APPROVED:          "Approved",
  CHANGES_REQUESTED: "Revisions Requested",
  REJECTED:          "Revisions Requested",
};

type ScreenRow = {
  id: string; name: string; version: string; date: string;
  status: DRStatus; comments: number; designer: string;
  figmaUrl: string | null; reviewId: string;
};

function apiToScreen(r: PortalDesignReview, idx: number): ScreenRow {
  const dateStr = new Date(r.requestedAt).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
  });
  return {
    reviewId: r.id,
    id:       r.id.slice(-6).toUpperCase(),
    name:     r.title,
    version:  `v${idx + 1}`,
    date:     dateStr,
    status:   API_STATUS_MAP[r.status] ?? "Awaiting Feedback",
    comments: 0,
    designer: "—",
    figmaUrl: r.figmaUrl,
  };
}

// ── Static lookup tables (keys are DRStatus — never rename) ──────────────────

const STATUS_COLOR: Record<DRStatus, string> = {
  "Approved":            "var(--green)",
  "Awaiting Feedback":   "var(--amber)",
  "Revisions Requested": "var(--red)",
};

const STATUS_BADGE: Record<DRStatus, string> = {
  "Approved":            "badgeGreen",
  "Awaiting Feedback":   "badgeAmber",
  "Revisions Requested": "badgeRed",
};

const STATUS_ICON: Record<DRStatus, string> = {
  "Approved":            "check",
  "Awaiting Feedback":   "clock",
  "Revisions Requested": "edit",
};

const TAB_COLOR: Record<DRTab, string> = {
  "All":                 "var(--muted)",
  "Awaiting Feedback":   "var(--amber)",
  "Approved":            "var(--green)",
  "Revisions Requested": "var(--red)",
};

const TABS: DRTab[] = ["All", "Awaiting Feedback", "Approved", "Revisions Requested"];

// ── Component ─────────────────────────────────────────────────────────────────

export function DesignReviewPage() {
  const { session, projectId } = useProjectLayer();

  const [tab,      setTab]      = useState<DRTab>("All");
  const [screens,  setScreens]  = useState<ScreenRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void getPortalDesignReviewsWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setScreens(r.data.map(apiToScreen));
      }
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load");
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  // ── Approve handler ────────────────────────────────────────────────────────
  function handleApprove(s: ScreenRow) {
    setApproved(p => ({ ...p, [s.reviewId]: true }));
    if (!session) return;
    approvePortalDesignReviewWithRefresh(session, s.reviewId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
    });
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total          = screens.length;
  const approvedCount  = screens.filter(s => approved[s.reviewId] || s.status === "Approved").length;
  const awaitingCount  = screens.filter(s => !approved[s.reviewId] && s.status === "Awaiting Feedback").length;
  const revisionsCount = screens.filter(s => !approved[s.reviewId] && s.status === "Revisions Requested").length;

  const filtered = useMemo(
    () => tab === "All" ? screens : screens.filter((s) => s.status === tab),
    [tab, screens],
  );

  // ── Loading / empty states ─────────────────────────────────────────────────
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
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Design</div>
          <h1 className={cx("pageTitle")}>Design Review</h1>
          <p className={cx("pageSub")}>Review screen designs, leave feedback, and approve screens to unblock the development team.</p>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Total Screens",     value: String(total),          color: "statCardAccent" },
          { label: "Approved",          value: String(approvedCount),  color: "statCardGreen"  },
          { label: "Awaiting Feedback", value: String(awaitingCount),  color: "statCardAmber"  },
          { label: "Revisions",         value: String(revisionsCount), color: "statCardRed"    },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Approval progress bar ────────────────────────────────────────── */}
      {total > 0 && (
        <div className={cx("card")}>
          <div className={cx("cardBodyPad", "pt14")}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("flexRow", "gap6")}>
                <Ic n="layers" sz={13} c="var(--lime)" />
                <span className={cx("fw600", "text12")}>Approval Progress</span>
              </div>
              <span className={cx("fw700", "text12", "colorGreen")}>
                {approvedCount} / {total} screens approved
              </span>
            </div>
            <div className={cx("trackH8")}>
              <div className={cx("pctFillRInherit", "dotBgGreen")} style={{ '--pct': `${total > 0 ? (approvedCount / total) * 100 : 0}%` } as React.CSSProperties} />
            </div>
            <div className={cx("flexRow", "gap16", "mt10", "flexWrap")}>
              {[
                { color: "var(--green)",  label: `Approved — ${approvedCount}` },
                { color: "var(--amber)",  label: `Awaiting Feedback — ${awaitingCount}` },
                { color: "var(--red)",    label: `Revisions Requested — ${revisionsCount}` },
              ].map((leg) => (
                <div key={leg.label} className={cx("flexRow", "gap5")}>
                  <div className={cx("dot8")} style={{ "--bg-color": leg.color } as React.CSSProperties} />
                  <span className={cx("text10", "colorMuted")}>{leg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Category tabs ───────────────────────────────────────────────── */}
      <div className={cx("pillTabs")}>
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t !== "All" && (
              <span className={cx("dot6", "inlineBlock", "mr5", "noShrink")} style={{ "--bg-color": TAB_COLOR[t] } as React.CSSProperties} />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {screens.length === 0 && (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="image" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No design reviews yet</div>
          <div className={cx("emptyStateSub")}>Design screens will appear here once your team uploads them for review.</div>
        </div>
      )}

      {/* ── Screen card grid ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className={cx("grid2Cols14Gap")}>
          {filtered.map((s) => {
            const effectiveStatus: DRStatus = approved[s.reviewId] ? "Approved" : s.status;
            const color = STATUS_COLOR[effectiveStatus];
            return (
              <div key={s.reviewId} className={cx("card", "p0", "overflowHidden", "flexCol")}>

                {/* Status accent bar */}
                <div className={cx("h3", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />

                <div className={cx("p16x18", "flexCol", "flex1")}>

                  {/* ID + version + status badge */}
                  <div className={cx("flexBetween", "mb12")}>
                    <div className={cx("flexRow", "gap6")}>
                      <span className={cx("badge", "badgeMuted")}>{s.id}</span>
                      <span className={cx("drVerTag")}>{s.version}</span>
                    </div>
                    <div className={cx("flexRow", "gap5")}>
                      <Ic n={STATUS_ICON[effectiveStatus]} sz={12} c={color} />
                      <span className={cx("badge", STATUS_BADGE[effectiveStatus])}>{effectiveStatus}</span>
                    </div>
                  </div>

                  {/* Screen mockup preview */}
                  <div className={cx("drMockupBox", "flexCol")}>
                    {/* Browser chrome bar */}
                    <div className={cx("drBrowserBar")}>
                      {["var(--red)", "var(--amber)", "var(--green)"].map((c, i) => (
                        <div key={i} className={cx("drChromeDot")} style={{ "--bg-color": c } as React.CSSProperties} />
                      ))}
                      <div className={cx("flex1", "h4", "rounded2", "dotBgB2", "ml6")} />
                    </div>
                    {/* Simulated content lines */}
                    <div className={cx("drContentArea", "flexCol", "gap5")}>
                      <div className={cx("h6px", "rounded2", "dynBgColor", "w55p")} style={{ "--bg-color": `color-mix(in oklab, ${color} 18%, var(--b2))` } as React.CSSProperties} />
                      <div className={cx("skeleBarW85")} />
                      <div className={cx("skeleBarW68")} />
                    </div>
                  </div>

                  {/* Screen name + date */}
                  <div className={cx("fw700", "text13", "mb4", "lineH13")}>{s.name}</div>
                  <div className={cx("text10", "colorMuted", "mb12")}>Submitted {s.date}</div>

                  {/* Designer + comments */}
                  <div className={cx("flexRow", "flexCenter", "gap8", "mb14")}>
                    <Av initials={s.designer === "—" ? "?" : s.designer} size={20} />
                    <span className={cx("text10", "colorMuted")}>{s.designer === "—" ? "Designer" : s.designer}</span>
                    {s.comments > 0 && (
                      <div className={cx("flexRow", "flexCenter", "gap4", "mlAuto")}>
                        <Ic n="message" sz={11} c="var(--muted2)" />
                        <span className={cx("text10", "colorMuted")}>{s.comments} comment{s.comments !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={cx("flexRow", "gap6", "mtAuto")}>
                    {s.figmaUrl ? (
                      <a
                        href={s.figmaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx("btnSm", "btnGhost", "flex1", "noUnderline", "flexCenter", "gap4")}
                      >
                        <Ic n="externalLink" sz={12} c="var(--muted)" /> View in Figma
                      </a>
                    ) : (
                      <button type="button" className={cx("btnSm", "btnGhost", "flex1")} disabled>
                        <Ic n="externalLink" sz={12} c="var(--muted)" /> View in Figma
                      </button>
                    )}
                    {effectiveStatus === "Awaiting Feedback" && (
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent", "flex1")}
                        onClick={() => handleApprove(s)}
                      >
                        <Ic n="check" sz={12} c="var(--bg)" /> Approve
                      </button>
                    )}
                    {effectiveStatus === "Revisions Requested" && (
                      <button type="button" className={cx("btnSm", "btnGhost", "flex1", "colorRed")}>
                        <Ic n="edit" sz={12} c="var(--red)" /> Add Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Approval guidelines ──────────────────────────────────────────── */}
      <div className={cx("card", "borderLeftAmber")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle", "flexRow", "gap6")}>
            <Ic n="alert" sz={14} c="var(--amber)" /> Approval Guidelines
          </span>
        </div>
        <div className={cx("cardBodyPad")}>
          <div className={cx("text11", "colorMuted", "lineH17")}>
            Please review each screen and approve or request revisions within{" "}
            <span className={cx("fw600")}>2 business days</span>. Approved screens are handed to
            development immediately. Any revision requests delay the sprint by the time required
            to action feedback.
          </div>
        </div>
      </div>

    </div>
  );
}
