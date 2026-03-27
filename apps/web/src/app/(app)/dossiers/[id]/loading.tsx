import { Skeleton } from "@/components/ui/skeleton";

export default function CaseDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="pb-4 border-b">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-7 w-48 mb-2" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>

        {/* Content skeleton */}
        <div className="min-h-[400px] space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>

      {/* Notes skeleton */}
      <div className="border-t pt-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
