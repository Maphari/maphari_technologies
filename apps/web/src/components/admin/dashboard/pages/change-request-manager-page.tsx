// ════════════════════════════════════════════════════════════════════════════
// change-request-manager-page.tsx — Admin Change Request Manager
// Data : loadProjectChangeRequestsWithRefresh → GET /change-requests
// Mut  : updateProjectChangeRequestWithRefresh → PATCH /change-requests/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, PipelineWidget, TableWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadProjectChangeRequestsWithRefresh,
  updateProjectChangeRequestWithRefresh,
} from "../../../../lib/api/admin/project-ops";
import type { ProjectChangeRequest } from "../../../../lib/api/admin/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: ProjectChangeRequest["status"]): string {
  switch (s) {
    case "DRAFT":            return "Draft";
    case "SUBMITTED":        return "Submitted";
    case "ESTIMATED":        return "Estimated";
    case "ADMIN_APPROVED":   return "Admin Approved";
    case "ADMIN_REJECTED":   return "Admin Rejected";
    case "CLIENT_APPROVED":  return "Client Approved";
    case "CLIENT_REJECTED":  return "Client Rejected";
  }
}

function statusBadge(s: ProjectChangeRequest["status"]): string {
  switch (s) {
    case "DRAFT":           return "badgeMuted";
    case "SUBMITTED":       return "badgeAmber";
    case "ESTIMATED":       return "badgePurple";
    case "ADMIN_APPROVED":  return "badgeGreen";
    case "ADMIN_REJECTED":  return "badgeRed";
    case "CLIENT_APPROVED": return "badgeGreen";
    case "CLIENT_REJECTED": return "badgeRed";
  }
}

function formatCost(cents: number | null): string {
  if (cents == null) return "—";
  return formatMoneyCents(cents, { maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return iso;
  }
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChangeRequestManagerPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "warning" | "info", message: string) => void;
}) {
  const [items, setItems] = useState<ProjectChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void loadProjectChangeRequestsWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setItems(r.data);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const handleDecision = async (id: string, status: "ADMIN_APPROVED" | "ADMIN_REJECTED") => {
    if (!session || updating) return;
    setUpdating(id);
    const r = await updateProjectChangeRequestWithRefresh(session, id, { status });
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) {
      setItems((prev) => prev.map((cr) => (cr.id === id ? r.data! : cr)));
      onNotify?.("success", status === "ADMIN_APPROVED" ? "Change request approved — team notified." : "Change request rejected.");
    } else if (r.error) {
      onNotify?.("error", r.error.message ?? "Failed to update change request.");
    }
    setUpdating(null);
  };

  const canAct = (s: ProjectChangeRequest["status"]) =>
    s === "SUBMITTED" || s === "ESTIMATED";

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

  const pendingCount  = items.filter((cr) => cr.status === "SUBMITTED" || cr.status === "ESTIMATED").length;
  const approvedCount = items.filter((cr) => cr.status === "ADMIN_APPROVED" || cr.status === "CLIENT_APPROVED").length;
  const rejectedCount = items.filter((cr) => cr.status === "ADMIN_REJECTED" || cr.status === "CLIENT_REJECTED").length;
  const draftCount    = items.filter((cr) => cr.status === "DRAFT").length;

  const tableRows: Record<string, unknown>[] = items.slice(0, 50).map((cr) => ({
    id:     shortId(cr.id),
    title:  cr.title,
    cost:   formatCost(cr.estimatedCostCents),
    by:     cr.requestedByName ?? "—",
    date:   formatDate(cr.requestedAt),
    status: statusLabel(cr.status),
    statusRaw: cr.status,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / CHANGE REQUEST MANAGER</div>
          <h1 className={styles.pageTitle}>Change Request Manager</h1>
          <div className={styles.pageSub}>Review and approve project scope change requests</div>
        </div>
      </div>

      <WidgetGrid>
        <StatWidget label="Pending"  value={pendingCount}  sub="Awaiting review"  tone={pendingCount > 0 ? "amber" : "default"} />
        <StatWidget label="Approved" value={approvedCount} sub="Accepted changes"  tone="green" />
        <StatWidget label="Rejected" value={rejectedCount} sub="Declined changes"  tone={rejectedCount > 0 ? "red" : "default"} />
        <StatWidget label="Draft"    value={draftCount}    sub="Not yet submitted" tone="default" />
      </WidgetGrid>

      <WidgetGrid columns={2}>
        <PipelineWidget
          label="Change Request Pipeline"
          stages={[
            { label: "Draft",     count: draftCount,    total: items.length || 1, color: "#8b6fff" },
            { label: "Pending",   count: pendingCount,  total: items.length || 1, color: "#f5a623" },
            { label: "Approved",  count: approvedCount, total: items.length || 1, color: "#34d98b" },
            { label: "Rejected",  count: rejectedCount, total: items.length || 1, color: "#ff5f5f" },
          ]}
        />
        <TableWidget
          label="Recent Change Requests"
          columns={[
            { key: "id",     header: "ID" },
            { key: "title",  header: "Title" },
            { key: "cost",   header: "Cost" },
            { key: "status", header: "Status" },
          ]}
          rows={tableRows}
          emptyMessage="No change requests yet"
        />
      </WidgetGrid>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Change Requests</span>
          {!loading && <span className={cx("colorMuted", "text12")}>{items.length} total</span>}
        </div>
        <div className={styles.cardInner}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M13 6h3a2 2 0 0 1 2 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="6" y1="9" x2="6" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No change requests</div>
                <div className={styles.emptySub}>When clients or staff submit scope change requests on active projects, they will appear here for review, estimation, and approval.</div>
              </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Change</th>
                  <th scope="col">Impact</th>
                  <th scope="col">Estimated Cost</th>
                  <th scope="col">Submitted By</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cr) => (
                  <tr key={cr.id}>
                    <td className={cx("fontMono", "text12")}>{shortId(cr.id)}</td>
                    <td className={cx("fw600")}>{cr.title}</td>
                    <td className={cx("text12", "colorMuted")}>{cr.impactSummary ?? "—"}</td>
                    <td className={cx("fontMono", "fw600", "colorAmber")}>{formatCost(cr.estimatedCostCents)}</td>
                    <td className={cx("text12", "colorMuted")}>{cr.requestedByName ?? "—"}</td>
                    <td className={cx("fontMono", "text11", "colorMuted")}>{formatDate(cr.requestedAt)}</td>
                    <td>
                      <span className={cx("badge", statusBadge(cr.status))}>
                        {statusLabel(cr.status)}
                      </span>
                    </td>
                    <td>
                      {canAct(cr.status) && (
                        <div className={cx("flex", "gap4")}>
                          <button
                            type="button"
                            className={cx("btnSm", "btnAccent")}
                            disabled={updating === cr.id}
                            onClick={() => void handleDecision(cr.id, "ADMIN_APPROVED")}
                          >
                            {updating === cr.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
                            disabled={updating === cr.id}
                            onClick={() => void handleDecision(cr.id, "ADMIN_REJECTED")}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </div>
  );
}
