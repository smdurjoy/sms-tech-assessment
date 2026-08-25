// Money is computed in integer pence to avoid floating-point drift, then
// returned as a 2dp number for display. Inputs come from Prisma Decimals
// converted to numbers at the query boundary.

function toPence(amount: number): number {
  return Math.round(amount * 100);
}

function fromPence(pence: number): number {
  return pence / 100;
}

/** Outstanding = fee − Σ payments. Negative means the student is in credit. */
export function outstandingBalance(feeAmount: number, paymentsTotal: number): number {
  return fromPence(toPence(feeAmount) - toPence(paymentsTotal));
}

export function isInCredit(balance: number): boolean {
  return balance < 0;
}

export function isSettled(balance: number): boolean {
  return balance <= 0;
}
