// apps/web/src/components/staff/staff-dashboard/pages/settings-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SettingsPage } from "./settings-page";
import {
  getStaff2faStatusWithRefresh,
  setupStaff2faWithRefresh,
  verifyStaff2faWithRefresh,
  disableStaff2faWithRefresh,
} from "@/lib/api/staff/auth-2fa";

vi.mock("@/lib/api/staff/auth-2fa");

const mockSession = { accessToken: "tok" } as any;

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    isActive: true,
    session: mockSession,
    staffInitials: "AS",
    staffName: "Alice Smith",
    staffEmail: "alice@example.com",
    staffRole: "Developer",
    profileName: "Alice Smith",
    profileEmail: "alice@example.com",
    profileAvatarUrl: "",
    weeklyTargetHours: 40,
    onProfileNameChange: vi.fn(),
    onProfileEmailChange: vi.fn(),
    onProfileAvatarChange: vi.fn(),
    onWeeklyTargetHoursChange: vi.fn(),
    onSaveProfile: vi.fn(),
    onResetProfile: vi.fn(),
    hasProfileChanges: false,
    notifications: {
      taskAssignments: true,
      clientMessages: false,
      deliverableReminders: true,
      standupReminders: false,
      weeklyTimeSummary: false,
    },
    onNotificationChange: vi.fn(),
    onSaveNotifications: vi.fn(),
    onResetNotifications: vi.fn(),
    hasNotificationsChanges: false,
    workspace: {
      timezone: "UTC",
      workStart: "09:00",
      workEnd: "17:00",
      defaultStatus: "Available" as const,
    },
    timezoneOptions: ["UTC", "America/New_York", "Europe/London"],
    onWorkspaceChange: vi.fn(),
    onSaveWorkspace: vi.fn(),
    onResetWorkspace: vi.fn(),
    onUseLocalTimezone: vi.fn(),
    hasWorkspaceChanges: false,
    projects: [{ id: "p1", name: "Project Alpha" }],
    highPriorityClients: ["Acme Corp"],
    theme: "dark" as const,
    onThemeChange: vi.fn(),
    kanbanViewMode: "all" as const,
    onKanbanViewModeChange: vi.fn(),
    kanbanSwimlane: "status" as const,
    onKanbanSwimlaneChange: vi.fn(),
    ...overrides,
  } as Parameters<typeof SettingsPage>[0];
}

beforeEach(() => {
  vi.mocked(getStaff2faStatusWithRefresh).mockResolvedValue({
    unauthorized: false, data: { enabled: false, enabledAt: null }, error: null,
  } as any);
  vi.mocked(setupStaff2faWithRefresh).mockResolvedValue({
    unauthorized: false,
    data: { secret: "TOTP_SECRET", qrCodeDataUrl: "data:image/png;base64,abc", backupCodes: ["CODE1", "CODE2"] },
    error: null,
  } as any);
  vi.mocked(verifyStaff2faWithRefresh).mockResolvedValue({
    unauthorized: false, data: { enabled: true }, error: null,
  } as any);
  vi.mocked(disableStaff2faWithRefresh).mockResolvedValue({
    unauthorized: false, data: { disabled: true }, error: null,
  } as any);
});

afterEach(() => vi.clearAllMocks());

// ── Initial render & tab navigation ──────────────────────────────────────────

describe("SettingsPage — initial render", () => {
  it("renders with Profile tab active by default", () => {
    render(<SettingsPage {...makeProps()} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("shows staff name and role in the sidebar rail", () => {
    render(<SettingsPage {...makeProps()} />);
    // Name appears in both rail and hero — getAllByText confirms at least one
    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Developer").length).toBeGreaterThanOrEqual(1);
  });

  it("clicking Notifications tab shows notification preferences panel", () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^notifications/i }));
    expect(screen.getByText("Task Assignments")).toBeInTheDocument();
  });
});

// ── Profile tab ───────────────────────────────────────────────────────────────

describe("SettingsPage — Profile tab", () => {
  it("Save Profile button calls onSaveProfile", () => {
    const onSaveProfile = vi.fn();
    render(<SettingsPage {...makeProps({ hasProfileChanges: true, onSaveProfile })} />);
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
    expect(onSaveProfile).toHaveBeenCalledOnce();
  });

  it("Reset button calls onResetProfile when profile has changes", () => {
    const onResetProfile = vi.fn();
    render(<SettingsPage {...makeProps({ hasProfileChanges: true, onResetProfile })} />);
    fireEvent.click(screen.getByRole("button", { name: /^reset$/i }));
    expect(onResetProfile).toHaveBeenCalledOnce();
  });

  it("shows unsaved dot on Profile tab when hasProfileChanges=true", () => {
    render(<SettingsPage {...makeProps({ hasProfileChanges: true })} />);
    // Unsaved dot has aria-label="Unsaved changes"
    expect(screen.getByLabelText(/unsaved changes/i)).toBeInTheDocument();
  });
});

