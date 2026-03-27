// ════════════════════════════════════════════════════════════════════════════
// livekit.ts — LiveKit Cloud video room helper
// Docs   : https://docs.livekit.io/home/server/managing-rooms/
// Env    : LIVEKIT_API_KEY     — from https://cloud.livekit.io
//          LIVEKIT_API_SECRET  — from https://cloud.livekit.io
//          LIVEKIT_WS_URL      — wss://your-project.livekit.cloud
//          APP_URL             — public base URL of the web app
// ════════════════════════════════════════════════════════════════════════════

import { AccessToken, RoomServiceClient, EgressClient, AgentDispatchClient } from "livekit-server-sdk";

// ── helpers ────────────────────────────────────────────────────────────────

function getConfig(): { apiKey: string; apiSecret: string; wsUrl: string; appUrl: string } | null {
  const apiKey    = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl     = process.env.LIVEKIT_WS_URL;   // wss://…livekit.cloud
  const appUrl    = process.env.APP_URL ?? "http://localhost:55445";
  if (!apiKey || !apiSecret || !wsUrl) {
    console.warn("[livekit] LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_WS_URL not set — video disabled");
    return null;
  }
  return { apiKey, apiSecret, wsUrl, appUrl };
}

/** Build an HTTP base URL from the WebSocket URL (wss:// → https://) */
function wsToHttp(wsUrl: string): string {
  return wsUrl.replace(/^wss?:\/\//, "https://");
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface LiveKitRoom {
  name:    string;
  joinUrl: string;
}

export interface LiveKitRecording {
  id:            string;
  room_name:     string;
  status:        "finished" | "in-progress";
  download_link?: string;
  duration?:     number;
  start_ts?:     number;
}

// ── createLiveKitRoom ──────────────────────────────────────────────────────
// Creates a room and returns a signed join URL pointing to /call/[roomName].
// Returns null when credentials are not configured (graceful degradation).
export async function createLiveKitRoom(options: {
  name:         string;
  durationMin?: number;   // default 60
}): Promise<LiveKitRoom | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  const { apiKey, apiSecret, wsUrl, appUrl } = cfg;
  const durationMin = options.durationMin ?? 60;
  const ttlSeconds  = durationMin * 60;

  // Create the room via REST
  const roomService = new RoomServiceClient(wsToHttp(wsUrl), apiKey, apiSecret);
  try {
    await roomService.createRoom({
      name:            options.name,
      emptyTimeout:    ttlSeconds,
      maxParticipants: 20,
    });
  } catch (err) {
    console.error("[livekit] Failed to create room:", err);
    return null;
  }

  // Dispatch the Maphari agent to the room (best-effort — won't fail room creation if agent is offline)
  try {
    const dispatchClient = new AgentDispatchClient(wsToHttp(wsUrl), apiKey, apiSecret);
    await dispatchClient.createDispatch(options.name, "maphari-agent");
    console.log(`[livekit] Agent dispatched to room: ${options.name}`);
  } catch (err) {
    console.warn("[livekit] Agent dispatch skipped (agent worker may not be running):", (err as Error).message);
  }

  // Generate a participant access token valid for the room's duration
  const at = new AccessToken(apiKey, apiSecret, {
    ttl:      ttlSeconds,
    identity: `participant-${Date.now()}`,
    name:     "Guest",
  });
  at.addGrant({
    roomJoin:       true,
    room:           options.name,
    canPublish:     true,
    canSubscribe:   true,
    canPublishData: true,
  });

  const token   = await at.toJwt();
  // Embed the LiveKit WS URL so the call page can connect without a separate env lookup
  const joinUrl = `${appUrl}/call/${options.name}?token=${encodeURIComponent(token)}&lkurl=${encodeURIComponent(wsUrl)}`;

  return { name: options.name, joinUrl };
}

// ── deleteLiveKitRoom ──────────────────────────────────────────────────────
export async function deleteLiveKitRoom(roomName: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;
  const roomService = new RoomServiceClient(wsToHttp(cfg.wsUrl), cfg.apiKey, cfg.apiSecret);
  try {
    await roomService.deleteRoom(roomName);
  } catch (err) {
    console.error("[livekit] delete room error:", err);
  }
}

// ── getRecordingsByRoom ────────────────────────────────────────────────────
// Returns egress (recording) jobs for the given room.
export async function getRecordingsByRoom(roomName: string): Promise<LiveKitRecording[]> {
  const cfg = getConfig();
  if (!cfg) return [];
  try {
    const egressClient = new EgressClient(wsToHttp(cfg.wsUrl), cfg.apiKey, cfg.apiSecret);
    const results = await egressClient.listEgress({ roomName, active: false });
    return results.map((e) => ({
      id:            e.egressId,
      room_name:     roomName,
      status:        "finished" as const,
      download_link: e.fileResults?.[0]?.location ?? undefined,
      duration:      e.fileResults?.[0]?.duration ? Number(e.fileResults[0].duration) : undefined,
      start_ts:      e.startedAt ? Number(e.startedAt) / 1_000_000 : undefined,
    }));
  } catch {
    return [];
  }
}

// ── getTranscriptText ──────────────────────────────────────────────────────
// LiveKit Cloud transcription is delivered via webhook; this is a stub that
// returns null until the webhook pipeline stores transcripts in the database.
export async function getTranscriptText(_recordingId: string): Promise<string | null> {
  return null;
}
