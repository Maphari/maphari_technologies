// ════════════════════════════════════════════════════════════════════════════
// meeting-notes.ts — GPT-4o meeting notes generator
// ════════════════════════════════════════════════════════════════════════════

import OpenAI from "openai";

export type TranscriptLine = {
  speaker: string;
  text: string;
  ts: number;
};

export type MeetingNotes = {
  summary: string;
  actionItems: string[];
  decisions: string[];
  nextSteps: string[];
  sentiment: "positive" | "neutral" | "negative";
};

const SYSTEM_PROMPT = `You are a professional meeting notes assistant for a digital agency called Maphari Technologies.
Extract structured information from the meeting transcript provided.
Return a JSON object with exactly these keys:
- summary: string (2-3 sentences, professional tone, no filler)
- actionItems: string[] (specific tasks mentioned, include owner name if stated)
- decisions: string[] (firm decisions made during the call)
- nextSteps: string[] (follow-up items, future meetings, etc.)
- sentiment: "positive" | "neutral" | "negative" (overall client sentiment from the conversation)
Only return valid JSON — no markdown fences, no explanation text outside the JSON.`;

/**
 * Uses GPT-4o to generate structured meeting notes from a transcript.
 * Falls back to an empty-but-valid MeetingNotes object on any error.
 */
export async function generateMeetingNotes(
  transcript: TranscriptLine[]
): Promise<MeetingNotes> {
  const fallback: MeetingNotes = {
    summary: "No transcript was captured for this meeting.",
    actionItems: [],
    decisions: [],
    nextSteps: [],
    sentiment: "neutral",
  };

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[meeting-notes] OPENAI_API_KEY not set — skipping AI notes");
    return fallback;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcriptText =
    transcript.length > 0
      ? transcript.map((l) => `${l.speaker}: ${l.text}`).join("\n")
      : "No transcript available for this meeting.";

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: transcriptText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<MeetingNotes>;

    return {
      summary: parsed.summary ?? fallback.summary,
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      sentiment: ["positive", "neutral", "negative"].includes(
        parsed.sentiment ?? ""
      )
        ? (parsed.sentiment as MeetingNotes["sentiment"])
        : "neutral",
    };
  } catch (err) {
    console.error("[meeting-notes] Failed to generate notes:", err);
    return fallback;
  }
}

/**
 * Transcribes a raw audio buffer (WAV/MP3/WEBM) using OpenAI Whisper.
 * Returns the transcript text, or null on error.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: "audio/wav" | "audio/webm" | "audio/mp3" = "audio/wav",
  speakerHint?: string
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // OpenAI SDK expects a File-like object; use toFile helper
    const ext = mimeType === "audio/wav" ? "wav" : mimeType === "audio/webm" ? "webm" : "mp3";
    const file = await OpenAI.toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

    const result = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      prompt: speakerHint
        ? `This is a business meeting. The current speaker is ${speakerHint}.`
        : "This is a business meeting at a digital agency.",
    });

    return result.text.trim() || null;
  } catch (err) {
    console.error("[meeting-notes] Whisper transcription failed:", err);
    return null;
  }
}
