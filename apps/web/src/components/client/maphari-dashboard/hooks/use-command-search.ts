"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageId } from "../config";
import { formatMoney, formatStatus } from "../utils";

type CommandResult =
  | { id: string; kind: "page"; label: string; detail: string; page: PageId }
  | { id: string; kind: "project"; label: string; detail: string; projectId: string }
  | { id: string; kind: "conversation"; label: string; detail: string; conversationId: string }
  | { id: string; kind: "invoice"; label: string; detail: string }
  | { id: string; kind: "milestone"; label: string; detail: string; projectId: string }
  | { id: string; kind: "notification"; label: string; detail: string; page: PageId; notificationId: string };

type ProjectRow = { id: string; name: string; status: string; description?: string | null };
type InvoiceRow = { id: string; number: string; status: string; amountCents: number; currency: string };
type MilestoneRow = { id: string; title: string; date: string; approval: string };
type MilestoneEntry = { milestone: { id: string }; projectId: string };
type NotificationJob = { id: string; status: string; tab: string; readAt: string | null };
type ThreadPreview = { id: string; sender: string; project: string; preview: string };

type Params = {
  projectScopedProjects: ProjectRow[];
  allMessageThreads: ThreadPreview[];
  dateScopedInvoices: InvoiceRow[];
  milestoneRows: MilestoneRow[];
  allMilestones: MilestoneEntry[];
  notificationJobs: NotificationJob[];
  convertMoney: (cents: number, currency: string) => number;
  displayCurrency: string;
  setActivePage: (page: PageId) => void;
  setTopbarProjectId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  selectConversation: (id: string) => void;
  handleMarkNotificationRead: (id: string, read: boolean) => Promise<void>;
  setNotificationsTrayOpen: (open: boolean) => void;
  setQuickComposeOpen: (open: boolean) => void;
};

