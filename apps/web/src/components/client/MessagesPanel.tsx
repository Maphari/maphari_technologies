import type { MessageThread } from "./data";

type Props = {
  threads: MessageThread[];
  selectedId: string;
  onSelect: (threadId: string) => void;
};

export function MessagesPanel({ threads, selectedId, onSelect }: Props) {
  const activeThread = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0, border: "1px solid var(--border)", height: 560, overflow: "hidden" }}>
      <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
          <input className="msg-input" style={{ width: "100%", background: "var(--surface)" }} placeholder="Search messages…" />
        </div>
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`msg-item${thread.unread ? " unread" : ""}`}
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              background: thread.id === selectedId ? "rgba(255,255,255,0.03)" : ""
            }}
            onClick={() => onSelect(thread.id)}
          >
            <div className="msg-av" style={{ background: thread.tagColor ?? "var(--accent)", color: "#050508", width: 38, height: 38, fontSize: 0.75 }}>
              {thread.sender.split(" ")[0].slice(0, 2)}
            </div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-sender" style={{ color: "var(--text)" }}>{thread.sender}</span>
                <span className="msg-time">{thread.time}</span>
              </div>
              <div style={{ fontSize: 12, fontFamily: "var(--font-dm-mono), monospace", color: thread.tagColor ?? "var(--muted)" }}>{thread.project}</div>
              <div className="msg-preview">{thread.preview}</div>
            </div>
            {thread.unread && <div className="msg-unread-dot" />}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="msg-av" style={{ background: "var(--accent)", color: "#050508", width: 36, height: 36, fontSize: "0.72rem" }}>JM</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{activeThread.sender}</div>
            <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6rem", color: "var(--accent)" }}>{activeThread.project}</div>
          </div>
          <span className="badge badge-green" style={{ marginLeft: "auto" }}>Active</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {activeThread.messages.map((message) => (
            <div
              key={`${activeThread.id}-${message.time}`}
              style={{
                display: "flex",
                gap: 10,
                maxWidth: "75%",
                alignSelf: message.from === "you" ? "flex-end" : "flex-start",
                flexDirection: message.from === "you" ? "row-reverse" : "row"
              }}
            >
              <div className="msg-av" style={{ background: message.from === "you" ? "var(--purple)" : "var(--accent)", color: message.from === "you" ? "#fff" : "#050508", width: 32, height: 32, fontSize: "0.65rem", flexShrink: 0 }}>
                {message.from === "you" ? "SC" : "JM"}
              </div>
              <div style={{ textAlign: message.from === "you" ? "right" : "left" }}>
                <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.58rem", color: "var(--muted2)", marginBottom: 6 }}>
                  {message.from === "you" ? "You" : "James M."} · {message.time}
                </div>
                <div
                  style={{
                    background: message.from === "you" ? "var(--accent-dim)" : "var(--surface)",
                    border: `1px solid ${message.from === "you" ? "color-mix(in srgb, var(--primary,#12d6c5) 20%, transparent)" : "var(--border)"}`,
                    padding: "12px 16px",
                    fontSize: "0.83rem",
                    lineHeight: 1.6,
                    borderRadius: message.from === "you" ? "8px 0 8px 8px" : "0 8px 8px 8px",
                    textAlign: "left"
                  }}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="msg-compose" style={{ borderTop: "1px solid var(--border)" }}>
          <input className="msg-input" placeholder="Reply to James…" />
          <button className="btn-sm btn-sm-ghost" type="button" style={{ flexShrink: 0 }}>📎</button>
          <button className="btn-sm btn-sm-accent" type="button" style={{ flexShrink: 0 }}>Send</button>
        </div>
      </div>
    </div>
  );
}
