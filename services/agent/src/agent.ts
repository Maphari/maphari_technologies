// ════════════════════════════════════════════════════════════════════════════
// agent.ts — @livekit/agents entrypoint
//
// The `@livekit/agents` framework loads this file as the "agent" module.
// It is invoked once per room job with a JobContext that already holds a Room
// reference and manages the WebRTC connection lifecycle.
//
// Pipeline:
//   1. ctx.connect()  → agent joins the room as an audio subscriber
//   2. voice.AgentSession.start() → wires up STT / LLM / TTS pipeline
//   3. On each UserInputTranscribed event → RoomAgentSession.handleTranscript()
//   4. On room disconnect → RoomAgentSession.onRoomDisconnected()
// ════════════════════════════════════════════════════════════════════════════

import {
  type JobContext,
  AutoSubscribe,
  defineAgent,
  voice,
} from "@livekit/agents";
import { STT, LLM, TTS } from "@livekit/agents-plugin-openai";
import { VAD } from "@livekit/agents-plugin-silero";
import { RoomAgentSession } from "./lib/room-agent.js";

// ── Active sessions registry ───────────────────────────────────────────────
// Keyed by room name; cleaned up when the session finishes.
const activeSessions = new Map<string, RoomAgentSession>();

// ── entrypoint ─────────────────────────────────────────────────────────────

/**
 * This default export is the function the @livekit/agents worker calls for
 * every new room job. The worker passes a JobContext with a pre-configured
 * Room reference.
 */
export default defineAgent({
  entry: async (ctx: JobContext): Promise<void> => {
  const roomName: string =
    (ctx.room as { name?: string }).name ??
    (ctx.job.room as { name?: string } | undefined)?.name ??
    "unknown-room";

  console.log(`[agent] Job started for room: ${roomName}`);

  // Register a shutdown callback so we always post notes on clean exit
  ctx.addShutdownCallback(async () => {
    const session = activeSessions.get(roomName);
    if (session) {
      await session.onRoomDisconnected();
      activeSessions.delete(roomName);
    }
  });

  // Connect the agent to the room, subscribing only to audio tracks
  await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

  console.log(`[agent] Connected to room: ${roomName}`);

  // Create a per-room session to accumulate transcript and handle events
  const roomSession = new RoomAgentSession(roomName);

  // Attach room reference so the session can publish DataChannel messages
  if (ctx.agent) {
    roomSession.attach(ctx.room, ctx.agent);
  }

  activeSessions.set(roomName, roomSession);
  roomSession.on("finished", () => activeSessions.delete(roomName));

  // ── Voice pipeline ──────────────────────────────────────────────────────
  // Build a voice.AgentSession with OpenAI STT + GPT-4o LLM + OpenAI TTS.

  const sttInstance = new STT({
    model: "whisper-1",
    language: "en",
    prompt:
      "This is a business meeting at Maphari Technologies digital agency. " +
      "Participants discuss web projects, timelines, budgets, and deliverables.",
  });

  const llmInstance = new LLM({
    model: "gpt-4o",
    temperature: 0.7,
  });

  const ttsInstance = new TTS({
    model: "tts-1",
    voice: "alloy",
  });

  const agentInstructions = `You are Maphari, an AI meeting assistant embedded in a video call for Maphari Technologies — a professional digital agency.

Your responsibilities:
1. Listen to the meeting and help track what is discussed.
2. Detect action items when mentioned and acknowledge them.
3. Answer questions when addressed directly with "hey maphari".
4. Be concise — keep all responses under 3 sentences.
5. Be professional and friendly; represent Maphari Technologies.
6. Do not interrupt ongoing conversations — only speak when addressed.`;

  const vadInstance = await VAD.load();

  const agentInstance = new voice.Agent({
    instructions: agentInstructions,
    stt: sttInstance,
    llm: llmInstance,
    tts: ttsInstance,
    vad: vadInstance,
  });

  const agentSession = new voice.AgentSession({
    stt: sttInstance,
    llm: llmInstance,
    tts: ttsInstance,
  });

  // Forward every transcript to our room session handler.
  // Use the AgentSessionEventTypes enum string value as the event name.
  agentSession.on(
    voice.AgentSessionEventTypes.UserInputTranscribed,
    (ev) => {
      const speakerIdentity = ev.speakerId ?? "Participant";
      roomSession
        .handleTranscript(speakerIdentity, ev.transcript, ev.isFinal)
        .catch((err: unknown) => {
          console.error("[agent] handleTranscript error:", err);
        });
    }
  );

  // Start the voice pipeline connected to the room.
  // inputOptions / outputOptions accept the partial forms; do not pass
  // unknown keys — use the fields defined in RoomInputOptions / RoomOutputOptions.
  await agentSession.start({
    agent: agentInstance,
    room: ctx.room,
    inputOptions: { audioEnabled: true },
    outputOptions: { audioEnabled: true },
  });

  console.log(`[agent] Voice pipeline active in room: ${roomName}`);

  // Wait for the room to disconnect before cleaning up
  await new Promise<void>((resolve) => {
    ctx.room.on("disconnected", () => {
      roomSession
        .onRoomDisconnected()
        .then(() => {
          activeSessions.delete(roomName);
          resolve();
        })
        .catch((err: unknown) => {
          console.error("[agent] onRoomDisconnected error:", err);
          activeSessions.delete(roomName);
          resolve();
        });
    });
  });

  console.log(`[agent] Job finished for room: ${roomName}`);
  },
});
