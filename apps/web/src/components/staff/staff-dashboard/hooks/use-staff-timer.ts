"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  createProjectWorkSessionWithRefresh,
  updateProjectWorkSessionWithRefresh,
  type ProjectTimeEntry
} from "../../../../lib/api/admin";
import type { TimeEntrySummary } from "../types";
import { formatDuration, formatTimer, startOfWeek } from "../utils";

type AdminProject = {
  id: string;
  clientId: string;
  name: string;
  status: string;
  progressPercent: number;
  updatedAt: string;
};

export type UseStaffTimerReturn = {
  activeWorkSessionId: string | null;
  setActiveWorkSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTimerProjectId: string;
  setSelectedTimerProjectId: React.Dispatch<React.SetStateAction<string>>;
  timerTaskLabel: string;
  setTimerTaskLabel: React.Dispatch<React.SetStateAction<string>>;
  timerRunning: boolean;
  setTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  timerSeconds: number;
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  timerRef: React.MutableRefObject<number | null>;
  timerStartRef: React.MutableRefObject<string | null>;
  effectiveSelectedTimerProjectId: string;
  timerDisplay: string;
  timeEntrySource: TimeEntrySummary[];
  recentTimeEntries: TimeEntrySummary[];
  weekData: { days: Array<{ date: Date; label: string }>; dailyMinutes: number[] };
  todayMinutes: number;
  weekMinutes: number;
  projectTimeBreakdown: Array<[string, number]>;
  maxProjectMinutes: number;
  handleTimerToggle: () => void;
  handleTimerStop: () => Promise<void>;
  handleExportTimeLog: () => void;
  handleExportTimeLogJson: () => void;
};

type AddTimeEntryParams = {
  projectId: string;
  taskLabel: string;
  minutes: number;
  startedAt?: string;
  endedAt: string;
  staffName: string;
};

