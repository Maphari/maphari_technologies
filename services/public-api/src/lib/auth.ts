import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { lookupActiveKey, touchLastUsed } from "./key-store.js";
import { getRedis } from "./redis.js";

export interface PublicApiAuthResult {
  ok: boolean;
  clientId?: string;
  errorCode?: string;
  errorMessage?: string;
}

const FRESHNESS_WINDOW_MS = 5 * 60 * 1000;
const NONCE_TTL_SECONDS = 300;

export async function verifyPublicApiRequest(
  request: FastifyRequest & { rawBody?: Buffer },
  encryptionKey: string
): Promise<PublicApiAuthResult> {
  const keyId = request.headers["x-api-key-id"] as string | undefined;
  const timestampStr = request.headers["x-timestamp"] as string | undefined;
  const nonce = request.headers["x-nonce"] as string | undefined;
  const signature = request.headers["x-api-signature"] as string | undefined;

  if (!keyId || !timestampStr || !nonce || !signature) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      errorMessage: "Missing required headers: x-api-key-id, x-timestamp, x-nonce, x-api-signature",
    };
  }

  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Invalid x-timestamp" };
  }
  if (Math.abs(Date.now() - timestamp) > FRESHNESS_WINDOW_MS) {
    return { ok: false, errorCode: "TIMESTAMP_EXPIRED", errorMessage: "Request timestamp is outside the 5-minute window" };
  }

  const keyRecord = await lookupActiveKey(keyId, encryptionKey);
  if (!keyRecord) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Unknown or inactive API key" };
  }

  const redis = getRedis();
  const nonceKey = `replay:${keyId}:${nonce}`;
  const stored = await redis.set(nonceKey, "1", "NX", "EX", NONCE_TTL_SECONDS);
  if (stored === null) {
    return { ok: false, errorCode: "REPLAY_DETECTED", errorMessage: "Nonce has already been used" };
  }

  if (!request.rawBody) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Missing raw request body for signature verification" };
  }
  const rawBody = request.rawBody;
  const canonicalPayload = `${timestampStr}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", keyRecord.keySecret)
    .update(canonicalPayload)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  const match =
    expectedBuf.length === signatureBuf.length &&
    timingSafeEqual(expectedBuf, signatureBuf);

  if (!match) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Invalid request signature" };
  }

  touchLastUsed(keyId, request.log);

  return { ok: true, clientId: keyRecord.clientId };
}
