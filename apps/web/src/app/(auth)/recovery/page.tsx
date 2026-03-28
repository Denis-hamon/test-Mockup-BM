import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecoveryDisplay } from "@/components/auth/recovery-display";

export const metadata = {
  title: "Phrase de r\u00e9cup\u00e9ration - LegalConnect",
  description:
    "Sauvegardez votre phrase de r\u00e9cup\u00e9ration pour prot\u00e9ger vos donn\u00e9es chiffr\u00e9es.",
};

export default async function RecoveryPage() {
  const session = await auth();

  // User must be authenticated (just registered)
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <RecoveryDisplay />;
}
