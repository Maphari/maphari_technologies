"use client";

// ════════════════════════════════════════════════════════════════════════════
// livekit-call-modal.tsx — Embedded LiveKit video call inside the portal.
//   Parses joinUrl → extracts token + lkurl → renders LiveKitRoom inline.
//   No navigation away from the portal — opens and closes as an overlay.
// ════════════════════════════════════════════════════════════════════════════

import { LiveKitRoom } from "@livekit/components-react";
import { Ic } from "../ui";
import type { AuthSession } from "@/lib/auth/session";
import { MaphariVideoCall } from "./call/maphari-video-call";

type Props = {
  joinUrl: string | null;
  onClose: () => void;
  conversationId?: string | null;
  session?: AuthSession | null;
};

function parseJoinUrl(joinUrl: string): { token: string; lkurl: string; roomName: string } {
  try {
    const url = new URL(joinUrl);
    const token    = url.searchParams.get("token") ?? "";
    const lkurl    = url.searchParams.get("lkurl")  ?? "";
    const parts    = url.pathname.split("/").filter(Boolean);
    const roomName = parts[parts.length - 1] ?? "meeting";
    return { token, lkurl, roomName };
  } catch {
    return { token: "", lkurl: "", roomName: "meeting" };
  }
}

export function LiveKitCallModal({ joinUrl, onClose, conversationId, session }: Props) {
  if (!joinUrl) return null;

  const { token, lkurl, roomName } = parseJoinUrl(joinUrl);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        color: "#e8e5e0",
      }}
    >
      {token && lkurl ? (
        <LiveKitRoom
          video
          audio
          token={token}
          serverUrl={lkurl}
          style={{ flex: 1, minHeight: 0 }}
          onDisconnected={onClose}
        >
          <MaphariVideoCall
            roomName={roomName}
            onClose={onClose}
            conversationId={conversationId}
            session={session}
          />
        </LiveKitRoom>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e8e5e0" }}>
            Invalid call link
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
            Missing token or server URL. Please request a new call link.
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 8,
              color: "#f87171",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Ic n="x" sz={12} c="#f87171" />
            Close
          </button>
        </div>
      )}
    </div>
  );
}
