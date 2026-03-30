// apps/web/src/components/staff/staff-dashboard/pages/my-integrations-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MyIntegrationsPage } from "./my-integrations-page";
import {
  loadAdminIntegrationProvidersWithRefresh,
  loadAdminIntegrationRequestsWithRefresh,
  updateAdminIntegrationRequestWithRefresh,
} from "@/lib/api/admin/integrations";
import { getMyProfile } from "@/lib/api/staff/profile";
import { saveSession } from "@/lib/auth/session";

vi.mock("@/lib/api/admin/integrations");
vi.mock("@/lib/api/staff/profile");
vi.mock("@/lib/auth/session");

const mockSession = { accessToken: "tok", user: { email: "alice@example.com" } } as any;
const mockProfile = { firstName: "Alice", lastName: "Smith", id: "u1" };

const mockProviders = [
  {
    id: "p1", key: "jira", label: "Jira", description: "Project tracking for teams",
    category: "Productivity", kind: "assisted" as const, availabilityStatus: "active" as const,
    iconKey: "jira", isClientVisible: true, isRequestEnabled: true,
    supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false,
    sortOrder: 1, launchStage: null, helpUrl: null, setupGuideUrl: null,
    metadata: {}, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "p2", key: "slack", label: "Slack", description: "Team communication",
    category: "Communication", kind: "oauth" as const, availabilityStatus: "active" as const,
    iconKey: "slack", isClientVisible: true, isRequestEnabled: true,
    supportsDisconnect: true, supportsReconnect: true, supportsHealthChecks: false,
    sortOrder: 2, launchStage: null, helpUrl: null, setupGuideUrl: null,
    metadata: {}, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
];

const mockRequests = [
  {
    id: "r1", clientId: "c1", clientName: "Acme Corp", providerKey: "jira",
    providerLabel: "Jira", status: "REQUESTED" as const,
    requestedByUserId: "u1", requestedByName: "Alice", requestedByEmail: "alice@example.com",
    assignedToUserId: null, assignedToName: null, notes: "Urgent setup needed",
    rejectedReason: null, requestedAt: "2024-01-15T10:00:00Z",
    completedAt: null, completedByUserId: null, priority: null,
  },
  {
    id: "r2", clientId: "c2", clientName: "Beta Inc", providerKey: "jira",
    providerLabel: "Jira", status: "IN_PROGRESS" as const,
    requestedByUserId: "u2", requestedByName: "Bob", requestedByEmail: "bob@example.com",
    assignedToUserId: null, assignedToName: null, notes: null,
    rejectedReason: null, requestedAt: "2024-01-16T10:00:00Z",
    completedAt: null, completedByUserId: null, priority: null,
  },
  {
    id: "r3", clientId: "c3", clientName: "Gamma LLC", providerKey: "slack",
    providerLabel: "Slack", status: "COMPLETED" as const,
    requestedByUserId: "u3", requestedByName: "Carol", requestedByEmail: "carol@example.com",
    assignedToUserId: null, assignedToName: null, notes: null,
    rejectedReason: null, requestedAt: "2024-01-10T10:00:00Z",
    completedAt: "2024-01-12T15:00:00Z", completedByUserId: "staff1", priority: null,
  },
];

function okProviders() {
  return { unauthorized: false, data: mockProviders, error: null, nextSession: null };
}
function okRequests() {
  return { unauthorized: false, data: mockRequests, error: null, nextSession: null };
}
function okProfile() {
  return { data: mockProfile, error: null, nextSession: null };
}
function okUpdate() {
  return { unauthorized: false, data: { id: "r1" }, error: null, nextSession: null };
}

beforeEach(() => {
  vi.mocked(loadAdminIntegrationProvidersWithRefresh).mockResolvedValue(okProviders() as any);
  vi.mocked(loadAdminIntegrationRequestsWithRefresh).mockResolvedValue(okRequests() as any);
  vi.mocked(getMyProfile).mockResolvedValue(okProfile() as any);
  vi.mocked(saveSession).mockImplementation(() => {});
  vi.mocked(updateAdminIntegrationRequestWithRefresh).mockResolvedValue(okUpdate() as any);
});

afterEach(() => vi.clearAllMocks());

// ── Loading state ─────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — loading state", () => {
  it("shows skeleton while fetching", () => {
    vi.mocked(loadAdminIntegrationProvidersWithRefresh).mockImplementation(() => new Promise(() => {}));
    render(<MyIntegrationsPage isActive session={mockSession} />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });
});

// ── Inactive ──────────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — inactive state", () => {
  it("renders nothing when isActive is false", () => {
    const { container } = render(<MyIntegrationsPage isActive={false} session={mockSession} />);
    expect(container.firstChild).toBeNull();
  });
});

