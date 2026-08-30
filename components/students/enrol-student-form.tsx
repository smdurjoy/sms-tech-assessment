"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { enrolStudent } from "@/app/(staff)/students/actions";
import { buildFeeSchedule } from "@/lib/services/fee-schedule";
import { formatMoney } from "@/lib/format";
import type { FieldErrors } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProgrammeOption = {
  id: string;
  code: string;
  name: string;
  feeAmount: number;
  durationSemesters: number;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function EnrolStudentForm({
  programmes,
  defaultAcademicYear,
  defaultFirstDueDate,
}: {
  programmes: ProgrammeOption[];
  defaultAcademicYear: string;
  defaultFirstDueDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  const [programmeId, setProgrammeId] = useState("");

  const selectedProgramme = programmes.find((p) => p.id === programmeId);
  const splitHint = selectedProgramme
    ? (() => {
        const schedule = buildFeeSchedule({
          totalFee: selectedProgramme.feeAmount,
          semesters: selectedProgramme.durationSemesters,
          firstDueDate: new Date(),
        });
        const first = schedule[0].amount;
        const last = schedule[schedule.length - 1].amount;
        const n = selectedProgramme.durationSemesters;
        const split =
          first === last
            ? `${n} × ${formatMoney(first)}`
            : `${n - 1} × ${formatMoney(first)} + ${formatMoney(last)}`;
        return `${formatMoney(selectedProgramme.feeAmount)} total → ${split}`;
      })()
    : null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("programmeId", programmeId);

    startTransition(async () => {
      const result = await enrolStudent(formData);
      if (result.ok) {
        toast.success("Student enrolled");
        router.push(`/students/${result.id}`);
      } else {
        setErrors(result.fieldErrors ?? {});
        if (result.formError) toast.error(result.formError);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Ada Lovelace"
            autoComplete="off"
            aria-invalid={Boolean(errors.fullName)}
          />
          <FieldError message={errors.fullName} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ada@example.ac.uk"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
          />
          <FieldError message={errors.email} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            aria-invalid={Boolean(errors.dateOfBirth)}
          />
          <FieldError message={errors.dateOfBirth} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="programme">Programme</Label>
          <Select value={programmeId} onValueChange={setProgrammeId}>
            <SelectTrigger id="programme" className="w-full" aria-invalid={Boolean(errors.programmeId)}>
              <SelectValue placeholder="Select a programme" />
            </SelectTrigger>
            <SelectContent>
              {programmes.map((programme) => (
                <SelectItem key={programme.id} value={programme.id}>
                  {programme.code} — {programme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.programmeId} />
          {selectedProgramme ? (
            <p className="text-xs text-muted-foreground">
              {splitHint} — snapshotted at enrolment; later fee changes
              won&apos;t re-bill this student.
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="academicYear">Academic year</Label>
          <Input
            id="academicYear"
            name="academicYear"
            defaultValue={defaultAcademicYear}
            placeholder="2025/26"
            autoComplete="off"
            aria-invalid={Boolean(errors.academicYear)}
          />
          <FieldError message={errors.academicYear} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="firstDueDate">First semester due date</Label>
          <Input
            id="firstDueDate"
            name="firstDueDate"
            type="date"
            defaultValue={defaultFirstDueDate}
            aria-invalid={Boolean(errors.firstDueDate)}
          />
          <FieldError message={errors.firstDueDate} />
          <p className="text-xs text-muted-foreground">
            Later semesters fall due every 4 months after this date.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          Enrol student
        </Button>
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/students">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
