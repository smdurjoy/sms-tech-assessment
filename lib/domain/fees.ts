import { outstandingBalance } from "@/lib/domain/balance";
import { isOverdue } from "@/lib/domain/overdue";

// The single per-student fee rollup. Detail page, students list, dashboard, and
// the student portal all derive their numbers from here, so the per-semester
// overdue rule lives in exactly one place. Reuses the shared outstandingBalance
// and isOverdue helpers, applied per installment rather than to one flat fee.

export type SemesterStatus = "PAID" | "DUE" | "OVERDUE" | "CREDIT";

/** One installment plus the payments recorded against it. */
export type InstallmentInput = {
  id: string;
  sequence: number;
  amount: number;
  dueDate: Date;
  paid: number;
};

export type SemesterSummary = InstallmentInput & {
  balance: number;
  status: SemesterStatus;
};

export type FeesSummary = {
  totalFee: number;
  totalPaid: number;
  totalOutstanding: number;
  perSemester: SemesterSummary[];
  nextDue: SemesterSummary | null;
  overdueCount: number;
  overdueAmount: number;
  anyOverdue: boolean;
};

function statusFor(balance: number, dueDate: Date, now: Date): SemesterStatus {
  if (balance < 0) return "CREDIT";
  if (balance === 0) return "PAID";
  return isOverdue({ balance, feeDueDate: dueDate, now }) ? "OVERDUE" : "DUE";
}

export function summariseFees(
  installments: InstallmentInput[],
  now: Date = new Date()
): FeesSummary {
  const perSemester: SemesterSummary[] = [...installments]
    .sort((a, b) => a.sequence - b.sequence)
    .map((it) => {
      const balance = outstandingBalance(it.amount, it.paid);
      return { ...it, balance, status: statusFor(balance, it.dueDate, now) };
    });

  const totalFee = perSemester.reduce((sum, it) => sum + it.amount, 0);
  const totalPaid = perSemester.reduce((sum, it) => sum + it.paid, 0);
  // Netted at student level: a credit on one semester offsets what's owed on
  // another, so this equals feeAmount − Σ payments.
  const totalOutstanding = outstandingBalance(totalFee, totalPaid);

  const overdue = perSemester.filter((it) => it.status === "OVERDUE");
  // Earliest semester still carrying a balance (whether merely due or overdue).
  const nextDue = perSemester.find((it) => it.balance > 0) ?? null;

  return {
    totalFee,
    totalPaid,
    totalOutstanding,
    perSemester,
    nextDue,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, it) => sum + it.balance, 0),
    anyOverdue: overdue.length > 0,
  };
}
