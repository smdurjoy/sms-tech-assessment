import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { isPastDeadline } from "@/lib/domain/late";
import { PageHeader } from "@/components/app/page-header";
import { AssessmentsClient } from "@/components/assessments/assessments-client";

export default async function AssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    orderBy: { deadline: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  const now = new Date();
  const rows = assessments.map((a) => ({
    id: a.id,
    title: a.title,
    module: a.module,
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
      <AssessmentsClient assessments={rows} />
    </>
  );
}
