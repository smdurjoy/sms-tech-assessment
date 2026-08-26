import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { summariseFees } from "@/lib/domain/fees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/students/status-badge";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { DeleteStudentControl } from "@/components/students/delete-student-control";
import { OverdueBadge } from "@/components/fees/fee-display";
import { FeesTab } from "@/components/fees/fees-tab";

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      programme: true,
      installments: { orderBy: { sequence: "asc" } },
      payments: { orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!student) notFound();

  // Group the loaded payments onto their installment, then derive every fee
  // number from the shared rollup so the rule lives in one place.
  const paidByInstallment = new Map<string, number>();
  for (const p of student.payments) {
    paidByInstallment.set(
      p.installmentId,
      (paidByInstallment.get(p.installmentId) ?? 0) + Number(p.amount)
    );
  }
  const summary = summariseFees(
    student.installments.map((i) => ({
      id: i.id,
      sequence: i.sequence,
      amount: Number(i.amount),
      dueDate: i.dueDate,
      paid: paidByInstallment.get(i.id) ?? 0,
    }))
  );

  const sequenceByInstallment = new Map(
    student.installments.map((i) => [i.id, i.sequence])
  );
  const paymentRows = student.payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    paidAt: p.paidAt,
    referenceNumber: p.referenceNumber,
    sequence: sequenceByInstallment.get(p.installmentId) ?? null,
  }));

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/students">
            <ArrowLeft />
            Back to students
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {student.fullName}
            </h1>
            <StatusBadge status={student.enrolmentStatus} />
            {summary.anyOverdue ? <OverdueBadge /> : null}
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {student.studentId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditStudentDialog
            student={{
              id: student.id,
              fullName: student.fullName,
              email: student.email,
              academicYear: student.academicYear,
              enrolmentStatus: student.enrolmentStatus,
            }}
          />
          <DeleteStudentControl
            studentId={student.id}
            studentName={student.fullName}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <DetailItem label="Email">{student.email}</DetailItem>
                <DetailItem label="Date of birth">
                  {formatDate(student.dateOfBirth)}
                </DetailItem>
                <DetailItem label="Academic year">
                  {student.academicYear}
                </DetailItem>
                <DetailItem label="Programme">
                  <span className="font-mono">{student.programme.code}</span> —{" "}
                  {student.programme.name}
                </DetailItem>
                <DetailItem label="Total fee">
                  {formatMoney(summary.totalFee)}
                </DetailItem>
                <DetailItem label="Next payment due">
                  {summary.nextDue ? formatDate(summary.nextDue.dueDate) : "—"}
                </DetailItem>
                <DetailItem label="Enrolled on">
                  {formatDate(student.createdAt)}
                </DetailItem>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="pt-2">
          <FeesTab
            studentId={student.id}
            summary={summary}
            payments={paymentRows}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
