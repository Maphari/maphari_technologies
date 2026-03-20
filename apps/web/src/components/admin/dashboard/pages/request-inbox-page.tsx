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

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void Promise.all([
      loadProjectRequestsQueueWithRefresh(session),
      loadClientDirectoryWithRefresh(session, { pageSize: 100 }),
    ]).then(([reqRes, clientRes]) => {
      if (cancelled) return;
      if (reqRes.nextSession) saveSession(reqRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);
      if (reqRes.error) { setError(reqRes.error.message ?? "Failed to load."); return; }
      if (reqRes.data) setItems(reqRes.data);
      if (!clientRes.error && clientRes.data?.items) {
        const map: Record<string, string> = {};
        for (const c of clientRes.data.items) map[c.id] = c.name;
        setClientNames(map);
      }
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const pipelineValue = items.reduce((s, r) => s + (r.estimatedBudgetCents ?? 0), 0);
  const high   = items.filter((r) => r.priority === "HIGH").length;
  const medium = items.filter((r) => r.priority === "MEDIUM").length;

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
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
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
