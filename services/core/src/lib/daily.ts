// ════════════════════════════════════════════════════════════════════════════
// daily.ts — Daily.co video room creation helper
// Docs   : https://docs.daily.co/reference/rest-api/rooms/create-room
// Env    : DAILY_API_KEY — obtain from https://dashboard.daily.co/developers
// ════════════════════════════════════════════════════════════════════════════

const DAILY_API_BASE = "https://api.daily.co/v1";

export interface DailyRoom {
  name: string;
  url:  string;
  id:   string;
}

// ── createDailyRoom ────────────────────────────────────────────────────────
// Creates a video room that expires 2 hours after `startsAt`.
// Returns null when DAILY_API_KEY is not configured (graceful degradation).
export async function createDailyRoom(options: {
  name:       string;    // unique room name — use appointment ID
  startsAt:   Date;      // appointment scheduled time
  durationMin?: number;  // default 60 minutes
}): Promise<DailyRoom | null> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    console.warn("[daily] DAILY_API_KEY not set — skipping room creation");
    return null;
  }

  const expiry = new Date(options.startsAt.getTime() + (options.durationMin ?? 60) * 60_000 * 2);

  const response = await fetch(`${DAILY_API_BASE}/rooms`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name:       options.name,
      privacy:    "public",
      properties: {
        exp:               Math.floor(expiry.getTime() / 1000),
        max_participants:   10,
        enable_chat:        true,
        enable_screenshare: true,
        start_video_off:    false,
        start_audio_off:    false,
        enable_recording:   "cloud",
        enable_transcription: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[daily] Failed to create room: ${response.status} — ${error}`);
    return null;
  }

  const data = (await response.json()) as { name: string; url: string; id: string };
  return { name: data.name, url: data.url, id: data.id };
}

// ── deleteDailyRoom ────────────────────────────────────────────────────────
// Cleans up a room (e.g. when appointment is cancelled).
export async function deleteDailyRoom(roomName: string): Promise<void> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return;

  await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    method:  "DELETE",
    headers: { "Authorization": `Bearer ${apiKey}` },
  }).catch((err) => console.error("[daily] delete room error:", err));
}

// ── DailyRecording ─────────────────────────────────────────────────────────
export interface DailyRecording {
  id:            string;
  room_name:     string;
  status:        "finished" | "in-progress";
  download_link?: string;
  duration?:     number;
  start_ts?:     number;
}

// ── getRecordingsByRoom ─────────────────────────────────────────────────────
// Returns all recordings for a given room name.
// Returns [] when DAILY_API_KEY is not configured or request fails.
export async function getRecordingsByRoom(roomName: string): Promise<DailyRecording[]> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `${DAILY_API_BASE}/recordings?room_name=${encodeURIComponent(roomName)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: DailyRecording[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

// ── getTranscriptText ───────────────────────────────────────────────────────
// Fetches and parses a VTT transcript for a recording into plain text.
// Returns null when unavailable or on any error.
export async function getTranscriptText(recordingId: string): Promise<string | null> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${DAILY_API_BASE}/recordings/${recordingId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { transcript_download_link?: string };
    if (!data.transcript_download_link) return null;
    const vtt = await fetch(data.transcript_download_link);
    if (!vtt.ok) return null;
    const raw = await vtt.text();
    return raw
      .split("\n")
      .filter(line => line && !line.startsWith("WEBVTT") && !/^\d\d:\d\d/.test(line) && !/-->/.test(line) && !/^\d+$/.test(line))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return null;
  }
}
