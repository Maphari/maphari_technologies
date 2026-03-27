"use client";
import { useDataChannel } from "@livekit/components-react";
import { useCallback, useState } from "react";

export function useCallDataChannel(topic: string) {
  const [messages, setMessages] = useState<{ id: string; payload: unknown; ts: number }[]>([]);

  const onMessage = useCallback((msg: { payload: Uint8Array; topic?: string; from?: unknown }) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const payload = JSON.parse(text) as unknown;
      setMessages(prev => [...prev.slice(-199), { id: crypto.randomUUID(), payload, ts: Date.now() }]);
    } catch { /* ignore malformed */ }
  }, []);

  useDataChannel(topic, onMessage);

  return messages;
}
