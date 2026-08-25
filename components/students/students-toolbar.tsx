"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { ENROLMENT_STATUS_OPTIONS } from "@/lib/validation/student";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProgrammeOption = { id: string; name: string };

export function StudentsToolbar({
  programmes,
}: {
  programmes: ProgrammeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const programme = searchParams.get("programme") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const hasFilters =
    Boolean(searchParams.get("q")) || programme !== "all" || status !== "all";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", value.trim()), 300);
  }

  function clearAll() {
    setQ("");
    router.push(pathname, { scroll: false });
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, ID, or email"
          className="pl-8"
        />
      </div>

      <Select
        value={programme}
        onValueChange={(value) => setParam("programme", value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Programme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All programmes</SelectItem>
          {programmes.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(value) => setParam("status", value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ENROLMENT_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}
