"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudentId } from "@/lib/session";
import { isPastDeadline } from "@/lib/domain/late";
import {
  canonicalMimeFor,
  validateSubmissionFile,
} from "@/lib/validation/submission";
import { deleteStoredFile, saveSubmissionFile } from "@/lib/services/uploads";
import type { ActionResult } from "@/lib/action-result";

export async function submitAssessment(
  formData: FormData
): Promise<ActionResult> {
  // Server-side identity: the submission is always attributed to the session's
  // student, never to an id sent from the client — a student can't submit as
  // someone else.
  const studentId = requireStudentId();

  const assessmentId = String(formData.get("assessmentId") ?? "");
  const file = formData.get("file");
  if (!assessmentId) {
    return { ok: false, formError: "Missing assessment." };
  }
  if (!(file instanceof File)) {
    return { ok: false, fieldErrors: { file: "Choose a file to upload." } };
  }

  const fileError = validateSubmissionFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (fileError) {
    return { ok: false, fieldErrors: { file: fileError } };
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, deadline: true, programmeId: true },
  });
  if (!assessment) {
    return { ok: false, formError: "This assessment no longer exists." };
  }

  // A student may only submit to assessments set for their own programme. This
  // is enforced here on the server — the portal also hides out-of-programme
  // assessments, but the check can't rely on the UI having filtered them.
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { programmeId: true },
  });
  if (!student || student.programmeId !== assessment.programmeId) {
    return { ok: false, formError: "This assessment isn't part of your programme." };
  }

  const existing = await prisma.submission.findUnique({
    where: { assessmentId_studentId: { assessmentId, studentId } },
    select: { id: true, storagePath: true },
  });

  const now = new Date();
  const past = isPastDeadline(assessment.deadline, now);

  // Resubmission is only allowed before the deadline. A *first* submission is
  // always accepted (and flagged late if past the deadline); replacing an
  // existing one after the deadline is blocked, so late work is final.
  if (existing && past) {
    return {
      ok: false,
      formError:
        "The deadline has passed — your submission is final and can't be replaced.",
    };
  }

  const saved = await saveSubmissionFile(file, canonicalMimeFor(file.name));

  try {
    if (existing) {
      await prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileName: saved.fileName,
          storagePath: saved.storagePath,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
          submittedAt: now, // resets the on-time/late assessment to this upload
        },
      });
      // Only after the DB commit do we drop the file we replaced.
      await deleteStoredFile(existing.storagePath);
    } else {
      await prisma.submission.create({
        data: {
          assessmentId,
          studentId,
          fileName: saved.fileName,
          storagePath: saved.storagePath,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
          submittedAt: now,
        },
      });
    }
  } catch (error) {
    // The write failed — don't leave the just-saved file orphaned on disk.
    await deleteStoredFile(saved.storagePath);
    // Unique constraint = a concurrent first submission won the race.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        formError:
          "You've already submitted to this assessment. Refresh and resubmit if you need to replace it.",
      };
    }
    return {
      ok: false,
      formError: "Could not upload your submission. Please try again.",
    };
  }

  revalidatePath("/portal");
  revalidatePath(`/assessments/${assessmentId}`);
  return { ok: true };
}
