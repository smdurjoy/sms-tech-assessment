/** A submission is late when it lands strictly after the deadline. */
export function isLate(submittedAt: Date, deadline: Date): boolean {
  return submittedAt.getTime() > deadline.getTime();
}

export function isPastDeadline(deadline: Date, now: Date = new Date()): boolean {
  return now.getTime() > deadline.getTime();
}
