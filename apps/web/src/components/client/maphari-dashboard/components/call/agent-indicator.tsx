"use client";
import { useParticipants } from "@livekit/components-react";
import styles from "@/app/style/client/call-ui.module.css";

export function AgentIndicator() {
  const participants = useParticipants();
  const hasAgent = participants.some(p => p.identity.startsWith("agent-"));

  if (!hasAgent) return null;

  return (
    <div className={styles.agentBadge}>
      <span className={`${styles.pulseDot} ${styles.pulseDotLime}`} />
      AI is listening
    </div>
  );
}
