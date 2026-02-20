import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const storageRoot = process.env.FILES_OBJECT_STORAGE_DIR ?? "/tmp/maphari-files";

function resolveStoragePath(storageKey: string): string {
  const safeKey = storageKey.replace(/[^\w.-]/g, "_");
  return path.join(storageRoot, safeKey);
}

export async function putObject(storageKey: string, data: Buffer): Promise<void> {
  await mkdir(storageRoot, { recursive: true });
  const filePath = resolveStoragePath(storageKey);
  await writeFile(filePath, data);
}

export async function getObject(storageKey: string): Promise<Buffer | null> {
  const filePath = resolveStoragePath(storageKey);
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

