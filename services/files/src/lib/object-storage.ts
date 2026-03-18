// ════════════════════════════════════════════════════════════════════════════
// object-storage.ts — Dual-mode object storage
//
// Strategy (checked in order):
//   1. S3-compatible (AWS S3 / MinIO) — used when AWS_ACCESS_KEY_ID +
//      AWS_SECRET_ACCESS_KEY + S3_BUCKET are all set in the environment
//      and are not placeholder values.
//   2. Local filesystem fallback — used in development or when S3 is not
//      configured.  Stores files under FILES_OBJECT_STORAGE_DIR (default:
//      /tmp/maphari-files).
//
// The public API is identical regardless of which provider is active so
// callers never need to know which backend is in use.
// ════════════════════════════════════════════════════════════════════════════

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// ── Types (dynamic imports avoid hard dependency when SDK not installed) ──────

/* eslint-disable @typescript-eslint/consistent-type-imports */
type S3ClientType = import("@aws-sdk/client-s3").S3Client;
type PutObjectCommandType = import("@aws-sdk/client-s3").PutObjectCommand;
type GetObjectCommandType = import("@aws-sdk/client-s3").GetObjectCommand;
/* eslint-enable @typescript-eslint/consistent-type-imports */

// ── S3 configuration ──────────────────────────────────────────────────────────

interface S3Config { bucket: string; region: string }

function getS3Config(): S3Config | null {
  const key    = process.env.AWS_ACCESS_KEY_ID    ?? "";
  const secret = process.env.AWS_SECRET_ACCESS_KEY ?? "";
  const bucket = process.env.S3_BUCKET            ?? "";
  const region = process.env.AWS_REGION           ?? "af-south-1";

  // Require all three + reject obvious placeholders
  if (!key || !secret || !bucket) return null;
  if (key.toUpperCase().startsWith("REPLACE") || secret.toUpperCase().startsWith("REPLACE")) return null;
  return { bucket, region };
}

let _s3Client: S3ClientType | null = null;

async function getS3(): Promise<{ client: S3ClientType; bucket: string } | null> {
  const cfg = getS3Config();
  if (!cfg) return null;

  if (!_s3Client) {
    try {
      const { S3Client } = await import("@aws-sdk/client-s3");
      _s3Client = new S3Client({
        region: cfg.region,
        credentials: {
          accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        },
        ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {})
      });
    } catch {
      // SDK not installed — fall through to filesystem
      return null;
    }
  }

  return { client: _s3Client, bucket: cfg.bucket };
}

// ── Filesystem fallback ───────────────────────────────────────────────────────

const storageRoot = process.env.FILES_OBJECT_STORAGE_DIR ?? "/tmp/maphari-files";

function resolveStoragePath(storageKey: string): string {
  const safeKey = storageKey.replace(/[^\w.-]/g, "_");
  return path.join(storageRoot, safeKey);
}

async function fsPut(storageKey: string, data: Buffer): Promise<void> {
  await mkdir(storageRoot, { recursive: true });
  await writeFile(resolveStoragePath(storageKey), data);
}

async function fsGet(storageKey: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveStoragePath(storageKey));
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Store an object. Uses S3 when configured, otherwise writes to local disk.
 */
export async function putObject(
  storageKey: string,
  data: Buffer,
  contentType = "application/octet-stream"
): Promise<void> {
  const s3 = await getS3();

  if (s3) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await s3.client.send(
      new PutObjectCommand({
        Bucket:      s3.bucket,
        Key:         storageKey,
        Body:        data,
        ContentType: contentType
      }) as PutObjectCommandType
    );
    return;
  }

  await fsPut(storageKey, data);
}

/**
 * Retrieve an object. Returns null when the key does not exist.
 */
export async function getObject(storageKey: string): Promise<Buffer | null> {
  const s3 = await getS3();

  if (s3) {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const response = await s3.client.send(
        new GetObjectCommand({ Bucket: s3.bucket, Key: storageKey }) as GetObjectCommandType
      );

      const body = (response as { Body?: AsyncIterable<Uint8Array> }).Body;
      if (!body) return null;

      const chunks: Uint8Array[] = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      if (err instanceof Error && err.name === "NoSuchKey") return null;
      throw err;
    }
  }

  return fsGet(storageKey);
}

/**
 * Generate a pre-signed download URL valid for `expiresInSeconds` (S3 only).
 * Returns null when running on local filesystem — caller should serve raw bytes.
 */
export async function getPresignedUrl(
  storageKey: string,
  expiresInSeconds = 900
): Promise<string | null> {
  const s3 = await getS3();
  if (!s3) return null;

  try {
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    return getSignedUrl(
      s3.client,
      new GetObjectCommand({ Bucket: s3.bucket, Key: storageKey }) as GetObjectCommandType,
      { expiresIn: expiresInSeconds }
    );
  } catch {
    return null;
  }
}

/**
 * Health indicator: true when S3 is the active backend, false for filesystem.
 */
export async function isS3Active(): Promise<boolean> {
  return (await getS3()) !== null;
}