export function useCommandSearch({
  projectScopedProjects,
  allMessageThreads,
  dateScopedInvoices,
  milestoneRows,
  allMilestones,
  notificationJobs,
  convertMoney,
  displayCurrency,
  setActivePage,
  setTopbarProjectId,
  setSelectedProjectId,
  selectConversation,
  handleMarkNotificationRead,
  setNotificationsTrayOpen,
  setQuickComposeOpen
}: Params) {
  const [commandSearchOpen, setCommandSearchOpen] = useState(false);
  const [commandSearchValue, setCommandSearchValue] = useState("");
  const [topbarSearch, setTopbarSearch] = useState("");
  const commandSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandSearchValue(topbarSearch);
        setCommandSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setCommandSearchOpen(false);
        setQuickComposeOpen(false);
        setNotificationsTrayOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setNotificationsTrayOpen, setQuickComposeOpen, topbarSearch]);

  useEffect(() => {
    if (!commandSearchOpen) return;
    commandSearchInputRef.current?.focus();
  }, [commandSearchOpen]);

  const commandResults = useMemo<CommandResult[]>(() => {
    const q = commandSearchValue.trim().toLowerCase();
    const include = (value: string) => !q || value.toLowerCase().includes(q);
    const results: CommandResult[] = [];

    [
      { id: "dashboard", label: "Open Dashboard", detail: "Navigate to overview", page: "dashboard" as const },
      { id: "reports", label: "Open Reports", detail: "Navigate to reporting dashboard", page: "reports" as const },
      { id: "ai", label: "Open AI & Automation", detail: "Navigate to AI workspace", page: "ai" as const },
      { id: "onboarding", label: "Open Onboarding", detail: "Navigate to onboarding journey", page: "onboarding" as const },
      { id: "projects", label: "Open Projects", detail: "Navigate to project workspace", page: "projects" as const },
      { id: "milestones", label: "Open Milestones", detail: "Navigate to milestones board", page: "milestones" as const },
      { id: "invoices", label: "Open Invoices", detail: "Navigate to billing", page: "invoices" as const },
      { id: "messages", label: "Open Messages", detail: "Navigate to threads", page: "messages" as const },
      { id: "automations", label: "Open Scheduling", detail: "Navigate to scheduling workspace", page: "automations" as const },
      { id: "settings", label: "Open Settings", detail: "Navigate to account settings", page: "settings" as const }
    ].forEach((item) => {
      if (include(`${item.label} ${item.detail}`)) {
        results.push({ id: `page-${item.id}`, kind: "page", label: item.label, detail: item.detail, page: item.page });
      }
    });

    projectScopedProjects.slice(0, 12).forEach((project) => {
      if (include(`${project.name} ${project.status} ${project.description ?? ""}`)) {
        results.push({
          id: `project-${project.id}`,
          kind: "project",
          label: project.name,
          detail: `Project · ${formatStatus(project.status)}`,
          projectId: project.id
        });
      }
    });

    allMessageThreads.slice(0, 12).forEach((thread) => {
      if (include(`${thread.sender} ${thread.project} ${thread.preview}`)) {
        results.push({
          id: `conversation-${thread.id}`,
          kind: "conversation",
          label: thread.sender,
          detail: `Thread · ${thread.project}`,
          conversationId: thread.id
        });
      }
    });

    dateScopedInvoices.slice(0, 8).forEach((invoice) => {
      const label = `Invoice ${invoice.number}`;
      if (include(`${label} ${invoice.status}`)) {
        results.push({
          id: `invoice-${invoice.id}`,
          kind: "invoice",
          label,
          detail: `${formatStatus(invoice.status)} · ${formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency)}`
        });
      }
    });

    milestoneRows.slice(0, 12).forEach((milestone) => {
      const projectId = allMilestones.find((entry) => entry.milestone.id === milestone.id)?.projectId;
      if (!projectId) return;
      if (include(`${milestone.title} ${milestone.date} ${milestone.approval}`)) {
        results.push({
          id: `milestone-${milestone.id}`,
          kind: "milestone",
          label: milestone.title,
          detail: `Milestone · ${milestone.date}`,
          projectId
        });
      }
    });

    notificationJobs.slice(0, 12).forEach((job) => {
      const page =
        job.tab === "operations"
          ? "automations"
          : (job.tab as Exclude<PageId, "automations">);
      const label = job.readAt ? "Notification (Read)" : "Notification (Unread)";
      const detail = `${job.tab} · ${formatStatus(job.status)}`;
      if (include(`${label} ${detail}`)) {
        results.push({
          id: `notification-${job.id}`,
          kind: "notification",
          label,
          detail,
          page,
          notificationId: job.id
        });
      }
    });

    return results.slice(0, 16);
  }, [
    allMessageThreads,
    allMilestones,
    commandSearchValue,
    convertMoney,
    displayCurrency,
    dateScopedInvoices,
    milestoneRows,
    notificationJobs,
    projectScopedProjects
  ]);

  const handleCommandResultSelect = useCallback(
    async (result: CommandResult) => {
      if (result.kind === "page") {
        setActivePage(result.page);
      }
      if (result.kind === "project") {
        setTopbarProjectId(result.projectId);
        setSelectedProjectId(result.projectId);
        setActivePage("projects");
      }
      if (result.kind === "conversation") {
        selectConversation(result.conversationId);
        setActivePage("messages");
      }
      if (result.kind === "invoice") {
        setActivePage("invoices");
      }
      if (result.kind === "milestone") {
        setTopbarProjectId(result.projectId);
        setSelectedProjectId(result.projectId);
        setActivePage("milestones");
      }
      if (result.kind === "notification") {
        setActivePage(result.page);
        await handleMarkNotificationRead(result.notificationId, true);
      }
      setCommandSearchOpen(false);
    },
    [handleMarkNotificationRead, selectConversation, setActivePage, setSelectedProjectId, setTopbarProjectId]
  );

  return {
    commandSearchOpen,
    setCommandSearchOpen,
    commandSearchValue,
    setCommandSearchValue,
    topbarSearch,
    setTopbarSearch,
    commandSearchInputRef,
    commandResults,
    handleCommandResultSelect
  };
}

export type { CommandResult };
