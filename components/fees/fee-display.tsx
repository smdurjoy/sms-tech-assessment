import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { SemesterStatus } from "@/lib/domain/fees";
import { Badge } from "@/components/ui/badge";

/** Shown wherever a student's fees are past due with a balance outstanding. */
export function OverdueBadge({ className }: { className?: string }) {
  return (
    <Badge variant="destructive" className={className}>
      Overdue
    </Badge>
  );
}

const SEMESTER_STATUS: Record<
  SemesterStatus,
  { label: string; variant: "secondary" | "destructive" | "outline" }
> = {
  PAID: { label: "Paid", variant: "secondary" },
  DUE: { label: "Due", variant: "outline" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  CREDIT: { label: "Credit", variant: "outline" },
};

/** Per-semester status pill for the fee schedule table. */
export function SemesterStatusBadge({ status }: { status: SemesterStatus }) {
  const { label, variant } = SEMESTER_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

/**
 * Renders an outstanding balance with Registry-friendly wording: a positive
 * balance is money owed, zero is "Settled", and a negative balance is credit.
 */
export function BalanceAmount({
  balance,
  className,
}: {
  balance: number;
  className?: string;
}) {
  if (balance > 0) {
    return (
      <span className={cn("tabular-nums", className)}>
        {formatMoney(balance)}
      </span>
    );
  }
  if (balance < 0) {
    return (
      <span className={cn("tabular-nums text-muted-foreground", className)}>
        {formatMoney(Math.abs(balance))} credit
      </span>
    );
  }
  return (
    <span className={cn("tabular-nums text-muted-foreground", className)}>
      Settled
    </span>
  );
}
