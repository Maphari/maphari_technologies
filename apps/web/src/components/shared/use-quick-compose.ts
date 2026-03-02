"use client";

import { useState, useCallback } from "react";
import type { AuthSession } from "../../lib/auth/session";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuickComposeParams {
  session: AuthSession | null;
  projects: Array<{ id: string; name: string }>;
  /** Function to call to create the conversation / message */
  createConversation: (
    session: AuthSession,
    payload: { subject: string; projectId?: string },
  ) => Promise<{ nextSession: AuthSession | null; error?: { message: string } | null }>;
  /** Background refresh after successful send */
  refreshSnapshot: (
    session?: AuthSession,
    options?: { background?: boolean },
  ) => Promise<void>;
  /** Toast / feedback handler */
  setFeedback: (f: { tone: "success" | "error"; message: string }) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Shared quick-compose hook usable by all dashboards.
 * Each dashboard provides its own `createConversation` function so portal/staff/admin
 * can use different API endpoints.
 *
 * @example
 * const compose = useQuickCompose({
 *   session,
 *   projects,
 *   createConversation: createStaffConversationWithRefresh,
 *   refreshSnapshot: refreshWorkspace,
 *   setFeedback,
 * });
 */
export function useQuickCompose({
  session,
  projects,
  createConversation,
  refreshSnapshot,
  setFeedback,
}: QuickComposeParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sending, setSending] = useState(false);

  const open = useCallback(
    (projectId?: string) => {
      setIsOpen(true);
      setSubject("");
      setSelectedProjectId(projectId ?? (projects[0]?.id ?? ""));
      setSending(false);
    },
    [projects],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSubject("");
    setSelectedProjectId("");
    setSending(false);
  }, []);

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
      const result = await createConversation(session, {
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

      close();

      refreshSnapshot(result.nextSession, { background: true });
    } catch {
      setFeedback({
        tone: "error",
        message: "Failed to create conversation. Please try again.",
      });
      setSending(false);
    }
  }, [session, subject, selectedProjectId, createConversation, setFeedback, close, refreshSnapshot]);

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
