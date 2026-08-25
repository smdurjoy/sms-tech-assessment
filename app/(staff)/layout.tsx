import { getCurrentStudentId, requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/app/sidebar";
import { RoleSwitcher } from "@/components/app/role-switcher";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  requireStaff();

  const students = await prisma.student.findMany({
    select: { id: true, studentId: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b px-6">
          <span className="text-sm font-medium text-muted-foreground md:hidden">
            SMS Registry
          </span>
          <div className="ml-auto">
            <RoleSwitcher
              role="staff"
              currentStudentId={getCurrentStudentId()}
              students={students}
            />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
