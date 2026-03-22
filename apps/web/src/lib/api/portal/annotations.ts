// ════════════════════════════════════════════════════════════════════════════
// annotations.ts — Portal API client: deliverable annotation endpoints
// Endpoints : GET  /deliverables/:id/annotations
//             POST /deliverables/:id/annotations
//             PATCH /annotations/:id/resolve
// Scope     : CLIENT (own deliverables only)
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface PortalAnnotation {
  id: string;
  deliverableId: string;
  clientId: string;
  comment: string;
  pageNumber: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPortalAnnotationsWithRefresh(
  session: AuthSession,
  deliverableId: string,
): Promise<AuthorizedResult<PortalAnnotation[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAnnotation[]>(
      `/deliverables/${deliverableId}/annotations`,
      accessToken,
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ANNOTATIONS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch annotations.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPortalAnnotationWithRefresh(
  session: AuthSession,
  deliverableId: string,
  data: { comment: string; pageNumber?: number },
): Promise<AuthorizedResult<PortalAnnotation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAnnotation>(
      `/deliverables/${deliverableId}/annotations`,
      accessToken,
      { method: "POST", body: data },
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ANNOTATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create annotation.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function resolvePortalAnnotationWithRefresh(
  session: AuthSession,
  annotationId: string,
): Promise<AuthorizedResult<PortalAnnotation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAnnotation>(
      `/annotations/${annotationId}/resolve`,
      accessToken,
      { method: "PATCH", body: {} },
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ANNOTATION_RESOLVE_FAILED",
          response.payload.error?.message ?? "Unable to resolve annotation.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
