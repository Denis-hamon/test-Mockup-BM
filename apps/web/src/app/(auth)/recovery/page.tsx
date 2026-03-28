import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecoveryDisplay } from "@/components/auth/recovery-display";

export const metadata = {
  title: "Phrase de récupération - LegalConnect",
  description:
    "Sauvegardez votre phrase de récupération pour protéger vos données chiffrées.",
};

export default async function RecoveryPage() {
  const session = await auth();

  // User must be authenticated (just registered)
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <RecoveryDisplay />;
}
