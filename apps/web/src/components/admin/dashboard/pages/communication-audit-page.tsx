"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type CommType = "email" | "call" | "meeting" | "slack";
type Direction = "inbound" | "outbound";
type Sentiment = "positive" | "neutral" | "negative";
type Tab = "all comms" | "flagged" | "by client" | "analytics";

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

const commsLog: CommItem[] = [
  { id: "COM-0241", client: "Kestrel Capital", clientColor: "var(--accent)", type: "email", direction: "inbound", from: "David Nkosi (Client)", to: "Nomsa Dlamini", subject: "RE: Invoice INV-0039 - Dispute", date: "Feb 22", time: "09:14", snippet: "We still haven't received the itemised breakdown we requested last week. This is now urgent.", read: true, flagged: true, sentiment: "negative" },
  { id: "COM-0240", client: "Volta Studios", clientColor: "var(--accent)", type: "call", direction: "outbound", from: "Nomsa Dlamini", to: "Lena Brandt (Client)", subject: "Monthly check-in call", date: "Feb 22", time: "08:30", snippet: "30min call. Discussed brand direction progress. Client very happy. Requested a sneak peek of logo options.", read: true, flagged: false, sentiment: "positive", duration: "28m" },
  { id: "COM-0239", client: "Dune Collective", clientColor: "var(--amber)", type: "email", direction: "inbound", from: "Sam Dune (Client)", to: "Renzo Fabbri", subject: "Scope changes - urgent discussion needed", date: "Feb 21", time: "17:42", snippet: "We need to talk about the additional templates that were added. We didn't authorise this.", read: true, flagged: true, sentiment: "negative" },
  { id: "COM-0238", client: "Mira Health", clientColor: "var(--blue)", type: "email", direction: "outbound", from: "Nomsa Dlamini", to: "Dr. Aisha Obi (Client)", subject: "Wireframe review - your feedback needed", date: "Feb 21", time: "14:05", snippet: "Please find the updated wireframes attached. We'd love your feedback by end of week.", read: true, flagged: false, sentiment: "neutral" },
  { id: "COM-0237", client: "Okafor & Sons", clientColor: "var(--amber)", type: "meeting", direction: "outbound", from: "Tapiwa Moyo", to: "James Okafor (Client)", subject: "Annual Report final review meeting", date: "Feb 21", time: "10:00", snippet: "In-person review session. Client approved all sections. Minor copy changes requested on p.12.", read: true, flagged: false, sentiment: "positive", duration: "90m" },
  { id: "COM-0236", client: "Kestrel Capital", clientColor: "var(--accent)", type: "email", direction: "outbound", from: "Nomsa Dlamini", to: "David Nkosi (Client)", subject: "Invoice INV-0039 - Payment breakdown", date: "Feb 20", time: "11:22", snippet: "Please find the full itemised breakdown for INV-0039. I'm happy to walk through this on a call.", read: true, flagged: false, sentiment: "neutral" },
  { id: "COM-0235", client: "Dune Collective", clientColor: "var(--amber)", type: "call", direction: "outbound", from: "Renzo Fabbri", to: "Sam Dune (Client)", subject: "Scope conversation", date: "Feb 20", time: "09:00", snippet: "Attempted to reach client re: scope concern. No answer. Left voicemail.", read: true, flagged: true, sentiment: "neutral", duration: "0m (VM)" },
  { id: "COM-0234", client: "Mira Health", clientColor: "var(--blue)", type: "email", direction: "inbound", from: "Dr. Aisha Obi (Client)", to: "Kira Bosman", subject: "Wireframe feedback round 1", date: "Feb 19", time: "16:30", snippet: "Overall structure looks great. Main concern is the mobile nav - it needs to be more prominent.", read: true, flagged: false, sentiment: "neutral" },
  { id: "COM-0233", client: "Volta Studios", clientColor: "var(--accent)", type: "email", direction: "inbound", from: "Lena Brandt (Client)", to: "Nomsa Dlamini", subject: "Logo concepts - excited!", date: "Feb 18", time: "13:45", snippet: "Just saw the concept previews and we're really excited. Option 2 is our favourite by far.", read: true, flagged: false, sentiment: "positive" },
];

