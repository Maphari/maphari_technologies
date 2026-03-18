"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllCommLogsWithRefresh, type AdminCommunicationLog } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

type CommType  = "email" | "call" | "meeting" | "slack";
type Direction = "inbound" | "outbound";
type Sentiment = "positive" | "neutral" | "negative";
type Tab       = "all comms" | "flagged" | "by client" | "analytics";

type CommItem = {
  id: string;
  client: string;
  clientColor: string;
  type: CommType;
  direction: Direction;
  from: string;
  to: string;
  subject: string;
  date: string;
  time: string;
  snippet: string;
  read: boolean;
  flagged: boolean;
  sentiment: Sentiment;
  duration?: string;
};

const typeConfig: Record<CommType, { icon: string; color: string; label: string }> = {
  email:   { icon: "✉",  color: "var(--blue)",   label: "Email"   },
  call:    { icon: "📞", color: "var(--accent)", label: "Call"    },
  meeting: { icon: "🤝", color: "var(--accent)", label: "Meeting" },
  slack:   { icon: "💬", color: "var(--amber)",  label: "Slack"   },
};

const sentimentConfig: Record<Sentiment, { color: string; icon: string }> = {
  positive: { color: "var(--accent)", icon: "▲" },
  neutral:  { color: "var(--muted)",  icon: "→" },
  negative: { color: "var(--red)",    icon: "▼" },
};

const tabs: Tab[] = ["all comms", "flagged", "by client", "analytics"];

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

