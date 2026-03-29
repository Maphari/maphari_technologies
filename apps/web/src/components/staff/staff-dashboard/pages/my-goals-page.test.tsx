// apps/web/src/components/staff/staff-dashboard/pages/my-goals-page.test.tsx
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MyGoalsPage } from "./my-goals-page";
import {
  loadStaffGoalsWithRefresh,
  createStaffGoalWithRefresh,
  updateStaffGoalWithRefresh,
  deleteStaffGoalWithRefresh,
  type StaffGoal,
} from "@/lib/api/staff/goals";

vi.mock("@/lib/api/staff/goals");

const mockSession = { accessToken: "tok", userId: "u1" } as any;

const activeGoal: StaffGoal = {
  id: "g1",
  staffUserId: "u1",
  title: "Learn TypeScript",
  description: "Study advanced patterns",
  targetDate: "2026-03-31T00:00:00.000Z",
  progress: 40,
  status: "ACTIVE",
  quarter: "Q1-2026",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const achievedGoal: StaffGoal = {
  id: "g2",
  staffUserId: "u1",
  title: "Deploy Project",
  description: null,
  targetDate: "2026-02-28T00:00:00.000Z",
  progress: 100,
  status: "ACHIEVED",
  quarter: "Q1-2026",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-28T00:00:00.000Z",
};

// KPI: active=1, achieved=1, avgProg=Math.round((40+100)/2)=70

beforeEach(() => {
  vi.mocked(loadStaffGoalsWithRefresh).mockResolvedValue({
    unauthorized: false,
    data: [activeGoal, achievedGoal],
    error: null,
    nextSession: null,
  } as any);
});

afterEach(() => vi.clearAllMocks());

// ── Loading state ─────────────────────────────────────────────────────────────

describe("MyGoalsPage — loading state", () => {
  it("shows skeleton blocks while fetching and hides goal titles", () => {
    vi.mocked(loadStaffGoalsWithRefresh).mockImplementation(() => new Promise(() => {}));
    render(<MyGoalsPage isActive session={mockSession} />);
    // Skeleton renders opacity50 + skeleH68 blocks — goal titles should not appear
    expect(screen.queryByText("Learn TypeScript")).not.toBeInTheDocument();
    expect(screen.queryByText("Deploy Project")).not.toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe("MyGoalsPage — error state", () => {
  it("shows error message when API returns result.error", async () => {
    vi.mocked(loadStaffGoalsWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: null,
      error: { message: "DB timeout", code: "ERR" },
      nextSession: null,
    } as any);
    render(<MyGoalsPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("DB timeout")).toBeInTheDocument());
  });

  it("retry button re-triggers the load", async () => {
    vi.mocked(loadStaffGoalsWithRefresh)
      .mockResolvedValueOnce({
        unauthorized: false,
        data: null,
        error: { message: "Network fail", code: "ERR" },
        nextSession: null,
      } as any)
      .mockResolvedValueOnce({
        unauthorized: false,
        data: [activeGoal],
        error: null,
        nextSession: null,
      } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Try again")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(screen.getByText("Learn TypeScript")).toBeInTheDocument());
    expect(loadStaffGoalsWithRefresh).toHaveBeenCalledTimes(2);
  });
});

// ── Quarter tabs ──────────────────────────────────────────────────────────────

describe("MyGoalsPage — quarter tabs", () => {
  it("renders 4 quarter tabs for the current year", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    const year = new Date().getFullYear();
    expect(screen.getByRole("button", { name: `Q1-${year}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Q2-${year}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Q3-${year}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Q4-${year}` })).toBeInTheDocument();
  });

  it("clicking a tab re-fetches with the new quarter", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    const year = new Date().getFullYear();
    fireEvent.click(screen.getByRole("button", { name: `Q3-${year}` }));
    await waitFor(() =>
      expect(loadStaffGoalsWithRefresh).toHaveBeenCalledWith(
        mockSession,
        `Q3-${year}`
      )
    );
  });
});

// ── KPI strip ─────────────────────────────────────────────────────────────────

describe("MyGoalsPage — KPI strip", () => {
  it("shows Active Goals = 1", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    expect(screen.getByTestId("kpi-active-value")).toHaveTextContent("1");
  });

  it("shows Achieved = 1", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    expect(screen.getByTestId("kpi-achieved-value")).toHaveTextContent("1");
  });

  it("shows Avg. Progress = 70%", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    // 70% should appear in the KPI strip (unique — no other KPI uses %)
    expect(screen.getByText("70%")).toBeInTheDocument();
  });
});

// ── Goal cards ────────────────────────────────────────────────────────────────

