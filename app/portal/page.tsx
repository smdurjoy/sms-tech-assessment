import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { getCurrentStudentId, getRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RoleSwitcher } from "@/components/app/role-switcher";
import { StatusBadge } from "@/components/students/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PortalPage() {
  // Handle role states inline (not via a redirect guard) to avoid bouncing
  // between the staff console and the portal on a stale/empty student cookie.
  if (getRole() !== "student") redirect("/");

  const studentId = getCurrentStudentId();
  const student = studentId
    ? await prisma.student.findUnique({
        where: { id: studentId },
        include: { programme: true },
      })
    : null;

  const students = await prisma.student.findMany({
    select: { id: true, studentId: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-14 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <div className="text-sm font-semibold">Student Portal</div>
        </div>
        <RoleSwitcher
          role="student"
          currentStudentId={studentId}
          students={students}
        />
      </header>

      <main className="mx-auto max-w-2xl p-6">
        {!student ? (
          <Card>
            <CardHeader>
              <CardTitle>No student selected</CardTitle>
              <CardDescription>
                Use the switcher in the top-right to pick a student to view, or
                return to the staff console.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{student.fullName}</span>
                <StatusBadge status={student.enrolmentStatus} />
              </CardTitle>
              <CardDescription className="font-mono">
                {student.studentId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Programme</dt>
                  <dd>{student.programme.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Academic year</dt>
                  <dd>{student.academicYear}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate">{student.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd>{formatDate(student.dateOfBirth)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
