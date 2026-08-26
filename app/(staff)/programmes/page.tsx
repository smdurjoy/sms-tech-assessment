import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { ProgrammesClient } from "@/components/programmes/programmes-client";

export default async function ProgrammesPage() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  const rows = programmes.map((programme) => ({
    id: programme.id,
    code: programme.code,
    name: programme.name,
    feeAmount: Number(programme.feeAmount),
    durationSemesters: programme.durationSemesters,
    studentCount: programme._count.students,
  }));

  return (
    <>
      <PageHeader
        title="Programmes"
        description="Controlled reference data. Each programme sets the fee billed to students enrolled onto it."
      />
      <ProgrammesClient programmes={rows} />
    </>
  );
}
