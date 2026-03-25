import Link from "next/link";
import { verifyEmail } from "@/server/actions/auth.actions";

export const metadata = {
  title: "Verification email - LegalConnect",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-destructive">
          Lien invalide
        </h1>
        <p className="mb-6 text-muted-foreground">
          Aucun token de verification fourni.
        </p>
        <Link href="/login" className="text-primary underline">
          Retour a la connexion
        </Link>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (result.success) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-green-600">
          Email verifie
        </h1>
        <p className="mb-6 text-muted-foreground">
          Votre email a ete verifie avec succes. Vous pouvez maintenant vous
          connecter a votre espace securise.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-primary px-6 py-2 text-primary-foreground"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-destructive">
        Verification echouee
      </h1>
      <p className="mb-6 text-muted-foreground">
        {result.error || "Lien de verification invalide ou expire."}
      </p>
      <Link href="/login" className="text-primary underline">
        Retour a la connexion
      </Link>
    </div>
  );
}
