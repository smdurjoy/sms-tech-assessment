"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createAssessment,
  updateAssessment,
} from "@/app/(staff)/assessments/actions";
import { toDateTimeInputValue } from "@/lib/format";
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

export type AssessmentFormValues = {
  id: string;
  title: string;
  module: string;
  deadline: string; // ISO string
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

/** Sensible default for a new assessment: two weeks out, end of day. */
function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setHours(23, 59, 0, 0);
  return toDateTimeInputValue(d);
}

export function AssessmentFormDialog({
  open,
  onOpenChange,
  assessment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment?: AssessmentFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [deadline, setDeadline] = useState("");

  const isEdit = Boolean(assessment);

  useEffect(() => {
    if (open) {
      setTitle(assessment?.title ?? "");
      setModule(assessment?.module ?? "");
      setDeadline(
        assessment ? toDateTimeInputValue(assessment.deadline) : defaultDeadline()
      );
      setErrors({});
    }
  }, [open, assessment]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("title", title);
    formData.set("module", module);
    formData.set("deadline", deadline);

    startTransition(async () => {
      const result = isEdit
        ? await updateAssessment(assessment!.id, formData)
        : await createAssessment(formData);

      if (result.ok) {
        toast.success(isEdit ? "Assessment updated" : "Assessment created");
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
            {isEdit ? "Edit assessment" : "New assessment"}
          </DialogTitle>
          <DialogDescription>
            Students submit a PDF or DOCX against this assessment. Work is
            accepted after the deadline but flagged as late.
          </DialogDescription>
        </DialogHeader>

        <form id="assessment-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Coursework 1 — Data Structures"
              autoComplete="off"
              aria-invalid={Boolean(errors.title)}
            />
            <FieldError message={errors.title} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="module">Module</Label>
            <Input
              id="module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="CS201"
              autoComplete="off"
              aria-invalid={Boolean(errors.module)}
            />
            <FieldError message={errors.module} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="deadline">Submission deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={Boolean(errors.deadline)}
            />
            <FieldError message={errors.deadline} />
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
          <Button type="submit" form="assessment-form" disabled={pending}>
            {isEdit ? "Save changes" : "Create assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
