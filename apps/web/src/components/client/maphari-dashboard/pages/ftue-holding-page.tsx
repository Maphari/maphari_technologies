// ════════════════════════════════════════════════════════════════════════════
// ftue-holding-page.tsx — Client Portal: No-project holding page (State A)
// Shown when the client has no ProjectCard in their workspace snapshot.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PageId } from "../config";
import type { AuthSession } from "@/lib/auth/session";
import { loadPortalProposalsWithRefresh, type PortalProposal } from "@/lib/api/portal/proposals";
import { saveSession } from "@/lib/auth/session";

type FtueHoldingPageProps = {
  session: AuthSession | null;
  navigateTo: (page: PageId) => void;
};

function formatCents(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

export function FtueHoldingPage({ session, navigateTo }: FtueHoldingPageProps) {
  const [proposals, setProposals] = useState<PortalProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void loadPortalProposalsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setProposals(r.data.filter((p) => p.status === "PENDING"));
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <div className={cx("pageBody")}>
      {/* ── Welcome header ──────────────────────────────────────────── */}
      <div className={cx("ftueHoldingHero")}>
        <div className={cx("ftuePulseDot")} />
        <div>
          <h1 className={cx("ftueHoldingTitle")}>Welcome to your portal</h1>
          <p className={cx("ftueHoldingSub")}>
            Get started by requesting a project, or your team will reach out with a proposal to review.
          </p>
        </div>
      </div>

      {/* ── Pending proposals ────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      ) : proposals.length > 0 ? (
        <>
          <div className={cx("ftueProposalHeading")}>
            <Ic n="fileText" sz={13} c="var(--lime)" />
            <span>Your pending proposals</span>
          </div>
          <div className={cx("ftuePropList")}>
            {proposals.map((p) => (
              <div key={p.id} className={cx("ftuePropCard")}>
                <div className={cx("ftuePropCardLeft")}>
                  <div className={cx("fw700", "text14")}>{p.title}</div>
                  <div className={cx("text11", "colorMuted")}>
                    {p.amountCents ? formatCents(p.amountCents) : "—"} &middot;{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  onClick={() => navigateTo("legalHub")}
                >
                  Review Proposal <Ic n="arrowRight" sz={11} c="var(--bg)" />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={cx("ftuePropCard", "ftueNoProposals")}>
          <Ic n="clock" sz={16} c="var(--muted2)" />
          <div>
            <div className={cx("fw600", "text13")}>No active projects yet</div>
            <div className={cx("text11", "colorMuted")}>Submit a project request to get started, or your team will be in touch with a proposal.</div>
          </div>
        </div>
      )}

      {/* ── CTA strip ───────────────────────────────────────────────── */}
      <div className={cx("ftueCtas")}>
        <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => navigateTo("projectRequest")}>
          <Ic n="plus" sz={13} c="var(--bg)" /> Request a Project
        </button>
        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => navigateTo("messages")}>
          <Ic n="message" sz={13} c="var(--muted)" /> Get in touch
        </button>
        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => navigateTo("bookCall")}>
          <Ic n="calendar" sz={13} c="var(--muted)" /> Book an intro call
        </button>
      </div>

      {/* ── What to expect ───────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>What happens next</span>
        </div>
        <div className={cx("cardBodyPad")}>
          <div className={cx("ftueStepList")}>
            {[
              { n: "1", label: "Request or await a proposal",  sub: "Submit a project brief or wait for your team to send a proposal." },
              { n: "2", label: "Contract signing",  sub: "Once approved, your contract is sent for e-signature."   },
              { n: "3", label: "Project kickoff",   sub: "Your dedicated team is assigned and your portal activates." },
            ].map((s) => (
              <div key={s.n} className={cx("ftueStep")}>
                <div className={cx("ftueStepNum")}>{s.n}</div>
                <div>
                  <div className={cx("fw600", "text13")}>{s.label}</div>
                  <div className={cx("text11", "colorMuted")}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
