import { formatDate, formatMoney } from "@/lib/format";
import type { FeesSummary } from "@/lib/domain/fees";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BalanceAmount,
  OverdueBadge,
  SemesterStatusBadge,
} from "@/components/fees/fee-display";
import { RecordPaymentControl } from "@/components/fees/record-payment-dialog";

type PaymentRow = {
  id: string;
  amount: number;
  paidAt: Date;
  referenceNumber: string;
  sequence: number | null;
};

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-base font-medium">{children}</dd>
    </div>
  );
}

export function FeesTab({
  studentId,
  summary,
  payments,
}: {
  studentId: string;
  summary: FeesSummary;
  payments: PaymentRow[];
}) {
  const installments = summary.perSemester.map((s) => ({
    id: s.id,
    sequence: s.sequence,
    dueDate: s.dueDate,
    outstanding: s.balance,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
          <CardDescription>
            The fee is billed per semester. Each balance is derived live from
            the payment ledger below — never stored.
          </CardDescription>
          <CardAction>
            <RecordPaymentControl
              studentId={studentId}
              installments={installments}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-3 gap-4">
            <Stat label="Total fee">{formatMoney(summary.totalFee)}</Stat>
            <Stat label="Paid to date">{formatMoney(summary.totalPaid)}</Stat>
            <Stat label="Outstanding">
              <span className="flex items-center gap-2">
                <BalanceAmount balance={summary.totalOutstanding} />
                {summary.anyOverdue ? <OverdueBadge /> : null}
              </span>
            </Stat>
          </dl>
          {summary.anyOverdue ? (
            <p className="text-sm text-destructive">
              {summary.overdueCount} semester
              {summary.overdueCount === 1 ? "" : "s"} overdue —{" "}
              {formatMoney(summary.overdueAmount)} past due.
            </p>
          ) : summary.nextDue ? (
            <p className="text-sm text-muted-foreground">
              Next payment of {formatMoney(summary.nextDue.balance)} due by{" "}
              {formatDate(summary.nextDue.dueDate)}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              All semesters settled.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Semester schedule
        </h2>
        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semester</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.perSemester.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    Semester {s.sequence}
                  </TableCell>
                  <TableCell>{formatDate(s.dueDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(s.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMoney(s.paid)}
                  </TableCell>
                  <TableCell className="text-right">
                    <BalanceAmount balance={s.balance} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex justify-end">
                      <SemesterStatusBadge status={s.status} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Payment history
        </h2>
        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paidAt)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.sequence ? `Semester ${payment.sequence}` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {payment.referenceNumber}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
