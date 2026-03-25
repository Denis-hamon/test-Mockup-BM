import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecoveryRestore } from "@/components/auth/recovery-restore";

export const metadata = {
  title: "Restaurer vos cles - LegalConnect",
  description:
    "Restaurez vos cles de chiffrement avec votre phrase de recuperation.",
};

export default async function RecoveryRestorePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <RecoveryRestore />;
}
