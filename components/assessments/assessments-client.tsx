"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteAssessment } from "@/app/(staff)/assessments/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssessmentStatusBadge } from "@/components/assessments/assessment-badges";
import {
  AssessmentFormDialog,
  type AssessmentFormValues,
} from "@/components/assessments/assessment-form-dialog";

export type AssessmentRow = {
  id: string;
  title: string;
  module: string;
  programmeId: string;
  programmeName: string;
  deadline: string; // ISO, for prefilling the edit form
  deadlineLabel: string; // formatted on the server to avoid hydration drift
  isOpen: boolean;
  submissionCount: number;
};

export function AssessmentsClient({
  assessments,
  programmes,
}: {
  assessments: AssessmentRow[];
  programmes: { id: string; code: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentFormValues | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<AssessmentRow | null>(null);

  function openEdit(row: AssessmentRow) {
    setEditing({
      id: row.id,
      title: row.title,
      module: row.module,
      programmeId: row.programmeId,
      deadline: row.deadline,
    });
    setEditOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteAssessment(target.id);
      if (result.ok) {
        toast.success("Assessment deleted");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.formError ?? "Could not delete the assessment.");
        setDeleting(null);
      }
    });
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New assessment
        </Button>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No assessments yet. Create one for students to submit against.
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/assessments/${row.id}`}
                      className="hover:underline"
                    >
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {row.module}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.programmeName}
                  </TableCell>
                  <TableCell>{row.deadlineLabel}</TableCell>
                  <TableCell>
                    <AssessmentStatusBadge open={row.isOpen} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.submissionCount}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/assessments/${row.id}`}>
                            <FileText />
                            View submissions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(row)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleting(row)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssessmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        programmes={programmes}
      />
      <AssessmentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        assessment={editing ?? undefined}
        programmes={programmes}
      />

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete assessment?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `"${deleting.title}" will be permanently removed. This can't be undone.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
