// ════════════════════════════════════════════════════════════════════════════
// webhook-handler.ts — LiveKit webhook event handlers (webhook mode)
//
// Used when MODE=webhook in .env.  The @livekit/agents worker (MODE=agent)
// handles room lifecycle directly via dispatch; this file is only needed for
// the standalone Fastify webhook server fallback.
//
// On room_finished:
//   1. Fetch egress recordings for the room
//   2. Download audio if available → transcribe with Whisper
//   3. Generate meeting notes → post to core API
// ════════════════════════════════════════════════════════════════════════════

import { RoomServiceClient, EgressClient } from "livekit-server-sdk";
import { generateMeetingNotes, transcribeAudio, type TranscriptLine } from "./lib/meeting-notes.js";
import { postMeetingNotesToThread } from "./lib/core-api.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function getLivekitConfig(): {
  apiKey: string;
  apiSecret: string;
  httpUrl: string;
} | null {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret || !wsUrl) return null;

  const httpUrl = wsUrl.replace(/^wss?:\/\//, "https://");
  return { apiKey, apiSecret, httpUrl };
}

// ── handleRoomStarted ──────────────────────────────────────────────────────

/**
 * Called when a room_started webhook fires.
 * In webhook mode we log the event; actual participation is handled by
 * the @livekit/agents worker when MODE=agent.
 */
export async function handleRoomStarted(roomName: string): Promise<void> {
  console.log(`[webhook] Room started: ${roomName}`);
}

// ── handleRoomFinished ─────────────────────────────────────────────────────

/**
 * Called when a room_finished webhook fires.
 * Fetches any egress recordings, transcribes audio, generates meeting notes,
 * and posts them to the core service.
 */
export async function handleRoomFinished(
  roomName: string,
  participantCount: number
): Promise<void> {
  console.log(
    `[webhook] Room finished: ${roomName} (${participantCount} participants)`
  );

  const cfg = getLivekitConfig();
  if (!cfg) {
    console.warn("[webhook] LiveKit credentials not configured — skipping note generation");
    return;
  }

  // Try to find a recording for the room
  let transcriptLines: TranscriptLine[] = [];
  let durationSeconds = 0;

  try {
    const egressClient = new EgressClient(cfg.httpUrl, cfg.apiKey, cfg.apiSecret);
    const egressResults = await egressClient.listEgress({
      roomName,
      active: false,
    });

    if (egressResults.length > 0) {
      const egress = egressResults[0];
      const fileResult = egress.fileResults?.[0];

      if (fileResult) {
        durationSeconds = fileResult.duration ? Number(fileResult.duration) : 0;
        const downloadUrl = fileResult.location;

        if (downloadUrl) {
          console.log(`[webhook] Downloading recording for ${roomName}: ${downloadUrl}`);

          // Download the recording and transcribe it
          const audioBuffer = await downloadAudio(downloadUrl);
          if (audioBuffer) {
            const transcriptText = await transcribeAudio(
              audioBuffer,
              "audio/mp3",
              "Meeting participant"
            );

            if (transcriptText) {
              // Convert flat transcript string into TranscriptLine array
              transcriptLines = transcriptText
                .split(/[.!?]+/)
                .filter((s) => s.trim().length > 0)
                .map((s, i) => ({
                  speaker: "Participant",
                  text: s.trim(),
                  ts: Date.now() - (transcriptLines.length - i) * 1000,
                }));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[webhook] Failed to fetch egress recordings:", err);
  }

  // Generate meeting notes (even if transcript is empty, we still post)
  const notes = await generateMeetingNotes(transcriptLines);

  await postMeetingNotesToThread({
    roomName,
    notes,
    transcript: transcriptLines,
    durationSeconds,
  });
}

// ── downloadAudio ──────────────────────────────────────────────────────────

async function downloadAudio(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(120_000), // 2 minute download timeout
    });

    if (!response.ok) {
      console.warn(`[webhook] Audio download failed: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[webhook] Audio download error:", err);
    return null;
  }
}
