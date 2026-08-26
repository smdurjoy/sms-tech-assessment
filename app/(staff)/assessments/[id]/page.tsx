import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { isLate, isPastDeadline } from "@/lib/domain/late";
import { Button } from "@/components/ui/button";
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
import {
  AssessmentStatusBadge,
  SubmissionTimingBadge,
} from "@/components/assessments/assessment-badges";

export default async function AssessmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      submissions: {
        orderBy: { submittedAt: "asc" },
        include: {
          student: { select: { fullName: true, studentId: true } },
        },
      },
    },
  });

  if (!assessment) notFound();

  const open = !isPastDeadline(assessment.deadline);
  const submissions = assessment.submissions.map((s) => ({
    ...s,
    late: isLate(s.submittedAt, assessment.deadline),
  }));
  const lateCount = submissions.filter((s) => s.late).length;

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/assessments">
            <ArrowLeft />
            Back to assessments
          </Link>
        </Button>
      </div>

      <div className="mb-6 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {assessment.title}
          </h1>
          <AssessmentStatusBadge open={open} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{assessment.module}</span> · deadline{" "}
          {formatDateTime(assessment.deadline)}
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {submissions.length === 0
              ? "No submissions yet."
              : `${submissions.length} submission${
                  submissions.length === 1 ? "" : "s"
                }${lateCount > 0 ? ` · ${lateCount} late` : ""}. One per student; a late upload is accepted but flagged.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No student has submitted to this assessment yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.student.fullName}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {s.student.studentId}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(s.submittedAt)}</TableCell>
                      <TableCell>
                        <SubmissionTimingBadge late={s.late} />
                      </TableCell>
                      <TableCell className="max-w-[16rem]">
                        <div className="truncate">{s.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(s.fileSize)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <a href={`/api/submissions/${s.id}/file`}>
                            <Download />
                            <span className="sr-only sm:not-sr-only">
                              Download
                            </span>
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