// ── Notifications tab ─────────────────────────────────────────────────────────

describe("SettingsPage — Notifications tab", () => {
  it("shows all 5 notification row labels", () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^notifications/i }));
    expect(screen.getByText("Task Assignments")).toBeInTheDocument();
    expect(screen.getByText("Client Messages")).toBeInTheDocument();
    expect(screen.getByText("Deliverable Reminders")).toBeInTheDocument();
    expect(screen.getByText("Standup Reminders")).toBeInTheDocument();
    expect(screen.getByText("Weekly Time Summary")).toBeInTheDocument();
  });

  it("shows unsaved banner when hasNotificationsChanges=true", () => {
    render(<SettingsPage {...makeProps({ hasNotificationsChanges: true })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^notifications/i }));
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
  });

  it("Save button calls onSaveNotifications", () => {
    const onSaveNotifications = vi.fn();
    render(<SettingsPage {...makeProps({ hasNotificationsChanges: true, onSaveNotifications })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSaveNotifications).toHaveBeenCalledOnce();
  });
});

// ── Workspace tab ─────────────────────────────────────────────────────────────

describe("SettingsPage — Workspace tab", () => {
  it("shows timezone select with provided options", () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^workspace/i }));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "UTC" })).toBeInTheDocument();
  });

  it("clicking a status card calls onWorkspaceChange with correct value", () => {
    const onWorkspaceChange = vi.fn();
    render(<SettingsPage {...makeProps({ onWorkspaceChange })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^workspace/i }));
    fireEvent.click(screen.getByRole("button", { name: /^focused/i }));
    expect(onWorkspaceChange).toHaveBeenCalledWith("defaultStatus", "Focused");
  });
});

// ── Appearance tab ────────────────────────────────────────────────────────────

describe("SettingsPage — Appearance tab", () => {
  it("shows Dark and Light theme cards", () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^appearance/i }));
    expect(screen.getByRole("button", { name: /^dark/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^light/i })).toBeInTheDocument();
  });

  it("clicking Light theme card calls onThemeChange with 'light'", () => {
    const onThemeChange = vi.fn();
    render(<SettingsPage {...makeProps({ onThemeChange })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^appearance/i }));
    fireEvent.click(screen.getByRole("button", { name: /^light/i }));
    expect(onThemeChange).toHaveBeenCalledWith("light");
  });
});

// ── Kanban tab ────────────────────────────────────────────────────────────────

describe("SettingsPage — Kanban tab", () => {
  it("clicking a view mode option calls onKanbanViewModeChange", () => {
    const onKanbanViewModeChange = vi.fn();
    render(<SettingsPage {...makeProps({ onKanbanViewModeChange })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^kanban/i }));
    fireEvent.click(screen.getByRole("button", { name: /my work/i }));
    expect(onKanbanViewModeChange).toHaveBeenCalledWith("my_work");
  });

  it("clicking a swimlane option calls onKanbanSwimlaneChange", () => {
    const onKanbanSwimlaneChange = vi.fn();
    render(<SettingsPage {...makeProps({ onKanbanSwimlaneChange })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^kanban/i }));
    fireEvent.click(screen.getByRole("button", { name: /by project/i }));
    expect(onKanbanSwimlaneChange).toHaveBeenCalledWith("project");
  });
});

// ── Focus Areas tab ───────────────────────────────────────────────────────────

describe("SettingsPage — Focus Areas tab", () => {
  it("shows project and client tags", () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^focus/i }));
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("shows empty state message when no projects assigned", () => {
    render(<SettingsPage {...makeProps({ projects: [], highPriorityClients: [] })} />);
    fireEvent.click(screen.getByRole("tab", { name: /^focus/i }));
    expect(screen.getByText(/no active projects assigned/i)).toBeInTheDocument();
  });
});

// ── Security tab — 2FA status ─────────────────────────────────────────────────

