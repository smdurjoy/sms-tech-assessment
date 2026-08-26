"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { assessmentSchema } from "@/lib/validation/assessment";
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
