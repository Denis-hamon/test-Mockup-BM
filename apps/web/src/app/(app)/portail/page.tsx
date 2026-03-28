import { redirect } from "next/navigation";
import { getClientDashboard } from "@/server/actions/portal.actions";
import { auth } from "@/lib/auth";
import { DashboardSummary } from "@/components/portal/dashboard-summary";

export default async function PortailPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "client") {
    redirect("/dashboard");
  }

  const result = await getClientDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-semibold">
          Impossible de charger cette page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          V\u00e9rifiez votre connexion et rechargez.
        </p>
      </div>
    );
  }

  const { activeCases, unreadMessages, nextAppointment, recentActivity } =
    result.data;

  const firstName = session.user.name?.split(" ")[0] ?? "Client";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[20px] font-semibold leading-[1.2]">
        Bienvenue, {firstName}
      </h1>

      {activeCases === 0 && recentActivity.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-semibold">
            Vous n&apos;avez pas encore de dossier
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre premier dossier apparaitra ici apres avoir soumis une demande
            via le formulaire d&apos;intake.
          </p>
        </div>
      ) : (
        <DashboardSummary
          activeCases={activeCases}
          unreadMessages={unreadMessages}
          nextAppointment={nextAppointment}
          recentActivity={recentActivity}
        />
      )}
    </div>
  );
}
