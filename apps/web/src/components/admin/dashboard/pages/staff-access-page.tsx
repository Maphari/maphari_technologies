// ════════════════════════════════════════════════════════════════════════════
// staff-access-page.tsx — Admin Dashboard: Staff Access Management
// Manages staff registration approval, verification tracking, and audit trail.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  approveStaffAccessRequestWithRefresh,
  loadStaffAccessRequestsWithRefresh,
  loadStaffUsersWithRefresh,
  revokeStaffUserWithRefresh,
  type StaffAccessRequest,
  type StaffAccessUser
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { AdminFilterBar, EmptyState, formatDate } from "./shared";
import { cx, styles } from "../style";

type StaffAccessPageProps = {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
};

const tabs = ["request queue", "staff accounts", "verification queue", "audit trail"] as const;
type Tab = (typeof tabs)[number];

type RequestFilter = "all" | "PENDING_ADMIN" | "APPROVED" | "VERIFIED" | "REVOKED";
type AccountFilter = "all" | "active" | "revoked";

function statusBadgeClass(status: StaffAccessRequest["status"]): string {
  switch (status) {
    case "PENDING_ADMIN": return "badgeAmber";
    case "APPROVED":      return "badgePurple";
    case "VERIFIED":      return "badgeBlue";
    case "REVOKED":       return "badgeRed";
    default:              return "badgeMuted";
  }
}

function statusLabel(status: StaffAccessRequest["status"]): string {
  switch (status) {
    case "PENDING_ADMIN": return "Pending Admin";
    case "APPROVED":      return "Approved";
    case "VERIFIED":      return "Verified";
    case "REVOKED":       return "Revoked";
    default:              return status;
  }
}

function VerificationStepper({ status }: { status: StaffAccessRequest["status"] }) {
  const steps = [
    { label: "Request approved by admin", done: status === "APPROVED" || status === "VERIFIED" },
    { label: "Staff completed PIN verification", done: status === "VERIFIED" },
    { label: "Access confirmed active", done: false }
  ];
  return (
    <div className={cx("flexRow", "gap10", "mt8", "flexWrap")}>
      {steps.map((step, i) => (
        <span key={step.label} className={cx("flexRow", "gap4", "text10", step.done ? "colorAccent" : "colorMuted2")}>
          {step.done ? "✓" : "○"} {i + 1}. {step.label}
          {i < steps.length - 1 ? <span className={cx("colorBorder")}>·</span> : null}
        </span>
      ))}
    </div>
  );
}

