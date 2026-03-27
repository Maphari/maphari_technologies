import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ClientsPage } from "./clients-page";
import type { ClientThread } from "../types";

function buildThread(overrides: Partial<ClientThread> = {}): ClientThread {
  return {
    id: "thread-1",
    name: "Acme",
    project: "Platform Revamp",
    preview: "Need update on sprint.",
    time: "2m ago",
    unread: true,
    avatar: {
      label: "AC",
      bg: "color-mix(in srgb, var(--accent) 15%, transparent)",
      color: "var(--accent)"
    },
    ...overrides
  };
}

describe("ClientsPage", () => {
  it("supports create-thread flow and disables thread actions when no thread is selected", async () => {
    const onCreateThread = vi.fn().mockResolvedValue(true);
    render(
      <ClientsPage
        isActive
        openConversationsCount={1}
        threadItems={[buildThread()]}
        threadFilter="all"
        threadCounts={{ all: 1, open: 1, unread: 1, project: 1, general: 0 }}
        queueCounts={{ unassigned: 0, sla_risk: 0, escalated: 0, awaiting_client: 0, needs_callback: 0 }}
        onThreadFilterChange={() => {}}
        threadSearch=""
        onThreadSearchChange={() => {}}
        newThreadSubject="Urgent delivery update"
        onNewThreadSubjectChange={() => {}}
        newThreadClientId="client-1"
        onNewThreadClientIdChange={() => {}}
        newThreadClientOptions={[{ id: "client-1", name: "Acme" }]}
        creatingThread={false}
        onCreateThread={onCreateThread}
        selectedConversationId={null}
        selectedThread={null}
        selectedConversation={null}
        conversationMessages={[]}
        sentMessageIds={[]}
        conversationNotes={[]}
        conversationEscalations={[]}
        messagesLoading={false}
        composeMessage=""
        sendingMessage={false}
        lastSendFailed={false}
        lastSendError={null}
        noteText=""
        escalationReason=""
        escalationSeverity="MEDIUM"
        onComposeMessageChange={() => {}}
        onNoteTextChange={() => {}}
        onEscalationReasonChange={() => {}}
        onEscalationSeverityChange={() => {}}
        onSendMessage={() => {}}
        onRetrySendMessage={() => {}}
        onAddNote={() => {}}
        onEscalate={() => {}}
        onEscalationAcknowledge={() => {}}
        onEscalationResolve={() => {}}
        onEscalationReopen={() => {}}
        onEscalationAssignToMe={() => {}}
        onClientClick={() => {}}
        onOpenThreadTask={() => {}}
        onOpenThreadFiles={() => {}}
        onCreateTaskFromThread={() => {}}
        onPrefillFollowUpNote={() => {}}
        onScheduleCallback={() => {}}
        onComposeSubmitShortcut={() => {}}
        staffInitials="ST"
        viewerUserId="staff-1"
        onAssignToMe={() => {}}
        onUnassign={() => {}}
      />
    );

    expect((screen.getByRole("button", { name: /View Task/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Attach file/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTitle("Create task from thread") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /New Thread/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create" }));
    });
    expect(onCreateThread).toHaveBeenCalledTimes(1);
  });
});
