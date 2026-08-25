import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/students/status-badge";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { DeleteStudentControl } from "@/components/students/delete-student-control";

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
    include: { programme: true },
  });

  if (!student) notFound();

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
              feeDueDate: toDateInputValue(student.feeDueDate),
            }}
          />
          <DeleteStudentControl
            studentId={student.id}
            studentName={student.fullName}
          />
        </div>
      </div>

      <Card className="max-w-3xl">
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
            <DetailItem label="Fee (snapshot)">
              {formatMoney(Number(student.feeAmount))}
            </DetailItem>
            <DetailItem label="Fee due date">
              {formatDate(student.feeDueDate)}
            </DetailItem>
            <DetailItem label="Enrolled on">
              {formatDate(student.createdAt)}
            </DetailItem>
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
