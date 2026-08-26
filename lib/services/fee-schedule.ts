// Pure, dependency-free helpers for splitting a programme fee into equal
// semester installments with auto-generated due dates. Money is split in
// integer pence so the installments always sum back to the exact total.

/** Semesters fall a fixed interval apart; due dates step by this many months. */
export const SEMESTER_INTERVAL_MONTHS = 4;

export type FeeScheduleItem = {
  sequence: number; // 1..N
  amount: number; // 2dp
  dueDate: Date;
};

/**
 * Add `n` months to a date, clamping the day to the target month's last day so
 * e.g. 31 Jan + 1 month is 28/29 Feb, never an overflow into March. Works in
 * UTC to match the UTC-midnight dates produced by date-only form inputs.
 */
export function addMonths(date: Date, n: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + n;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDayOfTargetMonth);
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

/**
 * Split `totalFee` into `semesters` equal installments in integer pence. Every
 * installment gets the floored base amount; the remainder lands on the last one
 * so the sum equals the total exactly. Due dates step `SEMESTER_INTERVAL_MONTHS`
 * apart from `firstDueDate`.
 */
export function buildFeeSchedule({
  totalFee,
  semesters,
  firstDueDate,
}: {
  totalFee: number;
  semesters: number;
  firstDueDate: Date;
}): FeeScheduleItem[] {
  const totalPence = Math.round(totalFee * 100);
  const basePence = Math.floor(totalPence / semesters);
  const remainderPence = totalPence - basePence * semesters;

  return Array.from({ length: semesters }, (_, i) => {
    const isLast = i === semesters - 1;
    const pence = isLast ? basePence + remainderPence : basePence;
    return {
      sequence: i + 1,
      amount: pence / 100,
      dueDate: addMonths(firstDueDate, i * SEMESTER_INTERVAL_MONTHS),
    };
  });
}
