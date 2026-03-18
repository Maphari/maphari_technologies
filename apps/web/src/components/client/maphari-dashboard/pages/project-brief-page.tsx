// ════════════════════════════════════════════════════════════════════════════
// project-brief-page.tsx — Client portal: Project Brief
// Data     : loadPortalBriefWithRefresh → GET /projects/:id/brief
// Mobile   : stacked single-column below 768 px
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalBriefWithRefresh, type PortalBrief } from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";
import type { PageId } from "../config";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Split a multiline brief string into a display-ready array of strings. */
function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.replace(/^[-•·*]\s*/, "").trim())
    .filter(Boolean);
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   "badgeAccent",
  DRAFT:    "badgeAmber",
  ARCHIVED: "badgeMuted",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectBriefPage({ onNavigate }: { onNavigate?: (page: PageId) => void }) {
  // ── Project layer context ─────────────────────────────────────────────────
  const { session, projectId } = useProjectLayer();
  const [brief, setBrief] = useState<PortalBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    void loadPortalBriefWithRefresh(session, projectId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      setBrief(result.data ?? null);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId]);

  // ── Derived display data ──────────────────────────────────────────────────
  const objectives   = brief ? parseLines(brief.objectives)   : [];
  const inScopeLines = brief ? parseLines(brief.inScope)      : [];
  const outOfScope   = brief ? parseLines(brief.outOfScope)   : [];
  const contactLines = brief ? parseLines(brief.contacts)     : [];
  const statusBadge  = brief ? (STATUS_BADGE[brief.status] ?? "badgeMuted") : "badgeMuted";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cx("pageBody")}>
      {/* ── Header ── */}
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>PROJECTS</div>
          <h1 className={cx("pageTitle")}>Project Brief</h1>
          <div className={cx("pageSub")}>Agreed scope, objectives, and key contacts for your project</div>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => onNavigate?.("changeRequests")}>Request Amendment</button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className={cx("card", "p32", "textCenter", "colorMuted2")}>
          Loading brief…
        </div>
      )}

      {/* ── Empty state (no brief yet) ── */}
      {!loading && !brief && (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No project brief yet</div>
          <div className={cx("emptyStateSub")}>Your project manager will publish the brief once the project kickoff is complete.</div>
        </div>
      )}

      {/* ── Brief content ── */}
      {!loading && brief && (
        <>
          {/* ── Hero card ── */}
          <div className={cx("card", "pbrHero")}>
            <div>
              <div className={cx("pbrProjectName")}>Project Brief</div>
              <div className={cx("text12", "colorMuted", "mt4")}>
                Version {brief.version} · Last updated {new Date(brief.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <span className={cx("badge", statusBadge)}>{brief.status === "ACTIVE" ? "Active" : brief.status === "DRAFT" ? "Draft" : "Archived"}</span>
          </div>

          {/* ── Objectives ── */}
          {objectives.length > 0 && (
            <div className={cx("card")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Objectives</span></div>
              <div className={cx("cardInner")}>
                <ul className={cx("pbrList")}>
                  {objectives.map((o) => (
                    <li key={o} className={cx("pbrListItem")}>{o}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Scope ── */}
          <div className={cx("grid2", "gap16")}>
            {inScopeLines.length > 0 && (
              <div className={cx("card")}>
                <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>In Scope</span></div>
                <div className={cx("cardInner")}>
                  {inScopeLines.map((s) => (
                    <div key={s} className={cx("pbrScopeItem")}>
                      <span className={cx("colorAccent")}>✓</span>
                      <span className={cx("text13")}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {outOfScope.length > 0 && (
              <div className={cx("card")}>
                <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Out of Scope</span></div>
                <div className={cx("cardInner")}>
                  {outOfScope.map((s) => (
                    <div key={s} className={cx("pbrScopeItem")}>
                      <span className={cx("colorMuted")}>✕</span>
                      <span className={cx("text13", "colorMuted")}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Key Contacts ── */}
          {contactLines.length > 0 && (
            <div className={cx("card")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Key Contacts</span></div>
              <div className={cx("cardInner")}>
                {contactLines.map((line) => (
                  <div key={line} className={cx("pbrContact")}>
                    <span className={cx("text13")}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
