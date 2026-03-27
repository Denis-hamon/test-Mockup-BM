import { redirect } from "next/navigation";
import { getClientCases } from "@/server/actions/portal.actions";
import { auth } from "@/lib/auth";
import { CaseListClient } from "@/components/portal/case-list-client";

export default async function DossiersClientPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "client") {
    redirect("/dashboard");
  }

  const result = await getClientCases();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-semibold">
          Impossible de charger cette page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifiez votre connexion et rechargez.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[20px] font-semibold leading-[1.2]">Mes dossiers</h1>
      <CaseListClient cases={result.data} />
    </div>
  );
}
