import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { signProposalSchema } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { eventBus } from "../lib/infrastructure.js";

export async function registerProposalRoutes(app: FastifyInstance): Promise<void> {
  app.post("/proposals/sign", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = signProposalSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid proposal sign payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    const signedProposal = {
      proposalId: parsedBody.data.proposalId,
      clientId,
      leadId: parsedBody.data.leadId ?? null,
      packageName: parsedBody.data.packageName,
      contactEmail: parsedBody.data.contactEmail,
      signedAt: parsedBody.data.signedAt ?? new Date().toISOString()
    };

    try {
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        clientId,
        topic: EventTopics.proposalSigned,
        payload: signedProposal
      });

      return {
        success: true,
        data: signedProposal,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof signedProposal>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "PROPOSAL_SIGN_FAILED",
          message: "Unable to process proposal signature"
        }
      } as ApiResponse;
    }
  });
}
