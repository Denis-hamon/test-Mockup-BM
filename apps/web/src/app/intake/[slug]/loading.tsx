import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /intake/[slug] — stepper + form field placeholders.
 */
export default function IntakeSlugLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      {/* Logo placeholder */}
      <Skeleton className="h-12 w-32" />

      {/* Stepper placeholder: 3 circles with connecting lines */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-px w-12" />
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-px w-12" />
        <Skeleton className="size-8 rounded-full" />
      </div>

      {/* Form field placeholders */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      {/* Navigation buttons placeholder */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
