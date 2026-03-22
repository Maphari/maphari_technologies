import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createProjectCollaborationNoteSchema,
  decideProjectRequestSchema,
  createProjectDependencySchema,
  createProjectMilestoneSchema,
  markProjectPaymentMilestoneSchema,
  createProjectWorkSessionSchema,
  createProjectChangeRequestSchema,
  createProjectRequestSchema,
  createProjectSchema,
  createProjectTaskSchema,
  createTaskCollaboratorSchema,
  getProjectChangeRequestsQuerySchema,
  getMilestoneApprovalsQuerySchema,
  getProjectPreferencesQuerySchema,
  getProjectQuerySchema,
  type ApiResponse,
  type Role,
  updateProjectWorkSessionSchema,
  updateTaskCollaboratorSchema,
  updateMilestoneApprovalSchema,
  updateProjectMilestoneSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  updateProjectTaskSchema,
  updateProjectChangeRequestSchema,
  upsertProjectPreferencesSchema
} from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class ProjectsController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("milestone-approvals")
  async listMilestoneApprovals(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getMilestoneApprovalsQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("Invalid milestone approval query");
    }
    const params = new URLSearchParams();
    Object.entries(parsed.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/milestone-approvals?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("milestones/:milestoneId/approval")
  async getMilestoneApproval(
    @Param("milestoneId") milestoneId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/milestones/${milestoneId}/approval`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("milestones/:milestoneId/approval")
  async updateMilestoneApproval(
    @Param("milestoneId") milestoneId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateMilestoneApprovalSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid milestone approval payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/milestones/${milestoneId}/approval`, "PUT", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects")
  async listProjects(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/directory")
  async listProjectsDirectory(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getProjectQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("Invalid project directory query");
    }
    const params = new URLSearchParams();
    Object.entries(parsed.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/directory?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Get("projects/requests")
  async listProjectRequests(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/requests`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId")
  async getProjectDetail(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects")
  async createProject(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid project payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("CLIENT")
  @Post("projects/requests")
  async createProjectRequest(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid project request payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/requests`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("projects/:projectId/request-decision")
  async decideProjectRequest(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = decideProjectRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid project request decision payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/request-decision`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("projects/:projectId")
  async updateProject(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateProjectSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid project update payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("projects/:projectId/status")
  async updateProjectStatus(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateProjectStatusSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid project status payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/projects/${parsedBody.data.projectId}/status`,
      "PATCH",
      { status: parsedBody.data.status },
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/payment-milestones")
  async getProjectPaymentMilestones(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/payment-milestones`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("projects/:projectId/payment-milestones")
  async markProjectPaymentMilestone(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = markProjectPaymentMilestoneSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid project payment milestone payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/payment-milestones`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/:projectId/milestones")
  async createMilestone(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectMilestoneSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid milestone payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/milestones`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("projects/:projectId/milestones/:milestoneId")
  async updateMilestone(
    @Param("projectId") projectId: string,
    @Param("milestoneId") milestoneId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateProjectMilestoneSchema.safeParse({ projectId, milestoneId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid milestone update payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/milestones/${milestoneId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/:projectId/tasks")
  async createTask(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectTaskSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid task payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/tasks`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("projects/:projectId/tasks/:taskId")
  async updateTask(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateProjectTaskSchema.safeParse({ projectId, taskId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid task update payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/tasks/${taskId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("projects/:projectId/tasks/:taskId/collaborators")
  async createTaskCollaborator(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createTaskCollaboratorSchema.safeParse({ projectId, taskId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid task collaborator payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/tasks/${taskId}/collaborators`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("projects/:projectId/tasks/:taskId/collaborators/:collaboratorId")
  async updateTaskCollaborator(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("collaboratorId") collaboratorId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateTaskCollaboratorSchema.safeParse({ projectId, taskId, collaboratorId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid task collaborator update payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/projects/${projectId}/tasks/${taskId}/collaborators/${collaboratorId}`,
      "PATCH",
      parsedBody.data,
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "STAFF",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/collaboration")
  async getProjectCollaboration(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/collaboration`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/:projectId/collaboration/notes")
  async createProjectCollaborationNote(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectCollaborationNoteSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid collaboration note payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/collaboration/notes`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("projects/:projectId/collaboration/sessions")
  async createProjectCollaborationSession(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectWorkSessionSchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid collaboration session payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/collaboration/sessions`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("projects/:projectId/collaboration/sessions/:sessionId")
  async updateProjectCollaborationSession(
    @Param("projectId") projectId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateProjectWorkSessionSchema.safeParse({ projectId, sessionId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid collaboration session update payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/collaboration/sessions/${sessionId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/:projectId/dependencies")
  async createDependency(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectDependencySchema.safeParse({ projectId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid dependency payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/dependencies`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/activities")
  async listProjectActivities(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/activities`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("change-requests")
  async listChangeRequests(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getProjectChangeRequestsQuerySchema.safeParse(query ?? {});
    if (!parsed.success) throw new BadRequestException("Invalid change request query");
    const params = new URLSearchParams();
    Object.entries(parsed.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/change-requests${params.size > 0 ? `?${params.toString()}` : ""}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("change-requests")
  async createChangeRequest(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createProjectChangeRequestSchema.safeParse(body);
    if (!parsedBody.success) throw new BadRequestException("Invalid change request payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/change-requests`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("change-requests/:changeRequestId")
  async updateChangeRequest(
    @Param("changeRequestId") changeRequestId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateProjectChangeRequestSchema.safeParse({ changeRequestId, ...(body as object) });
    if (!parsedBody.success) throw new BadRequestException("Invalid change request update payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/change-requests/${changeRequestId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/analytics")
  async getProjectAnalytics(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/analytics`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/handoff-package")
  async generateHandoffPackage(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/handoff-package`, "POST", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/handoff-exports")
  async listHandoffExports(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/handoff-exports`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/handoff-exports")
  async createHandoffExport(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const payload = (body as { format?: string } | undefined) ?? {};
    if (payload.format && payload.format !== "json" && payload.format !== "markdown") {
      throw new BadRequestException("Invalid handoff export format");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/handoff-exports`, "POST", payload, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/handoff-exports/:exportId/download")
  async resolveHandoffExportDownloadUrl(
    @Param("exportId") exportId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/handoff-exports/${exportId}/download`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("project-preferences")
  async getProjectPreference(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getProjectPreferencesQuerySchema.safeParse(query ?? {});
    if (!parsed.success) throw new BadRequestException("Invalid project preference query");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/project-preferences?key=${parsed.data.key}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("project-preferences")
  async upsertProjectPreference(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = upsertProjectPreferencesSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid project preference payload");
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/project-preferences`, "POST", parsed.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── Project-layer read endpoints (CLIENT-accessible) ─────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/deliverables")
  async listProjectDeliverables(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/deliverables`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/risks")
  async listProjectRisks(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/risks`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("STAFF", "ADMIN")
  @Get("sprints/burn-down")
  async getSprintBurnDown(
    @Query("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return proxyRequest(`${baseUrl}/sprints/burn-down${qs}`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/sprints")
  async listProjectSprints(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/sprints`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/sprints/:sprintId/tasks")
  async listSprintTasks(
    @Param("projectId") projectId: string,
    @Param("sprintId") sprintId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/projects/${projectId}/sprints/${sprintId}/tasks`,
      "GET", undefined, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/phases")
  async listProjectPhases(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/phases`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/sign-offs")
  async listProjectSignOffs(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/sign-offs`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("projects/:projectId/sign-offs/:signOffId/sign")
  async signProjectSignOff(
    @Param("projectId") projectId: string,
    @Param("signOffId") signOffId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/projects/${projectId}/sign-offs/${signOffId}/sign`,
      "PATCH", body as Record<string, unknown>, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/brief")
  async getProjectBrief(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/brief`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── Design Reviews ─────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/design-reviews")
  async listProjectDesignReviews(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/design-reviews`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("design-reviews/:reviewId/resolve")
  async resolveDesignReview(
    @Param("reviewId") reviewId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/design-reviews/${reviewId}/resolve`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("projects/:projectId/decisions")
  async listProjectDecisions(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/${projectId}/decisions`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("decisions")
  async listDecisions(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/decisions${params.size > 0 ? `?${params.toString()}` : ""}`,
      "GET", undefined, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── Approval decision & reminder ───────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("sign-offs/:signOffId")
  async updateSignOffApproval(
    @Param("signOffId") signOffId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/sign-offs/${signOffId}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("sign-offs/:signOffId/remind")
  async sendSignOffReminder(
    @Param("signOffId") signOffId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/sign-offs/${signOffId}/remind`, "POST", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("CLIENT")
  @Get("portal/project-roadmap")
  async getProjectRoadmap(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/portal/project-roadmap`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("CLIENT")
  @Get("portal/projects/:projectId/weekly-spend")
  async getPortalWeeklySpend(
    @Param("projectId") projectId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/portal/projects/${projectId}/weekly-spend`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/:projectId/deliverables/:deliverableId/approve")
  async approveDeliverable(
    @Param("projectId") projectId: string,
    @Param("deliverableId") deliverableId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/projects/${projectId}/deliverables/${deliverableId}/approve`,
      "POST", body as Record<string, unknown>, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("projects/:projectId/deliverables/:deliverableId/request-changes")
  async requestDeliverableChanges(
    @Param("projectId") projectId: string,
    @Param("deliverableId") deliverableId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/projects/${projectId}/deliverables/${deliverableId}/request-changes`,
      "POST", body as Record<string, unknown>, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── Deliverable Annotations ───────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("deliverables/:deliverableId/annotations")
  async listDeliverableAnnotations(
    @Param("deliverableId") deliverableId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/deliverables/${deliverableId}/annotations`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("deliverables/:deliverableId/annotations")
  async createDeliverableAnnotation(
    @Param("deliverableId") deliverableId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/deliverables/${deliverableId}/annotations`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("annotations/:annotationId/resolve")
  async resolveAnnotation(
    @Param("annotationId") annotationId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/annotations/${annotationId}/resolve`, "PATCH", {}, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Post("admin/projects/bulk-status")
  async bulkUpdateProjectStatus(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    if (!body || typeof body !== "object" || !Array.isArray((body as Record<string, unknown>).ids) || typeof (body as Record<string, unknown>).status !== "string") {
      throw new BadRequestException("ids (array) and status (string) are required");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/projects/bulk-status`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
