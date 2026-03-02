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

const tabs = ["request queue", "staff accounts", "verification queue"] as const;
type Tab = (typeof tabs)[number];

type RequestFilter = "all" | "PENDING_ADMIN" | "APPROVED" | "VERIFIED" | "REVOKED";
type AccountFilter = "all" | "active" | "revoked";

function statusBadgeClass(status: StaffAccessRequest["status"]): string {
  switch (status) {
    case "PENDING_ADMIN":
      return "badgeAmber";
    case "APPROVED":
      return "badgePurple";
    case "VERIFIED":
      return "badgeBlue";
    case "REVOKED":
      return "badgeRed";
    default:
      return "badgeMuted";
  }
}

function statusLabel(status: StaffAccessRequest["status"]): string {
  switch (status) {
    case "PENDING_ADMIN":
      return "Pending Admin";
    case "APPROVED":
      return "Approved";
    case "VERIFIED":
      return "Verified";
    case "REVOKED":
      return "Revoked";
    default:
      return status;
  }
}

export function StaffAccessPage({ session, onNotify }: StaffAccessPageProps) {
  const [requests, setRequests] = useState<StaffAccessRequest[]>([]);
  const [users, setUsers] = useState<StaffAccessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("request queue");

  const [requestFilter, setRequestFilter] = useState<RequestFilter>("all");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [query, setQuery] = useState("");
  const previousPendingRef = useRef(0);

  const statToneClass = (color: string): string => {
    if (color === "var(--red)") return "colorRed";
    if (color === "var(--amber)") return "colorAmber";
    if (color === "var(--blue)") return "colorBlue";
    if (color === "var(--purple)") return "colorPurple";
    if (color === "var(--muted)") return "colorMuted";
    return "colorAccent";
  };

  const pendingRequests = useMemo(() => requests.filter((item) => item.status === "PENDING_ADMIN").length, [requests]);
  const approvedWaitingVerification = useMemo(() => requests.filter((item) => item.status === "APPROVED").length, [requests]);
  const activeStaff = useMemo(() => users.filter((item) => item.isActive).length, [users]);
  const revokedStaff = useMemo(() => users.filter((item) => !item.isActive).length, [users]);

  const refreshAll = useCallback(
    async (currentSession: AuthSession) => {
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
    },
    [onNotify]
  );

  useEffect(() => {
    if (!session) return;
    const timeoutId = window.setTimeout(() => {
      void refreshAll(session);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshAll, session]);

  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => {
      void refreshAll(session);
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [refreshAll, session]);

  useEffect(() => {
    if (pendingRequests > previousPendingRef.current) {
      onNotify("success", "New staff request received.");
    }
    previousPendingRef.current = pendingRequests;
  }, [onNotify, pendingRequests]);

  const normalizedQuery = query.trim().toLowerCase();

  const requestRows = useMemo(() => {
    return requests
      .filter((item) => (requestFilter === "all" ? true : item.status === requestFilter))
      .filter((item) => (normalizedQuery ? item.email.toLowerCase().includes(normalizedQuery) : true))
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [normalizedQuery, requestFilter, requests]);

  const accountRows = useMemo(() => {
    return users
      .filter((item) => {
        if (accountFilter === "all") return true;
        return accountFilter === "active" ? item.isActive : !item.isActive;
      })
      .filter((item) => (normalizedQuery ? item.email.toLowerCase().includes(normalizedQuery) : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [accountFilter, normalizedQuery, users]);

  const verificationRows = useMemo(() => {
    return requests
      .filter((item) => item.status === "APPROVED" || item.status === "VERIFIED")
      .filter((item) => (normalizedQuery ? item.email.toLowerCase().includes(normalizedQuery) : true))
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [normalizedQuery, requests]);

  async function handleApprove(requestId: string): Promise<void> {
    if (!session) return;
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
    const confirm = window.confirm("Revoke this staff account now?");
    if (!confirm) return;
    const result = await revokeStaffUserWithRefresh(session, userId);
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to revoke staff access.");
      return;
    }
    onNotify("success", "Staff access revoked.");
    await refreshAll(result.nextSession);
  }

  return (
    <div className={cx(styles.pageBody, styles.staffAccessRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / IDENTITY</div>
          <h1 className={styles.pageTitle}>Staff Access</h1>
          <div className={styles.pageSub}>Approve staff registration, track verification, and revoke staff accounts.</div>
        </div>
        <button
          type="button"
          onClick={() => session && void refreshAll(session)}
          disabled={loading || !session}
          className={cx("btnSm", "btnGhost", loading && "opacity70")}
        >
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

      <div className={cx("overflowAuto", "minH0")}>
        <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
          <select
            title="Select staff access section"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as Tab)}
            className={styles.filterSelect}
          >
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
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

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email"
            className={styles.formInput}
          />
        </AdminFilterBar>

        {activeTab === "request queue" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("staffReqHead")}>
              {["Staff Email", "Status", "PIN", "Requested", "Action"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {requestRows.length > 0 ? (
              requestRows.map((request, i) => (
                <div key={request.id} className={styles.staffReqRow}>
                  <div>
                    <div className={cx("text12", "fw600")}>{request.email}</div>
                    <div className={cx("text10", "colorMuted")}>{request.id}</div>
                  </div>
                  <span className={cx("badge", statusBadgeClass(request.status))}>{statusLabel(request.status)}</span>
                  <span className={cx("fontMono", "text12", request.pin ? "colorText" : "colorMuted")}>{request.pin || "-"}</span>
                  <span className={cx("text11", "colorMuted")}>{formatDate(request.requestedAt)}</span>
                  {request.status === "PENDING_ADMIN" ? (
                    <button type="button" onClick={() => void handleApprove(request.id)} className={cx("btnSm", "btnAccent", "wFit")}>
                      Approve
                    </button>
                  ) : (
                    <span className={cx("text10", "colorMuted")}>No action</span>
                  )}
                </div>
              ))
            ) : (
              <div className={cx("p20")}>
                <EmptyState title="No matching staff requests" subtitle="Try clearing filters or check again after new requests are submitted." compact />
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "staff accounts" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={styles.staffAcctHead}>
              {["Staff Email", "Status", "Created", "Action"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {accountRows.length > 0 ? (
              accountRows.map((user, i) => (
                <div key={user.id} className={cx("staffAcctRow", !user.isActive && "staffRowRevoked")}>
                  <div>
                    <div className={cx("text12", "fw600")}>{user.email}</div>
                    <div className={cx("text10", "colorMuted")}>{user.id}</div>
                  </div>
                  <span className={cx("badge", user.isActive ? "badgeBlue" : "badgeRed")}>
                    {user.isActive ? "Active" : "Revoked"}
                  </span>
                  <span className={cx("text11", "colorMuted")}>{formatDate(user.createdAt)}</span>
                  {user.isActive ? (
                    <button type="button" onClick={() => void handleRevoke(user.id)} className={cx("btnSm", "btnGhost", "wFit")}>
                      Revoke Access
                    </button>
                  ) : (
                    <span className={cx("text10", "colorMuted")}>No action</span>
                  )}
                </div>
              ))
            ) : (
              <div className={cx("p20")}>
                <EmptyState title="No matching staff accounts" subtitle="Try a broader account status filter." compact />
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "verification queue" ? (
          <div className={cx("grid2")}>
            <div className={cx("card", "p18")}>
              <div className={cx("text12", "colorMuted", "uppercase", "tracking", "mb12")}>Awaiting Verification</div>
              {verificationRows.filter((r) => r.status === "APPROVED").length ? (
                verificationRows
                  .filter((r) => r.status === "APPROVED")
                  .map((row) => (
                    <div key={row.id} className={cx("py10", "borderB")}>
                      <div className={cx("text12", "fw600")}>{row.email}</div>
                      <div className={cx("text10", "colorMuted", "mt4")}>PIN {row.pin || "-"} · Approved {formatDate(row.requestedAt)}</div>
                    </div>
                  ))
              ) : (
                <EmptyState title="Queue clear" subtitle="No approved requests are waiting for staff verification." compact />
              )}
            </div>

            <div className={cx("card", "p18")}>
              <div className={cx("text12", "colorMuted", "uppercase", "tracking", "mb12")}>Recently Verified</div>
              {verificationRows.filter((r) => r.status === "VERIFIED").length ? (
                verificationRows
                  .filter((r) => r.status === "VERIFIED")
                  .slice(0, 12)
                  .map((row) => (
                    <div key={row.id} className={cx("py10", "borderB")}>
                      <div className={cx("text12", "fw600")}>{row.email}</div>
                      <div className={cx("text10", "colorMuted", "mt4")}>Verified · Request submitted {formatDate(row.requestedAt)}</div>
                    </div>
                  ))
              ) : (
                <EmptyState title="No verified events yet" subtitle="Verified staff requests will appear here for follow-up." compact />
              )}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className={cx("mt12", "text12", "colorMuted", "fontMono")}>Refreshing staff access data...</div>
        ) : null}
      </div>
    </div>
  );
}