function normaliseType(t: string): CommType {
  const l = t.toLowerCase();
  if (l.includes("email")) return "email";
  if (l.includes("call"))  return "call";
  if (l.includes("meet"))  return "meeting";
  if (l.includes("slack")) return "slack";
  return "email";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function mapLog(log: AdminCommunicationLog, clientName: string, clientColor: string): CommItem {
  return {
    id:          log.id,
    client:      clientName,
    clientColor,
    type:        normaliseType(log.type),
    direction:   (log.direction.toLowerCase() as Direction) === "inbound" ? "inbound" : "outbound",
    from:        log.fromName ?? "Maphari",
    to:          clientName,
    subject:     log.subject,
    date:        fmtDate(log.occurredAt),
    time:        fmtTime(log.occurredAt),
    snippet:     log.actionLabel ?? "",
    read:        true,
    flagged:     false,
    sentiment:   "neutral",
  };
}

export function CommunicationAuditPage({ session }: { session: AuthSession | null }) {
  const [commsLog, setCommsLog]     = useState<CommItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>("all comms");
  const [filterClient, setFilterClient] = useState("All");
  const [filterType, setFilterType]     = useState<"All" | CommType>("All");
  const [selectedComm, setSelectedComm] = useState<CommItem | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [logRes, snapRes] = await Promise.all([
        loadAllCommLogsWithRefresh(session),
        loadAdminSnapshotWithRefresh(session),
      ]);
      if (cancelled) return;
      if (logRes.nextSession)        saveSession(logRes.nextSession);
      else if (snapRes.nextSession)  saveSession(snapRes.nextSession);
      // Build client color map (by index for consistency)
      const clients     = snapRes.data?.clients ?? [];
      const clientColorMap = new Map<string, { name: string; color: string }>(
        clients.map((c, i) => [c.id, { name: c.name, color: CLIENT_COLORS[i % CLIENT_COLORS.length] }])
      );
      setCommsLog(
        (logRes.data ?? []).map(l => {
          const info = clientColorMap.get(l.clientId);
          return mapLog(l, info?.name ?? "Client", info?.color ?? "var(--accent)");
        })
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const clientNames = ["All", ...new Set(commsLog.map(c => c.client))];
  const types: Array<"All" | CommType> = ["All", "email", "call", "meeting"];

  const filtered = commsLog
    .filter(c => filterClient === "All" || c.client === filterClient)
    .filter(c => filterType === "All" || c.type === filterType);

  const flagged     = commsLog.filter(c => c.flagged);
  const negSentiment = commsLog.filter(c => c.sentiment === "negative");
  const todayStr    = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const totalToday  = commsLog.filter(c => c.date === todayStr).length;

  if (loading) {
    return (
      <div className={styles.pageBody}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Loading communications…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Communication Audit</h1>
          <div className={styles.pageSub}>Cross-portfolio comms log — Flagged items — Sentiment analysis</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Communication</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Comms (7d)",      value: commsLog.length.toString(),   color: "var(--blue)",   sub: `${totalToday} today`           },
          { label: "Flagged Items",          value: flagged.length.toString(),    color: flagged.length > 0 ? "var(--red)" : "var(--accent)", sub: "Require follow-up" },
          { label: "Negative Sentiment",     value: negSentiment.length.toString(), color: negSentiment.length > 0 ? "var(--amber)" : "var(--accent)", sub: "In last 7 days" },
          { label: "Silent Clients (5d+)",   value: "0",                          color: "var(--muted)",  sub: "No silent clients"             },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.commToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "all comms" && (
          <>
            <select title="Filter by client" value={filterClient} onChange={e => setFilterClient(e.target.value)} className={styles.filterSelect}>
              {clientNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select title="Filter by type" value={filterType} onChange={e => setFilterType(e.target.value as "All" | CommType)} className={styles.filterSelect}>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </>
        )}
      </div>

      {(activeTab === "all comms" || activeTab === "flagged") && (
        <div>
          <div className={cx(styles.commDetailSplit, selectedComm ? styles.commDetailSplitOpen : styles.commDetailSplitClosed)}>
            <div className={cx("flexCol", "gap8")}>
              {(activeTab === "flagged" ? flagged : filtered).length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateTitle")}>
                    {activeTab === "flagged" ? "No flagged communications" : "No communication logs"}
                  </div>
                  <p className={cx("emptyStateSub")}>
                    {activeTab === "flagged"
                      ? "Flagged items will appear here."
                      : "Communication logs will appear here once recorded."}
                  </p>
                </div>
              ) : (activeTab === "flagged" ? flagged : filtered).map(comm => {
                const tc         = typeConfig[comm.type];
                const sc         = sentimentConfig[comm.sentiment];
                const isSelected = selectedComm?.id === comm.id;
                return (
                  <div
                    key={comm.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedComm(isSelected ? null : comm)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedComm(isSelected ? null : comm); } }}
                    className={cx("card", "p16", "pointerCursor", "interactiveCard", isSelected && styles.commCardSelected, !isSelected && comm.flagged && styles.commCardFlagged)}
                  >
                    <div className={styles.commRow}>
                      <span className={styles.commTypeIcon}>{tc.icon}</span>
                      <div>
                        <div className={cx("fw600", "text13", styles.commToneText, toneClass(comm.clientColor))}>{comm.client}</div>
                        <div className={cx("text10", "colorMuted")}>{comm.from}</div>
                      </div>
                      <div>
                        <div className={cx("fw600", "text13", "mb3")}>{comm.subject}</div>
                        <div className={cx("text11", "colorMuted", "truncate")}>{comm.snippet}</div>
                      </div>
                      <span className={cx("text11", "fontMono", "colorMuted", "textRight")}>{comm.date}</span>
                      <span className={cx("text10", "textCenter", styles.commTypeBadge, styles.commToneText, toneClass(tc.color))}>{tc.label}</span>
                      <span className={cx("textCenter", styles.commSentIcon, styles.commToneText, toneClass(sc.color))}>{sc.icon}</span>
                      {comm.flagged ? <span className={cx("text12", "colorRed", "textCenter")}>🚩</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedComm && (
              <div className={cx("card", "p24", styles.commSticky)}>
                <div className={cx("flexBetween", "mb16")}>
                  <div className={cx("text11", "colorMuted", "fontMono")}>{selectedComm.id.slice(0, 8)}</div>
                  {selectedComm.flagged ? <span className={cx("text11", "colorRed")}>🚩 Flagged</span> : null}
                </div>
                <div className={cx("fw800", "mb4", styles.commTitle16)}>{selectedComm.subject}</div>
                <div className={cx("text12", "mb16", styles.commToneText, toneClass(selectedComm.clientColor))}>{selectedComm.client}</div>
                <div className={cx("flexCol", "gap8", "mb16")}>
                  {[
                    { label: "From",      value: selectedComm.from },
                    { label: "To",        value: selectedComm.to   },
                    { label: "Date",      value: `${selectedComm.date} ${selectedComm.time}` },
                    { label: "Type",      value: typeConfig[selectedComm.type].label },
                    { label: "Sentiment", value: selectedComm.sentiment },
                  ].map(f => (
                    <div key={f.label} className={cx("flexBetween", "text12")}>
                      <span className={cx("colorMuted")}>{f.label}</span>
                      <span className={cx("fw600")}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className={cx("bgBg", "p14", "text13", "mb16", styles.commSnippet)}>{selectedComm.snippet || "—"}</div>
                <div className={cx("flexRow", "gap8")}>
                  <button type="button" className={cx("btnSm", "btnAccent", styles.commFlex1)}>Reply</button>
                  <button type="button" className={cx("btnSm", "btnGhost", styles.commFlex1)}>{selectedComm.flagged ? "Unflag" : "Flag"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "by client" && (
        <div className={cx("grid2")}>
          {[...new Set(commsLog.map(c => c.client))].length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateTitle")}>No communication data</div>
            </div>
          ) : [...new Set(commsLog.map(c => c.client))].map(client => {
            const clientComms = commsLog.filter(c => c.client === client);
            const color       = commsLog.find(c => c.client === client)?.clientColor ?? "var(--accent)";
            const lastComm    = clientComms[0];
            const neg         = clientComms.filter(c => c.sentiment === "negative").length;
            return (
              <div key={client} className={cx("card", "p24", styles.commToneBorder, toneClass(color))}>
                <div className={cx("flexBetween", "mb16")}>
                  <div className={cx("fw700", styles.commToneText, styles.commTitle15, toneClass(color))}>{client}</div>
                  <div className={cx("fontMono", "fw800", "colorBlue", styles.commValue22)}>{clientComms.length}</div>
                </div>
                <div className={cx("grid3", "mb16")}>
                  {(["email", "call", "meeting"] as const).map(type => {
                    const count = clientComms.filter(c => c.type === type).length;
                    return (
                      <div key={type} className={cx("bgBg", "p10", "textCenter", styles.commRounded6)}>
                        <div className={styles.commTypeIcon}>{typeConfig[type].icon}</div>
                        <div className={cx("fontMono", "fw700", styles.commToneText, toneClass(typeConfig[type].color))}>{count}</div>
                        <div className={cx("textXs", "colorMuted")}>{typeConfig[type].label}</div>
                      </div>
                    );
                  })}
                </div>
                {lastComm && (
                  <div className={cx("bgBg", "p12", styles.commRounded8)}>
                    <div className={cx("text10", "colorMuted", "mb4")}>Last: {lastComm.date} — {lastComm.time}</div>
                    <div className={cx("text12", "fw600")}>{lastComm.subject}</div>
                    {neg > 0 ? <div className={cx("text11", "colorRed", "mt4")}>⚠ {neg} negative sentiment flagged</div> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Comms by Type</div>
            {Object.entries(typeConfig).map(([type, cfg]) => {
              const count = commsLog.filter(c => c.type === type).length;
              return (
                <div key={type} className={cx("flexRow", "gap12", "mb14")}>
                  <span className={styles.commTypeIconFixed}>{cfg.icon}</span>
                  <span className={cx("text13", styles.commFlex1)}>{cfg.label}</span>
                  <progress className={cx(styles.commProgressSm, styles.commBarFillTone, toneClass(cfg.color))} max={Math.max(commsLog.length, 1)} value={count} aria-label={`${cfg.label} communications ${count}`} />
                  <span className={cx("fontMono", "fw700", styles.commToneText, styles.commW20, toneClass(cfg.color))}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Sentiment Breakdown</div>
            {(["positive", "neutral", "negative"] as const).map(s => {
              const count = commsLog.filter(c => c.sentiment === s).length;
              const cfg   = sentimentConfig[s];
              return (
                <div key={s} className={cx("flexRow", "gap12", "mb14")}>
                  <span className={cx(styles.commToneText, styles.commSentIconSm, styles.commW20, toneClass(cfg.color))}>{cfg.icon}</span>
                  <span className={cx("text13", "capitalize", styles.commFlex1)}>{s}</span>
                  <progress className={cx(styles.commProgressSm, styles.commBarFillTone, toneClass(cfg.color))} max={Math.max(commsLog.length, 1)} value={count} aria-label={`${s} sentiment count ${count}`} />
                  <span className={cx("fontMono", "fw700", styles.commToneText, styles.commW20, toneClass(cfg.color))}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
