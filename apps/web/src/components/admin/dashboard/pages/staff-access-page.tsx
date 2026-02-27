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
import { AdminFilterBar, AdminTabs, EmptyState, formatDate } from "./shared";

type StaffAccessPageProps = {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
};

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

const tabs = ["request queue", "staff accounts", "verification queue"] as const;
type Tab = (typeof tabs)[number];

type RequestFilter = "all" | "PENDING_ADMIN" | "APPROVED" | "VERIFIED" | "REVOKED";
type AccountFilter = "all" | "active" | "revoked";

function statusBadge(status: StaffAccessRequest["status"]): { label: string; color: string; bg: string } {
  switch (status) {
    case "PENDING_ADMIN":
      return { label: "Pending Admin", color: C.amber, bg: `${C.amber}15` };
    case "APPROVED":
      return { label: "Approved", color: C.primary, bg: `${C.primary}15` };
    case "VERIFIED":
      return { label: "Verified", color: C.blue, bg: `${C.blue}15` };
    case "REVOKED":
      return { label: "Revoked", color: C.red, bg: `${C.red}15` };
    default:
      return { label: status, color: C.muted, bg: `${C.muted}15` };
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
    <div
      style={{
        background: C.bg,
        height: "100%",
        fontFamily: "Syne, sans-serif",
        color: C.text,
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / IDENTITY</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Staff Access</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Approve staff registration, track verification, and revoke staff accounts.</div>
        </div>
        <button
          type="button"
          onClick={() => session && void refreshAll(session)}
          disabled={loading || !session}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            color: C.text,
            padding: "8px 14px",
            fontSize: 12,
            fontFamily: "DM Mono, monospace",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Pending Approval", value: pendingRequests.toString(), color: pendingRequests > 0 ? C.amber : C.primary, sub: "Awaiting admin decision" },
          { label: "Approved · Awaiting PIN", value: approvedWaitingVerification.toString(), color: approvedWaitingVerification > 0 ? C.primary : C.muted, sub: "Not yet verified by staff" },
          { label: "Active Staff Accounts", value: activeStaff.toString(), color: C.blue, sub: "Accounts currently enabled" },
          { label: "Revoked Accounts", value: revokedStaff.toString(), color: revokedStaff > 0 ? C.red : C.muted, sub: "Disabled access records" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.primary}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      <div style={{ overflow: "auto", minHeight: 0 }}>
        <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Filters</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {activeTab === "request queue" ? (
              <select value={requestFilter} onChange={(e) => setRequestFilter(e.target.value as RequestFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="all">Request status: All</option>
                <option value="PENDING_ADMIN">Request status: Pending Admin</option>
                <option value="APPROVED">Request status: Approved</option>
                <option value="VERIFIED">Request status: Verified</option>
                <option value="REVOKED">Request status: Revoked</option>
              </select>
            ) : null}

            {activeTab === "staff accounts" ? (
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value as AccountFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="all">Account status: All</option>
                <option value="active">Account status: Active</option>
                <option value="revoked">Account status: Revoked</option>
              </select>
            ) : null}

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email"
              style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", minWidth: 220, fontFamily: "DM Mono, monospace", fontSize: 12 }}
            />
            {(query || requestFilter !== "all" || accountFilter !== "all") ? (
              <button
                onClick={() => {
                  setQuery("");
                  setRequestFilter("all");
                  setAccountFilter("all");
                }}
                style={{ background: C.border, border: "none", color: C.text, padding: "8px 10px", fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </AdminFilterBar>

        {activeTab === "request queue" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 120px 120px 160px 120px", padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 12 }}>
              {[
                "Staff Email",
                "Status",
                "PIN",
                "Requested",
                "Action"
              ].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {requestRows.length > 0 ? (
              requestRows.map((request, i) => {
                const badge = statusBadge(request.status);
                return (
                  <div key={request.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 120px 120px 160px 120px", padding: "13px 20px", borderBottom: i < requestRows.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{request.email}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{request.id}</div>
                    </div>
                    <span style={{ fontSize: 10, color: badge.color, background: badge.bg, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>{badge.label}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: request.pin ? C.text : C.muted, fontSize: 12 }}>{request.pin || "-"}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{formatDate(request.requestedAt)}</span>
                    {request.status === "PENDING_ADMIN" ? (
                      <button type="button" onClick={() => void handleApprove(request.id)} style={{ background: C.primary, color: C.bg, border: "none", padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", width: "fit-content" }}>
                        Approve
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, color: C.muted }}>No action</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 20 }}>
                <EmptyState title="No matching staff requests" subtitle="Try clearing filters or check again after new requests are submitted." compact />
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "staff accounts" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 120px 180px 140px", padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 12 }}>
              {["Staff Email", "Status", "Created", "Action"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {accountRows.length > 0 ? (
              accountRows.map((user, i) => (
                <div key={user.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 120px 180px 140px", padding: "13px 20px", borderBottom: i < accountRows.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12, background: user.isActive ? "transparent" : "#1a0a0a" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{user.email}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{user.id}</div>
                  </div>
                  <span style={{ fontSize: 10, color: user.isActive ? C.blue : C.red, background: user.isActive ? `${C.blue}15` : `${C.red}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>
                    {user.isActive ? "Active" : "Revoked"}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>{formatDate(user.createdAt)}</span>
                  {user.isActive ? (
                    <button type="button" onClick={() => void handleRevoke(user.id)} style={{ background: C.border, color: C.text, border: "none", padding: "6px 10px", fontSize: 11, cursor: "pointer", width: "fit-content" }}>
                      Revoke Access
                    </button>
                  ) : (
                    <span style={{ fontSize: 10, color: C.muted }}>No action</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: 20 }}>
                <EmptyState title="No matching staff accounts" subtitle="Try a broader account status filter." compact />
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "verification queue" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Awaiting Verification</div>
              {verificationRows.filter((r) => r.status === "APPROVED").length ? (
                verificationRows
                  .filter((r) => r.status === "APPROVED")
                  .map((row) => (
                    <div key={row.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{row.email}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>PIN {row.pin || "-"} · Approved {formatDate(row.requestedAt)}</div>
                    </div>
                  ))
              ) : (
                <EmptyState title="Queue clear" subtitle="No approved requests are waiting for staff verification." compact />
              )}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Recently Verified</div>
              {verificationRows.filter((r) => r.status === "VERIFIED").length ? (
                verificationRows
                  .filter((r) => r.status === "VERIFIED")
                  .slice(0, 12)
                  .map((row) => (
                    <div key={row.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{row.email}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Verified · Request submitted {formatDate(row.requestedAt)}</div>
                    </div>
                  ))
              ) : (
                <EmptyState title="No verified events yet" subtitle="Verified staff requests will appear here for follow-up." compact />
              )}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted, fontFamily: "DM Mono, monospace" }}>Refreshing staff access data...</div>
        ) : null}
      </div>
    </div>
  );
}
