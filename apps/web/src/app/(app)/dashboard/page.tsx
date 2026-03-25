import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tableau de bord - LegalConnect",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">
        Bienvenue sur LegalConnect
      </h1>
      <p className="text-muted-foreground">
        Vous etes connecte en tant que{" "}
        <span className="font-medium text-foreground">{session.user.role}</span>
        .
      </p>
    </div>
  );
}
