"use client";

import { useEffect, useState } from "react";
import {
  getProjectPreferenceWithRefresh,
  loadProjectDirectoryWithRefresh,
  loadProjectAnalyticsWithRefresh,
  loadProjectDetailWithRefresh,
  updateProjectWithRefresh,
  updateProjectStatusWithRefresh,
  createProjectMilestoneWithRefresh,
  updateProjectMilestoneWithRefresh,
  createProjectTaskWithRefresh,
  updateProjectTaskWithRefresh,
  createProjectDependencyWithRefresh,
  setProjectPreferenceWithRefresh,
  type ProjectAnalyticsSummary,
  type ProjectDetail,
  type ProjectTask
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import type { DashboardToast } from "../../../shared/dashboard-core";

type Snapshot = {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    progressPercent: number;
    dueAt?: string | null;
    budgetCents: number;
    ownerName?: string | null;
    clientId: string;
    updatedAt: string;
    startAt?: string | null;
    completedAt?: string | null;
    slaDueAt?: string | null;
  }>;
};

export type UseAdminProjectsReturn = {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: "ALL" | "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  setStatusFilter: React.Dispatch<React.SetStateAction<"ALL" | "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED">>;
  priorityFilter: "ALL" | "LOW" | "MEDIUM" | "HIGH";
  setPriorityFilter: React.Dispatch<React.SetStateAction<"ALL" | "LOW" | "MEDIUM" | "HIGH">>;
  riskFilter: "ALL" | "LOW" | "MEDIUM" | "HIGH";
  setRiskFilter: React.Dispatch<React.SetStateAction<"ALL" | "LOW" | "MEDIUM" | "HIGH">>;
  directoryRows: Snapshot["projects"];
  setDirectoryRows: React.Dispatch<React.SetStateAction<Snapshot["projects"]>>;
  directoryTotal: number;
  setDirectoryTotal: React.Dispatch<React.SetStateAction<number>>;
  pageIndex: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  sortBy: "updatedAt" | "createdAt" | "dueAt" | "progressPercent" | "name";
  sortDir: "asc" | "desc";
  setSortDir: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  selectedProjectId: string | null;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProject: ProjectDetail | null;
  setSelectedProject: React.Dispatch<React.SetStateAction<ProjectDetail | null>>;
  projectAnalytics: ProjectAnalyticsSummary | null;
  loadingDirectory: boolean;
  loadingDetail: boolean;
  savedView: string;
  setSavedView: React.Dispatch<React.SetStateAction<string>>;
  layout: string;
  setLayout: React.Dispatch<React.SetStateAction<string>>;
  newMilestoneTitle: string;
  setNewMilestoneTitle: React.Dispatch<React.SetStateAction<string>>;
  newTaskTitle: string;
  setNewTaskTitle: React.Dispatch<React.SetStateAction<string>>;
  newTaskAssignee: string;
  setNewTaskAssignee: React.Dispatch<React.SetStateAction<string>>;
  dependencyId: string;
  setDependencyId: React.Dispatch<React.SetStateAction<string>>;
  editName: string;
  setEditName: React.Dispatch<React.SetStateAction<string>>;
  editOwner: string;
  setEditOwner: React.Dispatch<React.SetStateAction<string>>;
  editPriority: "LOW" | "MEDIUM" | "HIGH";
  setEditPriority: React.Dispatch<React.SetStateAction<"LOW" | "MEDIUM" | "HIGH">>;
  editRisk: "LOW" | "MEDIUM" | "HIGH";
  setEditRisk: React.Dispatch<React.SetStateAction<"LOW" | "MEDIUM" | "HIGH">>;
  editDueAt: string;
  setEditDueAt: React.Dispatch<React.SetStateAction<string>>;
  editSlaDueAt: string;
  setEditSlaDueAt: React.Dispatch<React.SetStateAction<string>>;
  editProgress: number;
  setEditProgress: React.Dispatch<React.SetStateAction<number>>;
  editBudget: number;
  setEditBudget: React.Dispatch<React.SetStateAction<number>>;
  editDescription: string;
  setEditDescription: React.Dispatch<React.SetStateAction<string>>;
  saveProjectPreferences: () => Promise<void>;
  saveProject: () => Promise<void>;
  setProjectStatus: (status: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED") => Promise<void>;
  addMilestone: () => Promise<void>;
  markMilestoneComplete: (milestoneId: string) => Promise<void>;
  addTask: () => Promise<void>;
  updateTaskStatus: (task: ProjectTask, status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE") => Promise<void>;
  addDependency: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  snapshot: Snapshot;
  pushToast: (tone: DashboardToast["tone"], message: string) => void;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
};

export function useAdminProjects({ session, snapshot, pushToast, onRefreshSnapshot }: Params): UseAdminProjectsReturn {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [directoryRows, setDirectoryRows] = useState(snapshot.projects);
  const [directoryTotal, setDirectoryTotal] = useState(snapshot.projects.length);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(8);
  const [sortBy] = useState<"updatedAt" | "createdAt" | "dueAt" | "progressPercent" | "name">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(snapshot.projects[0]?.id ?? null);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalyticsSummary | null>(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savedView, setSavedView] = useState("All projects");
  const [layout, setLayout] = useState("board");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [dependencyId, setDependencyId] = useState("");

  const [editName, setEditName] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editRisk, setEditRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [editDueAt, setEditDueAt] = useState("");
  const [editSlaDueAt, setEditSlaDueAt] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editBudget, setEditBudget] = useState(0);
  const [editDescription, setEditDescription] = useState("");

  // Load saved view prefs
  useEffect(() => {
    if (!session) return;
    void (async () => {
      const [saved, savedLayout] = await Promise.all([
        getProjectPreferenceWithRefresh(session, "savedView"),
        getProjectPreferenceWithRefresh(session, "layout")
      ]);
      if (saved.nextSession && saved.data?.value) setSavedView(saved.data.value);
      if (savedLayout.nextSession && savedLayout.data?.value) setLayout(savedLayout.data.value);
    })();
  }, [session]);

  // Load project directory (with filters/sort/pagination)
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoadingDirectory(true);
      const [directory, analytics] = await Promise.all([
        loadProjectDirectoryWithRefresh(session, {
          q: query || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          priority: priorityFilter === "ALL" ? undefined : priorityFilter,
          riskLevel: riskFilter === "ALL" ? undefined : riskFilter,
          sortBy,
          sortDir,
          page: pageIndex,
          pageSize
        }),
        loadProjectAnalyticsWithRefresh(session)
      ]);
      if (!directory.nextSession) {
        pushToast("error", directory.error?.message ?? "Session expired.");
        setLoadingDirectory(false);
        return;
      }
      if (directory.error) pushToast("error", directory.error.message);
      if (directory.data) {
        setDirectoryRows(directory.data.items);
        setDirectoryTotal(directory.data.total);
        if (!selectedProjectId && directory.data.items.length > 0) setSelectedProjectId(directory.data.items[0].id);
      }
      if (analytics.data) setProjectAnalytics(analytics.data);
      setLoadingDirectory(false);
    };
    void load();
  }, [session, query, statusFilter, priorityFilter, riskFilter, sortBy, sortDir, pageIndex, pageSize, selectedProjectId, pushToast]);

  // Load project detail when selectedProjectId changes
  useEffect(() => {
    if (!session || !selectedProjectId) return;
    const load = async () => {
      setLoadingDetail(true);
      const detail = await loadProjectDetailWithRefresh(session, selectedProjectId);
      if (!detail.nextSession || !detail.data) {
        if (detail.error) pushToast("error", detail.error.message);
        setLoadingDetail(false);
        return;
      }
      setSelectedProject(detail.data);
      setEditName(detail.data.name);
      setEditOwner(detail.data.ownerName ?? "");
      setEditPriority(detail.data.priority);
      setEditRisk(detail.data.riskLevel);
      setEditDueAt(detail.data.dueAt ? new Date(detail.data.dueAt).toISOString().slice(0, 16) : "");
      setEditSlaDueAt(detail.data.slaDueAt ? new Date(detail.data.slaDueAt).toISOString().slice(0, 16) : "");
      setEditProgress(detail.data.progressPercent);
      setEditBudget(Math.round(detail.data.budgetCents / 100));
      setEditDescription(detail.data.description ?? "");
      setLoadingDetail(false);
    };
    void load();
  }, [session, selectedProjectId, pushToast]);

  async function saveProjectPreferences(): Promise<void> {
    if (!session) return;
    const [a, b] = await Promise.all([
      setProjectPreferenceWithRefresh(session, { key: "savedView", value: savedView }),
      setProjectPreferenceWithRefresh(session, { key: "layout", value: layout })
    ]);
    if (!a.nextSession || !b.nextSession) {
      pushToast("error", a.error?.message ?? b.error?.message ?? "Unable to save project preferences.");
      return;
    }
    pushToast("success", "Project preferences saved.");
  }

  async function saveProject(): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectWithRefresh(session, selectedProjectId, {
      name: editName.trim() || undefined,
      description: editDescription.trim() || undefined,
      ownerName: editOwner.trim() || undefined,
      priority: editPriority,
      riskLevel: editRisk,
      dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
      slaDueAt: editSlaDueAt ? new Date(editSlaDueAt).toISOString() : null,
      progressPercent: Math.max(0, Math.min(100, editProgress)),
      budgetCents: Math.max(0, Math.round(editBudget * 100))
    });
    if (!updated.nextSession || !updated.data) {
      pushToast("error", updated.error?.message ?? "Unable to save project.");
      return;
    }
    pushToast("success", "Project updated.");
    await onRefreshSnapshot(updated.nextSession);
  }

  async function setProjectStatus(status: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED"): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectStatusWithRefresh(session, selectedProjectId, status);
    if (!updated.nextSession || !updated.data) {
      pushToast("error", updated.error?.message ?? "Unable to update project status.");
      return;
    }
    const nextStatus = updated.data.status;
    pushToast("success", `Project moved to ${status}.`);
    await onRefreshSnapshot(updated.nextSession);
    setSelectedProject((prev) => (prev ? { ...prev, status: nextStatus } : prev));
  }

  async function addMilestone(): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !newMilestoneTitle.trim() || !canEdit) return;
    const created = await createProjectMilestoneWithRefresh(session, selectedProjectId, { title: newMilestoneTitle.trim() });
    if (!created.nextSession || !created.data) {
      pushToast("error", created.error?.message ?? "Unable to create milestone.");
      return;
    }
    setNewMilestoneTitle("");
    pushToast("success", "Milestone created.");
    const detail = await loadProjectDetailWithRefresh(created.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function markMilestoneComplete(milestoneId: string): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectMilestoneWithRefresh(session, selectedProjectId, milestoneId, { status: "COMPLETED" });
    if (!updated.nextSession || !updated.data) {
      pushToast("error", updated.error?.message ?? "Unable to update milestone.");
      return;
    }
    const detail = await loadProjectDetailWithRefresh(updated.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function addTask(): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !newTaskTitle.trim() || !canEdit) return;
    const created = await createProjectTaskWithRefresh(session, selectedProjectId, {
      title: newTaskTitle.trim(),
      assigneeName: newTaskAssignee.trim() || undefined
    });
    if (!created.nextSession || !created.data) {
      pushToast("error", created.error?.message ?? "Unable to create task.");
      return;
    }
    setNewTaskTitle("");
    setNewTaskAssignee("");
    pushToast("success", "Task created.");
    const detail = await loadProjectDetailWithRefresh(created.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function updateTaskStatus(task: ProjectTask, status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectTaskWithRefresh(session, selectedProjectId, task.id, { status });
    if (!updated.nextSession || !updated.data) {
      pushToast("error", updated.error?.message ?? "Unable to update task.");
      return;
    }
    const detail = await loadProjectDetailWithRefresh(updated.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function addDependency(): Promise<void> {
    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
    if (!session || !selectedProjectId || !dependencyId || !canEdit) return;
    const created = await createProjectDependencyWithRefresh(session, selectedProjectId, { blockedByProjectId: dependencyId });
    if (!created.nextSession || !created.data) {
      pushToast("error", created.error?.message ?? "Unable to create dependency.");
      return;
    }
    setDependencyId("");
    pushToast("success", "Dependency linked.");
    const detail = await loadProjectDetailWithRefresh(created.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    riskFilter,
    setRiskFilter,
    directoryRows,
    setDirectoryRows,
    directoryTotal,
    setDirectoryTotal,
    pageIndex,
    setPageIndex,
    pageSize,
    sortBy,
    sortDir,
    setSortDir,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    setSelectedProject,
    projectAnalytics,
    loadingDirectory,
    loadingDetail,
    savedView,
    setSavedView,
    layout,
    setLayout,
    newMilestoneTitle,
    setNewMilestoneTitle,
    newTaskTitle,
    setNewTaskTitle,
    newTaskAssignee,
    setNewTaskAssignee,
    dependencyId,
    setDependencyId,
    editName,
    setEditName,
    editOwner,
    setEditOwner,
    editPriority,
    setEditPriority,
    editRisk,
    setEditRisk,
    editDueAt,
    setEditDueAt,
    editSlaDueAt,
    setEditSlaDueAt,
    editProgress,
    setEditProgress,
    editBudget,
    setEditBudget,
    editDescription,
    setEditDescription,
    saveProjectPreferences,
    saveProject,
    setProjectStatus,
    addMilestone,
    markMilestoneComplete,
    addTask,
    updateTaskStatus,
    addDependency
  };
}