// ── Stats strip ───────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — stats strip", () => {
  it("shows provider count", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    expect(screen.getByTestId("stat-providers")).toHaveTextContent("2");
  });

  it("shows open request count", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-open");
    expect(screen.getByTestId("stat-open")).toHaveTextContent("2");
  });

  it("shows in-progress count", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-in-progress");
    expect(screen.getByTestId("stat-in-progress")).toHaveTextContent("1");
  });

  it("shows completed count", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-completed");
    expect(screen.getByTestId("stat-completed")).toHaveTextContent("1");
  });
});

// ── Provider grid ─────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — provider grid", () => {
  it("renders all provider cards", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    expect(screen.getAllByText("Jira").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Slack").length).toBeGreaterThan(0);
  });

  it("shows Assisted Setup badge for kind=assisted providers", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    expect(screen.getByText("Assisted Setup")).toBeInTheDocument();
  });

  it("shows OAuth Self-Serve badge for kind=oauth providers", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    expect(screen.getByText("OAuth Self-Serve")).toBeInTheDocument();
  });

  it("shows open count badge on card with active requests", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    // Jira has 2 open requests (r1 REQUESTED + r2 IN_PROGRESS)
    expect(screen.getByText("2 Open")).toBeInTheDocument();
  });

  it("shows View Active Requests button on card with open requests", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    expect(screen.getByRole("button", { name: /view active requests/i })).toBeInTheDocument();
  });

  it("does not show View Active Requests button on card with no open requests", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    // Slack has only a COMPLETED request, no opens — only Jira's button exists
    expect(screen.queryAllByRole("button", { name: /view active requests/i })).toHaveLength(1);
  });
});

// ── Category filter ───────────────────────────────────────────────────────────

describe("MyIntegrationsPage — category filter", () => {
  it("renders All, Productivity and Communication filter pills", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    // Two "All" buttons exist (category filter + queue filter) — first is the category pill
    expect(screen.getAllByRole("button", { name: /^all$/i })[0]).toBeInTheDocument();
    // Filter buttons include count spans so accessible name is e.g. "Productivity1"
    expect(screen.getByRole("button", { name: /^productivity/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^communication/i })).toBeInTheDocument();
  });

  it("filtering by Productivity hides Slack", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    fireEvent.click(screen.getByRole("button", { name: /^productivity/i }));
    // After filtering by Productivity, no element with class itgCardName containing "Slack" should exist
    expect(screen.queryByText("OAuth Self-Serve")).not.toBeInTheDocument();
    expect(screen.getByText("Assisted Setup")).toBeInTheDocument();
  });

  it("filtering by Communication hides Jira", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    fireEvent.click(screen.getByRole("button", { name: /^communication/i }));
    // After filtering by Communication, no Assisted Setup (Jira) badge should exist
    expect(screen.queryByText("Assisted Setup")).not.toBeInTheDocument();
    expect(screen.getByText("OAuth Self-Serve")).toBeInTheDocument();
  });

  it("clicking All after filtering shows all providers", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    fireEvent.click(screen.getByRole("button", { name: /^productivity/i }));
    // Two "All" buttons exist — first is the category filter pill
    fireEvent.click(screen.getAllByRole("button", { name: /^all$/i })[0]);
    expect(screen.getByText("Assisted Setup")).toBeInTheDocument();
    expect(screen.getByText("OAuth Self-Serve")).toBeInTheDocument();
  });
});

// ── Request queue ─────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — request queue", () => {
  it("shows only open requests by default (REQUESTED + IN_PROGRESS)", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByText("Acme Corp · Requested Jan 15, 2024");
    expect(screen.getByText("Beta Inc · Requested Jan 16, 2024")).toBeInTheDocument();
    // COMPLETED request should not appear in default "open" view
    expect(screen.queryByText("Gamma LLC · Requested Jan 10, 2024")).not.toBeInTheDocument();
  });

  it("shows all requests when All queue filter is clicked", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByText("Acme Corp · Requested Jan 15, 2024");
    // Click the "All" button in the queue filter row (last "All" on page)
    const allButtons = screen.getAllByRole("button", { name: /^all$/i });
    fireEvent.click(allButtons[allButtons.length - 1]);
    await screen.findByText("Gamma LLC · Requested Jan 10, 2024");
    expect(screen.getByText("Acme Corp · Requested Jan 15, 2024")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc · Requested Jan 16, 2024")).toBeInTheDocument();
  });

  it("shows empty message when no open requests exist", async () => {
    vi.mocked(loadAdminIntegrationRequestsWithRefresh).mockResolvedValue({
      unauthorized: false, data: [], error: null, nextSession: null,
    } as any);
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByTestId("stat-providers");
    expect(screen.getByText(/no open integration requests/i)).toBeInTheDocument();
  });

  it("shows notes text when notes are present", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByText("Urgent setup needed");
  });

  it("shows correct status badge labels", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    // "Requested" badge appears once (r1 status badge)
    await screen.findByText("Requested");
    // "In Progress" appears as both a stat label and a queue badge — verify at least one exists
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
  });
});

