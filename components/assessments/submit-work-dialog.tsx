"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Upload } from "lucide-react";

import { submitAssessment } from "@/app/portal/actions";
import {
  MAX_SUBMISSION_LABEL,
  SUBMISSION_ACCEPT,
  validateSubmissionFile,
} from "@/lib/validation/submission";
import type { FieldErrors } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SubmitTarget = {
  id: string;
  title: string;
  deadlineLabel: string;
  pastDeadline: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function SubmitWorkDialog({
  open,
  onOpenChange,
  assessment,
  isResubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: SubmitTarget | null;
  isResubmit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setFile(null);
    }
  }, [open]);

  // A late warning only applies to a *first* submission after the deadline; a
  // resubmission is blocked entirely once the deadline passes (enforced server
  // side too), so we never show the resubmit path in a late state.
  const lateWarning = assessment?.pastDeadline && !isResubmit;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assessment) return;

    if (!file) {
      setErrors({ file: "Choose a file to upload." });
      return;
    }
    const clientError = validateSubmissionFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (clientError) {
      setErrors({ file: clientError });
      return;
    }

    const formData = new FormData();
    formData.set("assessmentId", assessment.id);
    formData.set("file", file);

    startTransition(async () => {
      const result = await submitAssessment(formData);
      if (result.ok) {
        toast.success(isResubmit ? "Submission replaced" : "Work submitted");
        onOpenChange(false);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (result.formError) toast.error(result.formError);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isResubmit ? "Resubmit work" : "Submit work"}
          </DialogTitle>
          <DialogDescription>
            {assessment ? (
              <>
                {assessment.title} · deadline {assessment.deadlineLabel}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {lateWarning ? (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              The deadline has passed. Your submission will be accepted but
              flagged as <strong>late</strong>, and you won&apos;t be able to
              replace it afterwards.
            </span>
          </div>
        ) : null}

        <form id="submit-work-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="file">File (PDF or DOCX)</Label>
            <Input
              id="file"
              type="file"
              accept={SUBMISSION_ACCEPT}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErrors({});
              }}
              aria-invalid={Boolean(errors.file)}
            />
            <FieldError message={errors.file} />
            <p className="text-xs text-muted-foreground">
              PDF or DOCX, up to {MAX_SUBMISSION_LABEL}.
              {isResubmit ? " This replaces your current submission." : null}
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="submit-work-form"
            disabled={pending || !file}
          >
            <Upload />
            {isResubmit ? "Replace submission" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
