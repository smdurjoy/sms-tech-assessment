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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Confirm =
  | { scope: "single"; studentId: string; studentName: string; publish: boolean }
  | { scope: "all"; count: number; publish: boolean };

export function Marksheet({
  assessmentId,
  rows,
}: {
  assessmentId: string;
  rows: MarksheetRow[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<GradeTarget | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
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

  function runConfirmed() {
    if (!confirm) return;
    startTransition(async () => {
      const result =
        confirm.scope === "single"
          ? await setResultPublished(
              assessmentId,
              confirm.studentId,
              confirm.publish
            )
          : await publishAllResults(assessmentId, confirm.publish);

      if (result.ok) {
        toast.success(
          confirm.scope === "single"
            ? confirm.publish
              ? "Result published"
              : "Result withheld"
            : confirm.publish
              ? "All results published"
              : "All results withheld"
        );
        setConfirm(null);
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
              onClick={() =>
                setConfirm({
                  scope: "all",
                  count: allPublished ? publishedCount : gradedCount,
                  publish: !allPublished,
                })
              }
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
                                setConfirm({
                                  scope: "single",
                                  studentId: row.studentId,
                                  studentName: row.fullName,
                                  publish: !res.published,
                                })
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

      <Dialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.publish
                ? confirm.scope === "all"
                  ? "Publish all graded results?"
                  : "Publish this result?"
                : confirm?.scope === "all"
                  ? "Withhold all results?"
                  : "Withhold this result?"}
            </DialogTitle>
            <DialogDescription>
              {confirm
                ? confirm.scope === "all"
                  ? confirm.publish
                    ? `${confirm.count} student${confirm.count === 1 ? "" : "s"} will see their result on the portal immediately.`
                    : `${confirm.count} published result${confirm.count === 1 ? "" : "s"} will be hidden from the portal until you publish again.`
                  : confirm.publish
                    ? `${confirm.studentName} will see this result on the portal immediately.`
                    : `${confirm.studentName} will no longer see this result on the portal until you publish again.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirm?.publish ? "default" : "destructive"}
              onClick={runConfirmed}
              disabled={pending}
            >
              {confirm?.publish
                ? confirm.scope === "all"
                  ? "Publish all"
                  : "Publish"
                : confirm?.scope === "all"
                  ? "Withhold all"
                  : "Withhold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
