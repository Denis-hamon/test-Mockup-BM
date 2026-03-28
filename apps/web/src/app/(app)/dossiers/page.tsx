import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listCasesForLawyer } from "@/server/actions/dashboard.actions";
import { CaseDataTable } from "@/components/dashboard/case-data-table";
import { CaseFilters } from "@/components/dashboard/case-filters";

interface Props {
  searchParams: Promise<{
    page?: string;
    status?: string;
    specialty?: string;
    score?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function DossiersPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 20;

  const result = await listCasesForLawyer({
    page,
    pageSize,
    status: params.status,
    specialty: params.specialty,
    scoreRange: params.score as "faible" | "moyen" | "eleve" | undefined,
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sort,
    sortOrder: (params.order as "asc" | "desc") ?? "desc",
  });

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-medium">
          Impossible de charger les dossiers.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Vérifiez votre connexion et rechargez la page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dossiers</h1>
      </div>
      <CaseFilters
        currentFilters={{
          status: params.status,
          specialty: params.specialty,
          scoreRange: params.score,
          search: params.search,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        }}
      />
      <CaseDataTable
        data={result.data ?? []}
        total={result.total ?? 0}
        page={page}
        pageSize={pageSize}
        sortBy={params.sort}
        sortOrder={(params.order as "asc" | "desc") ?? "desc"}
      />
    </div>
  );
}
