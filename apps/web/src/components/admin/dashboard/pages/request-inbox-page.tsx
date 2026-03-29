// ════════════════════════════════════════════════════════════════════════════
// request-inbox-page.tsx — Admin Request Inbox
// Data : loadProjectRequestsQueueWithRefresh → GET /projects/requests
//        loadClientDirectoryWithRefresh      → GET /clients/directory
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadProjectRequestsQueueWithRefresh,
  decideProjectRequestWithRefresh,
  loadAdminEftPendingWithRefresh,
  verifyAdminEftDepositWithRefresh,
  type AdminEftPendingItem,
} from "../../../../lib/api/admin/projects";
import { loadClientDirectoryWithRefresh } from "../../../../lib/api/admin/clients";
import type { ProjectRequestQueueItem } from "../../../../lib/api/admin/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBudget(cents: number): string {
  return formatMoneyCents(cents, { maximumFractionDigits: 0 });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return "—";
  }
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

// ── Triage Modal ──────────────────────────────────────────────────────────────

function TriageModal({
  request,
  clientName,
  session,
  onClose,
  onSuccess,
  onError,
}: {
  request: ProjectRequestQueueItem;
  clientName: string;
  session: AuthSession | null;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
  onError: (message: string) => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [ownerName, setOwnerName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    try {
      const res = await decideProjectRequestWithRefresh(session, request.projectId, {
        decision,
        note: note.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
      });
      if (res.nextSession) saveSession(res.nextSession);
      if (res.error?.code === "SESSION_EXPIRED" || res.error?.code === "SESSION_UNAUTHORIZED") {
        onError("Session expired. Please log in again.");
        return;
      }
      if (res.error) {
        onError(res.error.message ?? "Failed to triage request.");
        return;
      }
      onSuccess(request.projectId);
    } catch {
      onError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={styles.modalOverlay}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHd}>
          <span className={styles.modalTitle}>Triage Request</span>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Request summary + form */}
        <div className={styles.modalBody}>
          <div className={cx("mb16")}>
            <div className={cx("fw600", "mb4")}>{request.name}</div>
            <div className={cx("flexRow", "flexWrap", "gap8", "mb4")}>
              <span className={cx("colorMuted", "text12")}>Client: {clientName}</span>
              <span className={cx("colorMuted", "text12")}>·</span>
              <span className={cx("fontMono", "text12")}>#{shortId(request.projectId)}</span>
              <span className={cx("colorMuted", "text12")}>·</span>
              <span className={cx("fontMono", "text12", "fw600")}>{formatBudget(request.estimatedBudgetCents)}</span>
            </div>
            {request.requestDetails?.serviceType && (
              <span className={cx("badge")}>{request.requestDetails.serviceType}</span>
            )}
            {request.requestNote && (
              <div className={cx("colorMuted", "text12", "mt8")}>
                {request.requestNote}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Decision */}
            <div className={cx("mb12")}>
              <label className={cx("colorMuted", "text12", "block", "mb6")}>
                Decision
              </label>
              <div className={cx("flexRow", "gap8")}>
                {(["APPROVED", "REJECTED"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={cx(
                      "btnSm",
                      decision === opt
                        ? opt === "APPROVED"
                          ? "btnAccent"
                          : "btnDanger"
                        : "btnGhost"
                    )}
                    onClick={() => setDecision(opt)}
                  >
                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner Name (only shown for APPROVED) */}
            {decision === "APPROVED" && (
              <div className={cx("mb12")}>
                <label className={cx("colorMuted", "text12", "block", "mb6")}>
                  Assign Owner (optional)
                </label>
                <input
                  type="text"
                  className={cx("inputSm")}
                  placeholder="Owner name…"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}

            {/* Note */}
            <div className={cx("mb16")}>
              <label className={cx("colorMuted", "text12", "block", "mb6")}>
                Note (optional)
              </label>
              <textarea
                className={cx("inputSm", "wFull", "resizeV")}
                placeholder="Add a triage note…"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Actions */}
            <div className={cx("flexEnd", "gap8")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cx("btnSm", "btnAccent")}
                disabled={submitting || !session}
              >
                {submitting ? "Saving…" : "Confirm Triage"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RequestInboxPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [items, setItems] = useState<ProjectRequestQueueItem[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequestQueueItem | null>(null);

  const [eftItems, setEftItems]           = useState<AdminEftPendingItem[]>([]);
  const [eftLoading, setEftLoading]       = useState(true);
  const [expandedEftId, setExpandedEftId] = useState<string | null>(null);
  const [eftNotes, setEftNotes]           = useState<Record<string, string>>({});
  const [eftRejReason, setEftRejReason]   = useState<Record<string, string>>({});
  const [eftFilter, setEftFilter]         = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");
  const [eftActionLoading, setEftActionLoading] = useState<string | null>(null); // tracks verificationId being actioned

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void Promise.all([
      loadProjectRequestsQueueWithRefresh(session),
      loadClientDirectoryWithRefresh(session, { pageSize: 100 }),
      loadAdminEftPendingWithRefresh(session),
    ]).then(([reqRes, clientRes, eftRes]) => {
      if (cancelled) return;
      if (reqRes.nextSession) saveSession(reqRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);
      if (eftRes.nextSession) saveSession(eftRes.nextSession);
      if (reqRes.error) { setError(reqRes.error.message ?? "Failed to load."); return; }
      if (reqRes.data) setItems(reqRes.data);
      if (!clientRes.error && clientRes.data?.items) {
        const map: Record<string, string> = {};
        for (const c of clientRes.data.items) map[c.id] = c.name;
        setClientNames(map);
      }
      setEftItems(eftRes.data ?? []);
      setEftLoading(false);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      if (!cancelled) { setLoading(false); setEftLoading(false); }
    });
    return () => { cancelled = true; };
  }, [session]);

  const pipelineValue = items.reduce((s, r) => s + (r.estimatedBudgetCents ?? 0), 0);
  const high   = items.filter((r) => r.priority === "HIGH").length;
  const medium = items.filter((r) => r.priority === "MEDIUM").length;

  async function handleEftVerify(verificationId: string, action: "VERIFY" | "REJECT") {
    if (eftActionLoading === verificationId) return; // prevent double-submit
    setEftActionLoading(verificationId);
    const rejectionReason = eftRejReason[verificationId]?.trim();
    if (action === "REJECT" && !rejectionReason) {
      onNotify?.("error", "Please enter a rejection reason.");
      setEftActionLoading(null);
      return;
    }
    try {
      const res = await verifyAdminEftDepositWithRefresh(session!, verificationId, { action, rejectionReason });
      if (res.nextSession) saveSession(res.nextSession);
      if (res.error) { onNotify?.("error", res.error.message ?? "Failed to verify deposit."); return; }
      setEftItems(prev => prev.map(item =>
        item.id === verificationId
          ? { ...item, status: action === "VERIFY" ? "VERIFIED" : "REJECTED", rejectionReason: rejectionReason ?? null }
          : item
      ));
      setExpandedEftId(null);
    } catch (err) {
      console.error("[eft] handleEftVerify error:", err);
    } finally {
      setEftActionLoading(null);
    }
  }

  function handleTriageSuccess(projectId: string) {
    setItems((prev) => prev.filter((r) => r.projectId !== projectId));
    setSelectedRequest(null);
    onNotify?.("success", "Request triaged.");
  }

  function handleTriageError(message: string) {
    setSelectedRequest(null);
    onNotify?.("error", message);
  }

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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / REQUEST INBOX</div>
          <h1 className={styles.pageTitle}>Request Inbox</h1>
          <div className={styles.pageSub}>Triage incoming project requests — assign, estimate, and approve</div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Requests",  value: String(items.length),          cls: "colorAccent" },
          { label: "High Priority",   value: String(high),                   cls: "colorRed"    },
          { label: "Medium Priority", value: String(medium),                 cls: "colorAmber"  },
          { label: "Pipeline Value",  value: formatBudget(pipelineValue),    cls: "colorAccent" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── EFT Verification Panel ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {/* Use inline style — "sectionTitle" is a client CSS class, not available in admin */}
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>EFT Deposit Verification</h2>
          {eftItems.filter(i => i.status === "PENDING").length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
              {eftItems.filter(i => i.status === "PENDING").length} pending
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["ALL", "PENDING", "VERIFIED", "REJECTED"] as const).map(f => (
            <button key={f} onClick={() => setEftFilter(f)}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
                background: eftFilter === f ? "var(--accent)" : "var(--surface)",
                color: eftFilter === f ? "#0c0c0f" : "var(--muted)",
                border: eftFilter === f ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          {eftLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
          ) : eftItems.filter(i => eftFilter === "ALL" || i.status === eftFilter).length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 600 }}>No {eftFilter === "ALL" ? "" : eftFilter.toLowerCase() + " "}EFT submissions</div>
            </div>
          ) : (
            eftItems
              .filter(i => eftFilter === "ALL" || i.status === eftFilter)
              .map(item => {
                const isExpanded = expandedEftId === item.id;
                const isVerified = item.status === "VERIFIED";
                const isRejected = item.status === "REJECTED";
                const ageMs = Date.now() - new Date(item.createdAt).getTime();
                const ageHrs = Math.floor(ageMs / 3_600_000);
                return (
                  <div key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    {/* Row */}
                    <div onClick={() => setExpandedEftId(isExpanded ? null : item.id)}
                      style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fbbf24", flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.clientName}</span>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#8b6fff", background: "rgba(139,111,255,0.08)", border: "1px solid rgba(139,111,255,0.2)", borderRadius: 4, padding: "2px 7px" }}>
                            {item.referenceCode ?? "—"}
                          </span>
                          {(isVerified || isRejected) && (
                            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, border: `1px solid ${isVerified ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, color: isVerified ? "#4ade80" : "#f87171", background: isVerified ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
                              {isVerified ? "Verified" : "Rejected"}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>Deposit: <span style={{ color: "var(--text)" }}>R {(item.depositCents / 100).toLocaleString("en-ZA")}</span></span>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>Proof: <span style={{ color: "var(--text)" }}>{item.proofFileName}</span></span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.status === "PENDING" && (
                          <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 4, padding: "2px 8px" }}>
                            {ageHrs < 1 ? "< 1h ago" : ageHrs < 24 ? `${ageHrs}h ago` : `${Math.floor(ageHrs / 24)}d ago`}
                          </span>
                        )}
                        <span style={{ color: "var(--muted)", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                      </div>
                    </div>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--border)" }}>
                        {isVerified && (
                          <div style={{ marginTop: 16, marginBottom: 12, padding: "12px 16px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8, color: "#4ade80", fontSize: 12.5 }}>
                            ✓ Deposit verified — client notified by email
                          </div>
                        )}
                        {isRejected && (
                          <div style={{ marginTop: 16, marginBottom: 12, padding: "12px 16px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, color: "#f87171", fontSize: 12.5 }}>
                            ✕ Rejected — {item.rejectionReason}
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: isVerified || isRejected ? 0 : 16, marginBottom: 16 }}>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Proof file</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 20 }}>📄</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.proofFileName}</div>
                                <a href={`/api/v1/files/${item.proofFileId}/download-url`} target="_blank" rel="noreferrer"
                                  style={{ fontSize: 11.5, color: "#8b6fff", cursor: "pointer" }}>↗ View proof document</a>
                              </div>
                            </div>
                          </div>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Request summary</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Deposit</span>
                                {/* Admin uses --accent (purple), not --lime */}
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>R {(item.depositCents / 100).toLocaleString("en-ZA")}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Submitted</span>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{new Date(item.createdAt).toLocaleDateString("en-ZA")}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Status</span>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fbbf24" }}>{item.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isVerified && !isRejected && (
                          <>
                            <textarea
                              placeholder="Optional internal note (not shown to client)"
                              value={eftNotes[item.id] ?? ""}
                              onChange={e => setEftNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              rows={2}
                              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text)", resize: "none", fontFamily: "inherit", marginBottom: 8, outline: "none", boxSizing: "border-box" }}
                            />
                            <textarea
                              placeholder="Rejection reason (required if rejecting — shown to client)"
                              value={eftRejReason[item.id] ?? ""}
                              onChange={e => setEftRejReason(prev => ({ ...prev, [item.id]: e.target.value }))}
                              rows={2}
                              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text)", resize: "none", fontFamily: "inherit", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                              {/* STAFF can see but not act — only ADMIN may verify/reject (spec §7) */}
                              <button
                                disabled={session?.user.role !== "ADMIN" || eftActionLoading === item.id}
                                onClick={() => handleEftVerify(item.id, "VERIFY")}
                                style={{ flex: 1, padding: 10, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: session?.user.role !== "ADMIN" || eftActionLoading === item.id ? "not-allowed" : "pointer", opacity: session?.user.role !== "ADMIN" || eftActionLoading === item.id ? 0.4 : 1 }}>
                                ✓ Verify deposit
                              </button>
                              <button
                                disabled={session?.user.role !== "ADMIN" || eftActionLoading === item.id}
                                onClick={() => handleEftVerify(item.id, "REJECT")}
                                style={{ flex: 1, padding: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, fontWeight: 600, cursor: session?.user.role !== "ADMIN" || eftActionLoading === item.id ? "not-allowed" : "pointer", opacity: session?.user.role !== "ADMIN" || eftActionLoading === item.id ? 0.4 : 1 }}>
                                ✕ Reject — request new proof
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </section>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Incoming Requests</span>
          <span className={cx("colorMuted", "text12")}>{items.length} total</span>
        </div>
        <div className={styles.cardInner}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No pending requests</div>
                <div className={styles.emptySub}>When clients submit new project requests through the portal, they will appear here for triage, estimation, and approval.</div>
              </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Request</th>
                  <th scope="col">Client</th>
                  <th scope="col">Type</th>
                  <th scope="col">Value</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Received</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.projectId}>
                    <td className={cx("fontMono", "text12")}>{shortId(r.projectId)}</td>
                    <td className={cx("fw600")}>{r.name}</td>
                    <td className={cx("colorMuted")}>{clientNames[r.clientId] ?? shortId(r.clientId)}</td>
                    <td><span className={cx("badge")}>{r.requestDetails?.serviceType ?? "—"}</span></td>
                    <td className={cx("fontMono", "fw600")}>{formatBudget(r.estimatedBudgetCents)}</td>
                    <td>
                      <span className={cx("badge", r.priority === "HIGH" ? "badgeRed" : r.priority === "MEDIUM" ? "badgeAmber" : "badgeMuted")}>
                        {r.priority.charAt(0) + r.priority.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className={cx("fontMono", "text11", "colorMuted")}>{formatDate(r.requestedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        onClick={() => setSelectedRequest(r)}
                      >
                        Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      {selectedRequest && (
        <TriageModal
          request={selectedRequest}
          clientName={clientNames[selectedRequest.clientId] ?? shortId(selectedRequest.clientId)}
          session={session}
          onClose={() => setSelectedRequest(null)}
          onSuccess={handleTriageSuccess}
          onError={handleTriageError}
        />
      )}
    </div>
  );
}
