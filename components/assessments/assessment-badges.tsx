import { Badge } from "@/components/ui/badge";
import type { Classification } from "@/lib/domain/classification";

/** Whether an assessment is still open (before its deadline) or closed. */
export function AssessmentStatusBadge({ open }: { open: boolean }) {
  return (
    <Badge variant={open ? "default" : "outline"}>
      {open ? "Open" : "Closed"}
    </Badge>
  );
}

/** On-time vs late state of a single submission, relative to the deadline. */
export function SubmissionTimingBadge({ late }: { late: boolean }) {
  return (
    <Badge variant={late ? "destructive" : "secondary"}>
      {late ? "Late" : "On time"}
    </Badge>
  );
}

const CLASSIFICATION_VARIANT: Record<
  Classification,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Distinction: "default",
  Merit: "secondary",
  Pass: "outline",
  Fail: "destructive",
};

/** UK HE grade band derived from a numeric grade. */
export function ClassificationBadge({
  classification,
}: {
  classification: Classification;
}) {
  return (
    <Badge variant={CLASSIFICATION_VARIANT[classification]}>
      {classification}
    </Badge>
  );
}

/** Whether a result has been released to the student, or is still withheld. */
export function ResultStatusBadge({ published }: { published: boolean }) {
  return (
    <Badge variant={published ? "default" : "outline"}>
      {published ? "Published" : "Withheld"}
    </Badge>
  );
}
