import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecoveryRestore } from "@/components/auth/recovery-restore";

export const metadata = {
  title: "Restaurer vos clés - LegalConnect",
  description:
    "Restaurez vos clés de chiffrement avec votre phrase de récupération.",
};

export default async function RecoveryRestorePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <RecoveryRestore />;
}
