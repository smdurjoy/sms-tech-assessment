// A student is overdue only once the fee due date has passed with a balance
// still outstanding — a freshly enrolled, unpaid student is NOT overdue.
export function isOverdue(params: {
  balance: number;
  feeDueDate: Date;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  return params.balance > 0 && now.getTime() > params.feeDueDate.getTime();
}
