"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { createPortalConversationWithRefresh } from "../../../../lib/api/portal";
import type { PageId } from "../config";

type Params = {
  session: AuthSession | null;
  projects: Array<{ id: string; name: string }>;
  sendMessage: (conversationId: string, content: string) => Promise<unknown>;
  refreshSnapshot: (session: AuthSession, options?: { background?: boolean }) => Promise<void>;
  selectConversation: (id: string) => void;
  setActivePage: (page: PageId) => void;
  setNotificationsTrayOpen: (open: boolean) => void;
  setFeedback: (feedback: { tone: "success" | "error"; message: string }) => void;
};

export function useQuickCompose({
  session,
  projects,
  sendMessage,
  refreshSnapshot,
  selectConversation,
  setActivePage,
  setNotificationsTrayOpen,
  setFeedback
}: Params) {
  const [quickComposeOpen, setQuickComposeOpen] = useState(false);
  const [quickComposeSubject, setQuickComposeSubject] = useState("");
  const [quickComposeBody, setQuickComposeBody] = useState("");
  const [quickComposeProjectId, setQuickComposeProjectId] = useState<string | null>(null);
  const [quickComposeCreating, setQuickComposeCreating] = useState(false);
  const quickComposeSubjectRef = useRef<HTMLInputElement>(null);

  const resolvedQuickComposeProjectId = useMemo(
    () =>
      quickComposeProjectId && projects.some((project) => project.id === quickComposeProjectId)
        ? quickComposeProjectId
        : null,
    [projects, quickComposeProjectId]
  );

  useEffect(() => {
    if (!quickComposeOpen) return;
    quickComposeSubjectRef.current?.focus();
  }, [quickComposeOpen]);

  const handleQuickComposeSubmit = useCallback(async () => {
    if (!session) return;
    if (quickComposeSubject.trim().length < 2) {
      setFeedback({ tone: "error", message: "Subject must be at least 2 characters." });
      return;
    }
    setQuickComposeCreating(true);
    const created = await createPortalConversationWithRefresh(session, {
      clientId: session.user.clientId ?? undefined,
      subject: quickComposeSubject.trim(),
      projectId: resolvedQuickComposeProjectId ?? undefined
    });
    if (!created.data) {
      setQuickComposeCreating(false);
      setFeedback({ tone: "error", message: created.error?.message ?? "Unable to create thread." });
      return;
    }

    if (quickComposeBody.trim()) {
      await sendMessage(created.data.id, quickComposeBody.trim());
    }

    await refreshSnapshot(created.nextSession ?? session, { background: true });
    selectConversation(created.data.id);
    setActivePage("messages");
    setQuickComposeOpen(false);
    setNotificationsTrayOpen(false);
    setQuickComposeSubject("");
    setQuickComposeBody("");
    setQuickComposeProjectId(null);
    setQuickComposeCreating(false);
    setFeedback({ tone: "success", message: "New thread started from top bar." });
  }, [
    quickComposeBody,
    quickComposeSubject,
    refreshSnapshot,
    resolvedQuickComposeProjectId,
    selectConversation,
    sendMessage,
    session,
    setActivePage,
    setFeedback,
    setNotificationsTrayOpen
  ]);

  return {
    quickComposeOpen,
    setQuickComposeOpen,
    quickComposeSubject,
    setQuickComposeSubject,
    quickComposeBody,
    setQuickComposeBody,
    quickComposeProjectId,
    setQuickComposeProjectId,
    quickComposeCreating,
    quickComposeSubjectRef,
    resolvedQuickComposeProjectId,
    handleQuickComposeSubmit
  };
}
