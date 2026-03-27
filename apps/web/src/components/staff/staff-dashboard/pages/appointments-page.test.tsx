import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppointmentsPage } from "./appointments-page";
import type { PortalAppointment } from "../../../../lib/api/portal/client-cx";
import {
  loadPortalAppointmentsWithRefresh,
  updatePortalAppointmentWithRefresh
} from "../../../../lib/api/portal/client-cx";

vi.mock("../../../../lib/api/portal/client-cx", () => ({
  loadPortalAppointmentsWithRefresh: vi.fn(),
  updatePortalAppointmentWithRefresh: vi.fn()
}));

vi.mock("../../../../lib/auth/session", () => ({
  saveSession: vi.fn()
}));

function buildAppointment(overrides: Partial<PortalAppointment>): PortalAppointment {
  return {
    id: overrides.id ?? "appt-1",
    clientId: overrides.clientId ?? "client-1",
    type: overrides.type ?? "Discovery Call",
    scheduledAt: overrides.scheduledAt ?? "2030-04-01T10:00:00.000Z",
    durationMins: overrides.durationMins ?? 45,
    ownerName: overrides.ownerName ?? "Acme Ltd",
    status: overrides.status ?? "PENDING",
    notes: overrides.notes ?? "Initial note",
    videoRoomUrl: overrides.videoRoomUrl ?? "https://meet.example.com/abc",
    videoProvider: overrides.videoProvider ?? "MEET",
    videoCallStatus: overrides.videoCallStatus ?? null,
    createdAt: overrides.createdAt ?? "2030-03-20T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2030-03-20T10:00:00.000Z"
  };
}

describe("AppointmentsPage", () => {
  const mockLoad = vi.mocked(loadPortalAppointmentsWithRefresh);
  const mockUpdate = vi.mocked(updatePortalAppointmentWithRefresh);
  const session = { accessToken: "token", user: { id: "staff-1" } } as never;

  const seededAppointments = [
    buildAppointment({
      id: "appt-pending",
      type: "Discovery Call",
      ownerName: "Acme Ltd",
      status: "PENDING",
      scheduledAt: "2030-04-01T10:00:00.000Z",
      notes: "Need requirements review"
    }),
    buildAppointment({
      id: "appt-past",
      type: "Weekly Sync",
      ownerName: "Beta Co",
      status: "CONFIRMED",
      scheduledAt: "2020-01-01T10:00:00.000Z",
      notes: "Past call notes"
    }),
    buildAppointment({
      id: "appt-upcoming-confirmed",
      type: "Roadmap Review",
      ownerName: "Gamma Inc",
      status: "CONFIRMED",
      scheduledAt: "2030-04-02T10:00:00.000Z",
      notes: "Prepare timeline"
    })
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue({
      unauthorized: false,
      data: seededAppointments,
      error: null,
      nextSession: null
    });
    mockUpdate.mockImplementation(async (_session, appointmentId, patch) => {
      const base = seededAppointments.find((item) => item.id === appointmentId);
      if (!base) {
        return { unauthorized: false, data: null, error: { code: "NOT_FOUND", message: "Missing" }, nextSession: null };
      }
      return {
        unauthorized: false,
        data: { ...base, ...patch, updatedAt: "2030-04-01T11:00:00.000Z" },
        error: null,
        nextSession: null
      };
    });
  });

  it("supports search and filter behavior", async () => {
    render(<AppointmentsPage isActive session={session} />);
    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Discovery Call")).toBeTruthy();
    expect(screen.getByText("Weekly Sync")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Pending" }));
    expect(screen.getByText("Discovery Call")).toBeTruthy();
    expect(screen.queryByText("Weekly Sync")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(
      screen.getByPlaceholderText("Search by client, type, notes, status…"),
      { target: { value: "Gamma" } }
    );
    expect(screen.getByText("Roadmap Review")).toBeTruthy();
    expect(screen.queryByText("Discovery Call")).toBeNull();
  });

  it("triggers lifecycle and notes update actions", async () => {
    render(<AppointmentsPage isActive session={session} />);
    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        session,
        "appt-pending",
        expect.objectContaining({ status: "CONFIRMED" })
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        session,
        "appt-past",
        expect.objectContaining({ status: "COMPLETED" })
      )
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        session,
        "appt-upcoming-confirmed",
        expect.objectContaining({ status: "CANCELLED" })
      )
    );

    const notesAreas = screen.getAllByPlaceholderText("Internal appointment notes…");
    fireEvent.change(notesAreas[1], { target: { value: "Updated operational note" } });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        session,
        "appt-pending",
        expect.objectContaining({ notes: "Updated operational note" })
      )
    );
  });
});
