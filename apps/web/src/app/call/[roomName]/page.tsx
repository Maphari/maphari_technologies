// ════════════════════════════════════════════════════════════════════════════
// /call/[roomName] — LiveKit video call room
// Accessible to anyone with a valid signed token URL.
// URL format: /call/[roomName]?token=[jwt]&lkurl=[wss://…]
// No auth required — the token IS the auth.
// ════════════════════════════════════════════════════════════════════════════
import { Suspense } from "react";
import { VideoCallRoom } from "./video-call-room";

interface Props {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ token?: string; lkurl?: string }>;
}

export default async function CallPage({ params, searchParams }: Props) {
  const { roomName } = await params;
  const { token, lkurl } = await searchParams;

  return (
    <Suspense fallback={<CallLoading />}>
      <VideoCallRoom
        roomName={roomName}
        token={token ?? ""}
        livekitUrl={lkurl ? decodeURIComponent(lkurl) : ""}
      />
    </Suspense>
  );
}

function CallLoading() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#0d0d14", color: "#e8e5e0",
      fontFamily: "system-ui, sans-serif", fontSize: "0.9rem",
    }}>
      Connecting to room…
    </div>
  );
}

export const metadata = {
  title: "Video Call — Maphari Technologies",
};
