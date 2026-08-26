import { z } from "zod";

import { GRADE_MAX, GRADE_MIN } from "@/lib/domain/classification";

export const gradeResultSchema = z.object({
  // A blank input coerces to 0, which is a valid Fail — so treat empty/whitespace
  // as "no grade entered" and let the required error fire instead.
  grade: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce
      .number({ error: "Enter a grade" })
      .int("Grade must be a whole number")
      .min(GRADE_MIN, `Grade can't be below ${GRADE_MIN}`)
      .max(GRADE_MAX, `Grade can't be above ${GRADE_MAX}`)
  ),
});

export type GradeResultInput = z.infer<typeof gradeResultSchema>;
