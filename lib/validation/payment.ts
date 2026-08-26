import { z } from "zod";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const recordPaymentSchema = z.object({
  installmentId: z.string().min(1, "Select a semester"),
  amount: z.coerce
    .number({ error: "Enter a payment amount" })
    .positive("Amount must be greater than 0")
    .max(1_000_000, "Amount looks too large")
    .transform(round2),
  // Date-only inputs coerce to UTC midnight; the +1 day grace absorbs the
  // timezone gap so "today" is never wrongly rejected, while clearly-future
  // dates still are.
  paidAt: z.coerce
    .date({ error: "Enter the payment date" })
    .refine(
      (d) => d.getTime() <= Date.now() + 86_400_000,
      "Payment date can't be in the future"
    ),
  referenceNumber: z
    .string()
    .trim()
    .min(3, "Enter a payment reference")
    .max(64, "Reference must be at most 64 characters"),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
