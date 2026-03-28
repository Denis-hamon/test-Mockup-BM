import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/server/actions/dashboard-stats.actions";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  FolderOpen,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Tableau de bord - LegalConnect",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const firstName = session.user.name?.split(" ")[0] ?? "Maître";
  const result = await getDashboardStats();
  const stats = result.data;

  const cards = [
    {
      title: "Total dossiers",
      value: stats?.totalCases ?? 0,
      icon: FolderOpen,
      href: "/dossiers",
    },
    {
      title: "Nouveaux",
      value: stats?.newCases ?? 0,
      icon: AlertCircle,
      href: "/dossiers?status=submitted",
    },
    {
      title: "En cours",
      value: stats?.inProgressCases ?? 0,
      icon: Clock,
      href: "/dossiers?status=en_cours",
    },
    {
      title: "Terminés",
      value: stats?.completedCases ?? 0,
      icon: CheckCircle2,
      href: "/dossiers?status=termine",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Bonjour, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Voici un aperçu de vos dossiers.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </span>
                    <span className="text-2xl font-semibold">{card.value}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
