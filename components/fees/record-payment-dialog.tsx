"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { recordPayment } from "@/app/(staff)/students/actions";
import { formatDate, formatMoney, toDateInputValue } from "@/lib/format";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InstallmentOption = {
  id: string;
  sequence: number;
  dueDate: Date;
  outstanding: number;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function optionSuffix(outstanding: number): string {
  if (outstanding > 0) return `${formatMoney(outstanding)} outstanding`;
  if (outstanding < 0) return `${formatMoney(Math.abs(outstanding))} credit`;
  return "settled";
}

/** Earliest semester still owing, or the first one if everything is settled. */
function defaultInstallment(installments: InstallmentOption[]) {
  return installments.find((i) => i.outstanding > 0) ?? installments[0];
}

export function RecordPaymentControl({
  studentId,
  installments,
}: {
  studentId: string;
  installments: InstallmentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  const [installmentId, setInstallmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    if (open) {
      const preset = defaultInstallment(installments);
      setInstallmentId(preset?.id ?? "");
      setAmount(
        preset && preset.outstanding > 0 ? preset.outstanding.toFixed(2) : ""
      );
      setPaidAt(toDateInputValue(new Date()));
      setReferenceNumber("");
      setErrors({});
    }
  }, [open, installments]);

  // Selecting a semester prefills its outstanding amount — staff can still edit
  // it (e.g. a part payment, or an overpayment that leaves the semester in
  // credit).
  function onSelectInstallment(id: string) {
    setInstallmentId(id);
    const inst = installments.find((i) => i.id === id);
    setAmount(inst && inst.outstanding > 0 ? inst.outstanding.toFixed(2) : "");
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("installmentId", installmentId);
    formData.set("amount", amount);
    formData.set("paidAt", paidAt);
    formData.set("referenceNumber", referenceNumber);

    startTransition(async () => {
      const result = await recordPayment(studentId, formData);
      if (result.ok) {
        toast.success("Payment recorded");
        setOpen(false);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (result.formError) toast.error(result.formError);
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Record payment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Payments form an immutable ledger against a semester. The
              outstanding balance recomputes from these transactions.
            </DialogDescription>
          </DialogHeader>

          <form id="payment-form" onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="installment">Semester</Label>
              <Select value={installmentId} onValueChange={onSelectInstallment}>
                <SelectTrigger
                  id="installment"
                  className="w-full"
                  aria-invalid={Boolean(errors.installmentId)}
                >
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {installments.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      Semester {i.sequence} · due {formatDate(i.dueDate)} ·{" "}
                      {optionSuffix(i.outstanding)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.installmentId} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="amount">Amount (৳)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoComplete="off"
                aria-invalid={Boolean(errors.amount)}
              />
              <FieldError message={errors.amount} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="paidAt">Payment date</Label>
              <Input
                id="paidAt"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                aria-invalid={Boolean(errors.paidAt)}
              />
              <FieldError message={errors.paidAt} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="referenceNumber">Reference number</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="BANK-2025-0001"
                autoComplete="off"
                aria-invalid={Boolean(errors.referenceNumber)}
              />
              <FieldError message={errors.referenceNumber} />
            </div>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" form="payment-form" disabled={pending}>
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
