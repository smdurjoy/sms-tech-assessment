import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { getCurrentStudentId, getRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { summariseFees } from "@/lib/domain/fees";
import { RoleSwitcher } from "@/components/app/role-switcher";
import { StatusBadge } from "@/components/students/status-badge";
import {
  BalanceAmount,
  OverdueBadge,
  SemesterStatusBadge,
} from "@/components/fees/fee-display";
import {
  Card,
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

export default async function PortalPage() {
  // Handle role states inline (not via a redirect guard) to avoid bouncing
  // between the staff console and the portal on a stale/empty student cookie.
  if (getRole() !== "student") redirect("/");

  const studentId = getCurrentStudentId();
  const student = studentId
    ? await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          programme: true,
          installments: { orderBy: { sequence: "asc" } },
          payments: { select: { installmentId: true, amount: true } },
        },
      })
    : null;

  const students = await prisma.student.findMany({
    select: { id: true, studentId: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  // The student only ever sees their own fees — scoped by the session's student
  // id, derived live from the payment ledger via the shared rollup. Nothing from
  // another student is ever loaded, so the switcher can never leak.
  const paidByInstallment = new Map<string, number>();
  for (const p of student?.payments ?? []) {
    paidByInstallment.set(
      p.installmentId,
      (paidByInstallment.get(p.installmentId) ?? 0) + Number(p.amount)
    );
  }
  const summary = student
    ? summariseFees(
        student.installments.map((i) => ({
          id: i.id,
          sequence: i.sequence,
          amount: Number(i.amount),
          dueDate: i.dueDate,
          paid: paidByInstallment.get(i.id) ?? 0,
        }))
      )
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-14 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <div className="text-sm font-semibold">Student Portal</div>
        </div>
        <RoleSwitcher
          role="student"
          currentStudentId={studentId}
          students={students}
        />
      </header>

      <main className="mx-auto max-w-2xl p-6">
        {!student || !summary ? (
          <Card>
            <CardHeader>
              <CardTitle>No student selected</CardTitle>
              <CardDescription>
                Use the switcher in the top-right to pick a student to view, or
                return to the staff console.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{student.fullName}</span>
                  <StatusBadge status={student.enrolmentStatus} />
                </CardTitle>
                <CardDescription className="font-mono">
                  {student.studentId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Programme</dt>
                    <dd>{student.programme.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Academic year</dt>
                    <dd>{student.academicYear}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="truncate">{student.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Date of birth</dt>
                    <dd>{formatDate(student.dateOfBirth)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Outstanding balance</dt>
                    <dd className="flex items-center gap-2">
                      <BalanceAmount balance={summary.totalOutstanding} />
                      {summary.anyOverdue ? <OverdueBadge /> : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Next payment due</dt>
                    <dd>
                      {summary.nextDue
                        ? formatDate(summary.nextDue.dueDate)
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {summary.anyOverdue ? (
                  <p className="mt-4 text-sm text-destructive">
                    {summary.overdueCount} semester
                    {summary.overdueCount === 1 ? "" : "s"} overdue —{" "}
                    {formatMoney(summary.overdueAmount)} past due. Please settle
                    with the Registry office.
                  </p>
                ) : summary.nextDue ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Next payment of {formatMoney(summary.nextDue.balance)} due by{" "}
                    {formatDate(summary.nextDue.dueDate)}.
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    All semesters settled — nothing outstanding.
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
          </div>
        )}
      </main>
    </div>
  );
}