type Params = {
  session: AuthSession | null;
  snapshot: object;
  timeEntries: ProjectTimeEntry[];
  projects: AdminProject[];
  projectById: Map<string, AdminProject>;
  clientById: Map<string, { id: string; name: string }>;
  addTimeEntry: (params: AddTimeEntryParams) => Promise<{ id: string } | null>;
  setFeedback: (feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => void;
  staffName: string;
};

export function useStaffTimer({
  session,
  timeEntries,
  projects,
  projectById,
  addTimeEntry,
  setFeedback,
  staffName
}: Params): UseStaffTimerReturn {
  const [activeWorkSessionId, setActiveWorkSessionId] = useState<string | null>(null);
  const [selectedTimerProjectId, setSelectedTimerProjectId] = useState<string>("");
  const [timerTaskLabel, setTimerTaskLabel] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const timerRef = useRef<number | null>(null);
  const timerStartRef = useRef<string | null>(null);

  const effectiveSelectedTimerProjectId =
    selectedTimerProjectId && projects.some((project) => project.id === selectedTimerProjectId)
      ? selectedTimerProjectId
      : projects[0]?.id ?? "";

  // ─── 1-second timer interval ───
  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [timerRunning]);

  const timeEntrySource = useMemo<TimeEntrySummary[]>(() => {
    return timeEntries.map((entry) => {
      const projectName = projectById.get(entry.projectId)?.name ?? "Project";
      return {
        id: entry.id,
        project: projectName,
        task: entry.taskLabel,
        minutes: entry.minutes,
        loggedAt: entry.endedAt ?? entry.createdAt,
        color: "var(--accent)"
      };
    });
  }, [projectById, timeEntries]);

  const recentTimeEntries = useMemo(() => {
    return [...timeEntrySource]
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 6);
  }, [timeEntrySource]);

  const weekData = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const days = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return { date, label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date) };
    });
    const dailyMinutes = new Array(5).fill(0);
    timeEntrySource.forEach((entry) => {
      const date = new Date(entry.loggedAt);
      const dayIndex = Math.floor((date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 5) {
        dailyMinutes[dayIndex] += entry.minutes;
      }
    });
    return { days, dailyMinutes };
  }, [timeEntrySource]);

  const todayMinutes = useMemo(() => {
    const today = new Date();
    return timeEntrySource.reduce((sum, entry) => {
      const date = new Date(entry.loggedAt);
      if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      ) {
        return sum + entry.minutes;
      }
      return sum;
    }, 0);
  }, [timeEntrySource]);

  const weekMinutes = useMemo(() => weekData.dailyMinutes.reduce((sum, value) => sum + value, 0), [weekData]);

  const projectTimeBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    timeEntrySource.forEach((entry) => {
      totals.set(entry.project, (totals.get(entry.project) ?? 0) + entry.minutes);
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [timeEntrySource]);

  const maxProjectMinutes = useMemo(
    () => Math.max(...projectTimeBreakdown.map((entry) => entry[1]), 0),
    [projectTimeBreakdown]
  );

  const timerDisplay = formatTimer(timerSeconds);

  // ─── Handlers ───

  const handleTimerToggle = useCallback(() => {
    if (!effectiveSelectedTimerProjectId) {
      setFeedback({ tone: "error", message: "Select a project before starting the timer." });
      return;
    }
    if (timerRunning) {
      setTimerRunning(false);
      if (session && effectiveSelectedTimerProjectId && activeWorkSessionId) {
        void updateProjectWorkSessionWithRefresh(session, effectiveSelectedTimerProjectId, activeWorkSessionId, {
          status: "PAUSED"
        });
      }
      return;
    }
    timerStartRef.current = new Date().toISOString();
    setTimerRunning(true);
    if (session && effectiveSelectedTimerProjectId) {
      void (async () => {
        const created = await createProjectWorkSessionWithRefresh(session, effectiveSelectedTimerProjectId, {
          taskId: undefined,
          memberName: staffName,
          memberRole: "STAFF",
          workstream: timerTaskLabel || "Execution",
          status: "ACTIVE"
        });
        if (created.data) {
          setActiveWorkSessionId(created.data.id);
        }
      })();
    }
  }, [activeWorkSessionId, effectiveSelectedTimerProjectId, session, setFeedback, staffName, timerRunning, timerTaskLabel]);

  const handleTimerStop = useCallback(async () => {
    setTimerRunning(false);
    if (session && effectiveSelectedTimerProjectId && activeWorkSessionId) {
      await updateProjectWorkSessionWithRefresh(session, effectiveSelectedTimerProjectId, activeWorkSessionId, {
        status: "DONE",
        endedAt: new Date().toISOString()
      });
      setActiveWorkSessionId(null);
    }
    if (effectiveSelectedTimerProjectId && timerSeconds > 0) {
      const minutes = Math.max(1, Math.round(timerSeconds / 60));
      await addTimeEntry({
        projectId: effectiveSelectedTimerProjectId,
        taskLabel: timerTaskLabel || "General work",
        minutes,
        startedAt: timerStartRef.current ?? undefined,
        endedAt: new Date().toISOString(),
        staffName
      });
    }
    timerStartRef.current = null;
    setTimerSeconds(0);
  }, [activeWorkSessionId, addTimeEntry, effectiveSelectedTimerProjectId, session, staffName, timerSeconds, timerTaskLabel]);

  const handleExportTimeLog = useCallback(() => {
    if (timeEntrySource.length === 0) {
      setFeedback({ tone: "error", message: "No time entries to export yet." });
      return;
    }

    const escapeCsv = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;
    const header = ["Entry ID", "Project", "Task", "Minutes", "Duration", "Logged At"];
    const rows = timeEntrySource
      .slice()
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .map((entry) => [
        entry.id,
        entry.project,
        entry.task,
        String(entry.minutes),
        formatDuration(entry.minutes),
        new Date(entry.loggedAt).toISOString()
      ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-time-log-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFeedback({ tone: "success", message: "Time log exported." });
  }, [setFeedback, timeEntrySource]);

  const handleExportTimeLogJson = useCallback(() => {
    if (timeEntrySource.length === 0) {
      setFeedback({ tone: "error", message: "No time entries to export yet." });
      return;
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      entries: timeEntrySource
        .slice()
        .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
        .map((entry) => ({
          id: entry.id,
          project: entry.project,
          task: entry.task,
          minutes: entry.minutes,
          duration: formatDuration(entry.minutes),
          loggedAt: new Date(entry.loggedAt).toISOString()
        }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-time-log-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFeedback({ tone: "success", message: "Time log JSON exported." });
  }, [setFeedback, timeEntrySource]);

  return {
    activeWorkSessionId,
    setActiveWorkSessionId,
    selectedTimerProjectId,
    setSelectedTimerProjectId,
    timerTaskLabel,
    setTimerTaskLabel,
    timerRunning,
    setTimerRunning,
    timerSeconds,
    setTimerSeconds,
    timerRef,
    timerStartRef,
    effectiveSelectedTimerProjectId,
    timerDisplay,
    timeEntrySource,
    recentTimeEntries,
    weekData,
    todayMinutes,
    weekMinutes,
    projectTimeBreakdown,
    maxProjectMinutes,
    handleTimerToggle,
    handleTimerStop,
    handleExportTimeLog,
    handleExportTimeLogJson
  };
}