describe("SettingsPage — Security tab — 2FA status", () => {
  it("shows loading state while 2FA status is being fetched", () => {
    vi.mocked(getStaff2faStatusWithRefresh).mockImplementation(() => new Promise(() => {}));
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    expect(document.querySelector("[aria-busy='true']")).toBeInTheDocument();
  });

  it("shows Enable 2FA button when 2FA is disabled", async () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    expect(await screen.findByRole("button", { name: /^enable 2fa$/i })).toBeInTheDocument();
  });

  it("shows Disable 2FA button when 2FA is enabled", async () => {
    vi.mocked(getStaff2faStatusWithRefresh).mockResolvedValue({
      unauthorized: false, data: { enabled: true, enabledAt: "2024-01-01" }, error: null,
    } as any);
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    expect(await screen.findByRole("button", { name: /^disable 2fa$/i })).toBeInTheDocument();
  });
});

// ── Security tab — 2FA setup flow ─────────────────────────────────────────────

describe("SettingsPage — Security tab — 2FA setup flow", () => {
  it("clicking Enable 2FA opens setup modal showing QR step", async () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^enable 2fa$/i }));
    expect(await screen.findByText("Set Up Two-Factor Authentication")).toBeInTheDocument();
    // Secret is displayed in the QR step
    expect(screen.getByText("TOTP_SECRET")).toBeInTheDocument();
  });

  it("clicking Next: Verify Code advances to the verify step", async () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^enable 2fa$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /next.*verify/i }));
    expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
  });

  it("entering valid code shows backup codes step", async () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^enable 2fa$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /next.*verify/i }));
    fireEvent.change(screen.getByPlaceholderText("000000"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify.*activate/i }));
    expect(await screen.findByText("Save Your Backup Codes")).toBeInTheDocument();
    expect(screen.getByText("CODE1")).toBeInTheDocument();
    expect(screen.getByText("CODE2")).toBeInTheDocument();
  });

  it("shows error message when setup API fails", async () => {
    vi.mocked(setupStaff2faWithRefresh).mockResolvedValue({
      unauthorized: false, data: null,
      error: { code: "ERR", message: "Setup failed" },
    } as any);
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^enable 2fa$/i }));
    expect(await screen.findByText("Setup failed")).toBeInTheDocument();
  });

  it("shows verify error when code is incorrect", async () => {
    vi.mocked(verifyStaff2faWithRefresh).mockResolvedValue({
      unauthorized: false, data: null,
      error: { code: "ERR", message: "Invalid code" },
    } as any);
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^enable 2fa$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /next.*verify/i }));
    fireEvent.change(screen.getByPlaceholderText("000000"), { target: { value: "999999" } });
    fireEvent.click(screen.getByRole("button", { name: /verify.*activate/i }));
    expect(await screen.findByText("Invalid code")).toBeInTheDocument();
  });
});

// ── Security tab — 2FA disable flow ──────────────────────────────────────────

describe("SettingsPage — Security tab — 2FA disable flow", () => {
  beforeEach(() => {
    vi.mocked(getStaff2faStatusWithRefresh).mockResolvedValue({
      unauthorized: false, data: { enabled: true, enabledAt: null }, error: null,
    } as any);
  });

  it("clicking Disable 2FA opens the disable confirmation modal", async () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^disable 2fa$/i }));
    expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
  });

  it("entering password and confirming calls disableStaff2faWithRefresh", async () => {
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    // Click the security row's Disable 2FA button to open modal
    fireEvent.click(await screen.findByRole("button", { name: /^disable 2fa$/i }));
    fireEvent.change(screen.getByPlaceholderText(/current password/i), { target: { value: "mypassword" } });
    // Two "Disable 2FA" buttons exist: row button + modal confirm — click the last one
    const disableBtns = screen.getAllByRole("button", { name: /^disable 2fa$/i });
    fireEvent.click(disableBtns[disableBtns.length - 1]);
    await waitFor(() =>
      expect(disableStaff2faWithRefresh).toHaveBeenCalledWith(mockSession, "mypassword")
    );
  });

  it("shows error message when disable API fails", async () => {
    vi.mocked(disableStaff2faWithRefresh).mockResolvedValue({
      unauthorized: false, data: null,
      error: { code: "ERR", message: "Wrong password" },
    } as any);
    render(<SettingsPage {...makeProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /^security/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^disable 2fa$/i }));
    fireEvent.change(screen.getByPlaceholderText(/current password/i), { target: { value: "wrongpass" } });
    const disableBtns = screen.getAllByRole("button", { name: /^disable 2fa$/i });
    fireEvent.click(disableBtns[disableBtns.length - 1]);
    expect(await screen.findByText("Wrong password")).toBeInTheDocument();
  });
});
