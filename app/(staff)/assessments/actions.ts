"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { assessmentSchema } from "@/lib/validation/assessment";
import { gradeResultSchema } from "@/lib/validation/result";
import { toFieldErrors, type ActionResult } from "@/lib/action-result";

// No per-user auth in this assessment build; assessments are owned by the office.
const REGISTRY_IDENTITY = "Registry Office";

export async function createAssessment(
  formData: FormData
): Promise<ActionResult> {
  requireStaff();

  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  let id: string;
  try {
    const created = await prisma.assessment.create({
      data: { ...parsed.data, createdBy: REGISTRY_IDENTITY },
    });
    id = created.id;
  } catch {
    return {
      ok: false,
      formError: "Could not create the assessment. Please try again.",
    };
  }

  revalidatePath("/assessments");
  return { ok: true, id };
}

export async function updateAssessment(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  requireStaff();

  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    await prisma.assessment.update({ where: { id }, data: parsed.data });
  } catch {
    return {
      ok: false,
      formError: "Could not update the assessment. Please try again.",
    };
  }

  revalidatePath("/assessments");
  revalidatePath(`/assessments/${id}`);
  return { ok: true };
}

export async function deleteAssessment(id: string): Promise<ActionResult> {
  requireStaff();

  // Submissions and results are academic records — an assessment students have
  // already engaged with must not be erased. Registries retire coursework, they
  // don't delete the evidence of it.
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    select: { _count: { select: { submissions: true, results: true } } },
  });
  if (!assessment) {
    return { ok: false, formError: "This assessment no longer exists." };
  }

  const { submissions, results } = assessment._count;
  if (submissions > 0 || results > 0) {
    const parts: string[] = [];
    if (submissions)
      parts.push(`${submissions} submission${submissions === 1 ? "" : "s"}`);
    if (results) parts.push(`${results} result${results === 1 ? "" : "s"}`);
    return {
      ok: false,
      formError: `Cannot delete: this assessment has ${parts.join(
        " and "
      )} on record.`,
    };
  }

  try {
    await prisma.assessment.delete({ where: { id } });
  } catch {
    return {
      ok: false,
      formError: "Could not delete the assessment. Please try again.",
    };
  }

  revalidatePath("/assessments");
  return { ok: true };
}

/**
 * Enter or correct a student's grade for an assessment. Re-grading updates the
 * mark in place and deliberately leaves the publish state untouched, so a
 * correction to an already-released grade flows straight through to the student.
 */
export async function gradeStudent(
  assessmentId: string,
  studentId: string,
  formData: FormData
): Promise<ActionResult> {
  requireStaff();

  const parsed = gradeResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }
  const { grade } = parsed.data;

  // The result must attach to a real assessment and a gradable student. A
  // withdrawn student has left the register, so is not graded.
  const [assessment, student] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true },
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { enrolmentStatus: true },
    }),
  ]);
  if (!assessment) {
    return { ok: false, formError: "This assessment no longer exists." };
  }
  if (!student) {
    return { ok: false, formError: "This student no longer exists." };
  }
  if (student.enrolmentStatus === "WITHDRAWN") {
    return { ok: false, formError: "A withdrawn student can't be graded." };
  }

  try {
    await prisma.result.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      update: { grade, gradedAt: new Date(), gradedBy: REGISTRY_IDENTITY },
      create: { assessmentId, studentId, grade, gradedBy: REGISTRY_IDENTITY },
    });
  } catch {
    return {
      ok: false,
      formError: "Could not save the grade. Please try again.",
    };
  }

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/portal");
  revalidatePath("/");
  return { ok: true };
}

/** Release or withhold a single student's result. Confidentiality is enforced
 * on the student's read (published-only), but we still null publishedAt on
 * withhold so the record reflects that it is no longer released. */
export async function setResultPublished(
  assessmentId: string,
  studentId: string,
  published: boolean
): Promise<ActionResult> {
  requireStaff();

  const existing = await prisma.result.findUnique({
    where: { assessmentId_studentId: { assessmentId, studentId } },
    select: { id: true },
  });
  if (!existing) {
    return {
      ok: false,
      formError: "Grade this student before publishing a result.",
    };
  }

  try {
    await prisma.result.update({
      where: { id: existing.id },
      data: { published, publishedAt: published ? new Date() : null },
    });
  } catch {
    return {
      ok: false,
      formError: "Could not update the result. Please try again.",
    };
  }

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/portal");
  revalidatePath("/");
  return { ok: true };
}

/** Bulk release/withhold — the exam-board "publish results" action. Only ever
 * touches results that already exist (i.e. graded students). */
export async function publishAllResults(
  assessmentId: string,
  published: boolean
): Promise<ActionResult> {
  requireStaff();

  try {
    await prisma.result.updateMany({
      where: { assessmentId },
      data: { published, publishedAt: published ? new Date() : null },
    });
  } catch {
    return {
      ok: false,
      formError: "Could not update the results. Please try again.",
    };
  }

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/portal");
  revalidatePath("/");
  return { ok: true };
}
