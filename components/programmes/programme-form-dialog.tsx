"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createProgramme,
  updateProgramme,
} from "@/app/(staff)/programmes/actions";
import type { FieldErrors } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProgrammeRow = {
  id: string;
  code: string;
  name: string;
  feeAmount: number;
  studentCount: number;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function ProgrammeFormDialog({
  open,
  onOpenChange,
  programme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programme?: ProgrammeRow;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  const isEdit = Boolean(programme);

  useEffect(() => {
    if (open) {
      setCode(programme?.code ?? "");
      setName(programme?.name ?? "");
      setFeeAmount(programme ? String(programme.feeAmount) : "");
      setErrors({});
    }
  }, [open, programme]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("code", code);
    formData.set("name", name);
    formData.set("feeAmount", feeAmount);

    startTransition(async () => {
      const result = isEdit
        ? await updateProgramme(programme!.id, formData)
        : await createProgramme(formData);

      if (result.ok) {
        toast.success(isEdit ? "Programme updated" : "Programme created");
        onOpenChange(false);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (result.formError) toast.error(result.formError);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit programme" : "New programme"}</DialogTitle>
          <DialogDescription>
            Programmes are reference data. The fee here is what new enrolments
            are billed.
          </DialogDescription>
        </DialogHeader>

        <form id="programme-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BSC-CS"
              autoComplete="off"
              aria-invalid={Boolean(errors.code)}
            />
            <FieldError message={errors.code} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BSc Computer Science"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="feeAmount">Annual fee (£)</Label>
            <Input
              id="feeAmount"
              type="number"
              min="0"
              step="0.01"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              placeholder="9250"
              aria-invalid={Boolean(errors.feeAmount)}
            />
            <FieldError message={errors.feeAmount} />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="programme-form" disabled={pending}>
            {isEdit ? "Save changes" : "Create programme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
