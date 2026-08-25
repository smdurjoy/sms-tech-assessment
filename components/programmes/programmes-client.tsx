"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteProgramme } from "@/app/(staff)/programmes/actions";
import { formatMoney } from "@/lib/format";
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
import {
  ProgrammeFormDialog,
  type ProgrammeRow,
} from "@/components/programmes/programme-form-dialog";

export function ProgrammesClient({ programmes }: { programmes: ProgrammeRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProgrammeRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProgrammeRow | null>(null);

  function openEdit(programme: ProgrammeRow) {
    setEditing(programme);
    setEditOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteProgramme(target.id);
      if (result.ok) {
        toast.success("Programme deleted");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.formError ?? "Could not delete the programme.");
        setDeleting(null);
      }
    });
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New programme
        </Button>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Annual fee</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {programmes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No programmes yet. Create your first programme to enrol
                  students.
                </TableCell>
              </TableRow>
            ) : (
              programmes.map((programme) => (
                <TableRow key={programme.id}>
                  <TableCell className="font-mono">{programme.code}</TableCell>
                  <TableCell className="font-medium">{programme.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(programme.feeAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {programme.studentCount}
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
                        <DropdownMenuItem onSelect={() => openEdit(programme)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleting(programme)}
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

      <ProgrammeFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProgrammeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        programme={editing ?? undefined}
      />

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete programme?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `"${deleting.name}" will be permanently removed. This can't be undone.`
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
