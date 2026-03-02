"use client";

import { useState, useCallback } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { createPortalConversationWithRefresh } from "../../../../lib/api/portal/messages";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useQuickCompose({
  session,
  projects,
  refreshSnapshot,
  setFeedback,
}: {
  session: AuthSession | null;
  projects: Array<{ id: string; name: string }>;
  refreshSnapshot: (
    session?: AuthSession,
    options?: { background?: boolean },
  ) => Promise<void>;
  setFeedback: (f: { tone: "success" | "error"; message: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sending, setSending] = useState(false);

  // ── Open ─────────────────────────────────────────────────────────────────

  const open = useCallback(
    (projectId?: string) => {
      setIsOpen(true);
      setSubject("");
      setSelectedProjectId(projectId ?? (projects[0]?.id ?? ""));
      setSending(false);
    },
    [projects],
  );

  // ── Close ────────────────────────────────────────────────────────────────

  const close = useCallback(() => {
    setIsOpen(false);
    setSubject("");
    setSelectedProjectId("");
    setSending(false);
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    if (!session) {
      setFeedback({
        tone: "error",
        message: "Session expired. Please sign in again.",
      });
      return;
    }

    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setFeedback({
        tone: "error",
        message: "Please enter a subject for your message.",
      });
      return;
    }

    setSending(true);

    try {
      const result = await createPortalConversationWithRefresh(session, {
        subject: trimmedSubject,
        projectId: selectedProjectId || undefined,
      });

      if (!result.nextSession) {
        setFeedback({
          tone: "error",
          message: "Session expired. Please sign in again.",
        });
        setSending(false);
        return;
      }

      if (result.error) {
        setFeedback({ tone: "error", message: result.error.message });
        setSending(false);
        return;
      }

      setFeedback({
        tone: "success",
        message: "Conversation created successfully.",
      });

      // Reset and close
      close();

      // Refresh data in the background
      refreshSnapshot(result.nextSession, { background: true });
    } catch {
      setFeedback({
        tone: "error",
        message: "Failed to create conversation. Please try again.",
      });
      setSending(false);
    }
  }, [session, subject, selectedProjectId, setFeedback, close, refreshSnapshot]);

  return {
    isOpen,
    open,
    close,
    subject,
    setSubject,
    selectedProjectId,
    setSelectedProjectId,
    sending,
    send,
  };
}
