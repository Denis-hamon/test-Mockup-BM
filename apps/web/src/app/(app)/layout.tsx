import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClientSidebar } from "@/components/portal/client-sidebar";
import { SecurityHeader } from "@/components/portal/security-header";
import { LawyerSidebar } from "@/components/dashboard/lawyer-sidebar";
import { UserMenu } from "@/components/auth/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isClient = session.user.role === "client";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href={isClient ? "/portail" : "/dashboard"}
            className="text-lg font-semibold"
          >
            LegalConnect
          </Link>
          <div className="flex items-center gap-3">
            <SecurityHeader />
            {!isClient && (
              <nav className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/dossiers"
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Dossiers
                </Link>
                <Link
                  href="/settings/cabinet"
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Param&egrave;tres
                </Link>
              </nav>
            )}
            <UserMenu
              email={session.user.email ?? ""}
              role={session.user.role ?? "client"}
              name={session.user.name}
            />
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1">
        {isClient ? <ClientSidebar /> : <LawyerSidebar />}

        {/* Main content */}
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
