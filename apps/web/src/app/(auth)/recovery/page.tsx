import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecoveryDisplay } from "@/components/auth/recovery-display";

export const metadata = {
  title: "Phrase de recuperation - LegalConnect",
  description:
    "Sauvegardez votre phrase de recuperation pour proteger vos donnees chiffrees.",
};

export default async function RecoveryPage() {
  const session = await auth();

  // User must be authenticated (just registered)
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <RecoveryDisplay />;
}
