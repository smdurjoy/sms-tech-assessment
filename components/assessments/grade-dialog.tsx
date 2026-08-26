"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { gradeStudent } from "@/app/(staff)/assessments/actions";
import { classify, isValidGrade } from "@/lib/domain/classification";
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
import { ClassificationBadge } from "@/components/assessments/assessment-badges";

export type GradeTarget = {
  assessmentId: string;
  studentId: string;
  studentName: string;
  studentDisplayId: string;
  currentGrade: number | null;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function GradeDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: GradeTarget | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [grade, setGrade] = useState("");

  useEffect(() => {
    if (open && target) {
      setGrade(target.currentGrade === null ? "" : String(target.currentGrade));
      setErrors({});
    }
  }, [open, target]);

  // Live preview mirrors the server rule exactly: only a valid 0–100 integer
  // maps to a band, so the staff member sees the classification before saving.
  const numeric = Number(grade);
  const preview =
    grade.trim() !== "" && isValidGrade(numeric) ? classify(numeric) : null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;

    const formData = new FormData();
    formData.set("grade", grade);

    startTransition(async () => {
      const result = await gradeStudent(
        target.assessmentId,
        target.studentId,
        formData
      );
      if (result.ok) {
        toast.success("Grade saved");
        onOpenChange(false);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (result.formError) toast.error(result.formError);
      }
    });
  }

  const isEdit = target?.currentGrade !== null && target?.currentGrade !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit grade" : "Enter grade"}</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                {target.studentName} ·{" "}
                <span className="font-mono">{target.studentDisplayId}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form id="grade-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="grade">Grade (0–100)</Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="100"
              step="1"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setErrors({});
              }}
              placeholder="0–100"
              autoComplete="off"
              aria-invalid={Boolean(errors.grade)}
            />
            <FieldError message={errors.grade} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Classification</span>
              {preview ? (
                <ClassificationBadge classification={preview} />
              ) : (
                <span>—</span>
              )}
            </div>
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
            form="grade-form"
            disabled={pending || grade.trim() === ""}
          >
            Save grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
