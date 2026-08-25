"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { programmeSchema } from "@/lib/validation/programme";
import { toFieldErrors, type ActionResult } from "@/lib/action-result";

function uniqueFieldError(error: unknown): ActionResult | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = (error.meta?.target as string[] | undefined)?.join(",") ?? "";
    const field = target.includes("code") ? "code" : "name";
    return {
      ok: false,
      fieldErrors: { [field]: `This ${field} is already in use` },
    };
  }
  return null;
}

export async function createProgramme(formData: FormData): Promise<ActionResult> {
  requireStaff();

  const parsed = programmeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    await prisma.programme.create({ data: parsed.data });
  } catch (error) {
    return (
      uniqueFieldError(error) ?? {
        ok: false,
        formError: "Could not create the programme. Please try again.",
      }
    );
  }

  revalidatePath("/programmes");
  return { ok: true };
}

export async function updateProgramme(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  requireStaff();

  const parsed = programmeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    await prisma.programme.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return (
      uniqueFieldError(error) ?? {
        ok: false,
        formError: "Could not update the programme. Please try again.",
      }
    );
  }

  revalidatePath("/programmes");
  return { ok: true };
}

export async function deleteProgramme(id: string): Promise<ActionResult> {
  requireStaff();

  // Reference data in use must not be deleted — it would orphan student records
  // and drop the fee basis. Registries retire programmes, they don't erase them.
  const enrolled = await prisma.student.count({ where: { programmeId: id } });
  if (enrolled > 0) {
    return {
      ok: false,
      formError: `Cannot delete: ${enrolled} student${
        enrolled === 1 ? " is" : "s are"
      } enrolled on this programme.`,
    };
  }

  try {
    await prisma.programme.delete({ where: { id } });
  } catch {
    return {
      ok: false,
      formError: "Could not delete the programme. Please try again.",
    };
  }

  revalidatePath("/programmes");
  return { ok: true };
}