const typeConfig: Record<CommType, { icon: string; color: string; label: string }> = {
  email: { icon: "\u2709", color: "var(--blue)", label: "Email" },
  call: { icon: "\uD83D\uDCDE", color: "var(--accent)", label: "Call" },
  meeting: { icon: "\uD83E\uDD1D", color: "var(--accent)", label: "Meeting" },
  slack: { icon: "\uD83D\uDCAC", color: "var(--amber)", label: "Slack" },
};

const sentimentConfig: Record<Sentiment, { color: string; icon: string }> = {
  positive: { color: "var(--accent)", icon: "\u25B2" },
  neutral: { color: "var(--muted)", icon: "\u2192" },
  negative: { color: "var(--red)", icon: "\u25BC" },
};

const tabs: Tab[] = ["all comms", "flagged", "by client", "analytics"];

export function CommunicationAuditPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all comms");
  const [filterClient, setFilterClient] = useState("All");
  const [filterType, setFilterType] = useState<"All" | CommType>("All");
  const [selectedComm, setSelectedComm] = useState<CommItem | null>(null);

  const clients = ["All", ...new Set(commsLog.map((c) => c.client))];
  const types: Array<"All" | CommType> = ["All", "email", "call", "meeting"];

  const filtered = commsLog.filter((c) => filterClient === "All" || c.client === filterClient).filter((c) => filterType === "All" || c.type === filterType);

  const flagged = commsLog.filter((c) => c.flagged);
  const negSentiment = commsLog.filter((c) => c.sentiment === "negative");
  const totalToday = commsLog.filter((c) => c.date === "Feb 22").length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Communication Audit</h1>
          <div className={styles.pageSub}>Cross-portfolio comms log - Flagged items - Sentiment analysis</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Communication</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Comms (7d)", value: commsLog.length.toString(), color: "var(--blue)", sub: `${totalToday} today` },
          { label: "Flagged Items", value: flagged.length.toString(), color: flagged.length > 0 ? "var(--red)" : "var(--accent)", sub: "Require follow-up" },
          { label: "Negative Sentiment", value: negSentiment.length.toString(), color: negSentiment.length > 0 ? "var(--amber)" : "var(--accent)", sub: "In last 7 days" },
          { label: "Silent Clients (5d+)", value: "1", color: "var(--red)", sub: "Kestrel - last reply Feb 17" },
        ].map((s) => (
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
        {activeTab === "all comms" ? (
          <>
            <select title="Filter by client" value={filterClient} onChange={e => setFilterClient(e.target.value)} className={styles.filterSelect}>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select title="Filter by type" value={filterType} onChange={e => setFilterType(e.target.value as "All" | CommType)} className={styles.filterSelect}>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </>
        ) : null}
      </div>

      {(activeTab === "all comms" || activeTab === "flagged") && (
        <div>
          <div className={cx(styles.commDetailSplit, selectedComm ? styles.commDetailSplitOpen : styles.commDetailSplitClosed)}>
            <div className={cx("flexCol", "gap8")}>
              {(activeTab === "flagged" ? flagged : filtered).map((comm) => {
                const tc = typeConfig[comm.type];
                const sc = sentimentConfig[comm.sentiment];
                const isSelected = selectedComm?.id === comm.id;
                return (
                  <div
                    key={comm.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedComm(isSelected ? null : comm)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedComm(isSelected ? null : comm);
                      }
                    }}
                    className={cx("card", "p16", "pointerCursor", "interactiveCard", isSelected && styles.commCardSelected, !isSelected && comm.flagged && styles.commCardFlagged)}
                  >
                    <div className={styles.commRow}>
                      <span className={styles.commTypeIcon}>{tc.icon}</span>
                      <div>
                        <div className={cx("fw600", "text13", styles.commToneText, toneClass(comm.clientColor))}>{comm.client}</div>
                        <div className={cx("text10", "colorMuted")}>{comm.from.split(" (")[0]}</div>
                      </div>
                      <div>
                        <div className={cx("fw600", "text13", "mb3")}>{comm.subject}</div>
                        <div className={cx("text11", "colorMuted", "truncate")}>{comm.snippet}</div>
                      </div>
                      <span className={cx("text11", "fontMono", "colorMuted", "textRight")}>{comm.date}</span>
                      <span className={cx("text10", "textCenter", styles.commTypeBadge, styles.commToneText, toneClass(tc.color))}>{tc.label}</span>
                      <span className={cx("textCenter", styles.commSentIcon, styles.commToneText, toneClass(sc.color))}>{sc.icon}</span>
                      {comm.flagged ? <span className={cx("text12", "colorRed", "textCenter")}>{"\uD83D\uDEA9"}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedComm && (
              <div className={cx("card", "p24", styles.commSticky)}>
                <div className={cx("flexBetween", "mb16")}>
                  <div className={cx("text11", "colorMuted", "fontMono")}>{selectedComm.id}</div>
                  {selectedComm.flagged ? <span className={cx("text11", "colorRed")}>{"\uD83D\uDEA9"} Flagged</span> : null}
                </div>
                <div className={cx("fw800", "mb4", styles.commTitle16)}>{selectedComm.subject}</div>
                <div className={cx("text12", "mb16", styles.commToneText, toneClass(selectedComm.clientColor))}>{selectedComm.client}</div>
                <div className={cx("flexCol", "gap8", "mb16")}>
                  {[
                    { label: "From", value: selectedComm.from },
                    { label: "To", value: selectedComm.to },
                    { label: "Date", value: `${selectedComm.date} ${selectedComm.time}` },
                    { label: "Type", value: typeConfig[selectedComm.type].label },
                    { label: "Sentiment", value: selectedComm.sentiment },
                    ...(selectedComm.duration ? [{ label: "Duration", value: selectedComm.duration }] : []),
                  ].map((f) => (
                    <div key={f.label} className={cx("flexBetween", "text12")}>
                      <span className={cx("colorMuted")}>{f.label}</span>
                      <span className={cx("fw600")}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className={cx("bgBg", "p14", "text13", "mb16", styles.commSnippet)}>{selectedComm.snippet}</div>
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
          {["Volta Studios", "Kestrel Capital", "Mira Health", "Dune Collective", "Okafor & Sons"].map((client, ci) => {
            const clientComms = commsLog.filter((c) => c.client === client);
            const color = ["var(--accent)", "var(--accent)", "var(--blue)", "var(--amber)", "var(--amber)"][ci];
            const lastComm = clientComms[0];
            const neg = clientComms.filter((c) => c.sentiment === "negative").length;
            return (
              <div key={client} className={cx("card", "p24", styles.commToneBorder, toneClass(color))}>
                <div className={cx("flexBetween", "mb16")}>
                  <div className={cx("fw700", styles.commToneText, styles.commTitle15, toneClass(color))}>{client}</div>
                  <div className={cx("fontMono", "fw800", "colorBlue", styles.commValue22)}>{clientComms.length}</div>
                </div>
                <div className={cx("grid3", "mb16")}>
                  {(["email", "call", "meeting"] as const).map((type) => {
                    const count = clientComms.filter((c) => c.type === type).length;
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
                    <div className={cx("text10", "colorMuted", "mb4")}>
                      Last Comm: {lastComm.date} - {lastComm.time}
                    </div>
                    <div className={cx("text12", "fw600")}>{lastComm.subject}</div>
                    {neg > 0 ? <div className={cx("text11", "colorRed", "mt4")}>{"\u26A0"} {neg} negative sentiment flagged</div> : null}
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
              const count = commsLog.filter((c) => c.type === type).length;
              return (
                <div key={type} className={cx("flexRow", "gap12", "mb14")}>
                  <span className={styles.commTypeIconFixed}>{cfg.icon}</span>
                  <span className={cx("text13", styles.commFlex1)}>{cfg.label}</span>
                  <progress className={cx(styles.commProgressSm, styles.commBarFillTone, toneClass(cfg.color))} max={commsLog.length} value={count} aria-label={`${cfg.label} communications ${count}`} />
                  <span className={cx("fontMono", "fw700", styles.commToneText, styles.commW20, toneClass(cfg.color))}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Sentiment Breakdown</div>
            {(["positive", "neutral", "negative"] as const).map((s) => {
              const count = commsLog.filter((c) => c.sentiment === s).length;
              const cfg = sentimentConfig[s];
              return (
                <div key={s} className={cx("flexRow", "gap12", "mb14")}>
                  <span className={cx(styles.commToneText, styles.commSentIconSm, styles.commW20, toneClass(cfg.color))}>{cfg.icon}</span>
                  <span className={cx("text13", "capitalize", styles.commFlex1)}>{s}</span>
                  <progress className={cx(styles.commProgressSm, styles.commBarFillTone, toneClass(cfg.color))} max={commsLog.length} value={count} aria-label={`${s} sentiment count ${count}`} />
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
