import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentStudentId, getRole } from "@/lib/session";
import { resolveStoredPath } from "@/lib/services/uploads";

export const runtime = "nodejs";

/**
 * The only way a submission file leaves the server. Access is enforced here,
 * server-side: staff may fetch any file; a student may fetch only their own.
 * A non-owner gets 404 (not 403) so they can't even confirm the file exists.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    select: {
      studentId: true,
      fileName: true,
      mimeType: true,
      storagePath: true,
    },
  });
  if (!submission) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (getRole() !== "staff") {
    const current = getCurrentStudentId();
    if (current !== submission.studentId) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  let data: Buffer;
  try {
    data = await readFile(resolveStoredPath(submission.storagePath));
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }

  // Keep unicode names intact while giving a safe ASCII fallback.
  const asciiName = submission.fileName.replace(/[^\x20-\x7E]+/g, "_");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": submission.mimeType,
      "Content-Disposition": `attachment; filename="${asciiName.replace(
        /["\\]/g,
        ""
      )}"; filename*=UTF-8''${encodeURIComponent(submission.fileName)}`,
      "Content-Length": String(data.byteLength),
    },
  });
}
