import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnrolStudentForm } from "@/components/students/enrol-student-form";

/** UK academic year for a date, e.g. "2025/26". Starts in September. */
function currentAcademicYear(date = new Date()): string {
  const startYear =
    date.getMonth() + 1 >= 9 ? date.getFullYear() : date.getFullYear() - 1;
  const end = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}/${end}`;
}

function defaultFeeDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return toDateInputValue(due);
}

export default async function NewStudentPage() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, feeAmount: true },
  });

  const options = programmes.map((programme) => ({
    id: programme.id,
    code: programme.code,
    name: programme.name,
    feeAmount: Number(programme.feeAmount),
  }));

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/students">
            <ArrowLeft />
            Back to students
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Enrol student"
        description="A unique Student ID is generated automatically and the programme fee is snapshotted at enrolment."
      />

      {options.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            You need at least one programme before enrolling a student.{" "}
            <Link href="/programmes" className="text-foreground underline">
              Create a programme
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <EnrolStudentForm
          programmes={options}
          defaultAcademicYear={currentAcademicYear()}
          defaultFeeDueDate={defaultFeeDueDate()}
        />
      )}
    </>
  );
}