export function StaffAccessPage({ session, onNotify }: StaffAccessPageProps) {
  const [requests, setRequests] = useState<StaffAccessRequest[]>([]);
  const [users, setUsers] = useState<StaffAccessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("request queue");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("all");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [query, setQuery] = useState("");
  const [approveModal, setApproveModal] = useState<{ requestId: string; notes: string } | null>(null);
  const previousPendingRef = useRef(0);

  const statToneClass = (color: string): string => {
    if (color === "var(--red)") return "colorRed";
    if (color === "var(--amber)") return "colorAmber";
    if (color === "var(--blue)") return "colorBlue";
    if (color === "var(--purple)") return "colorPurple";
    if (color === "var(--muted)") return "colorMuted";
    return "colorAccent";
  };

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "PENDING_ADMIN").length, [requests]);
  const approvedWaitingVerification = useMemo(() => requests.filter((r) => r.status === "APPROVED").length, [requests]);
  const activeStaff = useMemo(() => users.filter((u) => u.isActive).length, [users]);
  const revokedStaff = useMemo(() => users.filter((u) => !u.isActive).length, [users]);

  const refreshAll = useCallback(async (currentSession: AuthSession) => {
    setLoading(true);
    const [requestsResult, usersResult] = await Promise.all([
      loadStaffAccessRequestsWithRefresh(currentSession),
      loadStaffUsersWithRefresh(currentSession)
    ]);
    if (!requestsResult.nextSession || !usersResult.nextSession) {
      onNotify("error", requestsResult.error?.message ?? usersResult.error?.message ?? "Session expired.");
      setLoading(false);
      return;
    }
    if (requestsResult.error) onNotify("error", requestsResult.error.message);
    if (usersResult.error) onNotify("error", usersResult.error.message);
    setRequests(requestsResult.data ?? []);
    setUsers(usersResult.data ?? []);
    setLoading(false);
  }, [onNotify]);

  useEffect(() => {
    if (!session) return;
    const id = window.setTimeout(() => { void refreshAll(session); }, 0);
    return () => window.clearTimeout(id);
  }, [refreshAll, session]);

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => { void refreshAll(session); }, 15000);
    return () => window.clearInterval(id);
  }, [refreshAll, session]);

  useEffect(() => {
    if (pendingRequests > previousPendingRef.current) onNotify("success", "New staff request received.");
    previousPendingRef.current = pendingRequests;
  }, [onNotify, pendingRequests]);

  const normalizedQuery = query.trim().toLowerCase();

  const requestRows = useMemo(() =>
    requests
      .filter((r) => requestFilter === "all" ? true : r.status === requestFilter)
      .filter((r) => normalizedQuery ? r.email.toLowerCase().includes(normalizedQuery) : true)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
  [normalizedQuery, requestFilter, requests]);

  const accountRows = useMemo(() =>
    users
      .filter((u) => accountFilter === "all" ? true : accountFilter === "active" ? u.isActive : !u.isActive)
      .filter((u) => normalizedQuery ? u.email.toLowerCase().includes(normalizedQuery) : true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [accountFilter, normalizedQuery, users]);

  const verificationRows = useMemo(() =>
    requests
      .filter((r) => r.status === "APPROVED" || r.status === "VERIFIED")
      .filter((r) => normalizedQuery ? r.email.toLowerCase().includes(normalizedQuery) : true)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
  [normalizedQuery, requests]);

  const auditRows = useMemo(() => {
    type AuditEvent = { date: string; email: string; event: "Approved" | "Verified" | "Revoked"; };
    const events: AuditEvent[] = [];
    for (const r of requests) {
      if (r.status === "APPROVED" || r.status === "VERIFIED") events.push({ date: r.requestedAt, email: r.email, event: "Approved" });
      if (r.status === "VERIFIED") events.push({ date: r.requestedAt, email: r.email, event: "Verified" });
    }
    for (const u of users) {
      if (!u.isActive) events.push({ date: u.createdAt, email: u.email, event: "Revoked" });
    }
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
  }, [requests, users]);

  async function handleApproveConfirm(): Promise<void> {
    if (!session || !approveModal) return;
    const { requestId } = approveModal;
    setApproveModal(null);
    const result = await approveStaffAccessRequestWithRefresh(session, requestId);
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to approve request.");
      return;
    }
    onNotify("success", "Staff request approved.");
    await refreshAll(result.nextSession);
  }

  async function handleRevoke(userId: string): Promise<void> {
    if (!session) return;
    if (!window.confirm("Revoke this staff account now?")) return;
    const result = await revokeStaffUserWithRefresh(session, userId);
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to revoke staff access.");
      return;
    }
    onNotify("success", "Staff access revoked.");
    await refreshAll(result.nextSession);
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

  return (
    <div className={cx(styles.pageBody, styles.staffAccessRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / IDENTITY</div>
          <h1 className={styles.pageTitle}>Staff Access</h1>
          <div className={styles.pageSub}>Approve staff registration, track verification, and revoke staff accounts.</div>
        </div>
        <button type="button" onClick={() => session && void refreshAll(session)} disabled={loading || !session} className={cx("btnSm", "btnGhost", loading && "opacity70")}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className={cx("topCardsStack")}>
        {[
          { label: "Pending Approval", value: pendingRequests.toString(), color: pendingRequests > 0 ? "var(--amber)" : "var(--accent)", sub: "Awaiting admin decision" },
          { label: "Approved · Awaiting PIN", value: approvedWaitingVerification.toString(), color: approvedWaitingVerification > 0 ? "var(--accent)" : "var(--muted)", sub: "Not yet verified by staff" },
          { label: "Active Staff Accounts", value: activeStaff.toString(), color: "var(--blue)", sub: "Accounts currently enabled" },
          { label: "Revoked Accounts", value: revokedStaff.toString(), color: revokedStaff > 0 ? "var(--red)" : "var(--muted)", sub: "Disabled access records" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx("statValue", statToneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      {approveModal ? (
        <div className={cx("card", "p18", "mb12", "cardSelected")}>
          <div className={cx("text13", "fw600", "mb8")}>Approve staff request</div>
          <div className={cx("text11", "colorMuted", "mb10")}>Optional notes for this approval:</div>
          <input
            className={styles.formInput}
            placeholder="e.g. Verified via interview on March 8"
            value={approveModal.notes}
            onChange={(e) => setApproveModal((prev) => prev ? { ...prev, notes: e.target.value } : null)}
          />
          <div className={cx("flexRow", "gap8", "mt10")}>
            <button type="button" onClick={() => void handleApproveConfirm()} className={cx("btnSm", "btnAccent")}>Confirm Approval</button>
            <button type="button" onClick={() => setApproveModal(null)} className={cx("btnSm", "btnGhost")}>Cancel</button>
          </div>
        </div>
      ) : null}

      <div className={cx("overflowAuto", "minH0")}>
        <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
          <select title="Select staff access section" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
            {tabs.map((tab) => <option key={tab} value={tab}>{tab}</option>)}
          </select>
          {activeTab === "request queue" ? (
            <select title="Filter by request status" value={requestFilter} onChange={(e) => setRequestFilter(e.target.value as RequestFilter)} className={styles.filterSelect}>
              <option value="all">Request status: All</option>
              <option value="PENDING_ADMIN">Request status: Pending Admin</option>
              <option value="APPROVED">Request status: Approved</option>
              <option value="VERIFIED">Request status: Verified</option>
              <option value="REVOKED">Request status: Revoked</option>
            </select>
          ) : null}
          {activeTab === "staff accounts" ? (
            <select title="Filter by account status" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value as AccountFilter)} className={styles.filterSelect}>
              <option value="all">Account status: All</option>
              <option value="active">Account status: Active</option>
              <option value="revoked">Account status: Revoked</option>
            </select>
          ) : null}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email" className={styles.formInput} />
        </AdminFilterBar>

        {activeTab === "request queue" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("staffReqHead")}>
              {["Staff Email", "Status", "Requested", "Role", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {requestRows.length > 0 ? (
              requestRows.map((request) => (
                <div key={request.id} className={styles.staffReqRow}>
                  <div>
                    <div className={cx("text12", "fw600")}>{request.email}</div>
                    <div className={cx("text10", "colorMuted")}>{request.id}</div>
                  </div>
                  <span className={cx("badge", statusBadgeClass(request.status))}>{statusLabel(request.status)}</span>
                  <span className={cx("text11", "colorMuted")}>{formatDate(request.requestedAt)}</span>
                  <span className={cx("text11", "colorMuted")}>STAFF</span>
                  {request.status === "PENDING_ADMIN" ? (
                    <button type="button" onClick={() => setApproveModal({ requestId: request.id, notes: "" })} className={cx("btnSm", "btnAccent", "wFit")}>Approve</button>
                  ) : (
                    <span className={cx("text10", "colorMuted")}>No action</span>
                  )}
                </div>
              ))
            ) : (
              <div className={cx("p20")}><EmptyState title="No matching staff requests" subtitle="Try clearing filters or check again after new requests are submitted." compact /></div>
            )}
          </div>
        ) : null}

        {activeTab === "staff accounts" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={styles.staffAcctHead}>
              {["Staff Email", "Status", "Created", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {accountRows.length > 0 ? (
              accountRows.map((user) => (
                <div key={user.id} className={cx("staffAcctRow", !user.isActive && "staffRowRevoked")}>
                  <div>
                    <div className={cx("text12", "fw600")}>{user.email}</div>
                    <div className={cx("text10", "colorMuted")}>{user.id}</div>
                  </div>
                  <span className={cx("badge", user.isActive ? "badgeBlue" : "badgeRed")}>{user.isActive ? "Active" : "Revoked"}</span>
                  <span className={cx("text11", "colorMuted")}>{formatDate(user.createdAt)}</span>
                  {user.isActive ? (
                    <button type="button" onClick={() => void handleRevoke(user.id)} className={cx("btnSm", "btnGhost", "wFit")}>Revoke Access</button>
                  ) : (
                    <span className={cx("text10", "colorMuted")}>No action</span>
                  )}
                </div>
              ))
            ) : (
              <div className={cx("p20")}><EmptyState title="No matching staff accounts" subtitle="Try a broader account status filter." compact /></div>
            )}
          </div>
        ) : null}

        {activeTab === "verification queue" ? (
          <div className={cx("grid2")}>
            <div className={cx("card", "p18")}>
              <div className={cx("text12", "colorMuted", "uppercase", "tracking", "mb12")}>Awaiting Verification</div>
              {verificationRows.filter((r) => r.status === "APPROVED").length ? (
                verificationRows.filter((r) => r.status === "APPROVED").map((row) => (
                  <div key={row.id} className={cx("py10", "borderB")}>
                    <div className={cx("text12", "fw600")}>{row.email}</div>
                    <div className={cx("text10", "colorMuted", "mt4")}>Approved {formatDate(row.requestedAt)}</div>
                    <VerificationStepper status={row.status as StaffAccessRequest["status"]} />
                  </div>
                ))
              ) : (
                <EmptyState title="Queue clear" subtitle="No approved requests are waiting for staff verification." compact />
              )}
            </div>
            <div className={cx("card", "p18")}>
              <div className={cx("text12", "colorMuted", "uppercase", "tracking", "mb12")}>Recently Verified</div>
              {verificationRows.filter((r) => r.status === "VERIFIED").length ? (
                verificationRows.filter((r) => r.status === "VERIFIED").slice(0, 12).map((row) => (
                  <div key={row.id} className={cx("py10", "borderB")}>
                    <div className={cx("text12", "fw600")}>{row.email}</div>
                    <div className={cx("text10", "colorMuted", "mt4")}>Verified · Request submitted {formatDate(row.requestedAt)}</div>
                    <VerificationStepper status={row.status as StaffAccessRequest["status"]} />
                  </div>
                ))
              ) : (
                <EmptyState title="No verified events yet" subtitle="Verified staff requests will appear here for follow-up." compact />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "audit trail" ? (
          <div className={cx("card", "p18")}>
            <div className={cx("text12", "colorMuted", "uppercase", "tracking", "mb12")}>Approval Audit Trail</div>
            {auditRows.length > 0 ? (
              auditRows.map((ev, i) => (
                <div key={`${ev.email}-${ev.event}-${i}`} className={cx("py10", "borderB", "flexRow", "gap10")}>
                  <span className={cx("text13", "noShrink", ev.event === "Approved" ? "colorAccent" : ev.event === "Verified" ? "colorBlue" : "colorRed")}>
                    {ev.event === "Approved" ? "✓" : ev.event === "Verified" ? "◆" : "✕"}
                  </span>
                  <div>
                    <div className={cx("text12", "fw600")}>{ev.email}</div>
                    <div className={cx("text10", "colorMuted", "mt2")}>{ev.event} · {formatDate(ev.date)}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No audit events yet" subtitle="Approved, verified, and revoked staff records will appear here." compact />
            )}
          </div>
        ) : null}

      </div>
    </div>
  );
}
