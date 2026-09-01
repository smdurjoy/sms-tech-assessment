"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AssessmentStatusBadge,
  SubmissionTimingBadge,
} from "@/components/assessments/assessment-badges";
import {
  SubmitWorkDialog,
  type SubmitTarget,
} from "@/components/assessments/submit-work-dialog";

export type PortalAssessmentRow = {
  id: string;
  title: string;
  module: string;
  deadlineLabel: string;
  pastDeadline: boolean;
  resultPublished: boolean;
  submission: {
    id: string;
    submittedAtLabel: string;
    late: boolean;
  } | null;
};

export function PortalAssessments({
  assessments,
}: {
  assessments: PortalAssessmentRow[];
}) {
  const [target, setTarget] = useState<{
    assessment: SubmitTarget;
    isResubmit: boolean;
  } | null>(null);

  function openSubmit(row: PortalAssessmentRow, isResubmit: boolean) {
    setTarget({
      assessment: {
        id: row.id,
        title: row.title,
        deadlineLabel: row.deadlineLabel,
        pastDeadline: row.pastDeadline,
      },
      isResubmit,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessments</CardTitle>
        <CardDescription>
          Upload a PDF or DOCX for each assessment. You can replace it any time
          before the deadline; after that, your submission is final.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assessments have been set yet.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/10">
            {assessments.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {row.title}
                    </span>
                    <AssessmentStatusBadge open={!row.pastDeadline} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">{row.module}</span> · due{" "}
                    {row.deadlineLabel}
                  </div>
                  {row.submission ? (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <SubmissionTimingBadge late={row.submission.late} />
                      <span>Submitted {row.submission.submittedAtLabel}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {row.submission ? (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <a href={`/api/submissions/${row.submission.id}/file`}>
                          <Download />
                          Download
                        </a>
                      </Button>
                      {row.resultPublished ? (
                        <span className="text-xs text-muted-foreground">
                          Result published
                        </span>
                      ) : row.pastDeadline ? (
                        <span className="text-xs text-muted-foreground">
                          Deadline passed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openSubmit(row, true)}
                        >
                          Resubmit
                        </Button>
                      )}
                    </>
                  ) : row.resultPublished ? (
                    <span className="text-xs text-muted-foreground">
                      Result published
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => openSubmit(row, false)}>
                      {row.pastDeadline ? "Submit late" : "Submit work"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <SubmitWorkDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        assessment={target?.assessment ?? null}
        isResubmit={target?.isResubmit ?? false}
      />
    </Card>
  );
}
