import type { Prisma } from "@prisma/client";

import { formatStudentId, parseIntakeYear } from "@/lib/domain/studentId";

/**
 * Allocate the next human-readable Student ID (SMS-YYYY-NNNN) for an intake
 * year. Runs inside the caller's transaction: the upsert takes a row lock on
 * the per-year counter, so concurrent enrolments are serialised and can never
 * be handed the same sequence number.
 */
export async function allocateStudentId(
  tx: Prisma.TransactionClient,
  academicYear: string
): Promise<string> {
  const year = parseIntakeYear(academicYear);
  const sequence = await tx.studentSequence.upsert({
    where: { year },
    create: { year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return formatStudentId(year, sequence.lastSeq);
}
