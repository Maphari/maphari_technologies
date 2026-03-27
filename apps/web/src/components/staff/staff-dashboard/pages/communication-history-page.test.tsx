// apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommunicationHistoryPage } from "./communication-history-page";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";
import type { AuthSession } from "../../../../lib/auth/session";
import type { StaffCommLog } from "../../../../lib/api/staff/clients";

vi.mock("../../../../lib/api/staff/clients", () => ({
  getStaffAllComms: vi.fn(),
}));

const mockSession = {
  accessToken: "tok",
  user: { id: "u1", email: "staff@test.com", role: "STAFF" },
  nextSession: null,
} as unknown as AuthSession;

const mockLogs: StaffCommLog[] = [
  {
    id: "e1",
    clientId: "c1",
    clientName: "Acme Ltd",
    type: "message",
    subject: "Follow-up proposal",
    fromName: "Alice",
    direction: "outbound",
    actionLabel: "Sent follow-up",
    occurredAt: "2026-03-27T14:32:00.000Z",
  },
  {
    id: "e2",
    clientId: "c1",
    clientName: "Acme Ltd",
    type: "milestone",
    subject: "Sprint 3 done",
    fromName: null,
    direction: "both",
    actionLabel: "Sprint completed",
    occurredAt: "2026-03-25T09:15:00.000Z",
  },
  {
    id: "e3",
    clientId: "c2",
    clientName: "Beta Corp",
    type: "call",
    subject: "Weekly check-in",
    fromName: "Bob",
    direction: "inbound",
    actionLabel: "Received call",
    occurredAt: "2026-03-24T15:00:00.000Z",
  },
];

beforeEach(() => {
  vi.mocked(getStaffAllComms).mockResolvedValue({
    data: mockLogs,
    error: null,
    nextSession: null,
  });
});

afterEach(() => vi.clearAllMocks());

describe("CommunicationHistoryPage — page shell", () => {
  it("renders the page title", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Communication History")).toBeInTheDocument()
    );
  });

  // NOTE: The component must read r.error and set error state from r.error.message
  // (not only from the .catch() path). This test verifies that in-band API errors
  // are displayed to the user.
  it("shows error state when API fails", async () => {
    vi.mocked(getStaffAllComms).mockResolvedValue({
      data: null,
      error: { message: "Server error", code: "ERR" },
      nextSession: null,
    });
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Server error")).toBeInTheDocument()
    );
  });

  it("shows empty state when no events", async () => {
    vi.mocked(getStaffAllComms).mockResolvedValue({
      data: [],
      error: null,
      nextSession: null,
    });
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(
        screen.getByText(/no communication history/i)
      ).toBeInTheDocument()
    );
  });
});

describe("CommunicationHistoryPage — By Client view (default)", () => {
  it("renders client swimlane headers by default", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    expect(screen.getByText("Beta Corp")).toBeInTheDocument();
  });

  it("shows events inside each client lane", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Follow-up proposal")).toBeInTheDocument()
    );
    expect(screen.getByText("Sprint 3 done")).toBeInTheDocument();
    expect(screen.getByText("Weekly check-in")).toBeInTheDocument();
  });

  it("Acme Ltd lane appears before Beta Corp (most recent first)", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    const headers = screen.getAllByText(/Acme Ltd|Beta Corp/);
    expect(headers[0].textContent).toContain("Acme Ltd");
    expect(headers[1].textContent).toContain("Beta Corp");
  });

  it("collapses a lane when its header is clicked", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    // Events visible before collapse
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
    // Click the lane header
    fireEvent.click(screen.getByText("Acme Ltd"));
    // Events should be hidden
    expect(screen.queryByText("Follow-up proposal")).not.toBeInTheDocument();
  });

  it("re-expands a collapsed lane when header is clicked again", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Acme Ltd")); // collapse
    fireEvent.click(screen.getByText("Acme Ltd")); // expand
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
  });
});

describe("CommunicationHistoryPage — filter bar", () => {
  it("renders type pills: All, Messages, Calls, Milestones, Invoices, Files", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /calls/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /milestones/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /invoices/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /files/i })).toBeInTheDocument();
  });

  it("filters to calls only when Calls pill is clicked", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    // Only "Weekly check-in" (call) should be visible
    expect(screen.getByText("Weekly check-in")).toBeInTheDocument();
    expect(screen.queryByText("Follow-up proposal")).not.toBeInTheDocument();
    expect(screen.queryByText("Sprint 3 done")).not.toBeInTheDocument();
  });

  it("clicking active type pill again resets to All", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
  });

  it("hides client lane entirely when filter leaves it with 0 events", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    // Filter to calls — only Beta Corp has a call
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
    expect(screen.getByText("Beta Corp")).toBeInTheDocument();
  });

  it("search filters events and hides empty lanes", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "sprint" } });
    expect(screen.getByText("Sprint 3 done")).toBeInTheDocument();
    expect(screen.queryByText("Follow-up proposal")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta Corp")).not.toBeInTheDocument();
  });

  it("shows no-match empty state when search has no results", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "zzznomatch" } });
    expect(screen.getByText(/no events match/i)).toBeInTheDocument();
  });
});

describe("CommunicationHistoryPage — view toggle", () => {
  it("renders By Client and By Date toggle buttons", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /by client/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /by date/i })).toBeInTheDocument();
  });

  it("switches to By Date view showing date group headers", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /by date/i }));
    // Date groups should now be present (no swimlane client headers)
    // All events still visible
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
    expect(screen.getByText("Sprint 3 done")).toBeInTheDocument();
    expect(screen.getByText("Weekly check-in")).toBeInTheDocument();
    // Client swimlane headers should be gone
    // "Acme Ltd" only appears as a swimlane lane header in the By Client view.
    // In the By Date view, events are listed without client name headers.
    // (If the By Date event row ever shows clientName, update this assertion.)
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
  });

  it("switching back to By Client view shows swimlane headers again", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /by date/i }));
    fireEvent.click(screen.getByRole("button", { name: /by client/i }));
    expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
  });
});

describe("CommunicationHistoryPage — event expand", () => {
  it("expands an event row when clicked, showing excerpt", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Follow-up proposal")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Follow-up proposal"));
    expect(screen.getByText(/sent follow-up/i)).toBeInTheDocument();
  });

  it("collapses an expanded row when clicked again", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Follow-up proposal")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Follow-up proposal"));
    fireEvent.click(screen.getByText("Follow-up proposal"));
    expect(screen.queryByText(/sent follow-up/i)).not.toBeInTheDocument();
  });
});
