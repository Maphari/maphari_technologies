"use client";
import { useIsRecording } from "@livekit/components-react";
import styles from "@/app/style/client/call-ui.module.css";

export function RecordingBadge() {
  const isRecording = useIsRecording();

  if (!isRecording) return null;

  return (
    <div className={styles.recBadge}>
      <span className={`${styles.pulseDot} ${styles.pulseDotRed}`} />
      REC
    </div>
  );
}