// ── Status updates ────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — status updates", () => {
  it("Start Setup calls update with IN_PROGRESS", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByText("Acme Corp · Requested Jan 15, 2024");
    fireEvent.click(screen.getByRole("button", { name: /^start setup$/i }));
    await waitFor(() =>
      expect(updateAdminIntegrationRequestWithRefresh).toHaveBeenCalledWith(
        mockSession,
        "r1",
        { status: "IN_PROGRESS" }
      )
    );
  });

  it("Mark Complete calls update with COMPLETED", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByText("Beta Inc · Requested Jan 16, 2024");
    fireEvent.click(screen.getByRole("button", { name: /^mark complete$/i }));
    await waitFor(() =>
      expect(updateAdminIntegrationRequestWithRefresh).toHaveBeenCalledWith(
        mockSession,
        "r2",
        { status: "COMPLETED" }
      )
    );
  });

  it("Reject calls update with REJECTED", async () => {
    render(<MyIntegrationsPage isActive session={mockSession} />);
    await screen.findByText("Acme Corp · Requested Jan 15, 2024");
    // Requests are sorted descending by requestedAt: r2 (Jan 16) renders before r1 (Jan 15).
    // Both have canReject=true, so two Reject buttons appear.
    // rejectButtons[0] = r2 (IN_PROGRESS), rejectButtons[1] = r1 (REQUESTED).
    const rejectButtons = screen.getAllByRole("button", { name: /^reject$/i });
    fireEvent.click(rejectButtons[1]); // r1 — the REQUESTED item
    await waitFor(() =>
      expect(updateAdminIntegrationRequestWithRefresh).toHaveBeenCalledWith(
        mockSession,
        "r1",
        { status: "REJECTED" }
      )
    );
  });

  it("calls onNotify success after successful status update", async () => {
    const onNotify = vi.fn();
    render(<MyIntegrationsPage isActive session={mockSession} onNotify={onNotify} />);
    await screen.findByText("Acme Corp · Requested Jan 15, 2024");
    fireEvent.click(screen.getByRole("button", { name: /^start setup$/i }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("success", expect.any(String)));
  });

  it("calls onNotify error when update API fails", async () => {
    vi.mocked(updateAdminIntegrationRequestWithRefresh).mockResolvedValueOnce({
      unauthorized: false, data: null,
      error: { code: "ERR", message: "Update failed" },
      nextSession: null,
    } as any);
    const onNotify = vi.fn();
    render(<MyIntegrationsPage isActive session={mockSession} onNotify={onNotify} />);
    await screen.findByText("Acme Corp · Requested Jan 15, 2024");
    fireEvent.click(screen.getByRole("button", { name: /^start setup$/i }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("error", "Update failed"));
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe("MyIntegrationsPage — error handling", () => {
  it("calls onNotify with error when providers API fails", async () => {
    vi.mocked(loadAdminIntegrationProvidersWithRefresh).mockResolvedValue({
      unauthorized: false, data: null,
      error: { code: "ERR", message: "Providers unavailable" },
      nextSession: null,
    } as any);
    const onNotify = vi.fn();
    render(<MyIntegrationsPage isActive session={mockSession} onNotify={onNotify} />);
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("error", "Providers unavailable"));
  });

  it("calls onNotify with error when requests API fails", async () => {
    vi.mocked(loadAdminIntegrationRequestsWithRefresh).mockResolvedValue({
      unauthorized: false, data: null,
      error: { code: "ERR", message: "Requests unavailable" },
      nextSession: null,
    } as any);
    const onNotify = vi.fn();
    render(<MyIntegrationsPage isActive session={mockSession} onNotify={onNotify} />);
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("error", "Requests unavailable"));
  });

  it("calls onNotify with session-expired error when unauthorized", async () => {
    vi.mocked(loadAdminIntegrationProvidersWithRefresh).mockResolvedValue({
      unauthorized: true, data: null, error: null, nextSession: null,
    } as any);
    const onNotify = vi.fn();
    render(<MyIntegrationsPage isActive session={mockSession} onNotify={onNotify} />);
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("error", expect.stringMatching(/session expired/i)));
  });
});
