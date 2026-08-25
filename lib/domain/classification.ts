export type Classification = "Fail" | "Pass" | "Merit" | "Distinction";

export const GRADE_MIN = 0;
export const GRADE_MAX = 100;

export function isValidGrade(grade: number): boolean {
  return Number.isInteger(grade) && grade >= GRADE_MIN && grade <= GRADE_MAX;
}

/** Bands: <40 Fail · 40–59 Pass · 60–69 Merit · 70–100 Distinction. */
export function classify(grade: number): Classification {
  if (grade >= 70) return "Distinction";
  if (grade >= 60) return "Merit";
  if (grade >= 40) return "Pass";
  return "Fail";
}