describe("MyGoalsPage — goal cards", () => {
  it("renders goal titles", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    expect(screen.getByText("Deploy Project")).toBeInTheDocument();
  });

  it("shows Active badge on active goal", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Achieved badge on achieved goal", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Deploy Project");
    // Multiple "Achieved" texts exist (KPI label + badge) — getAllByText should find at least 2
    const achievedEls = screen.getAllByText("Achieved");
    expect(achievedEls.length).toBeGreaterThanOrEqual(2);
  });

  it("shows description when present", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Study advanced patterns");
    expect(screen.getByText("Study advanced patterns")).toBeInTheDocument();
  });

  it("shows progress percentage on the active goal card", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    // active goal progress = 40% — may appear multiple times (progress pct + slider val)
    const pctEls = screen.getAllByText("40%");
    expect(pctEls.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Mark achieved ─────────────────────────────────────────────────────────────

describe("MyGoalsPage — mark achieved", () => {
  it("calls updateStaffGoalWithRefresh with ACHIEVED status and progress 100", async () => {
    const updatedGoal: StaffGoal = { ...activeGoal, status: "ACHIEVED", progress: 100 };
    vi.mocked(updateStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: updatedGoal,
      error: null,
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Mark Achieved");
    fireEvent.click(screen.getByText("Mark Achieved"));

    await waitFor(() =>
      expect(updateStaffGoalWithRefresh).toHaveBeenCalledWith(
        mockSession,
        "g1",
        { status: "ACHIEVED", progress: 100 }
      )
    );
  });

  it("shows mutation error banner when mark achieved fails", async () => {
    vi.mocked(updateStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: null,
      error: { message: "Update failed", code: "ERR" },
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Mark Achieved");
    fireEvent.click(screen.getByText("Mark Achieved"));

    await waitFor(() => expect(screen.getByText("Update failed")).toBeInTheDocument());
  });
});

// ── Cancel goal ───────────────────────────────────────────────────────────────

describe("MyGoalsPage — cancel goal", () => {
  it("removes the goal from the list on successful cancel", async () => {
    vi.mocked(deleteStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: undefined,
      error: null,
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    fireEvent.click(screen.getByRole("button", { name: /cancel goal/i }));

    await waitFor(() =>
      expect(screen.queryByText("Learn TypeScript")).not.toBeInTheDocument()
    );
  });

  it("keeps the goal and shows error on failed cancel", async () => {
    vi.mocked(deleteStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: null,
      error: { message: "Cancel failed", code: "ERR" },
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");
    fireEvent.click(screen.getByRole("button", { name: /cancel goal/i }));

    await waitFor(() => expect(screen.getByText("Cancel failed")).toBeInTheDocument());
    expect(screen.getByText("Learn TypeScript")).toBeInTheDocument();
  });
});

// ── Add goal modal ────────────────────────────────────────────────────────────

describe("MyGoalsPage — add goal modal", () => {
  it("opens modal when Add Goal header button is clicked", async () => {
    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");

    // Click the header "Add Goal" button
    const addGoalBtns = screen.getAllByRole("button", { name: /add goal/i });
    fireEvent.click(addGoalBtns[0]);

    expect(screen.getByRole("dialog", { name: /add goal/i })).toBeInTheDocument();
  });

  it("calls createStaffGoalWithRefresh with form values on submit", async () => {
    const newGoal: StaffGoal = {
      id: "g3",
      staffUserId: "u1",
      title: "New goal",
      description: null,
      targetDate: "2026-06-30T00:00:00.000Z",
      progress: 0,
      status: "ACTIVE",
      quarter: "Q1-2026",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(createStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: newGoal,
      error: null,
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");

    // Open modal
    const addGoalBtns = screen.getAllByRole("button", { name: /add goal/i });
    fireEvent.click(addGoalBtns[0]);

    const dialog = screen.getByRole("dialog", { name: /add goal/i });

    // Fill title
    const titleInput = within(dialog).getByPlaceholderText(/complete react certification/i);
    fireEvent.change(titleInput, { target: { value: "New goal" } });

    // Fill target date
    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-06-30" } });

    // Submit
    const submitBtn = within(dialog).getByRole("button", { name: /^add goal$/i });
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(createStaffGoalWithRefresh).toHaveBeenCalledWith(
        mockSession,
        expect.objectContaining({ title: "New goal", targetDate: "2026-06-30" })
      )
    );
  });

  it("closes modal on successful goal creation", async () => {
    const newGoal: StaffGoal = {
      id: "g3",
      staffUserId: "u1",
      title: "Another goal",
      description: null,
      targetDate: "2026-06-30T00:00:00.000Z",
      progress: 0,
      status: "ACTIVE",
      quarter: "Q1-2026",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(createStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: newGoal,
      error: null,
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");

    // Open modal
    const addGoalBtns = screen.getAllByRole("button", { name: /add goal/i });
    fireEvent.click(addGoalBtns[0]);

    const dialog = screen.getByRole("dialog", { name: /add goal/i });

    // Fill in required fields
    const titleInput = within(dialog).getByPlaceholderText(/complete react certification/i);
    fireEvent.change(titleInput, { target: { value: "Another goal" } });
    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-06-30" } });

    const submitBtn = within(dialog).getByRole("button", { name: /^add goal$/i });
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /add goal/i })).not.toBeInTheDocument()
    );
  });

  it("shows inline error inside modal when creation fails", async () => {
    vi.mocked(createStaffGoalWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: null,
      error: { message: "Creation failed", code: "ERR" },
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await screen.findByText("Learn TypeScript");

    // Open modal
    const addGoalBtns = screen.getAllByRole("button", { name: /add goal/i });
    fireEvent.click(addGoalBtns[0]);

    const dialog = screen.getByRole("dialog", { name: /add goal/i });

    // Fill in required fields
    const titleInput = within(dialog).getByPlaceholderText(/complete react certification/i);
    fireEvent.change(titleInput, { target: { value: "Failing goal" } });
    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-06-30" } });

    const submitBtn = within(dialog).getByRole("button", { name: /^add goal$/i });
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(within(dialog).getByText("Creation failed")).toBeInTheDocument()
    );
    // Modal should remain open
    expect(screen.getByRole("dialog", { name: /add goal/i })).toBeInTheDocument();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("MyGoalsPage — empty state", () => {
  it("shows empty state message when no goals are returned", async () => {
    vi.mocked(loadStaffGoalsWithRefresh).mockResolvedValue({
      unauthorized: false,
      data: [],
      error: null,
      nextSession: null,
    } as any);

    render(<MyGoalsPage isActive session={mockSession} />);
    await waitFor(() => {
      const year = new Date().getFullYear();
      const quarter = `Q${Math.floor(new Date().getMonth() / 3) + 1}-${year}`;
      expect(screen.getByText(`No goals for ${quarter}`)).toBeInTheDocument();
    });
  });
});
