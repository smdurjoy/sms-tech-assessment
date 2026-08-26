"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { updateStudent } from "@/app/(staff)/students/actions";
import { ENROLMENT_STATUS_OPTIONS } from "@/lib/validation/student";
import type { FieldErrors } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StudentForEdit = {
  id: string;
  fullName: string;
  email: string;
  academicYear: string;
  enrolmentStatus: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function EditStudentDialog({ student }: { student: StudentForEdit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState(student.fullName);
  const [email, setEmail] = useState(student.email);
  const [academicYear, setAcademicYear] = useState(student.academicYear);
  const [status, setStatus] = useState(student.enrolmentStatus);

  useEffect(() => {
    if (open) {
      setFullName(student.fullName);
      setEmail(student.email);
      setAcademicYear(student.academicYear);
      setStatus(student.enrolmentStatus);
      setErrors({});
    }
  }, [open, student]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("email", email);
    formData.set("academicYear", academicYear);
    formData.set("enrolmentStatus", status);

    startTransition(async () => {
      const result = await updateStudent(student.id, formData);
      if (result.ok) {
        toast.success("Student updated");
        setOpen(false);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (result.formError) toast.error(result.formError);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit student</DialogTitle>
          <DialogDescription>
            Update the record. The Student ID, programme, and snapshotted fee
            stay fixed.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-student-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-fullName">Full name</Label>
            <Input
              id="edit-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
            />
            <FieldError message={errors.fullName} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            <FieldError message={errors.email} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-status">Enrolment status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENROLMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-academicYear">Academic year</Label>
              <Input
                id="edit-academicYear"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                aria-invalid={Boolean(errors.academicYear)}
              />
              <FieldError message={errors.academicYear} />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-student-form" disabled={pending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
