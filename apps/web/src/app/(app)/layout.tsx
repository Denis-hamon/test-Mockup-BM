import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold">
            LegalConnect
          </Link>
          <div className="flex items-center gap-4">
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
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {session.user.role}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
