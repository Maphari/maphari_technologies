"use client";

import { useCallback } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  updatePortalMilestoneApprovalWithRefresh,
  updatePortalChangeRequestWithRefresh,
} from "../../../../lib/api/portal/projects";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useClientActions({
  session,
  refreshSnapshot,
  setFeedback,
}: {
  session: AuthSession | null;
  refreshSnapshot: (
    session?: AuthSession,
    options?: { background?: boolean },
  ) => Promise<void>;
  setFeedback: (f: { tone: "success" | "error"; message: string }) => void;
}) {
  // ── Milestone approvals ──────────────────────────────────────────────────

  const handleApproveMilestone = useCallback(
    async (milestoneId: string, comment?: string) => {
      if (!session) {
        setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
        return;
      }

      try {
        const result = await updatePortalMilestoneApprovalWithRefresh(session, milestoneId, {
          status: "APPROVED",
          comment,
        });

        if (!result.nextSession) {
          setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
          return;
        }

        if (result.error) {
          setFeedback({ tone: "error", message: result.error.message });
          return;
        }

        setFeedback({ tone: "success", message: "Milestone approved successfully." });
        refreshSnapshot(result.nextSession, { background: true });
      } catch {
        setFeedback({ tone: "error", message: "Failed to approve milestone. Please try again." });
      }
    },
    [session, refreshSnapshot, setFeedback],
  );

  const handleRejectMilestone = useCallback(
    async (milestoneId: string, comment?: string) => {
      if (!session) {
        setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
        return;
      }

      try {
        const result = await updatePortalMilestoneApprovalWithRefresh(session, milestoneId, {
          status: "REJECTED",
          comment,
        });

        if (!result.nextSession) {
          setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
          return;
        }

        if (result.error) {
          setFeedback({ tone: "error", message: result.error.message });
          return;
        }

        setFeedback({ tone: "success", message: "Milestone rejected." });
        refreshSnapshot(result.nextSession, { background: true });
      } catch {
        setFeedback({ tone: "error", message: "Failed to reject milestone. Please try again." });
      }
    },
    [session, refreshSnapshot, setFeedback],
  );

  // ── Change request actions ───────────────────────────────────────────────

  const handleApproveChangeRequest = useCallback(
    async (id: string, comment?: string) => {
      if (!session) {
        setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
        return;
      }

      try {
        const result = await updatePortalChangeRequestWithRefresh(session, id, {
          status: "CLIENT_APPROVED",
          clientDecisionNote: comment,
        });

        if (!result.nextSession) {
          setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
          return;
        }

        if (result.error) {
          setFeedback({ tone: "error", message: result.error.message });
          return;
        }

        setFeedback({ tone: "success", message: "Change request approved." });
        refreshSnapshot(result.nextSession, { background: true });
      } catch {
        setFeedback({ tone: "error", message: "Failed to approve change request. Please try again." });
      }
    },
    [session, refreshSnapshot, setFeedback],
  );

  const handleRejectChangeRequest = useCallback(
    async (id: string, comment?: string) => {
      if (!session) {
        setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
        return;
      }

      try {
        const result = await updatePortalChangeRequestWithRefresh(session, id, {
          status: "CLIENT_REJECTED",
          clientDecisionNote: comment,
        });

        if (!result.nextSession) {
          setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
          return;
        }

        if (result.error) {
          setFeedback({ tone: "error", message: result.error.message });
          return;
        }

        setFeedback({ tone: "success", message: "Change request rejected." });
        refreshSnapshot(result.nextSession, { background: true });
      } catch {
        setFeedback({ tone: "error", message: "Failed to reject change request. Please try again." });
      }
    },
    [session, refreshSnapshot, setFeedback],
  );

  const handleRequestInfoChangeRequest = useCallback(
    async (id: string, comment?: string) => {
      if (!session) {
        setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
        return;
      }

      try {
        // "Request info" maps to resetting the status back to SUBMITTED with a note
        const result = await updatePortalChangeRequestWithRefresh(session, id, {
          status: "SUBMITTED",
          clientDecisionNote: comment ?? "More information requested.",
        });

        if (!result.nextSession) {
          setFeedback({ tone: "error", message: "Session expired. Please sign in again." });
          return;
        }

        if (result.error) {
          setFeedback({ tone: "error", message: result.error.message });
          return;
        }

        setFeedback({ tone: "success", message: "Information requested for change request." });
        refreshSnapshot(result.nextSession, { background: true });
      } catch {
        setFeedback({ tone: "error", message: "Failed to request info. Please try again." });
      }
    },
    [session, refreshSnapshot, setFeedback],
  );

  return {
    handleApproveMilestone,
    handleRejectMilestone,
    handleApproveChangeRequest,
    handleRejectChangeRequest,
    handleRequestInfoChangeRequest,
  };
}
