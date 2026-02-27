"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadProjectDetailWithRefresh,
  loadProjectCollaborationWithRefresh,
  loadProjectBlockersWithRefresh,
  loadTimelineWithRefresh,
  loadProjectChangeRequestsWithRefresh,
  loadProjectHandoffExportsWithRefresh,
  loadNotificationJobsWithRefresh,
  setProjectPreferenceWithRefresh,
  type ProjectDetail,
  type ProjectCollaborationSnapshot,
  type ProjectChangeRequest,
  type ProjectHandoffExportRecord
} from "../../../../lib/api/admin";
import type { PageId } from "../config";

export type UseStaffDataReturn = {
  projectDetails: ProjectDetail[];
  setProjectDetails: React.Dispatch<React.SetStateAction<ProjectDetail[]>>;
  projectCollaboration: Record<string, ProjectCollaborationSnapshot>;
  setProjectCollaboration: React.Dispatch<React.SetStateAction<Record<string, ProjectCollaborationSnapshot>>>;
  projectBlockers: ProjectBlocker[];
  setProjectBlockers: React.Dispatch<React.SetStateAction<ProjectBlocker[]>>;
  timelineEvents: TimelineEvent[];
  setTimelineEvents: React.Dispatch<React.SetStateAction<TimelineEvent[]>>;
  changeRequests: ProjectChangeRequest[];
  setChangeRequests: React.Dispatch<React.SetStateAction<ProjectChangeRequest[]>>;
  estimateDrafts: Record<string, { hours: string; costCents: string; assessment: string }>;
  setEstimateDrafts: React.Dispatch<React.SetStateAction<Record<string, { hours: string; costCents: string; assessment: string }>>>;
  handoffExports: ProjectHandoffExportRecord[];
  setHandoffExports: React.Dispatch<React.SetStateAction<ProjectHandoffExportRecord[]>>;
  generatingHandoffExport: boolean;
  setGeneratingHandoffExport: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardLastSeenAt: string | null | undefined;
  setDashboardLastSeenAt: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  dashboardSeenMarkedRef: React.MutableRefObject<boolean>;
  effectiveProjectDetails: ProjectDetail[];
  clientById: Map<string, AdminClient>;
  projectById: Map<string, AdminProject>;
  fileById: Map<string, AdminFileRecord>;
  nowTs: number;
  handleRealtimeRefresh: () => void;
};

type NotificationJob = {
  id: string;
  status: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  readAt: string | null;
};

type ProjectBlocker = {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  etaAt: string | null;
  ownerName: string | null;
  updatedAt: string;
};

type TimelineEvent = {
  id: string;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
};

type AdminProject = {
  id: string;
  clientId: string;
  name: string;
  status: string;
  progressPercent: number;
  dueAt?: string | null;
  slaDueAt?: string | null;
  updatedAt: string;
};

type AdminClient = {
  id: string;
  name: string;
};

type AdminFileRecord = {
  id: string;
  fileName: string;
};

type Params = {
  session: AuthSession | null;
  snapshot: {
    projects?: AdminProject[];
    clients?: AdminClient[];
  };
  projects: AdminProject[];
  clients: AdminClient[];
  files: AdminFileRecord[];
  activePage: PageId;
  loading: boolean;
  setNotificationJobs: React.Dispatch<React.SetStateAction<NotificationJob[]>>;
};

