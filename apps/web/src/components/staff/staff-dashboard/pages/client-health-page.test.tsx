// apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ClientHealthPage } from "./client-health-page";
import { getStaffAllHealthScores } from "@/lib/api/staff/clients";
import { createStaffInterventionWithRefresh } from "@/lib/api/staff/interventions";

vi.mock("@/lib/api/staff/clients");
vi.mock("@/lib/api/staff/interventions");
vi.mock("@/lib/api/staff/messaging");
vi.mock("@/lib/auth/session", () => ({ saveSession: vi.fn() }));

const mockSession = { accessToken: "tok", userId: "u1" } as any;

const mockData = [
  {
    id: "client-acme",
    name: "Acme Ltd",
    avatar: "AL",
    project: "Platform Upgrade",
    score: 82,
    trend: "up" as const,
    trendVal: "+6",
    sentiment: "positive" as const,
    lastTouched: "2h ago",
    overdueTasks: 0,
    unreadMessages: 0,
    milestoneDelay: 0,
    retainerBurn: 42,
    invoiceStatus: "paid" as const,
    signals: [{ type: "positive" as const, text: "Milestone approved" }],
  },
  {
    id: "client-beta",
    name: "Beta Co",
    avatar: "BC",
    project: "Ops Rescue",
    score: 44,
    trend: "down" as const,
    trendVal: "-8",
    sentiment: "at_risk" as const,
    lastTouched: "1d ago",
    overdueTasks: 2,
    unreadMessages: 3,
    milestoneDelay: 5,
    retainerBurn: 85,
    invoiceStatus: "overdue" as const,
    signals: [{ type: "negative" as const, text: "Missed checkpoint" }],
  },
  {
    id: "client-gamma",
    name: "Gamma Inc",
    avatar: "GI",
    project: "Brand Refresh",
    score: 63,
    trend: "stable" as const,
    trendVal: "0",
    sentiment: "neutral" as const,
    lastTouched: "3d ago",
    overdueTasks: 0,
    unreadMessages: 1,
    milestoneDelay: 0,
    retainerBurn: 55,
    invoiceStatus: "pending" as const,
    signals: [],
  },
];

beforeEach(() => {
  vi.mocked(getStaffAllHealthScores).mockResolvedValue({
    data: mockData,
    error: null,
    nextSession: null,
  });
  vi.mocked(createStaffInterventionWithRefresh).mockResolvedValue({
    data: {
      id: "int-1",
      clientId: "c-1",
      clientName: "Acme Ltd",
      type: "CLIENT_UPDATE",
      description: "",
      priority: "MEDIUM",
      status: "OPEN",
      dueDate: null,
      createdAt: "2026-01-01T00:00:00Z",
      isOverdue: false,
    },
    error: null,
    nextSession: null,
  });
});

afterEach(() => vi.clearAllMocks());

describe("ClientHealthPage — KPI strip", () => {
  it("shows 4 KPI cards with computed values", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Acme Ltd")).toBeInTheDocument());

    // Portfolio avg: (82 + 44 + 63) / 3 = 63
    expect(screen.getByText("63")).toBeInTheDocument();
    // At risk: 1 (Beta Co score 44 < 50) and Improving: 1 (Acme trend up) both render "1"
    // Use getAllByText since both KPI values are "1"
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
    // Total signals: 1 + 1 + 0 = 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("ClientHealthPage — tab navigation", () => {
  it("renders Overview tab by default", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Acme Ltd")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /overview/i })).toHaveClass(/chTabActive/);
  });

  it("switches to All Clients tab on click", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    // Table should appear
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("switches to At Risk tab and shows only at-risk clients", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /at risk/i }));
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("switches to Positive tab and shows only positive clients", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /positive/i }));
    expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
    expect(screen.queryByText("Beta Co")).not.toBeInTheDocument();
  });
});

describe("ClientHealthPage — client selection", () => {
  it("opens detail panel when a client is clicked in the overview needs-attention list", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    // Beta Co appears in needs-attention (score 44)
    const attentionItem = screen.getByRole("button", { name: /beta co/i });
    fireEvent.click(attentionItem);
    expect(screen.getByText("Ops Rescue")).toBeInTheDocument(); // detail header
    expect(screen.getByText("Send client update")).toBeInTheDocument();
  });

  it("shows risk banner in detail panel for client with score < 50", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    expect(screen.getByText(/below threshold/i)).toBeInTheDocument();
  });

  it("does NOT show risk banner for client with score >= 50", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    fireEvent.click(screen.getByRole("row", { name: /acme ltd/i }));
    expect(screen.queryByText(/below threshold/i)).not.toBeInTheDocument();
  });

  it("clears selection when Clear selection is clicked", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    expect(screen.getByText("Send client update")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(screen.queryByText("Send client update")).not.toBeInTheDocument();
  });

  it("persists selected client when switching tabs", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    // Switch to All Clients tab
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    // Detail panel still shows Beta Co
    expect(screen.getByText("Send client update")).toBeInTheDocument();
  });
});

describe("ClientHealthPage — All Clients tab filtering", () => {
  it("filters by search query", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.change(search, { target: { value: "beta" } });
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
  });

  it("filters by At Risk sentiment pill", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    fireEvent.click(screen.getByRole("button", { name: /at risk/i }));
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
  });
});

describe("ClientHealthPage — quick actions", () => {
  it("calls createStaffInterventionWithRefresh when Flag for admin review is clicked", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    fireEvent.click(screen.getByRole("button", { name: /flag for admin review/i }));
    await waitFor(() =>
      expect(createStaffInterventionWithRefresh).toHaveBeenCalledWith(
        mockSession,
        expect.objectContaining({ clientId: "client-beta", type: "ADMIN_FLAG" })
      )
    );
  });
});

describe("ClientHealthPage — loading and error states", () => {
  it("shows skeleton while loading", () => {
    vi.mocked(getStaffAllHealthScores).mockImplementation(() => new Promise(() => {}));
    render(<ClientHealthPage isActive session={mockSession} />);
    expect(document.querySelector(".skeletonBlock")).toBeTruthy();
  });

  it("shows error message on API failure", async () => {
    vi.mocked(getStaffAllHealthScores).mockResolvedValue({
      data: null,
      error: { message: "Server error", code: "ERR" },
      nextSession: null,
    });
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Server error")).toBeInTheDocument());
  });

  it("shows empty state when no clients", async () => {
    vi.mocked(getStaffAllHealthScores).mockResolvedValue({
      data: [],
      error: null,
      nextSession: null,
    });
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText(/no health data/i)).toBeInTheDocument());
  });
});
