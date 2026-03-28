import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecoveryRestore } from "@/components/auth/recovery-restore";

export const metadata = {
  title: "Restaurer vos cl\u00e9s - LegalConnect",
  description:
    "Restaurez vos cl\u00e9s de chiffrement avec votre phrase de r\u00e9cup\u00e9ration.",
};

export default async function RecoveryRestorePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <RecoveryRestore />;
}
