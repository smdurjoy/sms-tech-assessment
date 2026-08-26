import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Uploaded submissions live outside the app's served tree and are git-ignored.
 * They are only ever returned through the guarded download route — never as
 * static assets — so files can't be enumerated or fetched by a non-owner.
 */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export type StoredFile = {
  storagePath: string; // opaque filename relative to UPLOAD_DIR
  fileName: string; // original name, shown to users
  mimeType: string;
  fileSize: number;
};

/** Persist an uploaded file under a random, non-enumerable name. */
export async function saveSubmissionFile(
  file: File,
  canonicalMime: string
): Promise<StoredFile> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).toLowerCase();
  const storagePath = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storagePath), buffer);
  return {
    storagePath,
    fileName: file.name,
    mimeType: canonicalMime,
    fileSize: buffer.byteLength,
  };
}

/** Best-effort removal of a replaced/orphaned file — never throws. */
export async function deleteStoredFile(storagePath: string): Promise<void> {
  try {
    await unlink(resolveStoredPath(storagePath));
  } catch {
    // Already gone or never written — nothing to clean up.
  }
}

/** Resolve a stored filename to an absolute path, guarding against traversal. */
export function resolveStoredPath(storagePath: string): string {
  return path.join(UPLOAD_DIR, path.basename(storagePath));
}
