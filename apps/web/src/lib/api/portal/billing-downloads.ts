// ════════════════════════════════════════════════════════════════════════════
// billing-downloads.ts — Portal API: invoice PDF + payment receipt fileId
// Endpoints: GET /invoices/:id/pdf   → { fileId }
//            GET /payments/:id/receipt → { fileId }
// Use the returned fileId with getPortalFileDownloadUrlWithRefresh() to get
// a presigned download URL from the files service.
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

export interface PortalFileRef {
  fileId: string;
}

// ── GET /invoices/:id/pdf ─────────────────────────────────────────────────────

export async function getPortalInvoicePdfFileIdWithRefresh(
  session: AuthSession,
  invoiceId: string
): Promise<AuthorizedResult<PortalFileRef>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFileRef>(`/invoices/${invoiceId}/pdf`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_PDF_FAILED",
          response.payload.error?.message ?? "No PDF available for this invoice."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── GET /payments/:id/receipt ─────────────────────────────────────────────────

export async function getPortalPaymentReceiptFileIdWithRefresh(
  session: AuthSession,
  paymentId: string
): Promise<AuthorizedResult<PortalFileRef>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFileRef>(`/payments/${paymentId}/receipt`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "RECEIPT_FETCH_FAILED",
          response.payload.error?.message ?? "No receipt available for this payment."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
