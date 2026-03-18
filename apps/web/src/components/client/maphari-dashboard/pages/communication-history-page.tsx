// ════════════════════════════════════════════════════════════════════════════
// communication-history-page.tsx — Client Communication History
// Data     : loadPortalCommLogsWithRefresh → GET /clients/:id/comms
// Mobile   : filter bar wraps; table scrolls horizontally
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalCommLogsWithRefresh,
  type PortalCommLog
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type CommType = "email" | "meeting" | "message" | "document" | "call" | "other";

interface UiComm {
  id: string;
  type: CommType;
  subject: string;
  date: string;
  from: string;
  action: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toCommType(raw: string): CommType {
  const t = raw.toLowerCase();
  if (t === "email") return "email";
  if (t === "meeting") return "meeting";
  if (t === "message") return "message";
  if (t === "document") return "document";
  if (t === "call" || t === "phone") return "call";
  return "other";
}

function formatDate(raw: string): string {
  return new Date(raw).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapLog(log: PortalCommLog): UiComm {
  return {
    id: log.id,
    type: toCommType(log.type),
    subject: log.subject,
    date: formatDate(log.occurredAt),
    from: log.fromName ?? "Maphari Team",
    action: log.actionLabel ?? "View"
  };
}

// ── Static config ─────────────────────────────────────────────────────────────
const typeIcons: Record<CommType, string> = {
  email: "✉",
  meeting: "◷",
  message: "◎",
  document: "⊡",
  call: "⌕",
  other: "•"
};

function typeBadge(t: CommType) {
  if (t === "email") return "badgeAccent";
  if (t === "meeting") return "badgeAmber";
  if (t === "call") return "badgeGreen";
  if (t === "document") return "badgeMuted";
  return "badgeMuted";
}

const filters: Array<"all" | CommType> = ["all", "email", "meeting", "message", "document", "call"];

// ── Component ─────────────────────────────────────────────────────────────────
export function CommunicationHistoryPage() {
  const { session } = useProjectLayer();
  const [commHistory, setCommHistory] = useState<UiComm[]>([]);
  const [filter, setFilter] = useState<"all" | CommType>("all");

  useEffect(() => {
    if (!session) return;
    loadPortalCommLogsWithRefresh(session, session.user.clientId ?? "").then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setCommHistory(result.data.map(mapLog));
    });
  }, [session]);

  const messagesCount = commHistory.filter((c) => c.type === "message" || c.type === "email").length;
  const meetingsCount = commHistory.filter((c) => c.type === "meeting" || c.type === "call").length;
  const docsCount = commHistory.filter((c) => c.type === "document").length;
  const filtered = filter === "all" ? commHistory : commHistory.filter((c) => c.type === filter);

  return (
    <div className={cx("pageBody")}>
      {/* ── Header ── */}
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>COMMUNICATION</div>
          <h1 className={cx("pageTitle")}>Communication History</h1>
          <div className={cx("pageSub")}>A complete log of all interactions between you and your Maphari team</div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className={cx("cohKpiRow")}>
        {[
          { label: "Messages & Emails", value: String(messagesCount), sub: "This month" },
          { label: "Meetings & Calls", value: String(meetingsCount), sub: "Sessions held" },
          { label: "Documents Shared", value: String(docsCount), sub: "Files exchanged" },
          { label: "Total Interactions", value: String(commHistory.length), sub: "All time" },
        ].map((k) => (
          <div key={k.label} className={cx("cohKpiCard")}>
            <div className={cx("cohKpiLabel")}>{k.label}</div>
            <div className={cx("cohKpiValue")}>{k.value}</div>
            <div className={cx("cohKpiMeta")}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className={cx("card", "p12", "flexRow", "gap8", "flexWrap", "mb4")}>
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={cx("btnSm", filter === f ? "btnAccent" : "btnGhost")}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Timeline list ── */}
      <div className={cx("card", "overflowHidden")}>
        <div className={cx("cohHead")}>
          {["Type", "Subject", "Date", "From", "Action"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="message" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No communication logs</div>
            <div className={cx("emptyStateSub")}>All emails, meetings, calls and documents shared with your team will appear here.</div>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className={cx("cohRow")}>
              <div className={cx("flexRow", "gap8", "alignCenter")}>
                <span className={cx("cohIcon")}>{typeIcons[item.type]}</span>
                <span className={cx("badge", typeBadge(item.type))}>{item.type}</span>
              </div>
              <span className={cx("fw600", "text13")}>{item.subject}</span>
              <span className={cx("fontMono", "text12")}>{item.date}</span>
              <span className={cx("text12", "colorMuted")}>{item.from}</span>
              <button type="button" className={cx("btnSm", "btnGhost")}>{item.action}</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
