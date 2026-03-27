"use client";
import { useRef, useEffect } from "react";
import { useCallDataChannel } from "./use-call-data-channel";
import { Ic } from "../../ui";
import styles from "@/app/style/client/call-ui.module.css";

interface TranscriptLine {
  speaker: string;
  text: string;
  isFinal: boolean;
  ts: number;
}

function isTranscriptLine(v: unknown): v is TranscriptLine {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.speaker === "string" && typeof obj.text === "string";
}

interface TranscriptPanelProps {
  open: boolean;
  onClose: () => void;
}

export function TranscriptPanel({ open, onClose }: TranscriptPanelProps) {
  const rawMessages = useCallDataChannel("transcript");
  const bodyRef = useRef<HTMLDivElement>(null);

  const lines = rawMessages
    .map(m => (isTranscriptLine(m.payload) ? { id: m.id, ...m.payload } : null))
    .filter((m): m is { id: string; speaker: string; text: string; isFinal: boolean; ts: number } => m !== null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines.length]);

  return (
    <div className={`${styles.callPanel} ${open ? styles.callPanelOpen : ""}`}>
      <div className={styles.callPanelHeader}>
        <span className={styles.callPanelTitle}>Transcript</span>
        <button type="button" className={styles.callPanelClose} onClick={onClose}>
          <Ic n="x" sz={14} c="currentColor" />
        </button>
      </div>

      <div ref={bodyRef} className={styles.callPanelBody}>
        {lines.map(line => (
          <div
            key={line.id}
            className={`${styles.transcriptLine} ${!line.isFinal ? styles.transcriptLinePending : ""}`}
          >
            <span className={styles.transcriptSpeaker}>{line.speaker}:</span>
            {line.text}
          </div>
        ))}
        {lines.length === 0 && (
          <div style={{ color: "rgba(232,229,224,0.3)", fontSize: "0.8rem", textAlign: "center", paddingTop: 24 }}>
            Transcript will appear here when participants speak
          </div>
        )}
      </div>
    </div>
  );
}
