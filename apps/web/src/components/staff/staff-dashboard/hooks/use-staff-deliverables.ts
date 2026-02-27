"use client";

import { useCallback, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  createProjectHandoffExportWithRefresh,
  createProjectMilestoneWithRefresh,
  downloadProjectHandoffExportWithRefresh,
  updateProjectChangeRequestWithRefresh,
  updateProjectMilestoneWithRefresh,
  type ProjectChangeRequest,
  type ProjectDetail,
  type ProjectHandoffExportRecord
} from "../../../../lib/api/admin";
import type { DeliverableGroup } from "../types";
import { formatDateShort, formatStatus } from "../utils";

type AdminClient = {
  id: string;
  name: string;
};

type AdminFileRecord = {
  id: string;
  fileName: string;
};

export type UseStaffDeliverablesReturn = {
  showDeliverableComposer: boolean;
  setShowDeliverableComposer: React.Dispatch<React.SetStateAction<boolean>>;
  creatingDeliverable: boolean;
  newDeliverableDraft: { projectId: string; title: string; dueAt: string };
  setNewDeliverableDraft: React.Dispatch<React.SetStateAction<{ projectId: string; title: string; dueAt: string }>>;
  estimateDrafts: Record<string, { hours: string; costCents: string; assessment: string }>;
  setEstimateDrafts: React.Dispatch<React.SetStateAction<Record<string, { hours: string; costCents: string; assessment: string }>>>;
  handoffExports: ProjectHandoffExportRecord[];
  setHandoffExports: React.Dispatch<React.SetStateAction<ProjectHandoffExportRecord[]>>;
  generatingHandoffExport: boolean;
  setGeneratingHandoffExport: React.Dispatch<React.SetStateAction<boolean>>;
  deliverableGroups: DeliverableGroup[];
  milestoneStats: { overdue: number; dueThisWeek: number; deliveredThisMonth: number };
  handleCreateDeliverable: (projects: Array<{ id: string; name: string }>) => Promise<void>;
  handleMilestoneAttachment: (projectId: string, milestoneId: string, fileId: string | null) => Promise<void>;
  handleMilestoneStatusUpdate: (projectId: string, milestoneId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  handleEstimateDraftChange: (changeRequestId: string, field: "hours" | "costCents" | "assessment", value: string) => void;
  handleEstimateChangeRequest: (changeRequestId: string) => Promise<void>;
  handleGenerateHandoffExport: (format: "json" | "markdown") => Promise<void>;
  handleDownloadHandoffExport: (exportId: string) => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  projectDetails: ProjectDetail[];
  setProjectDetails: React.Dispatch<React.SetStateAction<ProjectDetail[]>>;
  changeRequests: ProjectChangeRequest[];
  setChangeRequests: React.Dispatch<React.SetStateAction<ProjectChangeRequest[]>>;
  clientById: Map<string, AdminClient>;
  fileById: Map<string, AdminFileRecord>;
  nowTs: number;
  effectiveProjectDetails: ProjectDetail[];
  topbarSearch: string;
  estimateDrafts: Record<string, { hours: string; costCents: string; assessment: string }>;
  setEstimateDrafts: React.Dispatch<React.SetStateAction<Record<string, { hours: string; costCents: string; assessment: string }>>>;
  handoffExports: ProjectHandoffExportRecord[];
  setHandoffExports: React.Dispatch<React.SetStateAction<ProjectHandoffExportRecord[]>>;
  generatingHandoffExport: boolean;
  setGeneratingHandoffExport: React.Dispatch<React.SetStateAction<boolean>>;
  setFeedback: (feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => void;
  refreshWorkspace: (session: AuthSession, opts?: { background?: boolean }) => Promise<void>;
};

export function useStaffDeliverables({
  session,
  setProjectDetails,
  changeRequests,
  setChangeRequests,
  clientById,
  fileById,
  nowTs,
  effectiveProjectDetails,
  topbarSearch,
  estimateDrafts,
  setEstimateDrafts,
  handoffExports,
  setHandoffExports,
  generatingHandoffExport,
  setGeneratingHandoffExport,
  setFeedback,
  refreshWorkspace
}: Params): UseStaffDeliverablesReturn {
  const [showDeliverableComposer, setShowDeliverableComposer] = useState(false);
  const [creatingDeliverable, setCreatingDeliverable] = useState(false);
  const [newDeliverableDraft, setNewDeliverableDraft] = useState({
    projectId: "",
    title: "",
    dueAt: ""
  });

  const searchQuery = topbarSearch.trim().toLowerCase();

  const deliverableGroups = useMemo<DeliverableGroup[]>(() => {
    const groups = effectiveProjectDetails.map((project) => {
      const clientName = clientById.get(project.clientId)?.name ?? "Client";
      const tone: DeliverableGroup["badge"]["tone"] =
        project.riskLevel === "HIGH"
          ? "amber"
          : project.riskLevel === "MEDIUM"
            ? "purple"
            : "green";
      const items = project.milestones.map((milestone) => {
        const status: DeliverableGroup["items"][number]["status"] =
          milestone.status === "COMPLETED" ? "done" : milestone.status === "IN_PROGRESS" ? "doing" : "";
        const dueLabel = milestone.dueAt ? formatDateShort(milestone.dueAt) : "TBD";
        const meta =
          milestone.status === "COMPLETED"
            ? `Delivered · ${dueLabel}`
            : milestone.dueAt
              ? `Due ${dueLabel} · ${formatStatus(milestone.status)}`
              : "Not scheduled";
        const metaTone = milestone.status === "IN_PROGRESS" ? "var(--accent)" : milestone.status === "COMPLETED" ? "var(--muted)" : undefined;
        const fileName = milestone.fileId ? fileById.get(milestone.fileId)?.fileName ?? null : null;
        const milestoneStatus: DeliverableGroup["items"][number]["milestoneStatus"] =
          milestone.status === "COMPLETED"
            ? "COMPLETED"
            : milestone.status === "IN_PROGRESS"
              ? "IN_PROGRESS"
              : "PENDING";
        return {
          status,
          milestoneStatus,
          dueAt: milestone.dueAt ?? null,
          title: milestone.title,
          meta,
          titleTone: milestone.status === "COMPLETED" ? "var(--muted)" : undefined,
          metaTone,
          fileId: milestone.fileId,
          fileName,
          projectId: project.id,
          milestoneId: milestone.id
        };
      });
      return { title: project.name, clientId: project.clientId, badge: { label: clientName, tone }, items };
    });
    if (!searchQuery) return groups;
    return groups
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          const haystack = `${item.title} ${item.meta} ${item.fileName ?? ""}`.toLowerCase();
          return haystack.includes(searchQuery);
        });
        if (group.title.toLowerCase().includes(searchQuery)) {
          return group;
        }
        return { ...group, items: filteredItems };
      })
      .filter((group) => group.items.length > 0 || group.title.toLowerCase().includes(searchQuery));
  }, [clientById, effectiveProjectDetails, fileById, searchQuery]);

  const milestoneStats = useMemo(() => {
    const now = nowTs;
    const weekAhead = now + 1000 * 60 * 60 * 24 * 7;
    let overdue = 0;
    let dueThisWeek = 0;
    let deliveredThisMonth = 0;
    const currentMonth = new Date().getMonth();
    effectiveProjectDetails.forEach((project) => {
      project.milestones.forEach((milestone) => {
        const dueTs = milestone.dueAt ? new Date(milestone.dueAt).getTime() : null;
        if (milestone.status === "COMPLETED") {
          const completedAt = milestone.updatedAt ? new Date(milestone.updatedAt).getMonth() : null;
          if (completedAt === currentMonth) deliveredThisMonth += 1;
          return;
        }
        if (dueTs && dueTs < now) overdue += 1;
        if (dueTs && dueTs >= now && dueTs <= weekAhead) dueThisWeek += 1;
      });
    });
    return { overdue, dueThisWeek, deliveredThisMonth };
  }, [effectiveProjectDetails, nowTs]);

  const handleCreateDeliverable = useCallback(async (projects: Array<{ id: string; name: string }>) => {
    if (!session) return;
    const effectiveDeliverableDraftProjectId = newDeliverableDraft.projectId || projects[0]?.id || "";
    const projectId = effectiveDeliverableDraftProjectId;
    if (!projectId || newDeliverableDraft.title.trim().length < 3) {
      setFeedback({ tone: "error", message: "Select a project and enter a deliverable title." });
      return;
    }
    setCreatingDeliverable(true);
    const result = await createProjectMilestoneWithRefresh(session, projectId, {
      title: newDeliverableDraft.title.trim(),
      dueAt: newDeliverableDraft.dueAt || undefined
    });
    setCreatingDeliverable(false);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to create deliverable." });
      return;
    }
    setProjectDetails((previous) =>
      previous.map((project) =>
        project.id === projectId
          ? { ...project, milestones: [result.data!, ...project.milestones] }
          : project
      )
    );
    setNewDeliverableDraft({
      projectId,
      title: "",
      dueAt: ""
    });
    setShowDeliverableComposer(false);
    setFeedback({ tone: "success", message: "Deliverable created." });
    await refreshWorkspace(result.nextSession ?? session, { background: true });
  }, [newDeliverableDraft, refreshWorkspace, session, setFeedback, setProjectDetails]);

  const handleMilestoneAttachment = useCallback(async (projectId: string, milestoneId: string, fileId: string | null) => {
    if (!session) return;
    const result = await updateProjectMilestoneWithRefresh(session, projectId, milestoneId, { fileId });
    if (result.data) {
      setProjectDetails((prev) =>
        prev.map((project) =>
          project.id !== projectId
            ? project
            : {
                ...project,
                milestones: project.milestones.map((milestone) => (milestone.id === milestoneId ? result.data! : milestone))
              }
        )
      );
    }
    await refreshWorkspace(result.nextSession ?? session);
  }, [refreshWorkspace, session, setProjectDetails]);

  const handleMilestoneStatusUpdate = useCallback(async (
    projectId: string,
    milestoneId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    if (!session) return;
    const result = await updateProjectMilestoneWithRefresh(session, projectId, milestoneId, { status });
    if (result.data) {
      setProjectDetails((prev) =>
        prev.map((project) =>
          project.id !== projectId
            ? project
            : {
                ...project,
                milestones: project.milestones.map((milestone) => (milestone.id === milestoneId ? result.data! : milestone))
              }
        )
      );
      setFeedback({ tone: "success", message: `Deliverable moved to ${formatStatus(status)}.` });
    }
    await refreshWorkspace(result.nextSession ?? session);
  }, [refreshWorkspace, session, setFeedback, setProjectDetails]);

  const handleEstimateDraftChange = useCallback((
    changeRequestId: string,
    field: "hours" | "costCents" | "assessment",
    value: string
  ) => {
    setEstimateDrafts((previous) => ({
      ...previous,
      [changeRequestId]: {
        hours: previous[changeRequestId]?.hours ?? "",
        costCents: previous[changeRequestId]?.costCents ?? "",
        assessment: previous[changeRequestId]?.assessment ?? "",
        [field]: value
      }
    }));
  }, [setEstimateDrafts]);

  const handleEstimateChangeRequest = useCallback(async (changeRequestId: string) => {
    if (!session) return;
    const draft = estimateDrafts[changeRequestId] ?? { hours: "", costCents: "", assessment: "" };
    const estimatedHours = Number(draft.hours);
    const estimatedCostCents = Number(draft.costCents);
    const result = await updateProjectChangeRequestWithRefresh(session, changeRequestId, {
      status: "ESTIMATED",
      estimatedHours: Number.isFinite(estimatedHours) && estimatedHours > 0 ? estimatedHours : undefined,
      estimatedCostCents: Number.isFinite(estimatedCostCents) && estimatedCostCents > 0 ? estimatedCostCents : undefined,
      staffAssessment: draft.assessment.trim() || undefined
    });
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to submit estimate." });
      return;
    }
    setChangeRequests((previous) =>
      previous.map((item) => (item.id === changeRequestId ? result.data! : item))
    );
    setFeedback({ tone: "success", message: "Estimate submitted for admin review." });
  }, [estimateDrafts, session, setFeedback, setChangeRequests]);

  const handleGenerateHandoffExport = useCallback(async (format: "json" | "markdown") => {
    if (!session || generatingHandoffExport) return;
    setGeneratingHandoffExport(true);
    const result = await createProjectHandoffExportWithRefresh(session, { format });
    setGeneratingHandoffExport(false);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to create handoff export." });
      return;
    }
    const download = await downloadProjectHandoffExportWithRefresh(session, result.data.record.id);
    if (download.data?.downloadUrl) {
      const anchor = document.createElement("a");
      anchor.href = download.data.downloadUrl;
      anchor.download = download.data.fileName;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    setHandoffExports((previous) => [result.data!.record, ...previous.filter((entry) => entry.id !== result.data!.record.id)].slice(0, 25));
    setFeedback({ tone: "success", message: `Handoff export ready: ${result.data.record.fileName}` });
  }, [generatingHandoffExport, session, setFeedback, setHandoffExports, setGeneratingHandoffExport]);

  const handleDownloadHandoffExport = useCallback(async (exportId: string) => {
    if (!session) return;
    const result = await downloadProjectHandoffExportWithRefresh(session, exportId);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to download handoff export." });
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.data.downloadUrl;
    anchor.download = result.data.fileName;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [session, setFeedback]);

  return {
    showDeliverableComposer,
    setShowDeliverableComposer,
    creatingDeliverable,
    newDeliverableDraft,
    setNewDeliverableDraft,
    estimateDrafts,
    setEstimateDrafts,
    handoffExports,
    setHandoffExports,
    generatingHandoffExport,
    setGeneratingHandoffExport,
    deliverableGroups,
    milestoneStats,
    handleCreateDeliverable,
    handleMilestoneAttachment,
    handleMilestoneStatusUpdate,
    handleEstimateDraftChange,
    handleEstimateChangeRequest,
    handleGenerateHandoffExport,
    handleDownloadHandoffExport
  };
}
