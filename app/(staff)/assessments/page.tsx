import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { isPastDeadline } from "@/lib/domain/late";
import { PageHeader } from "@/components/app/page-header";
import { AssessmentsClient } from "@/components/assessments/assessments-client";

export default async function AssessmentsPage() {
  const [assessments, programmes] = await Promise.all([
    prisma.assessment.findMany({
      orderBy: { deadline: "desc" },
      include: {
        programme: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.programme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const now = new Date();
  const rows = assessments.map((a) => ({
    id: a.id,
    title: a.title,
    module: a.module,
    programmeId: a.programmeId,
    programmeName: a.programme.name,
    deadline: a.deadline.toISOString(),
    deadlineLabel: formatDateTime(a.deadline),
    isOpen: !isPastDeadline(a.deadline, now),
    submissionCount: a._count.submissions,
  }));

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Coursework set for students. Track submissions, flag late work, and grade in the marksheet."
      />
      <AssessmentsClient assessments={rows} programmes={programmes} />
    </>
  );
}
