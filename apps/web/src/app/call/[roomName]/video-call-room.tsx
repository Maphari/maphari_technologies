"use client";

// ════════════════════════════════════════════════════════════════════════════
// video-call-room.tsx — Maphari branded video conference UI
// ════════════════════════════════════════════════════════════════════════════

import { LiveKitRoom } from "@livekit/components-react";
import { MaphariVideoCall } from "@/components/client/maphari-dashboard/components/call/maphari-video-call";
import styles from "./call.module.css";

interface Props {
  roomName: string;
  token:    string;
  livekitUrl: string;
}

export function VideoCallRoom({ roomName, token, livekitUrl }: Props) {
  if (!token || !livekitUrl) {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorCard}>
          <div className={styles.errorTitle}>Invalid call link</div>
          <div className={styles.errorSub}>
            This link is missing required credentials. Please request a new call link.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.callWrap}>
      <LiveKitRoom
        video
        audio
        token={token}
        serverUrl={livekitUrl}
        className={styles.lkRoom}
        onDisconnected={() => {
          window.location.href = "/call/ended";
        }}
      >
        <MaphariVideoCall
          roomName={roomName}
          onClose={() => { window.location.href = "/call/ended"; }}
        />
      </LiveKitRoom>
    </div>
  );
}
