import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventTopics } from "@maphari/platform";
import { createCoreApp } from "../app.js";
import { eventBus } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

const clientId = "550e8400-e29b-41d4-a716-446655440901";
const projectId = "550e8400-e29b-41d4-a716-446655440902";
const changeRequestId = "550e8400-e29b-41d4-a716-446655440903";

describe("change request workflow integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("auto-creates task/milestone artifacts when client approves a change request", async () => {
    vi.spyOn(eventBus, "publish").mockResolvedValue(undefined);
    vi.spyOn(prisma.projectChangeRequest, "findUnique").mockResolvedValue({
      id: changeRequestId,
      projectId,
      clientId,
      title: "Add reporting dashboard",
      description: null,
      reason: null,
      impactSummary: null,
      status: "ADMIN_APPROVED",
      requestedByRole: "CLIENT",
      requestedByName: "client-user",
      requestedAt: new Date(),
      estimatedHours: 10,
      estimatedCostCents: 200000,
      staffAssessment: null,
      estimatedAt: new Date(),
      estimatedByRole: "STAFF",
      estimatedByName: "staff",
      adminDecisionNote: null,
      adminDecidedAt: new Date(),
      adminDecidedByRole: "ADMIN",
      adminDecidedByName: "admin",
      clientDecisionNote: null,
      clientDecidedAt: null,
      clientDecidedByRole: null,
      clientDecidedByName: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    vi.spyOn(prisma.projectChangeRequest, "update").mockResolvedValue({
      id: changeRequestId,
      projectId,
      clientId,
      title: "Add reporting dashboard",
      description: null,
      reason: null,
      impactSummary: null,
      status: "CLIENT_APPROVED",
      requestedByRole: "CLIENT",
      requestedByName: "client-user",
      requestedAt: new Date(),
      estimatedHours: 10,
      estimatedCostCents: 200000,
      staffAssessment: "Looks good",
      estimatedAt: new Date(),
      estimatedByRole: "STAFF",
      estimatedByName: "staff",
      adminDecisionNote: "Approved",
      adminDecidedAt: new Date(),
      adminDecidedByRole: "ADMIN",
      adminDecidedByName: "admin",
      clientDecisionNote: "Approved",
      clientDecidedAt: new Date(),
      clientDecidedByRole: "CLIENT",
      clientDecidedByName: "client",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    vi.spyOn(prisma.projectTask, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.projectMilestone, "findFirst").mockResolvedValue(null);
    const taskCreateSpy = vi.spyOn(prisma.projectTask, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440904",
      projectId,
      title: "[CR:550e8400] Add reporting dashboard",
      assigneeName: "Assigned by workflow",
      externalLinks: null,
      status: "TODO",
      priority: "MEDIUM",
      progressPercent: 0,
      estimateMinutes: null,
      storyPoints: null,
      sprintId: null,
      blockedAt: null,
      dueAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const milestoneCreateSpy = vi.spyOn(prisma.projectMilestone, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440905",
      projectId,
      title: "[CR:550e8400] Delivery package",
      status: "PENDING",
      progressPercent: 0,
      tags: null,
      dueAt: new Date(),
      fileId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const milestoneApprovalSpy = vi.spyOn(prisma.milestoneApproval, "upsert").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440906",
      milestoneId: "550e8400-e29b-41d4-a716-446655440905",
      projectId,
      clientId,
      status: "PENDING",
      comment: null,
      decidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const projectActivitySpy = vi.spyOn(prisma.projectActivity, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440907",
      projectId,
      clientId,
      type: "CHANGE_REQUEST_UPDATED",
      details: "x",
      createdAt: new Date()
    });

    const app = await createCoreApp();
    const response = await app.inject({
      method: "PATCH",
      url: `/change-requests/${changeRequestId}`,
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": clientId
      },
      payload: {
        status: "CLIENT_APPROVED",
        clientDecisionNote: "Approved"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(taskCreateSpy).toHaveBeenCalled();
    expect(milestoneCreateSpy).toHaveBeenCalled();
    expect(milestoneApprovalSpy).toHaveBeenCalled();
    expect(projectActivitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "CHANGE_REQUEST_TASK_CREATED" })
      })
    );
    expect(projectActivitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "CHANGE_REQUEST_MILESTONE_CREATED" })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.notificationRequested
      })
    );
    await app.close();
  });

  it("allows admin override on finalized change request and records override activity", async () => {
    vi.spyOn(eventBus, "publish").mockResolvedValue(undefined);
    vi.spyOn(prisma.projectChangeRequest, "findUnique").mockResolvedValue({
      id: changeRequestId,
      projectId,
      clientId,
      title: "Add reporting dashboard",
      description: null,
      reason: null,
      impactSummary: null,
      status: "CLIENT_REJECTED",
      requestedByRole: "CLIENT",
      requestedByName: "client-user",
      requestedAt: new Date(),
      estimatedHours: 8,
      estimatedCostCents: 120000,
      staffAssessment: null,
      estimatedAt: new Date(),
      estimatedByRole: "STAFF",
      estimatedByName: "staff",
      adminDecisionNote: null,
      adminDecidedAt: new Date(),
      adminDecidedByRole: "ADMIN",
      adminDecidedByName: "admin",
      clientDecisionNote: "No",
      clientDecidedAt: new Date(),
      clientDecidedByRole: "CLIENT",
      clientDecidedByName: "client",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    vi.spyOn(prisma.projectChangeRequest, "update").mockResolvedValue({
      id: changeRequestId,
      projectId,
      clientId,
      title: "Add reporting dashboard",
      description: null,
      reason: null,
      impactSummary: null,
      status: "SUBMITTED",
      requestedByRole: "CLIENT",
      requestedByName: "client-user",
      requestedAt: new Date(),
      estimatedHours: 8,
      estimatedCostCents: 120000,
      staffAssessment: null,
      estimatedAt: new Date(),
      estimatedByRole: "STAFF",
      estimatedByName: "staff",
      adminDecisionNote: "Reopened",
      adminDecidedAt: new Date(),
      adminDecidedByRole: "ADMIN",
      adminDecidedByName: "admin",
      clientDecisionNote: "No",
      clientDecidedAt: new Date(),
      clientDecidedByRole: "CLIENT",
      clientDecidedByName: "client",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    const activitySpy = vi.spyOn(prisma.projectActivity, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440908",
      projectId,
      clientId,
      type: "CHANGE_REQUEST_UPDATED",
      details: "x",
      createdAt: new Date()
    });

    const app = await createCoreApp();
    const response = await app.inject({
      method: "PATCH",
      url: `/change-requests/${changeRequestId}`,
      headers: {
        "x-user-role": "ADMIN"
      },
      payload: {
        status: "SUBMITTED",
        forceOverride: true,
        adminDecisionNote: "Reopened"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "CHANGE_REQUEST_OVERRIDE" })
      })
    );
    await app.close();
  });

  it("blocks finalized change request transition without admin override", async () => {
    vi.spyOn(prisma.projectChangeRequest, "findUnique").mockResolvedValue({
      id: changeRequestId,
      projectId,
      clientId,
      title: "Add reporting dashboard",
      description: null,
      reason: null,
      impactSummary: null,
      status: "CLIENT_APPROVED",
      requestedByRole: "CLIENT",
      requestedByName: "client-user",
      requestedAt: new Date(),
      estimatedHours: 8,
      estimatedCostCents: 120000,
      staffAssessment: null,
      estimatedAt: new Date(),
      estimatedByRole: "STAFF",
      estimatedByName: "staff",
      adminDecisionNote: null,
      adminDecidedAt: new Date(),
      adminDecidedByRole: "ADMIN",
      adminDecidedByName: "admin",
      clientDecisionNote: "Yes",
      clientDecidedAt: new Date(),
      clientDecidedByRole: "CLIENT",
      clientDecidedByName: "client",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const updateSpy = vi.spyOn(prisma.projectChangeRequest, "update");
    const app = await createCoreApp();
    const response = await app.inject({
      method: "PATCH",
      url: `/change-requests/${changeRequestId}`,
      headers: {
        "x-user-role": "ADMIN"
      },
      payload: {
        status: "SUBMITTED"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(updateSpy).not.toHaveBeenCalled();
    await app.close();
  });
});
