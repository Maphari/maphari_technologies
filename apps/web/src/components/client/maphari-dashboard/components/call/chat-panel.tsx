"use client";
import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { useRoomContext } from "@livekit/components-react";
import { useCallDataChannel } from "./use-call-data-channel";
import { Ic } from "../../ui";
import styles from "@/app/style/client/call-ui.module.css";

interface ChatMessage {
  from: string;
  text: string;
  ts: number;
}

function isChatMessage(v: unknown): v is ChatMessage {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.from === "string" && typeof obj.text === "string";
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  participantName: string;
}

export function ChatPanel({ open, onClose, participantName }: ChatPanelProps) {
  const room = useRoomContext();
  const rawMessages = useCallDataChannel("chat");
  const [inputText, setInputText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const messages = rawMessages
    .map(m => (isChatMessage(m.payload) ? { id: m.id, ...m.payload } : null))
    .filter((m): m is { id: string; from: string; text: string; ts: number } => m !== null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages.length]);

  function sendMessage() {
    const text = inputText.trim();
    if (!text) return;

    const encoder = new TextEncoder();
    const payload = JSON.stringify({ from: participantName, text, ts: Date.now() });
    void room.localParticipant.publishData(encoder.encode(payload), {
      topic: "chat",
      reliable: true,
    });
    setInputText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className={`${styles.callPanel} ${open ? styles.callPanelOpen : ""}`}>
      <div className={styles.callPanelHeader}>
        <span className={styles.callPanelTitle}>Chat</span>
        <button type="button" className={styles.callPanelClose} onClick={onClose}>
          <Ic n="x" sz={14} c="currentColor" />
        </button>
      </div>

      <div ref={bodyRef} className={styles.callPanelBody}>
        {messages.map(msg => {
          const isMine = msg.from === participantName;
          return (
            <div key={msg.id} className={`${styles.chatMsg} ${isMine ? styles.chatMsgMine : ""}`}>
              {!isMine && <div className={styles.chatMsgName}>{msg.from}</div>}
              <div className={styles.chatMsgText}>{msg.text}</div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div style={{ color: "rgba(232,229,224,0.3)", fontSize: "0.8rem", textAlign: "center", paddingTop: 24 }}>
            No messages yet
          </div>
        )}
      </div>

      <div className={styles.callPanelInput}>
        <textarea
          className={styles.callPanelInputField}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
        />
        <button
          type="button"
          className={styles.callPanelSendBtn}
          onClick={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ic n="send" sz={14} c="#0d0d14" />
        </button>
      </div>
    </div>
  );
}
