// apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkloadHeatmapPage } from "./workload-heatmap-page";
import { getWorkloadHeatmap } from "@/lib/api/staff/workload";

vi.mock("@/lib/api/staff/workload");

const mockSession = { accessToken: "tok", userId: "u-alice" } as any;

// Two staff members, two weeks each
// Alice: week 1 = 38/40 = 95% (red, > 90), week 2 = 32/40 = 80% (amber, > 70)
//   → overloaded (has 95% > 90%), NOT available (has 80% > 70%)
// Bob: week 1 = 20/40 = 50% (green), week 2 = 24/40 = 60% (green)
//   → not overloaded, available (all weeks ≤ 70%)
//
// KPI math:
//   totalStaff = 2
//   allCells = [95, 80, 50, 60] → sum=285/4 = 71.25 → Math.round = 71 → "71%"
//   overloaded = 1 (Alice has 95%)
//   available  = 1 (Bob: both weeks ≤ 70%)
const mockHeatmap = {
  staff: [
    {
      staffId: "s1", name: "Alice Smith", role: "Developer",
      weeks: [
        { weekLabel: "Mar 3–Mar 9",   allocatedHours: 38, availableHours: 40 },
        { weekLabel: "Mar 10–Mar 16", allocatedHours: 32, availableHours: 40 },
      ],
    },
    {
      staffId: "s2", name: "Bob Jones", role: "Designer",
      weeks: [
        { weekLabel: "Mar 3–Mar 9",   allocatedHours: 20, availableHours: 40 },
        { weekLabel: "Mar 10–Mar 16", allocatedHours: 24, availableHours: 40 },
      ],
    },
  ],
};

beforeEach(() => {
  vi.mocked(getWorkloadHeatmap).mockResolvedValue({
    data: mockHeatmap, error: null, unauthorized: false,
  } as any);
});

afterEach(() => vi.clearAllMocks());

// ── Loading state ─────────────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — loading state", () => {
  it("does not show staff data while fetch is pending", () => {
    vi.mocked(getWorkloadHeatmap).mockImplementation(() => new Promise(() => {}));
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — error state", () => {
  it("shows error message when API returns result.error", async () => {
    vi.mocked(getWorkloadHeatmap).mockResolvedValue({
      data: null, error: { message: "DB timeout", code: "ERR" }, unauthorized: false,
    } as any);
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("DB timeout")).toBeInTheDocument());
  });

  it("retry: error → click 'Try again' → second call succeeds → data shown", async () => {
    vi.mocked(getWorkloadHeatmap)
      .mockResolvedValueOnce({ data: null, error: { message: "fail", code: "E" }, unauthorized: false } as any)
      .mockResolvedValueOnce({ data: mockHeatmap, error: null, unauthorized: false } as any);

    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
    expect(getWorkloadHeatmap).toHaveBeenCalledTimes(2);
  });
});

// ── Week selector toolbar ─────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — week selector toolbar", () => {
  it("renders buttons '4 weeks', '8 weeks', '12 weeks'", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByRole("button", { name: "4 weeks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8 weeks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12 weeks" })).toBeInTheDocument();
  });

  it("default: getWorkloadHeatmap called with (mockSession, 4)", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(getWorkloadHeatmap).toHaveBeenCalledWith(mockSession, 4);
  });

  it("clicking '8 weeks': getWorkloadHeatmap called with (mockSession, 8)", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByRole("button", { name: "8 weeks" }));
    await waitFor(() => expect(getWorkloadHeatmap).toHaveBeenCalledWith(mockSession, 8));
  });

  it("clicking '12 weeks': getWorkloadHeatmap called with (mockSession, 12)", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByRole("button", { name: "12 weeks" }));
    await waitFor(() => expect(getWorkloadHeatmap).toHaveBeenCalledWith(mockSession, 12));
  });
});

// ── KPI strip ─────────────────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — KPI strip", () => {
  it("shows 'Team Members' label and value '2'", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Team Members")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows 'Avg Utilization' label and value '71%'", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Avg Utilization")).toBeInTheDocument();
    expect(screen.getByText("71%")).toBeInTheDocument();
  });

  it("shows 'Overloaded' label and value '1'", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Overloaded")).toBeInTheDocument();
    // The overloaded KPI value is 1 — rendered as the staffKpiValue div sibling of 'Overloaded'
    const overloadedLabel = screen.getByText("Overloaded");
    const kpiCell = overloadedLabel.closest("div[class]")?.parentElement;
    expect(kpiCell?.textContent).toContain("1");
  });

  it("shows 'Available' label and value '1'", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Available")).toBeInTheDocument();
    const availableLabel = screen.getByText("Available");
    const kpiCell = availableLabel.closest("div[class]")?.parentElement;
    expect(kpiCell?.textContent).toContain("1");
  });
});

// ── Heatmap table ─────────────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — heatmap table", () => {
  it("shows column headers with week labels from API", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Mar 3–Mar 9")).toBeInTheDocument();
    expect(screen.getByText("Mar 10–Mar 16")).toBeInTheDocument();
  });

  it("renders staff names and roles", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("shows cell hours and percentage for Alice's first week and Bob's first week", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("38h / 40h")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("20h / 40h")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows lastUpdated timestamp", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });
});

// ── Legend ────────────────────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — legend", () => {
  it("shows legend labels when data is present", async () => {
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("≤ 70% utilised")).toBeInTheDocument();
    expect(screen.getByText("71 – 90%")).toBeInTheDocument();
    expect(screen.getByText("> 90%")).toBeInTheDocument();
  });

  it("does not show legend labels when data is empty", async () => {
    vi.mocked(getWorkloadHeatmap).mockResolvedValue({
      data: { staff: [] }, error: null, unauthorized: false,
    } as any);
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText(/no team data available/i));
    expect(screen.queryByText("≤ 70% utilised")).not.toBeInTheDocument();
    expect(screen.queryByText("71 – 90%")).not.toBeInTheDocument();
    expect(screen.queryByText("> 90%")).not.toBeInTheDocument();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("WorkloadHeatmapPage — empty state", () => {
  it("shows empty state message when staff array is empty", async () => {
    vi.mocked(getWorkloadHeatmap).mockResolvedValue({
      data: { staff: [] }, error: null, unauthorized: false,
    } as any);
    render(<WorkloadHeatmapPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("No team data available")).toBeInTheDocument());
    expect(screen.getByText(/Workload heatmap will appear/i)).toBeInTheDocument();
  });
});
