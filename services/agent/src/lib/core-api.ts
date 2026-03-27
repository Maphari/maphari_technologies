// ════════════════════════════════════════════════════════════════════════════
// core-api.ts — Internal calls to the core service
// Auth  : x-user-role: ADMIN  (internal service-to-service header)
// Target: POST /meetings/:id/transcribe
//         POST /meetings  (create a MeetingRecord)
// ════════════════════════════════════════════════════════════════════════════

import type { MeetingNotes, TranscriptLine } from "./meeting-notes.js";

const CORE_URL =
  process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

/** Shared headers for internal service-to-service requests to core */
function internalHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-user-role": "ADMIN",
    "x-request-id": `agent-${Date.now()}`,
  };

  // Optional shared secret for defence-in-depth if core checks it
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    headers["x-internal-secret"] = secret;
  }

  return headers;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PostMeetingNotesPayload {
  roomName: string;
  notes: MeetingNotes;
  transcript: TranscriptLine[];
  durationSeconds: number;
  /** Optional — if we know the meetingRecord id ahead of time */
  meetingId?: string;
}

// ── formatNotesAsMessage ───────────────────────────────────────────────────

/**
 * Converts structured MeetingNotes into a human-readable rich-text block
 * suitable for storing in the `notes` column of MeetingRecord.
 */
export function formatNotesAsMessage(
  notes: MeetingNotes,
  durationSeconds: number
): string {
  const mins = Math.floor(durationSeconds / 60);

  const sections: string[] = [
    `Meeting Summary (${mins} min)`,
    ``,
    notes.summary,
  ];

  if (notes.actionItems.length > 0) {
    sections.push(
      ``,
      `Action Items:`,
      ...notes.actionItems.map((i) => `• ${i}`)
    );
  }

  if (notes.decisions.length > 0) {
    sections.push(
      ``,
      `Decisions:`,
      ...notes.decisions.map((d) => `• ${d}`)
    );
  }

  if (notes.nextSteps.length > 0) {
    sections.push(
      ``,
      `Next Steps:`,
      ...notes.nextSteps.map((s) => `• ${s}`)
    );
  }

  sections.push(``, `Sentiment: ${notes.sentiment}`);

  return sections.join("\n");
}

// ── findMeetingByRoomName ──────────────────────────────────────────────────

/**
 * Searches for a MeetingRecord whose title contains the room name.
 * Returns the first match id, or null.
 */
async function findMeetingByRoomName(roomName: string): Promise<string | null> {
  try {
    const res = await fetch(`${CORE_URL}/meetings`, {
      headers: internalHeaders(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      success?: boolean;
      data?: Array<{ id: string; title?: string; notes?: string }>;
    };

    const records = data?.data ?? [];
    const match = records.find(
      (r) =>
        r.title?.includes(roomName) ||
        r.notes?.includes(roomName)
    );

    return match?.id ?? null;
  } catch {
    return null;
  }
}

// ── postMeetingNotesToThread ───────────────────────────────────────────────

/**
 * Posts the generated meeting notes back to the core service.
 *
 * Strategy:
 * 1. If meetingId is provided → PATCH /meetings/:id via transcribe endpoint
 * 2. Otherwise → search for the meeting by room name and patch it
 * 3. If no existing record is found → create a new MeetingRecord
 */
export async function postMeetingNotesToThread(
  payload: PostMeetingNotesPayload
): Promise<void> {
  const { roomName, notes, transcript, durationSeconds, meetingId } = payload;

  const notesText = formatNotesAsMessage(notes, durationSeconds);
  const transcriptText = transcript
    .map((l) => `[${new Date(l.ts).toISOString()}] ${l.speaker}: ${l.text}`)
    .join("\n");

  // Attempt to find an existing meeting record to update
  const resolvedId = meetingId ?? (await findMeetingByRoomName(roomName));

  if (resolvedId) {
    // Patch the existing meeting with notes + transcript
    await patchMeetingNotes(resolvedId, notesText, transcriptText, notes);
    return;
  }

  // No existing record — create a new one
  await createMeetingRecord(roomName, notesText, transcriptText, durationSeconds, notes);
}

// ── patchMeetingNotes ──────────────────────────────────────────────────────

async function patchMeetingNotes(
  meetingId: string,
  notesText: string,
  transcriptText: string,
  notes: MeetingNotes
): Promise<void> {
  try {
    // Use the transcribe endpoint to store transcriptText + aiSummary
    const res = await fetch(`${CORE_URL}/meetings/${meetingId}/transcribe`, {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({
        transcriptText,
        aiSummary: notesText,
        sentiment: notes.sentiment,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      console.log(`[core-api] Patched meeting ${meetingId} with notes`);
    } else {
      const body = await res.text().catch(() => "(no body)");
      console.warn(
        `[core-api] PATCH /meetings/${meetingId}/transcribe returned ${res.status}: ${body}`
      );
    }
  } catch (err) {
    console.error(`[core-api] Failed to patch meeting ${meetingId}:`, err);
  }
}

// ── createMeetingRecord ────────────────────────────────────────────────────

async function createMeetingRecord(
  roomName: string,
  notesText: string,
  transcriptText: string,
  durationSeconds: number,
  notes: MeetingNotes
): Promise<void> {
  // The core /meetings endpoint only has GET and POST /:id/mood — there is no
  // CREATE endpoint exposed yet.  We log the notes so they're not lost, and
  // the agent can be extended once a POST /meetings admin endpoint is added.
  console.log(
    `[core-api] No existing MeetingRecord for room "${roomName}". ` +
      `Notes will be logged until a POST /meetings admin endpoint is available.`
  );
  console.log("[core-api] Notes:", notesText);
  console.log("[core-api] Transcript excerpt:", transcriptText.slice(0, 500));
  console.log("[core-api] Sentiment:", notes.sentiment);
  console.log("[core-api] Action items:", notes.actionItems);
}
