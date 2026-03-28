import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import Link from "next/link";

export const metadata = {
  title: "Se connecter - LegalConnect",
  description: "Connectez-vous à votre espace LegalConnect.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">Se connecter</h1>
      <form
        action={async (formData) => {
          "use server";
          try {
            await signIn("credentials", {
              email: formData.get("email") as string,
              password: formData.get("password") as string,
              redirect: false,
            });
          } catch (err) {
            if (err instanceof AuthError) {
              redirect("/login?error=credentials");
            }
            throw err;
          }
          redirect("/dashboard");
        }}
        className="flex flex-col gap-4"
      >
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Email ou mot de passe incorrect.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nom@exemple.fr"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <button
          type="submit"
          className="mt-2 h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Se connecter
        </button>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href="/reset-password" className="text-primary underline">
            Mot de passe oublié ?
          </Link>
          <p>
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-primary underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
