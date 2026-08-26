"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  publishAllResults,
  setResultPublished,
} from "@/app/(staff)/assessments/actions";
import { classify } from "@/lib/domain/classification";
import { Button } from "@/components/ui/button";
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
  ClassificationBadge,
  ResultStatusBadge,
  SubmissionTimingBadge,
} from "@/components/assessments/assessment-badges";
import {
  GradeDialog,
  type GradeTarget,
} from "@/components/assessments/grade-dialog";

export type MarksheetRow = {
  studentId: string;
  fullName: string;
  studentDisplayId: string;
  submission: { late: boolean } | null;
  result: { grade: number; published: boolean } | null;
};

export function Marksheet({
  assessmentId,
  rows,
}: {
  assessmentId: string;
  rows: MarksheetRow[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<GradeTarget | null>(null);
  const [pending, startTransition] = useTransition();

  const gradedCount = rows.filter((r) => r.result).length;
  const publishedCount = rows.filter((r) => r.result?.published).length;
  const allPublished = gradedCount > 0 && publishedCount === gradedCount;

  function openGrade(row: MarksheetRow) {
    setTarget({
      assessmentId,
      studentId: row.studentId,
      studentName: row.fullName,
      studentDisplayId: row.studentDisplayId,
      currentGrade: row.result?.grade ?? null,
    });
  }

  function runPublish(studentId: string, published: boolean) {
    startTransition(async () => {
      const result = await setResultPublished(
        assessmentId,
        studentId,
        published
      );
      if (result.ok) {
        toast.success(published ? "Result published" : "Result withheld");
        router.refresh();
      } else if (result.formError) {
        toast.error(result.formError);
      }
    });
  }

  function runPublishAll(published: boolean) {
    startTransition(async () => {
      const result = await publishAllResults(assessmentId, published);
      if (result.ok) {
        toast.success(
          published ? "All results published" : "All results withheld"
        );
        router.refresh();
      } else if (result.formError) {
        toast.error(result.formError);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marksheet</CardTitle>
        <CardDescription>
          Enter a grade (0–100) per student — bands are Fail &lt;40 · Pass 40–59
          · Merit 60–69 · Distinction 70+. A result stays withheld until you
          publish it; the student only ever sees a published result.
        </CardDescription>
        {gradedCount > 0 ? (
          <CardAction>
            <Button
              size="sm"
              variant={allPublished ? "outline" : "default"}
              onClick={() => runPublishAll(!allPublished)}
              disabled={pending}
            >
              {allPublished ? "Withhold all" : "Publish all graded"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No students to grade.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const res = row.result;
                  return (
                    <TableRow key={row.studentId}>
                      <TableCell>
                        <div className="font-medium">{row.fullName}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {row.studentDisplayId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.submission ? (
                          <SubmissionTimingBadge late={row.submission.late} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not submitted
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {res ? res.grade : "—"}
                      </TableCell>
                      <TableCell>
                        {res ? (
                          <ClassificationBadge
                            classification={classify(res.grade)}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {res ? <ResultStatusBadge published={res.published} /> : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGrade(row)}
                            disabled={pending}
                          >
                            {res ? "Edit grade" : "Grade"}
                          </Button>
                          {res ? (
                            <Button
                              size="sm"
                              variant={res.published ? "ghost" : "secondary"}
                              onClick={() =>
                                runPublish(row.studentId, !res.published)
                              }
                              disabled={pending}
                            >
                              {res.published ? "Withhold" : "Publish"}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <GradeDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        target={target}
      />
    </Card>
  );
}
