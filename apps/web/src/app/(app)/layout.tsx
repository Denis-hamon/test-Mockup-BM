import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClientSidebar } from "@/components/portal/client-sidebar";
import { SecurityHeader } from "@/components/portal/security-header";

async function LawyerSidebar() {
  return (
    <aside className="hidden border-r bg-card lg:block lg:w-60">
      <div className="flex h-full flex-col gap-6 p-6">
        <Link href="/dashboard" className="text-lg font-semibold">
          LegalConnect
        </Link>
        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/dossiers"
            className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Dossiers
          </Link>
          <Link
            href="/settings/privacy"
            className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Parametres
          </Link>
        </nav>
      </div>
    </aside>
  );
}

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
          <div className="flex items-center gap-4">
            <SecurityHeader />
            {!isClient && (
              <>
                <Link
                  href="/dossiers"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Dossiers
                </Link>
                <Link
                  href="/settings/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Parametres
                </Link>
              </>
            )}
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {session.user.role}
            </span>
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
