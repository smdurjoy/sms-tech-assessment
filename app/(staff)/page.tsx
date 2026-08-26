import Link from "next/link";
import { AlertTriangle, Building2, UserPlus, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { outstandingBalance } from "@/lib/domain/balance";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const now = new Date();

  const [studentCount, programmeCount, dueInstallments] = await Promise.all([
    prisma.student.count(),
    prisma.programme.count(),
    // Only installments already past their due date can be overdue.
    prisma.feeInstallment.findMany({
      where: { dueDate: { lt: now } },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        student: { select: { id: true, studentId: true, fullName: true } },
      },
    }),
  ]);

  const overdueSums = await prisma.payment.groupBy({
    by: ["installmentId"],
    where: { installmentId: { in: dueInstallments.map((i) => i.id) } },
    _sum: { amount: true },
  });
  const paidByInstallment = new Map(
    overdueSums.map((r) => [r.installmentId, Number(r._sum.amount ?? 0)])
  );

  // Among past-due installments, keep those still carrying a balance and roll
  // them up per student: total overdue amount, how many semesters, and the
  // oldest due date (how long they've been in arrears).
  type OverdueStudent = {
    id: string;
    studentId: string;
    fullName: string;
    amount: number;
    count: number;
    oldestDue: Date;
  };
  const byStudent = new Map<string, OverdueStudent>();
  for (const inst of dueInstallments) {
    const balance = outstandingBalance(
      Number(inst.amount),
      paidByInstallment.get(inst.id) ?? 0
    );
    if (balance <= 0) continue;
    const existing = byStudent.get(inst.student.id);
    if (existing) {
      existing.amount += balance;
      existing.count += 1;
      if (inst.dueDate < existing.oldestDue) existing.oldestDue = inst.dueDate;
    } else {
      byStudent.set(inst.student.id, {
        id: inst.student.id,
        studentId: inst.student.studentId,
        fullName: inst.student.fullName,
        amount: balance,
        count: 1,
        oldestDue: inst.dueDate,
      });
    }
  }
  const overdueStudents = Array.from(byStudent.values()).sort(
    (a, b) => a.oldestDue.getTime() - b.oldestDue.getTime()
  );

  return (
    <>
      <PageHeader
        title="Registry Console"
        description="Manage the student lifecycle — enrolment, fees, assessments, and results."
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/programmes">
                <Building2 />
                New programme
              </Link>
            </Button>
            <Button asChild>
              <Link href="/students/new">
                <UserPlus />
                Enrol student
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Link href="/students" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                Students
              </CardTitle>
              <CardDescription>Enrolled and tracked records</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-3xl font-semibold">
                {studentCount}
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/programmes" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                Programmes
              </CardTitle>
              <CardDescription>Reference data with set fees</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-3xl font-semibold">
                {programmeCount}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <section className="mt-8 lg:max-w-2xl">
        <h2 className="mb-3 font-heading text-sm font-medium text-muted-foreground">
          Needs attention
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Overdue fees
              {overdueStudents.length > 0 ? (
                <span className="ml-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive tabular-nums">
                  {overdueStudents.length}
                </span>
              ) : null}
            </CardTitle>
            <CardDescription>
              A balance outstanding past a semester&apos;s due date — not simply
              unpaid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdueStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No overdue accounts. Newly enrolled students are not flagged
                until a semester&apos;s due date passes.
              </p>
            ) : (
              <ul className="divide-y divide-foreground/10">
                {overdueStudents.map((s) => {
                  const days = Math.max(
                    1,
                    Math.floor(
                      (now.getTime() - new Date(s.oldestDue).getTime()) /
                        86_400_000
                    )
                  );
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/students/${s.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {s.fullName}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {s.studentId}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm tabular-nums">
                            {formatMoney(s.amount)}
                          </div>
                          <div className="text-xs text-destructive">
                            {s.count} semester{s.count === 1 ? "" : "s"} overdue
                            · {days} day{days === 1 ? "" : "s"}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
