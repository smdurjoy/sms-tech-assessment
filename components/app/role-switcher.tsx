"use client";

import { useTransition } from "react";
import { ChevronDown, GraduationCap, ShieldCheck, UserRound } from "lucide-react";

import type { Role } from "@/lib/session";
import { switchToStaff, switchToStudent } from "@/lib/actions/session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StudentOption = { id: string; studentId: string; fullName: string };

export function RoleSwitcher({
  role,
  currentStudentId,
  students,
}: {
  role: Role;
  currentStudentId: string | null;
  students: StudentOption[];
}) {
  const [pending, startTransition] = useTransition();

  const currentStudent = students.find((s) => s.id === currentStudentId);
  const label =
    role === "staff"
      ? "Staff console"
      : currentStudent
        ? currentStudent.fullName
        : "Student portal";

  function goStaff() {
    startTransition(async () => {
      await switchToStaff();
    });
  }

  function goStudent(id: string) {
    startTransition(async () => {
      await switchToStudent(id);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          {role === "staff" ? (
            <ShieldCheck className="text-muted-foreground" />
          ) : (
            <GraduationCap className="text-muted-foreground" />
          )}
          <span className="max-w-40 truncate">{label}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>View as</DropdownMenuLabel>
        <DropdownMenuItem onSelect={goStaff}>
          <ShieldCheck />
          Staff (Registry console)
          {role === "staff" ? (
            <span className="ml-auto text-xs text-muted-foreground">current</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Student portal (impersonate)</DropdownMenuLabel>
        {students.length === 0 ? (
          <DropdownMenuItem disabled>Enrol a student first</DropdownMenuItem>
        ) : (
          students.map((s) => (
            <DropdownMenuItem key={s.id} onSelect={() => goStudent(s.id)}>
              <UserRound />
              <span className="flex flex-col">
                <span className="truncate">{s.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.studentId}
                </span>
              </span>
              {role === "student" && s.id === currentStudentId ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  current
                </span>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
