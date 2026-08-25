import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProgrammes() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="space-y-2 rounded-xl p-4 ring-1 ring-foreground/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
