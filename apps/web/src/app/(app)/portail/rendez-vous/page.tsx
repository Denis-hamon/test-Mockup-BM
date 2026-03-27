import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClientAppointments } from "@/server/actions/appointment.actions";
import { getClientCases } from "@/server/actions/portal.actions";
import { AppointmentList } from "./appointment-list";

export default async function RendezVousPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "client") {
    redirect("/dashboard");
  }

  const [appointmentsResult, casesResult] = await Promise.all([
    getClientAppointments(),
    getClientCases(),
  ]);

  const appointments = appointmentsResult.success
    ? (appointmentsResult.data ?? [])
    : [];

  const cases = casesResult.success ? (casesResult.data ?? []) : [];

  // Filter active cases for the request form dropdown
  const activeCases = cases
    .filter((c) => c.status !== "termine")
    .map((c) => ({ id: c.id, problemType: c.problemType }));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[20px] font-semibold leading-[1.2]">Rendez-vous</h1>
      <AppointmentList appointments={appointments} activeCases={activeCases} />
    </div>
  );
}
