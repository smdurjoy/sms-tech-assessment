"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteStudent } from "@/app/(staff)/students/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteStudentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteStudent(studentId);
      if (result.ok) {
        toast.success("Student deleted");
        onOpenChange(false);
        onDeleted();
      } else {
        // Dependency guard (payments/submissions/results) surfaces here.
        toast.error(result.formError ?? "Could not delete the student.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete student?</DialogTitle>
          <DialogDescription>
            {studentName} will be permanently removed. This cannot be undone. A
            student with payments, submissions, or results cannot be deleted —
            set them to Withdrawn instead.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
