"use client";
import { useEffect, useState } from "react";
import { useCallDataChannel } from "./use-call-data-channel";
import styles from "@/app/style/client/call-ui.module.css";

type ActionItemPayload = { text: string; ts?: number };

function isActionItemPayload(v: unknown): v is ActionItemPayload {
  return typeof v === "object" && v !== null && "text" in v && typeof (v as Record<string, unknown>).text === "string";
}

export function ActionItemToast() {
  const messages = useCallDataChannel("action-item");
  const [visible, setVisible] = useState(false);
  const [currentText, setCurrentText] = useState("");

  const latest = messages[messages.length - 1];

  useEffect(() => {
    if (!latest) return;
    const payload = latest.payload;
    if (!isActionItemPayload(payload)) return;

    setCurrentText(payload.text);
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [latest?.id]);

  if (!visible || !currentText) return null;

  return (
    <div className={styles.actionToast}>
      <div className={styles.actionToastLabel}>Action Item</div>
      <div className={styles.actionToastText}>{currentText}</div>
    </div>
  );
}
