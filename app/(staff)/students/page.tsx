import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Prisma, type EnrolmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/students/status-badge";
import { StudentRowActions } from "@/components/students/student-row-actions";
import { StudentsToolbar } from "@/components/students/students-toolbar";
import { ENROLMENT_STATUS_OPTIONS } from "@/lib/validation/student";

const STATUS_VALUES = new Set<string>(
  ENROLMENT_STATUS_OPTIONS.map((o) => o.value)
);

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q =
    (typeof searchParams.q === "string" ? searchParams.q.trim() : "") ||
    undefined;
  const programmeId =
    typeof searchParams.programme === "string" ? searchParams.programme : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  const where: Prisma.StudentWhereInput = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { studentId: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (programmeId && programmeId !== "all") where.programmeId = programmeId;
  if (status && status !== "all" && STATUS_VALUES.has(status)) {
    where.enrolmentStatus = status as EnrolmentStatus;
  }

  const [students, programmes] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { programme: { select: { code: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.programme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const filtersActive =
    Boolean(q) ||
    (programmeId && programmeId !== "all") ||
    (status && status !== "all");

  return (
    <>
      <PageHeader
        title="Students"
        description="Search and filter enrolled students, or enrol a new one."
        action={
          <Button asChild>
            <Link href="/students/new">
              <UserPlus />
              Enrol student
            </Link>
          </Button>
        }
      />

      <StudentsToolbar programmes={programmes} />

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Academic year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {filtersActive
                    ? "No students match these filters."
                    : "No students enrolled yet."}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {student.studentId}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/students/${student.id}`}
                      className="hover:underline"
                    >
                      {student.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono">
                    {student.programme.code}
                  </TableCell>
                  <TableCell>{student.academicYear}</TableCell>
                  <TableCell>
                    <StatusBadge status={student.enrolmentStatus} />
                  </TableCell>
                  <TableCell>
                    <StudentRowActions
                      studentId={student.id}
                      studentName={student.fullName}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
