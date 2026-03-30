// apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TeamPerformancePage } from "./team-performance-page";
import { getStaffTeamPerformance } from "@/lib/api/staff/performance";

vi.mock("@/lib/api/staff/performance");

const mockSession = { accessToken: "tok", userId: "u-alice" } as any;

const mockMembers = [
  {
    id: "s1", name: "Alice Smith", role: "Developer", department: "Eng",
    avatarInitials: "AS", hoursThisWeek: 32, tasksCompleted: 8,
    utilizationPct: 92, peerRating: 4.6, isSelf: true,
  },
  {
    id: "s2", name: "Bob Jones", role: "Designer", department: "Design",
    avatarInitials: "BJ", hoursThisWeek: 16, tasksCompleted: 3,
    utilizationPct: 40, peerRating: null, isSelf: false,
  },
  {
    id: "s3", name: "Carol Tan", role: "PM", department: "Ops",
    avatarInitials: "CT", hoursThisWeek: 38, tasksCompleted: 11,
    utilizationPct: 95, peerRating: 4.9, isSelf: false,
  },
];

beforeEach(() => {
  vi.mocked(getStaffTeamPerformance).mockResolvedValue({
    data: mockMembers, error: null, nextSession: null,
  } as any);
});

afterEach(() => vi.clearAllMocks());

// ── Loading & error states ────────────────────────────────────────────────────

describe("TeamPerformancePage — loading state", () => {
  it("shows skeleton blocks while fetching", () => {
    vi.mocked(getStaffTeamPerformance).mockImplementation(() => new Promise(() => {}));
    render(<TeamPerformancePage isActive session={mockSession} />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });
});

describe("TeamPerformancePage — error state", () => {
  it("shows error message when API returns result.error", async () => {
    vi.mocked(getStaffTeamPerformance).mockResolvedValue({
      data: null, error: { message: "DB timeout", code: "ERR" }, nextSession: null,
    } as any);
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("DB timeout")).toBeInTheDocument());
  });

  it("shows a Retry button that re-triggers the fetch", async () => {
    vi.mocked(getStaffTeamPerformance)
      .mockResolvedValueOnce({ data: null, error: { message: "fail", code: "E" }, nextSession: null } as any)
      .mockResolvedValueOnce({ data: mockMembers, error: null, nextSession: null } as any);

    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
    expect(getStaffTeamPerformance).toHaveBeenCalledTimes(2);
  });
});

// ── KPI cards ─────────────────────────────────────────────────────────────────

describe("TeamPerformancePage — KPI cards", () => {
  it("shows team size", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    // Team size = 3 members
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("shows average utilization", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    // Avg util: (92+40+95)/3 = 75.67 → 76
    expect(screen.getByText("76%")).toBeInTheDocument();
  });
});

// ── Member table ─────────────────────────────────────────────────────────────

describe("TeamPerformancePage — member table", () => {
  it("renders all members", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Carol Tan")).toBeInTheDocument();
  });

  it("shows 'you' badge on the self-row", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("you")).toBeInTheDocument();
    // Only one 'you' badge
    expect(screen.getAllByText("you").length).toBe(1);
  });

  it("shows real task counts (not always 0)", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("8")).toBeInTheDocument();  // Alice tasks
    expect(screen.getByText("11")).toBeInTheDocument(); // Carol tasks
  });

  it("shows — for peerRating when null", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    // Bob has peerRating: null → "—" shown in CSAT cell
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows department values", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Eng")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Ops")).toBeInTheDocument();
  });
});

// ── Sort pills ────────────────────────────────────────────────────────────────

describe("TeamPerformancePage — sort pills", () => {
  it("renders 4 sort pills", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByRole("button", { name: /util/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /csat/i })).toBeInTheDocument();
  });

  it("sorts by Name ascending when Name pill is clicked", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByRole("button", { name: /^name/i }));
    const rows = screen.getAllByRole("row").slice(1); // skip header
    const names = rows.map((r) => r.querySelector("td")?.textContent ?? "");
    // First name alphabetically: Alice < Bob < Carol
    expect(names[0]).toContain("Alice");
  });

  it("reverses sort direction when active pill is clicked again", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const namePill = screen.getByRole("button", { name: /^name/i });
    fireEvent.click(namePill); // asc
    fireEvent.click(namePill); // desc
    const rows = screen.getAllByRole("row").slice(1);
    const names = rows.map((r) => r.querySelector("td")?.textContent ?? "");
    // Last alphabetically first in desc: Carol
    expect(names[0]).toContain("Carol");
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("TeamPerformancePage — empty state", () => {
  it("shows empty state message when no members returned", async () => {
    vi.mocked(getStaffTeamPerformance).mockResolvedValue({
      data: [], error: null, nextSession: null,
    } as any);
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText(/no team data available/i)).toBeInTheDocument()
    );
  });
});

// ── CSAT sort with null-rated members ─────────────────────────────────────────

describe("TeamPerformancePage — CSAT sort with null-rated members", () => {
  const mixedMembers = [
    {
      id: "1", name: "Alice", role: "Developer", department: "Eng",
      avatarInitials: "A", hoursThisWeek: 40, tasksCompleted: 5,
      utilizationPct: 80, peerRating: 4.5, isSelf: false,
    },
    {
      id: "2", name: "Bob", role: "Designer", department: "Design",
      avatarInitials: "B", hoursThisWeek: 28, tasksCompleted: 3,
      utilizationPct: 70, peerRating: null, isSelf: false,
    },
    {
      id: "3", name: "Carol", role: "PM", department: "Ops",
      avatarInitials: "C", hoursThisWeek: 30, tasksCompleted: 2,
      utilizationPct: 60, peerRating: 3.8, isSelf: false,
    },
  ];

  beforeEach(() => {
    vi.mocked(getStaffTeamPerformance).mockResolvedValue({
      data: mixedMembers, error: null, nextSession: null,
    } as any);
  });

  it("CSAT descending: null-rated members appear last", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await screen.findByText("Alice");

    // Click CSAT pill to sort by CSAT desc
    fireEvent.click(screen.getByRole("button", { name: /^csat$/i }));

    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1); // skip header
    const names = dataRows.map((r) => r.textContent);

    const aliceIdx = names.findIndex((t) => t?.includes("Alice"));
    const carolIdx = names.findIndex((t) => t?.includes("Carol"));
    const bobIdx   = names.findIndex((t) => t?.includes("Bob"));

    // Alice (4.5) and Carol (3.8) should both come before Bob (null)
    expect(aliceIdx).toBeLessThan(bobIdx);
    expect(carolIdx).toBeLessThan(bobIdx);
  });

  it("CSAT ascending: null-rated members still appear last", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await screen.findByText("Alice");

    // Click CSAT twice: first click sets CSAT desc, second click sets CSAT asc
    fireEvent.click(screen.getByRole("button", { name: /^csat$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^csat$/i }));

    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1);
    const names = dataRows.map((r) => r.textContent);

    const aliceIdx = names.findIndex((t) => t?.includes("Alice"));
    const carolIdx = names.findIndex((t) => t?.includes("Carol"));
    const bobIdx   = names.findIndex((t) => t?.includes("Bob"));

    // Bob (null) must appear after both Alice (4.5) and Carol (3.8)
    expect(aliceIdx).toBeLessThan(bobIdx);
    expect(carolIdx).toBeLessThan(bobIdx);
  });
});
