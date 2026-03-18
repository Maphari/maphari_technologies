// ════════════════════════════════════════════════════════════════════════════
// invoice-chasing-page.tsx — Automated Invoice Chasing Sequences
// Data source: loadOverdueChaseStatusWithRefresh
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadOverdueChaseStatusWithRefresh,
  triggerInvoiceChaseWithRefresh,
  type OverdueInvoice,
  type ChaseStage,
} from "../../../../lib/api/admin/billing";
import { cx, styles } from "../style";
import { ConfirmDialog } from "@/components/shared/ui/confirm-dialog";
import { Tooltip } from "@/components/shared/ui/tooltip";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function stageLabelText(stage: ChaseStage): string {
  switch (stage) {
    case "CHASE_3D": return "3-day";
    case "CHASE_7D": return "7-day";
    case "CHASE_14D": return "14-day";
    case "PAUSED": return "Paused";
    case "NONE": return "Pending";
  }
}

// ── Chase sequence visual ──────────────────────────────────────────────────

function ChaseSequenceTrack({ highlightStage }: { highlightStage: ChaseStage | null }) {
  const stages: Array<{ stage: ChaseStage; label: string; days: string }> = [
    { stage: "CHASE_3D", label: "1st", days: "3 days" },
    { stage: "CHASE_7D", label: "2nd", days: "7 days" },
    { stage: "CHASE_14D", label: "3rd", days: "14 days" },
  ];

  return (
    <div className={styles.icSequenceTrack}>
      {stages.map((s, i) => {
        const isActive =
          highlightStage === s.stage ||
          (highlightStage === "CHASE_7D" && s.stage === "CHASE_3D") ||
          (highlightStage === "CHASE_14D" && (s.stage === "CHASE_3D" || s.stage === "CHASE_7D"));
        return (
          <div key={s.stage} className={cx(styles.icSequenceTrackFlex)} style={{ flex: i < stages.length - 1 ? "1" : undefined }}>
            <div className={cx(styles.icSequenceTrackFlex)} style={{ flexDirection: "column", gap: 4 }}>
              <div className={cx(styles.icStageDot, isActive && styles.icStageDotActive)}>
                {s.label}
              </div>
              <span className={cx("text10", "colorMuted")} style={{ whiteSpace: "nowrap" }}>{s.days}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={cx(styles.icStageLine, isActive && styles.icStageLineActive)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stage badge ────────────────────────────────────────────────────────────

function ChaseStageBadge({ stage }: { stage: ChaseStage }) {
  const map: Record<ChaseStage, string> = {
    CHASE_3D: styles.badgeAmber,
    CHASE_7D: styles.badgeRed,
    CHASE_14D: styles.badgeRed,
    PAUSED: styles.badgeMuted,
    NONE: styles.badgeMuted,
  };
  return (
    <span className={cx(styles.badge, map[stage])}>
      {stageLabelText(stage)}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InvoiceChasingPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [confirmChase, setConfirmChase] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    const r = await loadOverdueChaseStatusWithRefresh(session);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else if (r.data) {
      setInvoices(r.data.invoices);
    }
    setLoading(false);
  }, [session, onNotify]);

  useEffect(() => { void load(); }, [load]);

  async function handleAction(inv: OverdueInvoice, action: "send" | "pause" | "resume") {
    if (!session) return;
    setActioning(inv.id + ":" + action);
    const r = await triggerInvoiceChaseWithRefresh(session, inv.id, action);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      const msg =
        action === "send"
          ? `Reminder sent for invoice ${inv.id.slice(0, 8)}…`
          : action === "pause"
          ? "Chase sequence paused."
          : "Chase sequence resumed.";
      onNotify("success", msg);
      await load();
    }
    setActioning(null);
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalOutstanding = invoices.reduce((s, i) => s + i.amountCents, 0);
  const running = invoices.filter(
    (i) => i.chaseStage !== "PAUSED" && i.chaseStage !== "NONE"
  ).length;

  // The dominant stage for the visual track (highest stage across all invoices)
  const dominantStage: ChaseStage | null = invoices.reduce<ChaseStage | null>((acc, inv) => {
    const order: ChaseStage[] = ["NONE", "PAUSED", "CHASE_3D", "CHASE_7D", "CHASE_14D"];
    if (!acc) return inv.chaseStage;
    return order.indexOf(inv.chaseStage) > order.indexOf(acc) ? inv.chaseStage : acc;
  }, null);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCE</div>
          <h1 className={styles.pageTitle}>Invoice Chasing</h1>
          <div className={styles.pageSub}>Automated payment reminders for overdue invoices</div>
        </div>
        <button
          type="button"
          className={cx("btnSm", "btnGhost")}
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Summary row ────────────────────────────────────────────────────── */}
      <div className={styles.icSummaryRow}>
        <div className={styles.icSumStat}>
          <span className={styles.icSumVal}>{invoices.length}</span>
          overdue invoice{invoices.length !== 1 ? "s" : ""}
        </div>
        <div className={styles.icSumStat}>
          <span className={styles.icSumVal}>
            {totalOutstanding > 0
              ? formatMoneyCents(totalOutstanding, { currency: "ZAR", maximumFractionDigits: 0 })
              : "R0"}
          </span>
          outstanding
        </div>
        <div className={styles.icSumStat}>
          <span className={styles.icSumVal}>{running}</span>
          sequence{running !== 1 ? "s" : ""} running
        </div>
      </div>

      {/* ── Chase sequence visualiser ──────────────────────────────────────── */}
      <ChaseSequenceTrack highlightStage={dominantStage} />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH40")} />
        </div>
      ) : invoices.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.emptyTitle}>No overdue invoices — great work!</div>
          <div className={styles.emptySub}>All invoices are current. No chasing sequences are active.</div>
        </div>
      ) : (
        <div className={cx("card", "overflowAuto", "p0")}>
          <div className={styles.icChaseMinW}>
            {/* Table header */}
            <div className={cx(styles.icChaseGrid, "px20", "borderB", "text10", "colorMuted", "uppercase", "tracking")}>
              {["Client", "Invoice ID", "Amount", "Days Overdue", "Chase Stage", "Last Sent", "Next Scheduled", "Actions"].map(
                (h, i) => <span key={`${h}-${i}`}>{h}</span>
              )}
            </div>

            {/* Table rows */}
            {invoices.map((inv, i) => (
              <div
                key={inv.id}
                className={cx(
                  styles.icChaseGrid,
                  styles.tableRow,
                  "px20",
                  "invcRowPad16",
                  "invcRowAlign",
                  i < invoices.length - 1 && "borderB"
                )}
              >
                <span className={cx("fw600")}>
                  {inv.clientName ?? inv.clientId.slice(0, 8) + "…"}
                </span>
                <span className={cx("fontMono", "text11", "colorMuted")}>{inv.id.slice(0, 12)}…</span>
                <span className={cx("fontMono", "fw700", "colorAccent")}>
                  {formatMoneyCents(inv.amountCents, { currency: "ZAR", maximumFractionDigits: 0 })}
                </span>
                <span className={cx("fw600", inv.daysOverdue >= 14 ? "colorRed" : inv.daysOverdue >= 7 ? "colorAmber" : "colorMuted")}>
                  {inv.daysOverdue}d
                </span>
                <ChaseStageBadge stage={inv.chaseStage} />
                <span className={cx("text11", "fontMono", "colorMuted")}>{fmtDate(inv.lastChasedAt)}</span>
                <span className={cx("text11", "fontMono", "colorMuted")}>{fmtDate(inv.nextChaseAt)}</span>
                <div className={cx("flexRow", "gap6")}>
                  <Tooltip label="Send an overdue reminder email to the client">
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      tabIndex={0}
                      disabled={actioning !== null || inv.chaseStage === "PAUSED"}
                      onClick={() => setConfirmChase(inv.id)}
                    >
                      {actioning === inv.id + ":send" ? "Sending…" : "Send Now"}
                    </button>
                  </Tooltip>
                  {inv.chaseStage === "PAUSED" ? (
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      tabIndex={0}
                      disabled={actioning !== null}
                      onClick={() => void handleAction(inv, "resume")}
                    >
                      {actioning === inv.id + ":resume" ? "Resuming…" : "Resume"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      tabIndex={0}
                      disabled={actioning !== null}
                      onClick={() => void handleAction(inv, "pause")}
                    >
                      {actioning === inv.id + ":pause" ? "Pausing…" : "Pause"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmChase !== null}
        title="Send reminder now?"
        body="A reminder email will be sent to the client immediately."
        confirmLabel="Send"
        onConfirm={() => {
          if (confirmChase) {
            const inv = invoices.find((i) => i.id === confirmChase);
            if (inv) void handleAction(inv, "send");
          }
          setConfirmChase(null);
        }}
        onCancel={() => setConfirmChase(null)}
      />
    </div>
  );
}
