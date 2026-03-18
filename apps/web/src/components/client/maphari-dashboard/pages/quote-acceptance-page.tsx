"use client";
import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer }    from "../hooks/use-project-layer";
import { saveSession }        from "../../../../lib/auth/session";
import {
  loadPortalProposalsWithRefresh,
  acceptPortalProposalWithRefresh,
  declinePortalProposalWithRefresh,
  type PortalProposal,
} from "../../../../lib/api/portal/proposals";

// ── Display helpers ───────────────────────────────────────────────────────────

const LOCALE          = process.env.NEXT_PUBLIC_LOCALE          ?? "en-ZA";
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "R";
const fmt = (cents: number) =>
  `${CURRENCY_SYMBOL} ${(cents / 100).toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type QStatus = "Pending Acceptance" | "Accepted" | "Declined" | "Expired";

function toDisplayStatus(s: PortalProposal["status"]): QStatus {
  if (s === "PENDING")  return "Pending Acceptance";
  if (s === "ACCEPTED") return "Accepted";
  if (s === "DECLINED") return "Declined";
  return "Expired";
}

function daysLeft(validUntil: string | null): number {
  if (!validUntil) return 999;
  const diff = new Date(validUntil).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLOR: Record<QStatus, string> = {
  "Pending Acceptance": "var(--amber)",
  "Accepted":           "var(--lime)",
  "Declined":           "var(--red)",
  "Expired":            "var(--b3)",
};
const STATUS_BADGE: Record<QStatus, string> = {
  "Pending Acceptance": "badgeAmber",
  "Accepted":           "badgeGreen",
  "Declined":           "badgeRed",
  "Expired":            "badgeMuted",
};
const STATUS_ICON: Record<QStatus, string> = {
  "Pending Acceptance": "clock",
  "Accepted":           "check",
  "Declined":           "x",
  "Expired":            "alert",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function QuoteAcceptancePage() {
  const { session } = useProjectLayer();

  const [proposals,  setProposals]  = useState<PortalProposal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [declOpen,   setDeclOpen]   = useState<string | null>(null);
  const [declReason, setDeclReason] = useState<Record<string, string>>({});
  const [acting,     setActing]     = useState<string | null>(null);
  const loaded = useRef(false);

  // ── Load proposals ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || loaded.current) return;
    loaded.current = true;
    setLoading(true);
    loadPortalProposalsWithRefresh(session)
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error)       { setError(r.error.message); return; }
        setProposals(r.data ?? []);
      })
      .catch(() => setError("Unable to load proposals."))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  // ── Accept handler ──────────────────────────────────────────────────────────
  async function handleAccept(id: string) {
    if (!session || acting) return;
    setActing(id);
    try {
      const r = await acceptPortalProposalWithRefresh(session, id);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setProposals((prev) => prev.map((p) => p.id === id ? r.data! : p));
      }
    } catch { /* silent */ } finally {
      setActing(null);
      setConfirming(null);
    }
  }

  // ── Decline handler ─────────────────────────────────────────────────────────
  async function handleDecline(id: string) {
    if (!session || acting) return;
    setActing(id);
    const reason = declReason[id]?.trim() || undefined;
    try {
      const r = await declinePortalProposalWithRefresh(session, id, reason);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setProposals((prev) => prev.map((p) => p.id === id ? r.data! : p));
      }
    } catch { /* silent */ } finally {
      setActing(null);
      setDeclOpen(null);
    }
  }

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalAll      = proposals.reduce((s, p) => s + p.amountCents, 0) || 1;
  const totalAccepted = proposals.filter((p) => p.status === "ACCEPTED").reduce((s, p) => s + p.amountCents, 0);
  const totalPending  = proposals.filter((p) => p.status === "PENDING").reduce((s,  p) => s + p.amountCents, 0);
  const totalOther    = proposals.filter((p) => p.status === "DECLINED" || p.status === "EXPIRED").reduce((s, p) => s + p.amountCents, 0);

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Finance · Quotes</div>
            <h1 className={cx("pageTitle")}>Quote Acceptance</h1>
          </div>
        </div>
        <div className={cx("card")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="loader" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>Loading proposals…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Finance · Quotes</div>
            <h1 className={cx("pageTitle")}>Quote Acceptance</h1>
          </div>
        </div>
        <div className={cx("card")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="alert" sz={22} c="var(--red)" /></div>
            <div className={cx("emptyStateTitle")}>Unable to load proposals</div>
            <div className={cx("emptyStateSub")}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Quotes</div>
          <h1 className={cx("pageTitle")}>Quote Acceptance</h1>
          <p className={cx("pageSub")}>Review proposals, inspect line items, and formally accept or decline quotes.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")}>
            <Ic n="download" sz={13} c="var(--muted)" /> Download All
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Total Quotes",        value: String(proposals.length),                                                          color: "statCardAccent" },
          { label: "Pending",             value: String(proposals.filter((p) => p.status === "PENDING").length),                   color: "statCardAmber"  },
          { label: "Accepted",            value: String(proposals.filter((p) => p.status === "ACCEPTED").length),                  color: "statCardGreen"  },
          { label: "Expired / Declined",  value: String(proposals.filter((p) => p.status === "DECLINED" || p.status === "EXPIRED").length), color: "statCardRed" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Value overview bar ───────────────────────────────────────────── */}
      {proposals.length > 0 && (
      <div className={cx("card")}>
        <div className={cx("cardBodyPad", "pt14")}>
          <div className={cx("flexBetween", "mb10")}>
            <div className={cx("flexRow", "gap6")}>
              <Ic n="chart" sz={13} c="var(--lime)" />
              <span className={cx("fw600", "text12")}>Quote Value Overview</span>
            </div>
            <span className={cx("fw700", "text12")}>{fmt(totalAll)} total</span>
          </div>
          <div className={cx("qaOverviewBar")}>
            <div title={`Accepted: ${fmt(totalAccepted)}`} className={cx("animBarLime")} style={{ '--pct': `${(totalAccepted / totalAll) * 100}%` } as React.CSSProperties} />
            <div title={`Pending: ${fmt(totalPending)}`}   className={cx("animBarAmber75")} style={{ '--pct': `${(totalPending  / totalAll) * 100}%` } as React.CSSProperties} />
            <div title={`Other: ${fmt(totalOther)}`}       className={cx("animBarB3")} style={{ '--pct': `${(totalOther    / totalAll) * 100}%` } as React.CSSProperties} />
          </div>
          <div className={cx("flexRow", "gap16", "flexWrap")}>
            {[
              { color: "var(--lime)",  label: `Accepted — ${fmt(totalAccepted)}`  },
              { color: "var(--amber)", label: `Pending — ${fmt(totalPending)}`    },
              { color: "var(--b3)",    label: `Expired / Declined — ${fmt(totalOther)}` },
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

      {/* ── Quote cards ──────────────────────────────────────────────────── */}
      {proposals.length === 0 ? (
        <div className={cx("card")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No quotes yet</div>
            <div className={cx("emptyStateSub")}>Quotes and proposals from your project team will appear here once they have been prepared.</div>
          </div>
        </div>
      ) : (
      <div className={cx("flexCol", "gap14")}>
        {proposals.map((proposal) => {
          const eff          = toDisplayStatus(proposal.status);
          const accentColor  = STATUS_COLOR[eff];
          const isPending    = eff === "Pending Acceptance";
          const isConfirming = confirming === proposal.id;
          const isDeclOpen   = declOpen   === proposal.id;
          const isActing     = acting     === proposal.id;

          const dl             = daysLeft(proposal.validUntil);
          const countdownColor = dl <= 1 ? "var(--red)" : dl <= 5 ? "var(--amber)" : "var(--green)";
          const countdownLabel = dl > 0
            ? `${dl} day${dl !== 1 ? "s" : ""} remaining`
            : `Expired ${Math.abs(dl)} day${Math.abs(dl) !== 1 ? "s" : ""} ago`;

          const amountFmt = fmt(proposal.amountCents);

          return (
            <div key={proposal.id} className={cx("card", "p0", "overflowHidden")}>

              {/* Status accent bar */}
              <div className={cx("h3", "dynBgColor")} style={{ "--bg-color": accentColor } as React.CSSProperties} />

              <div className={cx("py20_px", "px22_px")}>

                {/* ── Card header ── */}
                <div className={cx("flexRow", "flexAlignStart", "gap16", "mb16")}>

                  {/* Left: meta */}
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("flexRow", "flexCenter", "gap7", "mb8", "flexWrap")}>
                      <span className={cx("badge", "badgeMuted", "fontMono", "fs10")}>
                        #{proposal.id.slice(0, 8)}
                      </span>
                      <div className={cx("flexRow", "gap4")}>
                        <Ic n={STATUS_ICON[eff]} sz={11} c={accentColor} />
                        <span className={cx("badge", STATUS_BADGE[eff])}>{eff}</span>
                      </div>
                    </div>
                    <div className={cx("fw700", "qaQuoteTitle")}>
                      {proposal.title}
                    </div>
                    <div className={cx("flexRow", "flexCenter", "gap14", "flexWrap")}>
                      {proposal.preparedByInitials && (
                        <div className={cx("flexRow", "gap6")}>
                          <Av initials={proposal.preparedByInitials} size={20} />
                          <span className={cx("text10", "colorMuted")}>{proposal.preparedBy ?? "Team"}</span>
                        </div>
                      )}
                      <div className={cx("flexRow", "gap4")}>
                        <Ic n="calendar" sz={10} c="var(--muted2)" />
                        <span className={cx("text10", "colorMuted")}>Issued {fmtDate(proposal.createdAt)}</span>
                      </div>
                      {proposal.validUntil && (
                        <div className={cx("flexRow", "gap4")}>
                          <Ic n={isPending && dl <= 1 ? "alert" : "clock"} sz={10} c={isPending ? countdownColor : "var(--muted2)"} />
                          <span className={cx("text10", "dynColor", isPending && "fw700")} style={{ "--color": isPending ? countdownColor : "var(--muted2)" } as React.CSSProperties}>
                            {isPending ? countdownLabel : `Valid until ${fmtDate(proposal.validUntil)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: amount */}
                  <div className={cx("textRight", "noShrink")}>
                    <div className={cx("qaAmountBig", "dynColor")} style={{ "--color": eff === "Accepted" ? "var(--lime)" : eff === "Declined" || eff === "Expired" ? "var(--muted2)" : "inherit" } as React.CSSProperties}>
                      {amountFmt}
                    </div>
                    <div className={cx("text10", "colorMuted", "mt4")}>excl. VAT</div>
                  </div>
                </div>

                {/* ── Summary ── */}
                {proposal.summary && (
                  <div className={cx("text12", "colorMuted", "qaSummary")}>
                    {proposal.summary}
                  </div>
                )}

                {/* ── Line items ── */}
                {proposal.items.length > 0 && (
                <div className={cx("mb18")}>
                  <div className={cx("qaLineItemsLabel")}>
                    Line Items
                  </div>
                  {proposal.items.map((item, i) => (
                    <div
                      key={item.id}
                      className={cx("qaLineItem", i < proposal.items.length - 1 && "borderB")}
                    >
                      <div className={cx("qaLineItemIcon", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${accentColor} 10%, var(--s2))`, "--color": `color-mix(in oklab, ${accentColor} 20%, transparent)` } as React.CSSProperties}>
                        <Ic n={item.icon} sz={13} c={accentColor} />
                      </div>
                      <span className={cx("text12", "flex1")}>{item.description}</span>
                      <span className={cx("fw700", "text12")}>{fmt(item.amountCents)}</span>
                    </div>
                  ))}

                  {/* Total row */}
                  <div className={cx("qaTotalRow")}>
                    <span className={cx("text12", "colorMuted")}>Total (excl. VAT)</span>
                    <span className={cx("qaTotalAmt", "dynColor")} style={{ "--color": eff === "Accepted" ? "var(--lime)" : "inherit" } as React.CSSProperties}>
                      {amountFmt}
                    </span>
                  </div>
                </div>
                )}

                {/* ── Actions ── */}

                {/* Accepted */}
                {eff === "Accepted" && (
                  <div className={cx("flexBetween", "gap10")}>
                    <div className={cx("qaAcceptedBanner")}>
                      <Ic n="check" sz={14} c="var(--lime)" />
                      <span className={cx("fw600", "text12", "colorAccent")}>Quote accepted</span>
                      {proposal.acceptedAt && (
                        <span className={cx("text11", "colorMuted")}>— {fmtDate(proposal.acceptedAt)}</span>
                      )}
                    </div>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>
                      <Ic n="download" sz={12} c="var(--muted)" /> Download PDF
                    </button>
                  </div>
                )}

                {/* Declined */}
                {eff === "Declined" && (
                  <div className={cx("flexBetween", "gap10")}>
                    <div className={cx("qaDeclinedBanner")}>
                      <Ic n="x" sz={14} c="var(--red)" />
                      <span className={cx("fw600", "text12", "colorRed")}>Quote declined</span>
                      {proposal.declineReason && (
                        <span className={cx("text11", "colorMuted", "ml4")}>— {proposal.declineReason}</span>
                      )}
                    </div>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>
                      <Ic n="download" sz={12} c="var(--muted)" /> Download PDF
                    </button>
                  </div>
                )}

                {/* Expired */}
                {eff === "Expired" && (
                  <div className={cx("flexBetween", "gap10")}>
                    <div className={cx("qaExpiredBanner")}>
                      <Ic n="alert" sz={13} c="var(--muted2)" />
                      <span className={cx("text12", "colorMuted")}>This quote has expired — contact us to request a revised proposal.</span>
                    </div>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>
                      <Ic n="download" sz={12} c="var(--muted)" /> Download PDF
                    </button>
                  </div>
                )}

                {/* Pending — default actions */}
                {isPending && !isConfirming && !isDeclOpen && (
                  <div className={cx("flexRow", "flexCenter", "gap8")}>
                    <button
                      type="button"
                      className={cx("btnSm", "btnAccent")}
                      disabled={!!acting}
                      onClick={() => setConfirming(proposal.id)}
                    >
                      <Ic n="check" sz={13} c="var(--bg)" /> Accept Quote
                    </button>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "qaDeclineBtn")}
                      disabled={!!acting}
                      onClick={() => setDeclOpen(proposal.id)}
                    >
                      <Ic n="x" sz={12} c="var(--red)" /> Decline
                    </button>
                    <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")}>
                      <Ic n="download" sz={12} c="var(--muted)" /> Download PDF
                    </button>
                  </div>
                )}

                {/* Pending — confirm acceptance */}
                {isPending && isConfirming && (
                  <div className={cx("qaConfirmBox")}>
                    <div className={cx("fw600", "text12", "mb12")}>
                      Confirm acceptance of{" "}
                      <span className={cx("fw800", "colorAccent")}>{amountFmt}</span>
                      {" "}for <span className={cx("colorAccent")}>{proposal.title}</span>?
                    </div>
                    <div className={cx("text11", "colorMuted", "mb14", "lineH16")}>
                      By accepting you agree to the scope and cost outlined above. A confirmation will be sent to your account email.
                    </div>
                    <div className={cx("flexRow", "gap8")}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={isActing}
                        onClick={() => handleAccept(proposal.id)}
                      >
                        {isActing
                          ? <><Ic n="loader" sz={13} c="var(--bg)" /> Confirming…</>
                          : <><Ic n="check" sz={13} c="var(--bg)" /> Confirm Acceptance</>
                        }
                      </button>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={isActing}
                        onClick={() => setConfirming(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending — decline form */}
                {isPending && isDeclOpen && (
                  <div className={cx("qaDeclBox")}>
                    <div className={cx("fw600", "text12", "mb12", "colorRed")}>
                      Decline this quote?
                    </div>
                    <div className={cx("text11", "colorMuted", "mb10")}>
                      Reason (optional — helps us improve our proposals):
                    </div>
                    <textarea
                      className={cx("textarea", "mb12", "resizeV")}
                      rows={2}
                      placeholder="e.g. Budget constraints, scope change, timing..."
                      value={declReason[proposal.id] ?? ""}
                      onChange={(e) => setDeclReason((p) => ({ ...p, [proposal.id]: e.target.value }))}
                    />
                    <div className={cx("flexRow", "gap8")}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost", "qaDeclineConfirmBtn")}
                        disabled={isActing}
                        onClick={() => handleDecline(proposal.id)}
                      >
                        {isActing
                          ? <><Ic n="loader" sz={12} c="var(--red)" /> Declining…</>
                          : <><Ic n="x" sz={12} c="var(--red)" /> Confirm Decline</>
                        }
                      </button>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={isActing}
                        onClick={() => setDeclOpen(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
