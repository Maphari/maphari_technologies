import { timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { signWebhookPayload } from "@maphari/platform";
import { listApiKeys } from "./store.js";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export interface PublicApiAuthResult {
  ok: boolean;
  clientId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export function verifyPublicApiRequest(request: FastifyRequest): PublicApiAuthResult {
  const keyId = request.headers["x-api-key-id"] as string | undefined;
  const signature = request.headers["x-api-signature"] as string | undefined;

  if (!keyId || !signature) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      errorMessage: "Missing x-api-key-id or x-api-signature"
    };
  }

  const keyRecord = listApiKeys().find((record) => safeEqual(record.keyId, keyId));
  if (!keyRecord) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      errorMessage: "Unknown API key"
    };
  }

  const bodyText = JSON.stringify(request.body ?? {});
  const expectedSignature = signWebhookPayload(bodyText, keyRecord.keySecret);

  if (!safeEqual(expectedSignature, signature)) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      errorMessage: "Invalid request signature"
    };
  }

  return { ok: true, clientId: keyRecord.clientId };
}
