import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TasksPage } from "./tasks-page";
import type { TaskContext } from "../types";

function buildTask(overrides: Partial<TaskContext> = {}): TaskContext {
  return {
    id: "task-1",
    projectId: "proj-1",
    clientId: "client-1",
    title: "Implement integration sync",
    subtitle: "Assigned to Staff",
    projectName: "Platform Revamp",
    clientName: "Acme",
    status: "IN_PROGRESS",
    statusLabel: "In Progress",
    statusTone: "blue",
    badgeTone: "blue",
    dueAt: null,
    dueLabel: "No due date",
    dueTone: "var(--muted)",
    priority: "med",
    estimateMinutes: 45,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    progress: 20,
    assigneeInitials: "ST",
    externalLinks: [],
    ...overrides
  };
}

describe("TasksPage integrations UI", () => {
  it("shows provider picker and sync log inside link manager", () => {
    const onAddTaskExternalLink = vi.fn();
    const onCreateExternalTask = vi.fn();
    const onLoadTaskIntegrationSyncEvents = vi.fn();
    render(
      <TasksPage
        isActive
        openTasksCount={1}
        projectsCount={1}
        taskCounts={{ all: 1, in_progress: 1, todo: 0, blocked: 0, done: 0 }}
        projects={[{ id: "proj-1", name: "Platform Revamp" }]}
        taskTabs={[{ id: "all", label: "All (1)" }]}
        activeTaskTab="all"
        onTaskTabChange={() => {}}
        highPriorityOnly={false}
        onToggleHighPriority={() => {}}
        showComposer={false}
        onToggleComposer={() => {}}
        newTask={{ projectId: "proj-1", title: "", assigneeName: "", dueAt: "" }}
        onNewTaskChange={() => {}}
        creatingTask={false}
        onCreateTask={() => {}}
        filteredTasks={[buildTask()]}
        onTaskAction={() => {}}
        onAddTaskExternalLink={onAddTaskExternalLink}
        onRemoveTaskExternalLink={() => {}}
        onCreateExternalTask={onCreateExternalTask}
        onOpenTaskThread={() => {}}
        hasProjectThread={() => true}
        integrationOpenRequestsCount={0}
        integrationProvidersByClientId={{ "client-1": ["jira", "asana"] }}
        creatingExternalTaskId={null}
        taskSyncEventsByTaskId={{
          "task-1": [{
            id: "evt-1",
            providerKey: "jira",
            status: "SUCCESS",
            summary: "Created external task JIRA PLAT-1",
            errorMessage: null,
            createdAt: new Date().toISOString(),
            durationMs: 180
          }]
        }}
        taskSyncEventsLoadingId={null}
        onLoadTaskIntegrationSyncEvents={onLoadTaskIntegrationSyncEvents}
        onNavigate={() => {}}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(onLoadTaskIntegrationSyncEvents).toHaveBeenCalledWith("task-1");
    expect(screen.getByText("Task Sync Log")).toBeTruthy();
    expect(screen.getByText("Created external task JIRA PLAT-1")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Create in Jira/i })).toBeTruthy();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[2], { target: { value: "asana" } });
    const createButton = screen.getByRole("button", { name: /Create in Asana/i });
    expect(createButton).toBeTruthy();
    fireEvent.click(createButton);
    expect(onCreateExternalTask).toHaveBeenCalledWith("task-1", "proj-1", expect.objectContaining({ providerKey: "asana" }));
    expect(onAddTaskExternalLink).not.toHaveBeenCalled();
  });
});
