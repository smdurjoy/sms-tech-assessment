import Link from "next/link";
import { Building2, UserPlus, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const [studentCount, programmeCount] = await Promise.all([
    prisma.student.count(),
    prisma.programme.count(),
  ]);

  return (
    <>
      <PageHeader
        title="Registry Console"
        description="Manage the student lifecycle — enrolment, fees, assessments, and results."
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/programmes">
                <Building2 />
                New programme
              </Link>
            </Button>
            <Button asChild>
              <Link href="/students/new">
                <UserPlus />
                Enrol student
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Link href="/students" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                Students
              </CardTitle>
              <CardDescription>Enrolled and tracked records</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-3xl font-semibold">
                {studentCount}
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/programmes" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                Programmes
              </CardTitle>
              <CardDescription>Reference data with set fees</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-3xl font-semibold">
                {programmeCount}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
