// ════════════════════════════════════════════════════════════════════════════
// change-requests-page.tsx — Staff Change Requests
// Data     : getStaffChangeRequests → GET /change-requests
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffChangeRequests, type StaffChangeRequest } from "../../../../lib/api/staff";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function priorityBadge(status: StaffChangeRequest["status"]): string {
  if (status === "ADMIN_REJECTED" || status === "CLIENT_REJECTED") return "badgeRed";
  if (status === "SUBMITTED") return "badgeAmber";
  if (status === "ESTIMATED" || status === "ADMIN_APPROVED") return "badgeMuted";
  if (status === "CLIENT_APPROVED") return "badgeGreen";
  return "badgeMuted";
}

function statusLabel(status: StaffChangeRequest["status"]): string {
  switch (status) {
    case "DRAFT":            return "draft";
    case "SUBMITTED":        return "open";
    case "ESTIMATED":        return "in review";
    case "ADMIN_APPROVED":   return "approved";
    case "ADMIN_REJECTED":   return "rejected";
    case "CLIENT_APPROVED":  return "approved";
    case "CLIENT_REJECTED":  return "rejected";
    default:                 return "open";
  }
}

type Tab = "open" | "in review" | "completed";
const tabs: Tab[] = ["open", "in review", "completed"];

// ── Component ─────────────────────────────────────────────────────────────────

export function ChangeRequestsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [requests, setRequests] = useState<StaffChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("open");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    getStaffChangeRequests(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setRequests(r.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [session]);

  const openCount      = requests.filter((r) => r.status === "SUBMITTED").length;
  const reviewCount    = requests.filter((r) => r.status === "ESTIMATED" || r.status === "ADMIN_APPROVED").length;
  const completedCount = requests.filter(
    (r) => r.status === "CLIENT_APPROVED" || r.status === "ADMIN_REJECTED" || r.status === "CLIENT_REJECTED"
  ).length;
  const totalCount     = requests.length;

  const filtered = requests.filter((r) => {
    if (activeTab === "open")       return r.status === "SUBMITTED" || r.status === "DRAFT";
    if (activeTab === "in review")  return r.status === "ESTIMATED" || r.status === "ADMIN_APPROVED";
    return (
      r.status === "CLIENT_APPROVED" ||
      r.status === "ADMIN_REJECTED"  ||
      r.status === "CLIENT_REJECTED"
    );
  });

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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-change-requests">
      {/* ── Header ── */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Change Requests</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Track client change requests assigned to you and your team</p>
      </div>

      {/* ── KPI row ── */}
      <div className={cx("grid4", "gap14", "mb4")}>
        {[
          { label: "Open Requests",   value: String(openCount),      sub: "Awaiting action"  },
          { label: "In Review",       value: String(reviewCount),    sub: "Estimated or approved" },
          { label: "Completed",       value: String(completedCount), sub: "Resolved"         },
          { label: "Total",           value: String(totalCount),     sub: "All time"         },
        ].map((k) => (
          <div key={k.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{k.label}</div>
            <div className={cx("statValue")}>{k.value}</div>
            <div className={cx("statMeta")}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className={cx("card", "p14", "flexRow", "gap8", "mb4")}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={cx("btnSm", activeTab === t ? "btnAccent" : "btnGhost")}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={cx("card", "overflowHidden")}>
        <div className={cx("scrHead")}>
          {["Request", "Project", "Requested By", "Requested", "Status"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No change requests in this view.</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className={cx("scrRow")}>
              <span className={cx("fw600", "text13")}>{r.title}</span>
              <span className={cx("text12", "colorMuted")}>{r.projectId.slice(0, 8)}</span>
              <span className={cx("text12", "colorMuted")}>{r.requestedByName ?? "—"}</span>
              <span className={cx("fontMono", "text12")}>{formatDate(r.requestedAt)}</span>
              <span className={cx("badge", priorityBadge(r.status))}>{statusLabel(r.status)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
