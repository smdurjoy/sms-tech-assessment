"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { allocateStudentId } from "@/lib/services/student-id";
import { buildFeeSchedule } from "@/lib/services/fee-schedule";
import {
  enrolStudentSchema,
  updateStudentSchema,
} from "@/lib/validation/student";
import { recordPaymentSchema } from "@/lib/validation/payment";
import { toFieldErrors, type ActionResult } from "@/lib/action-result";

function isUniqueViolation(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    ((error.meta?.target as string[] | undefined)?.some((t) =>
      t.includes(field)
    ) ??
      false)
  );
}

export async function enrolStudent(formData: FormData): Promise<ActionResult> {
  requireStaff();

  const parsed = enrolStudentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const programme = await prisma.programme.findUnique({
    where: { id: data.programmeId },
  });
  if (!programme) {
    return { ok: false, fieldErrors: { programmeId: "Programme not found" } };
  }

  // Snapshot the programme fee into equal semester installments at enrolment,
  // so later programme fee/duration changes never re-bill this student.
  const schedule = buildFeeSchedule({
    totalFee: Number(programme.feeAmount),
    semesters: programme.durationSemesters,
    firstDueDate: data.firstDueDate,
  });

  // Retry only on a Student ID race; the row-locked counter makes this rare,
  // and the unique constraint is the backstop that triggers the retry.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const student = await prisma.$transaction(async (tx) => {
        const studentId = await allocateStudentId(tx, data.academicYear);
        return tx.student.create({
          data: {
            studentId,
            fullName: data.fullName,
            email: data.email,
            dateOfBirth: data.dateOfBirth,
            programmeId: data.programmeId,
            academicYear: data.academicYear,
            enrolmentStatus: data.enrolmentStatus,
            feeAmount: programme.feeAmount, // total snapshot (= Σ installments)
            installments: {
              create: schedule.map((s) => ({
                sequence: s.sequence,
                amount: s.amount,
                dueDate: s.dueDate,
              })),
            },
          },
        });
      });

      revalidatePath("/students");
      return { ok: true, id: student.id };
    } catch (error) {
      if (isUniqueViolation(error, "email")) {
        return {
          ok: false,
          fieldErrors: { email: "A student with this email already exists" },
        };
      }
      if (isUniqueViolation(error, "studentId")) {
        continue; // race on the sequence — retry
      }
      return {
        ok: false,
        formError: "Could not enrol the student. Please try again.",
      };
    }
  }

  return {
    ok: false,
    formError: "Could not allocate a Student ID. Please try again.",
  };
}

export async function updateStudent(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  requireStaff();

  const parsed = updateStudentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    await prisma.student.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error, "email")) {
      return {
        ok: false,
        fieldErrors: { email: "A student with this email already exists" },
      };
    }
    return {
      ok: false,
      formError: "Could not update the student. Please try again.",
    };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { ok: true };
}

export async function recordPayment(
  studentId: string,
  formData: FormData
): Promise<ActionResult> {
  requireStaff();

  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }
  const { installmentId, ...payment } = parsed.data;

  // The installment must exist and belong to this student — never let a payment
  // be posted against another student's semester.
  const installment = await prisma.feeInstallment.findUnique({
    where: { id: installmentId },
    select: { studentId: true },
  });
  if (!installment || installment.studentId !== studentId) {
    return { ok: false, fieldErrors: { installmentId: "Select a valid semester" } };
  }

  try {
    await prisma.payment.create({
      data: { studentId, installmentId, ...payment },
    });
  } catch (error) {
    if (isUniqueViolation(error, "referenceNumber")) {
      return {
        ok: false,
        fieldErrors: {
          referenceNumber: "This payment reference has already been recorded",
        },
      };
    }
    return {
      ok: false,
      formError: "Could not record the payment. Please try again.",
    };
  }

  // Balance and the overdue flag are derived, so refresh every view that shows
  // them: the student's fees tab, the students list, and the dashboard.
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  requireStaff();

  // A student who has financial or academic history must not be erased — the
  // payment ledger, submissions, and results are audit records. Registries
  // withdraw such students, they don't delete them. Hard delete is only for
  // records with no dependants (e.g. a mistaken or duplicate enrolment).
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      _count: { select: { payments: true, submissions: true, results: true } },
    },
  });
  if (!student) {
    return { ok: false, formError: "This student no longer exists." };
  }

  const { payments, submissions, results } = student._count;
  if (payments > 0 || submissions > 0 || results > 0) {
    const parts: string[] = [];
    if (payments) parts.push(`${payments} payment${payments === 1 ? "" : "s"}`);
    if (submissions)
      parts.push(`${submissions} submission${submissions === 1 ? "" : "s"}`);
    if (results) parts.push(`${results} result${results === 1 ? "" : "s"}`);
    return {
      ok: false,
      formError: `Cannot delete: this student has ${parts.join(
        ", "
      )} on record. Set their status to Withdrawn instead.`,
    };
  }

  try {
    await prisma.student.delete({ where: { id } });
  } catch {
    return {
      ok: false,
      formError: "Could not delete the student. Please try again.",
    };
  }

  revalidatePath("/students");
  return { ok: true };
}
