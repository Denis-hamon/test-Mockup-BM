import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLawyerProfile } from "@/server/actions/lawyer-settings.actions";
import { CabinetSettingsForm } from "./cabinet-form";

export default async function CabinetSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    redirect("/dashboard");
  }

  const result = await getLawyerProfile();
  const profile = result.profile ?? {
    firmName: null,
    phone: null,
    specialties: [],
    notifyNewCase: true,
    notifyNewMessage: true,
    readReceiptsEnabled: true,
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <h1 className="text-xl font-semibold">Param\u00e8tres</h1>
      <CabinetSettingsForm
        initialProfile={profile}
        email={session.user.email ?? ""}
      />
    </div>
  );
}
