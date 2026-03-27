import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CommunicationHistoryPage } from "./communication-history-page";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";

vi.mock("../../../../lib/api/staff/clients", () => ({
  getStaffAllComms: vi.fn()
}));

describe("CommunicationHistoryPage", () => {
  const mockGetComms = vi.mocked(getStaffAllComms);
  const session = { accessToken: "token", user: { id: "staff-1" } } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetComms.mockResolvedValue({
      unauthorized: false,
      error: null,
      nextSession: null,
      data: [
        {
          id: "log-1",
          clientId: "c-1",
          clientName: "Acme Labs",
          type: "message",
          subject: "Kickoff approved",
          fromName: "Alex",
          direction: "inbound",
          actionLabel: "Client approved kickoff scope",
          occurredAt: "2030-01-10T08:00:00.000Z"
        },
        {
          id: "log-2",
          clientId: "c-2",
          clientName: "Beta Studio",
          type: "call",
          subject: "Weekly standup",
          fromName: "Sam",
          direction: "outbound",
          actionLabel: "Status call completed",
          occurredAt: "2030-01-09T08:00:00.000Z"
        }
      ]
    });
  });

  it("supports type and search filtering", async () => {
    render(<CommunicationHistoryPage isActive session={session} />);
    await waitFor(() => expect(mockGetComms).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Kickoff approved")).toBeTruthy();
    expect(screen.getByText("Weekly standup")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Filter by type"), { target: { value: "call" } });
    expect(screen.getByText("Weekly standup")).toBeTruthy();
    expect(screen.queryByText("Kickoff approved")).toBeNull();

    fireEvent.change(screen.getByLabelText("Filter by type"), { target: { value: "all" } });
    fireEvent.change(screen.getByPlaceholderText("Search events…"), { target: { value: "Acme" } });
    expect(screen.getByText("Kickoff approved")).toBeTruthy();
    expect(screen.queryByText("Weekly standup")).toBeNull();
  });

  it("refreshes and allows copying an expanded event", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<CommunicationHistoryPage isActive session={session} />);
    await waitFor(() => expect(mockGetComms).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("Kickoff approved"));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(mockGetComms).toHaveBeenCalledTimes(2));
  });
});
