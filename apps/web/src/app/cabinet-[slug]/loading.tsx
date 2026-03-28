import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /cabinet-[slug] — hero + specialty cards + stepper.
 */
export default function CabinetSlugLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero placeholder */}
      <section className="bg-muted px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-10 w-48" />
        </div>
      </section>

      {/* Specialty cards placeholder */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <Skeleton className="mb-6 h-7 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </section>

      {/* Stepper placeholder */}
      <section className="mx-auto w-full max-w-2xl px-4 py-12">
        <Skeleton className="mb-6 h-7 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-px w-12" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-px w-12" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
    </div>
  );
}
