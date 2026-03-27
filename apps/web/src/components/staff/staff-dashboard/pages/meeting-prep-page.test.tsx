import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MeetingPrepPage } from "./meeting-prep-page";
import { getStaffMeetingsWithRefresh, type StaffMeeting } from "../../../../lib/api/staff";

vi.mock("../../../../lib/api/staff", () => ({
  getStaffMeetingsWithRefresh: vi.fn()
}));

vi.mock("../../../../lib/auth/session", () => ({
  saveSession: vi.fn()
}));

function buildMeeting(overrides: Partial<StaffMeeting>): StaffMeeting {
  return {
    id: overrides.id ?? "meeting-1",
    title: overrides.title ?? "Acme Weekly",
    clientId: overrides.clientId ?? "client-1",
    scheduledAt: overrides.scheduledAt ?? "2030-05-01T09:00:00.000Z",
    durationMinutes: overrides.durationMinutes ?? 45,
    agenda: overrides.agenda ?? "- Review goals\n- Risks",
    notes: overrides.notes ?? "Prepare deliverables",
    status: overrides.status ?? "SCHEDULED",
    videoRoomUrl: overrides.videoRoomUrl ?? "https://meet.example.com/room",
    videoProvider: overrides.videoProvider ?? "MEET",
    videoCallStatus: overrides.videoCallStatus ?? null,
    createdAt: overrides.createdAt ?? "2030-04-20T09:00:00.000Z"
  };
}

describe("MeetingPrepPage", () => {
  const mockGetMeetings = vi.mocked(getStaffMeetingsWithRefresh);
  const session = { accessToken: "token", user: { id: "staff-1" } } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMeetings.mockResolvedValue({
      unauthorized: false,
      error: null,
      nextSession: null,
      data: [
        buildMeeting({ id: "m-scheduled", title: "Acme Planning", status: "SCHEDULED" }),
        buildMeeting({ id: "m-completed", title: "Beta Retrospective", status: "COMPLETED" })
      ]
    });
  });

  it("supports meeting search and status filtering", async () => {
    render(<MeetingPrepPage isActive session={session} />);
    await waitFor(() => expect(mockGetMeetings).toHaveBeenCalledTimes(1));

    expect(screen.getAllByText("Acme Planning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beta Retrospective").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "completed" }));
    expect(screen.getAllByText("Beta Retrospective").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acme Planning")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "all" }));
    fireEvent.change(screen.getByPlaceholderText("Search meetings…"), { target: { value: "Acme" } });
    expect(screen.getAllByText("Acme Planning").length).toBeGreaterThan(0);
    expect(screen.queryByText("Beta Retrospective")).toBeNull();
  });

  it("copies video link and notifies success", async () => {
    const notify = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<MeetingPrepPage isActive session={session} onNotify={notify} />);
    await waitFor(() => expect(mockGetMeetings).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://meet.example.com/room"));
    expect(notify).toHaveBeenCalledWith("success", "Video link copied.");
  });
});
