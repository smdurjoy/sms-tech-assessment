import { z } from "zod";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const programmeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(16, "Code must be at most 16 characters")
    .transform((v) => v.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must be at most 120 characters"),
  feeAmount: z.coerce
    .number({ error: "Enter a fee amount" })
    .positive("Fee must be greater than 0")
    .max(1_000_000, "Fee looks too large")
    .transform(round2),
  durationSemesters: z.coerce
    .number({ error: "Enter the number of semesters" })
    .int("Semesters must be a whole number")
    .min(1, "There must be at least 1 semester")
    .max(16, "That's more semesters than any programme runs"),
});

export type ProgrammeInput = z.infer<typeof programmeSchema>;
