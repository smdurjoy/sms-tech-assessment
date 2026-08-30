import { z } from "zod";

export const assessmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  module: z
    .string()
    .trim()
    .min(2, "Module must be at least 2 characters")
    .max(100, "Module must be at most 100 characters"),
  programmeId: z.string().min(1, "Select a programme"),
  // Deadlines are intentionally unconstrained in time: a Registrar may record an
  // assessment whose deadline has already passed (late submissions are still
  // accepted, just flagged), so we don't force a future date here.
  deadline: z.coerce.date({ error: "Enter a valid submission deadline" }),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
