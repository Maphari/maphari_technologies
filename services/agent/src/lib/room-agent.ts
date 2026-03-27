// ════════════════════════════════════════════════════════════════════════════
// room-agent.ts — Per-room agent instance
//
// Responsibilities:
//   • Connect to a LiveKit room as "agent-maphari"
//   • Subscribe to all audio tracks and transcribe with OpenAI Whisper (via
//     the @livekit/agents STT pipeline when running under the agents framework)
//   • Publish transcript + action-item + agent-response DataChannel messages
//   • Detect the "hey maphari" wake word and answer with GPT-4o
//   • Accumulate the full transcript in memory
//   • On room disconnect → generate structured meeting notes → post to core API
//
// NOTE: This module is used by agent.ts (the @livekit/agents entrypoint).
//       The AgentSession handles audio I/O; this file exposes helper logic
//       that the session callbacks invoke.
// ════════════════════════════════════════════════════════════════════════════

import { EventEmitter } from "node:events";
import type { Room, LocalParticipant } from "@livekit/rtc-node";
import OpenAI from "openai";
import { extractWakeCommand, isActionItemPhrase } from "./wake-word.js";
import {
  generateMeetingNotes,
  type TranscriptLine,
  type MeetingNotes,
} from "./meeting-notes.js";
import { postMeetingNotesToThread } from "./core-api.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TranscriptDataMessage {
  speaker: string;
  text: string;
  isFinal: boolean;
  ts: number;
}

export interface ActionItemDataMessage {
  text: string;
  ts: number;
}

export interface AgentResponseDataMessage {
  text: string;
  ts: number;
}

export type RoomAgentEvents = {
  transcript: [msg: TranscriptDataMessage];
  "action-item": [msg: ActionItemDataMessage];
  "agent-response": [msg: AgentResponseDataMessage];
  finished: [];
};

// ── DataChannel topic names ────────────────────────────────────────────────
export const TOPIC_TRANSCRIPT = "transcript";
export const TOPIC_ACTION_ITEM = "action-item";
export const TOPIC_AGENT_RESPONSE = "agent-response";

// ── RoomAgentSession ───────────────────────────────────────────────────────

/**
 * Tracks state for one active LiveKit room session.
 * Instantiated by the @livekit/agents entrypoint (`agent.ts`) when a job arrives.
 */
export class RoomAgentSession extends EventEmitter {
  private readonly roomName: string;
  private readonly startedAt: number;
  private readonly transcriptLines: TranscriptLine[] = [];
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private meetingNotesPosted = false;

  constructor(roomName: string) {
    super();
    this.roomName = roomName;
    this.startedAt = Date.now();
  }

  // ── attach ──────────────────────────────────────────────────────────────

  /**
   * Called by the agent entrypoint once the Room is available from JobContext.
   * Stores a reference so we can publish DataChannel messages.
   */
  attach(room: Room, localParticipant: LocalParticipant): void {
    this.room = room;
    this.localParticipant = localParticipant;
  }

  // ── handleTranscript ────────────────────────────────────────────────────

  /**
   * Called for every final STT transcript line produced by the AgentSession.
   * Publishes to the `transcript` DataChannel and checks for action items /
   * wake word.
   */
  async handleTranscript(speaker: string, text: string, isFinal: boolean): Promise<void> {
    const ts = Date.now();
    const msg: TranscriptDataMessage = { speaker, text, isFinal, ts };

    if (isFinal) {
      this.transcriptLines.push({ speaker, text, ts });
    }

    // Publish transcript to room DataChannel so the UI can display it
    await this.publishData(TOPIC_TRANSCRIPT, msg);
    this.emit("transcript", msg);

    if (!isFinal) return;

    // ── action-item detection ─────────────────────────────────────────────
    if (isActionItemPhrase(text)) {
      const actionMsg: ActionItemDataMessage = { text, ts };
      await this.publishData(TOPIC_ACTION_ITEM, actionMsg);
      this.emit("action-item", actionMsg);
    }

    // ── wake word detection ───────────────────────────────────────────────
    const command = extractWakeCommand(text);
    if (command) {
      const response = await this.handleWakeCommand(command);
      if (response) {
        const responseMsg: AgentResponseDataMessage = { text: response, ts: Date.now() };
        await this.publishData(TOPIC_AGENT_RESPONSE, responseMsg);
        this.emit("agent-response", responseMsg);
      }
    }
  }

  // ── handleWakeCommand ────────────────────────────────────────────────────

  private async handleWakeCommand(command: string): Promise<string | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are Maphari, an AI assistant embedded in a video call for Maphari Technologies — a digital agency.
Answer concisely and helpfully. You have access to the meeting context: you can hear what is being discussed.
Keep responses under 3 sentences. Be professional and friendly.`,
          },
          {
            role: "user",
            content: command,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content?.trim() ?? null;
    } catch (err) {
      console.error("[room-agent] Wake command LLM error:", err);
      return null;
    }
  }

  // ── publishData ──────────────────────────────────────────────────────────

  private async publishData(
    topic: string,
    payload: TranscriptDataMessage | ActionItemDataMessage | AgentResponseDataMessage
  ): Promise<void> {
    if (!this.localParticipant) return;
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(payload));
      await this.localParticipant.publishData(bytes, { topic, reliable: true });
    } catch (err) {
      // DataChannel publish failures are non-fatal
      console.warn(`[room-agent] publishData(${topic}) failed:`, err);
    }
  }

  // ── onRoomDisconnected ───────────────────────────────────────────────────

  /**
   * Called when the room session ends. Generates meeting notes and posts them
   * to the core service.
   */
  async onRoomDisconnected(): Promise<void> {
    if (this.meetingNotesPosted) return;
    this.meetingNotesPosted = true;

    const durationSeconds = Math.floor((Date.now() - this.startedAt) / 1000);

    console.log(
      `[room-agent] Room "${this.roomName}" ended. ` +
        `Duration: ${durationSeconds}s, Transcript lines: ${this.transcriptLines.length}`
    );

    let notes: MeetingNotes;
    try {
      notes = await generateMeetingNotes(this.transcriptLines);
    } catch (err) {
      console.error("[room-agent] Failed to generate meeting notes:", err);
      notes = {
        summary: "Meeting notes could not be generated.",
        actionItems: [],
        decisions: [],
        nextSteps: [],
        sentiment: "neutral",
      };
    }

    try {
      await postMeetingNotesToThread({
        roomName: this.roomName,
        notes,
        transcript: this.transcriptLines,
        durationSeconds,
      });
    } catch (err) {
      console.error("[room-agent] Failed to post meeting notes:", err);
    }

    this.emit("finished");
  }

  // ── getTranscript ────────────────────────────────────────────────────────

  getTranscript(): TranscriptLine[] {
    return [...this.transcriptLines];
  }

  getRoomName(): string {
    return this.roomName;
  }
}
