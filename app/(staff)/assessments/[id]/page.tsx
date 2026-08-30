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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Marksheet, type MarksheetRow } from "@/components/assessments/marksheet";

export default async function AssessmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      programme: { select: { name: true, code: true } },
      submissions: {
        orderBy: { submittedAt: "asc" },
        include: {
          student: { select: { fullName: true, studentId: true } },
        },
      },
      results: {
        select: { studentId: true, grade: true, published: true },
      },
    },
  });

  if (!assessment) notFound();

  // Marksheet roster: every non-withdrawn student *on this assessment's
  // programme*. Assessments are programme-scoped, so staff grade that cohort and
  // can record a mark for a non-submitter too. Withdrawn students have left the
  // register and are omitted.
  const roster = await prisma.student.findMany({
    where: {
      programmeId: assessment.programmeId,
      enrolmentStatus: { not: "WITHDRAWN" },
    },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, studentId: true },
  });

  const open = !isPastDeadline(assessment.deadline);
  const submissions = assessment.submissions.map((s) => ({
    ...s,
    late: isLate(s.submittedAt, assessment.deadline),
  }));
  const lateCount = submissions.filter((s) => s.late).length;

  const lateByStudent = new Map(submissions.map((s) => [s.studentId, s.late]));
  const resultByStudent = new Map(
    assessment.results.map((r) => [r.studentId, r])
  );
  const marksheetRows: MarksheetRow[] = roster.map((student) => {
    const late = lateByStudent.get(student.id);
    const result = resultByStudent.get(student.id);
    return {
      studentId: student.id,
      fullName: student.fullName,
      studentDisplayId: student.studentId,
      submission: late === undefined ? null : { late },
      result: result
        ? { grade: result.grade, published: result.published }
        : null,
    };
  });

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
          <span className="font-mono">{assessment.module}</span> ·{" "}
          {assessment.programme.name} · deadline{" "}
          {formatDateTime(assessment.deadline)}
        </p>
      </div>

      <Tabs defaultValue="submissions" className="max-w-4xl">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="marksheet">Marksheet</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="pt-2">
          <Card>
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
                            <div className="font-medium">
                              {s.student.fullName}
                            </div>
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
        </TabsContent>

        <TabsContent value="marksheet" className="pt-2">
          <Marksheet assessmentId={assessment.id} rows={marksheetRows} />
        </TabsContent>
      </Tabs>
    </>
  );
}