export function useStaffData({
  session,
  projects,
  clients,
  files,
  activePage,
  loading,
  setNotificationJobs
}: Params): UseStaffDataReturn {
  const [projectDetails, setProjectDetails] = useState<ProjectDetail[]>([]);
  const [projectCollaboration, setProjectCollaboration] = useState<Record<string, ProjectCollaborationSnapshot>>({});
  const [projectBlockers, setProjectBlockers] = useState<ProjectBlocker[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProjectChangeRequest[]>([]);
  const [estimateDrafts, setEstimateDrafts] = useState<Record<string, { hours: string; costCents: string; assessment: string }>>({});
  const [handoffExports, setHandoffExports] = useState<ProjectHandoffExportRecord[]>([]);
  const [generatingHandoffExport, setGeneratingHandoffExport] = useState(false);
  const [dashboardLastSeenAt, setDashboardLastSeenAt] = useState<string | null | undefined>(undefined);

  const dashboardSeenMarkedRef = useRef(false);

  // ─── Reset seen ref when session changes ───
  useEffect(() => {
    dashboardSeenMarkedRef.current = false;
  }, [session?.user.id]);

  // ─── Data fetching: project details ───
  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        projects.map((project) => loadProjectDetailWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const details = results
        .map((result) => result.data)
        .filter((detail): detail is ProjectDetail => Boolean(detail));
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
      const results = await Promise.all(
        projects.map((project) => loadProjectCollaborationWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const next: Record<string, ProjectCollaborationSnapshot> = {};
      results.forEach((result) => {
        if (result.data) next[result.data.projectId] = result.data;
      });
      setProjectCollaboration(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, session]);

  // ─── Data fetching: blockers + timeline + changeRequests + exports ───
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [blockersResult, timelineResult, changeRequestsResult, exportsResult] = await Promise.all([
        loadProjectBlockersWithRefresh(session, { limit: 80 }),
        loadTimelineWithRefresh(session, { limit: 80 }),
        loadProjectChangeRequestsWithRefresh(session, { limit: 80 }),
        loadProjectHandoffExportsWithRefresh(session)
      ]);
      if (cancelled) return;
      setProjectBlockers(blockersResult.data ?? []);
      setTimelineEvents(timelineResult.data ?? []);
      setChangeRequests(changeRequestsResult.data ?? []);
      setHandoffExports(exportsResult.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // ─── Mark dashboard seen ───
  useEffect(() => {
    if (!session || loading || activePage !== "dashboard" || dashboardLastSeenAt === undefined) return;
    if (dashboardSeenMarkedRef.current) return;
    dashboardSeenMarkedRef.current = true;
    const seenAt = new Date().toISOString();
    void setProjectPreferenceWithRefresh(session, {
      key: "dashboardLastSeenAt",
      value: JSON.stringify({ seenAt })
    });
  }, [activePage, dashboardLastSeenAt, loading, session]);

  // ─── Realtime refresh ───
  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void (async () => {
      const [jobsResult, blockersResult, timelineResult, changeRequestsResult, exportsResult] = await Promise.all([
        loadNotificationJobsWithRefresh(session),
        loadProjectBlockersWithRefresh(session, { limit: 80 }),
        loadTimelineWithRefresh(session, { limit: 80 }),
        loadProjectChangeRequestsWithRefresh(session, { limit: 80 }),
        loadProjectHandoffExportsWithRefresh(session)
      ]);
      if (jobsResult.data) {
        setNotificationJobs(jobsResult.data.map((job) => ({
          id: job.id,
          status: job.status,
          tab: job.tab,
          readAt: job.readAt
        })));
      }
      if (blockersResult.data) setProjectBlockers(blockersResult.data);
      if (timelineResult.data) setTimelineEvents(timelineResult.data);
      if (changeRequestsResult.data) setChangeRequests(changeRequestsResult.data);
      if (exportsResult.data) setHandoffExports(exportsResult.data);
      if (projects.length > 0) {
        const collaborationResults = await Promise.all(
          projects.map((project) => loadProjectCollaborationWithRefresh(session, project.id))
        );
        const next: Record<string, ProjectCollaborationSnapshot> = {};
        collaborationResults.forEach((result) => {
          if (result.data) next[result.data.projectId] = result.data;
        });
        setProjectCollaboration(next);
      }
    })();
  }, [projects, session, setNotificationJobs]);

  // ─── Derived memos ───
  const effectiveProjectDetails = useMemo(
    () => (projects.length === 0 ? [] : projectDetails),
    [projectDetails, projects.length]
  );

  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file])), [files]);
  const nowTs = useMemo(() => new Date().getTime(), []);

  return {
    projectDetails,
    setProjectDetails,
    projectCollaboration,
    setProjectCollaboration,
    projectBlockers,
    setProjectBlockers,
    timelineEvents,
    setTimelineEvents,
    changeRequests,
    setChangeRequests,
    estimateDrafts,
    setEstimateDrafts,
    handoffExports,
    setHandoffExports,
    generatingHandoffExport,
    setGeneratingHandoffExport,
    dashboardLastSeenAt,
    setDashboardLastSeenAt,
    dashboardSeenMarkedRef,
    effectiveProjectDetails,
    clientById,
    projectById,
    fileById,
    nowTs,
    handleRealtimeRefresh
  };
}
