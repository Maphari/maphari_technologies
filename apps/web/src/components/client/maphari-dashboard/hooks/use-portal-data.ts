"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadPortalProjectDetailWithRefresh,
  loadPortalProjectCollaborationWithRefresh,
  loadPortalMilestoneApprovalsWithRefresh,
  loadConversationMessagesWithRefresh,
  loadPortalBlockersWithRefresh,
  loadPortalTimelineWithRefresh,
  loadPortalChangeRequestsWithRefresh,
  type PortalProjectDetail,
  type PortalProjectCollaboration,
  type PortalMilestoneApproval,
  type PortalMessage,
  type PortalProjectChangeRequest,
  type PortalSnapshot
} from "../../../../lib/api/portal";

type TopbarDateRange = "7d" | "30d" | "90d" | "all";

type BlockerItem = {
  id: string;
  projectId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  ownerName: string | null;
  etaAt: string | null;
  updatedAt: string;
};

type TimelineEvent = {
  id: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
};

type Params = {
  session: AuthSession | null;
  snapshot: PortalSnapshot;
  topbarDateRange: TopbarDateRange;
  projectScopeId: string | null;
};

export function usePortalData({ session, snapshot, topbarDateRange, projectScopeId }: Params) {
  const [projectDetails, setProjectDetails] = useState<PortalProjectDetail[]>([]);
  const [projectCollaborationById, setProjectCollaborationById] = useState<Record<string, PortalProjectCollaboration>>({});
  const [milestoneApprovals, setMilestoneApprovals] = useState<Record<string, PortalMilestoneApproval>>({});
  const [messagePreviewMap, setMessagePreviewMap] = useState<Record<string, PortalMessage | null>>({});
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [changeRequests, setChangeRequests] = useState<PortalProjectChangeRequest[]>([]);
  const [handoffSummary, setHandoffSummary] = useState<{
    docs: number;
    decisions: number;
    blockers: number;
    generatedAt: string;
  } | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);

  const projects = useMemo(() => snapshot.projects ?? [], [snapshot.projects]);
  const invoices = useMemo(() => snapshot.invoices ?? [], [snapshot.invoices]);
  const conversations = useMemo(() => snapshot.conversations ?? [], [snapshot.conversations]);
  const fileById = useMemo(() => new Map(snapshot.files.map((file) => [file.id, file])), [snapshot.files]);

  const nowTs = useMemo(() => new Date().getTime(), []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects]);

  const isWithinSelectedDateRange = useCallback(
    (dateValue?: string | null): boolean => {
      if (topbarDateRange === "all") return true;
      if (!dateValue) return false;
      const timestamp = new Date(dateValue).getTime();
      if (Number.isNaN(timestamp)) return false;
      const now = Date.now();
      const days = topbarDateRange === "7d" ? 7 : topbarDateRange === "30d" ? 30 : 90;
      return now - timestamp <= days * 24 * 60 * 60 * 1000;
    },
    [topbarDateRange]
  );

  const projectScopedConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        if (projectScopeId && conversation.projectId !== projectScopeId) return false;
        return isWithinSelectedDateRange(conversation.updatedAt);
      }),
    [conversations, isWithinSelectedDateRange, projectScopeId]
  );

  const projectScopedProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (projectScopeId && project.id !== projectScopeId) return false;
        return isWithinSelectedDateRange(project.updatedAt);
      }),
    [isWithinSelectedDateRange, projectScopeId, projects]
  );

  const sortedScopedProjects = useMemo(
    () => [...projectScopedProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [projectScopedProjects]
  );

  const dateScopedInvoices = useMemo(
    () => invoices.filter((invoice) => isWithinSelectedDateRange(invoice.updatedAt)),
    [invoices, isWithinSelectedDateRange]
  );

  const scopedOutstandingInvoices = useMemo(
    () => dateScopedInvoices.filter((invoice) => invoice.status === "ISSUED" || invoice.status === "OVERDUE"),
    [dateScopedInvoices]
  );
  const outstandingInvoices = scopedOutstandingInvoices;

  const overdueInvoices = useMemo(
    () => dateScopedInvoices.filter((invoice) => invoice.status === "OVERDUE"),
    [dateScopedInvoices]
  );

  const effectiveProjectDetails = useMemo(
    () => (projects.length === 0 ? [] : projectDetails),
    [projectDetails, projects.length]
  );

  const scopedProjectDetails = useMemo(
    () =>
      effectiveProjectDetails.filter((detail) => {
        if (projectScopeId && detail.id !== projectScopeId) return false;
        return true;
      }),
    [effectiveProjectDetails, projectScopeId]
  );

  const effectiveMessagePreviewMap = useMemo(
    () => (conversations.length === 0 ? {} : messagePreviewMap),
    [conversations.length, messagePreviewMap]
  );

  const projectDetailsLoading = Boolean(session && projectScopedProjects.length > 0 && scopedProjectDetails.length === 0);

  const openThreads = useMemo(
    () => projectScopedConversations.filter((conversation) => conversation.status === "OPEN"),
    [projectScopedConversations]
  );

  const scopedBlockers = useMemo(
    () =>
      blockers.filter((item) => {
        if (projectScopeId && item.projectId !== projectScopeId) return false;
        return true;
      }),
    [blockers, projectScopeId]
  );

  const scopedTimelineEvents = useMemo(
    () =>
      timelineEvents.filter((event) => {
        if (!projectScopeId) return true;
        return event.projectId === projectScopeId;
      }),
    [projectScopeId, timelineEvents]
  );

  const scopedChangeRequests = useMemo(
    () =>
      changeRequests.filter((request) => {
        if (projectScopeId && request.projectId !== projectScopeId) return false;
        return true;
      }),
    [changeRequests, projectScopeId]
  );

  const allMilestones = useMemo(() => {
    return scopedProjectDetails.flatMap((detail) =>
      detail.milestones.map((milestone) => ({ milestone, projectId: detail.id }))
    );
  }, [scopedProjectDetails]);

  const scopedMilestones = useMemo(
    () =>
      allMilestones.filter((entry) => {
        return isWithinSelectedDateRange(entry.milestone.updatedAt);
      }),
    [allMilestones, isWithinSelectedDateRange]
  );

  // ─── Last login ───
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:last-login:${session.user.email}`;
    const previous = window.localStorage.getItem(key);
    queueMicrotask(() => {
      setLastLoginAt(previous);
    });
    window.localStorage.setItem(key, new Date().toISOString());
  }, [session?.user?.email]);

  // ─── Data fetching: project details ───
  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const detailResponses = await Promise.all(
        projects.map((project) => loadPortalProjectDetailWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const details = detailResponses
        .map((result) => result.data)
        .filter((detail): detail is PortalProjectDetail => Boolean(detail));
      setProjectDetails(details);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, session]);

  // ─── Data fetching: collaboration ───
  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const responses = await Promise.all(
        projects.map((project) => loadPortalProjectCollaborationWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const next: Record<string, PortalProjectCollaboration> = {};
      responses.forEach((response) => {
        if (response.data) {
          next[response.data.projectId] = response.data;
        }
      });
      setProjectCollaborationById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, session]);

  // ─── Data fetching: milestone approvals ───
  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const approvals = await loadPortalMilestoneApprovalsWithRefresh(session);
      if (cancelled) return;
      const map: Record<string, PortalMilestoneApproval> = {};
      (approvals.data ?? []).forEach((approval) => {
        map[approval.milestoneId] = approval;
      });
      setMilestoneApprovals(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects.length, session]);

  // ─── Data fetching: message previews ───
  useEffect(() => {
    if (!session || conversations.length === 0) return;
    let cancelled = false;
    const topThreads = [...conversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);

    void (async () => {
      const results = await Promise.all(
        topThreads.map(async (conversation) => {
          const messages = await loadConversationMessagesWithRefresh(session, conversation.id);
          const lastMessage = messages.data?.[messages.data.length - 1] ?? null;
          return [conversation.id, lastMessage] as const;
        })
      );
      if (cancelled) return;
      const nextMap: Record<string, PortalMessage | null> = {};
      results.forEach(([id, message]) => {
        nextMap[id] = message;
      });
      setMessagePreviewMap(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [conversations, session]);

  // ─── Data fetching: blockers + timeline + change requests ───
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [blockersResult, timelineResult, changeRequestsResult] = await Promise.all([
        loadPortalBlockersWithRefresh(session, { limit: 80 }),
        loadPortalTimelineWithRefresh(session, { limit: 80 }),
        loadPortalChangeRequestsWithRefresh(session, { limit: 80 })
      ]);
      if (cancelled) return;
      setBlockers(blockersResult.data ?? []);
      setTimelineEvents(timelineResult.data ?? []);
      setChangeRequests(changeRequestsResult.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // ─── Realtime refresh handler ───
  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void (async () => {
      const [blockersResult, timelineResult, changeRequestsResult] = await Promise.all([
        loadPortalBlockersWithRefresh(session, { limit: 80 }),
        loadPortalTimelineWithRefresh(session, { limit: 80 }),
        loadPortalChangeRequestsWithRefresh(session, { limit: 80 })
      ]);
      if (blockersResult.data) setBlockers(blockersResult.data);
      if (timelineResult.data) setTimelineEvents(timelineResult.data);
      if (changeRequestsResult.data) setChangeRequests(changeRequestsResult.data);
    })();
  }, [session]);

  return {
    projects,
    invoices,
    conversations,
    fileById,
    nowTs,
    sortedProjects,
    isWithinSelectedDateRange,
    projectScopedConversations,
    projectScopedProjects,
    sortedScopedProjects,
    dateScopedInvoices,
    scopedOutstandingInvoices,
    outstandingInvoices,
    overdueInvoices,
    effectiveProjectDetails,
    scopedProjectDetails,
    effectiveMessagePreviewMap,
    projectDetailsLoading,
    openThreads,
    scopedBlockers,
    scopedTimelineEvents,
    scopedChangeRequests,
    allMilestones,
    scopedMilestones,
    projectDetails,
    projectCollaborationById,
    milestoneApprovals,
    setMilestoneApprovals,
    changeRequests,
    setChangeRequests,
    handoffSummary,
    setHandoffSummary,
    lastLoginAt,
    handleRealtimeRefresh
  };
}
