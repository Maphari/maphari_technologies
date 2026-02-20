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
import styles from "../../../../app/style/maphari-dashboard.module.css";
import { EmptyState, formatDate } from "./shared";

type StaffAccessPageProps = {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
};

export function StaffAccessPage({ session, onNotify }: StaffAccessPageProps) {
  const [requests, setRequests] = useState<StaffAccessRequest[]>([]);
  const [users, setUsers] = useState<StaffAccessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const previousPendingRef = useRef(0);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === "PENDING_ADMIN").length,
    [requests]
  );
  const approvedWaitingVerification = useMemo(
    () => requests.filter((item) => item.status === "APPROVED").length,
    [requests]
  );
  const activeStaff = useMemo(
    () => users.filter((item) => item.isActive).length,
    [users]
  );

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
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Access Control</div>
          <div className={styles.projName}>Staff Access</div>
          <div className={styles.projMeta}>Approve staff registration requests, share verification PINs, and revoke access instantly.</div>
        </div>
        <button
          type="button"
          className={`${styles.btnSm} ${styles.btnGhost}`}
          onClick={() => session && void refreshAll(session)}
          disabled={loading || !session}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols3}`}>
        <div className={`${styles.statCard} ${styles.amber}`}>
          <div className={styles.statLabel}>Pending Approval</div>
          <div className={styles.statValue}>{pendingRequests}</div>
          <div className={styles.statDelta}>Awaiting admin decision</div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Approved · Waiting PIN</div>
          <div className={styles.statValue}>{approvedWaitingVerification}</div>
          <div className={styles.statDelta}>Staff must verify PIN</div>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Active Staff</div>
          <div className={styles.statValue}>{activeStaff}</div>
          <div className={styles.statDelta}>Current enabled staff accounts</div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Staff Requests</span></div>
          <table className={styles.projTable}>
            <thead>
              <tr><th>Email</th><th>Status</th><th>PIN</th><th>Requested</th><th>Action</th></tr>
            </thead>
            <tbody>
              {requests.length > 0 ? requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.email}</td>
                  <td>
                    <span className={`${styles.badge} ${request.status === "PENDING_ADMIN" ? styles.badgeAmber : request.status === "VERIFIED" ? styles.badgeGreen : request.status === "REVOKED" ? styles.badgeRed : styles.badgeBlue}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className={styles.metaMono}>{request.pin}</td>
                  <td>{formatDate(request.requestedAt)}</td>
                  <td>
                    {request.status === "PENDING_ADMIN" ? (
                      <button type="button" className={`${styles.btnSm} ${styles.btnAccent} ${styles.btnInline}`} onClick={() => void handleApprove(request.id)}>
                        Approve
                      </button>
                    ) : (
                      <span className={styles.cellSub}>No action</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No staff requests" subtitle="Staff registration requests appear here once submitted." compact /></td></tr>
              )}
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Staff Accounts</span></div>
          <table className={styles.projTable}>
            <thead>
              <tr><th>Email</th><th>Status</th><th>Created</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.badge} ${user.isActive ? styles.badgeGreen : styles.badgeRed}`}>
                      {user.isActive ? "ACTIVE" : "REVOKED"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    {user.isActive ? (
                      <button type="button" className={`${styles.btnSm} ${styles.btnGhost} ${styles.btnInline}`} onClick={() => void handleRevoke(user.id)}>
                        Revoke Access
                      </button>
                    ) : (
                      <span className={styles.cellSub}>No action</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No staff users" subtitle="Verified staff accounts appear here." compact /></td></tr>
              )}
            </tbody>
          </table>
        </article>
      </div>

      {loading ? <div className={styles.loading}>Refreshing staff access data…</div> : null}
    </div>
  );
}
