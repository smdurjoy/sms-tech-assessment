// Pure formatting/parsing helpers for the human-readable Student ID.
// The atomic sequence allocation lives in the student service (transaction).

/** Extract the 4-digit intake year from an academic year like "2025/26". */
export function parseIntakeYear(academicYear: string): number {
  const match = academicYear.match(/\d{4}/);
  if (!match) {
    throw new Error(`Cannot parse intake year from academic year: "${academicYear}"`);
  }
  return parseInt(match[0], 10);
}

/** Format as SMS-YYYY-NNNN (zero-padded to 4 digits). */
export function formatStudentId(year: number, seq: number): string {
  return `SMS-${year}-${String(seq).padStart(4, "0")}`;
}
