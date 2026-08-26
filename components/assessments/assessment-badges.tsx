import { Badge } from "@/components/ui/badge";

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
