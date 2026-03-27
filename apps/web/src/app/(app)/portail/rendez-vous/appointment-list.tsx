"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AppointmentRequestForm } from "@/components/appointments/appointment-request-form";
import { CalendarPlus } from "lucide-react";

interface Appointment {
  id: string;
  submissionId: string;
  type: string | null;
  status: string | null;
  preferredDates: string | null;
  preferredSlots: string | null;
  notes: string | null;
  confirmedDate: Date | null;
  visioLink: string | null;
  cabinetAddress: string | null;
  createdAt: Date;
  problemType: string;
}

interface ClientCase {
  id: string;
  problemType: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  activeCases: ClientCase[];
}

export function AppointmentList({
  appointments,
  activeCases,
}: AppointmentListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const now = new Date();

  // Upcoming: confirmed not past + pending, sorted by date asc
  const upcoming = appointments.filter((a) => {
    if (a.status === "en_attente") return true;
    if (
      a.status === "confirme" &&
      a.confirmedDate &&
      new Date(a.confirmedDate) >= now
    )
      return true;
    return false;
  });

  // History: past confirmed + refused + cancelled, sorted by date desc
  const history = appointments.filter((a) => {
    if (a.status === "refuse" || a.status === "annule") return true;
    if (
      a.status === "confirme" &&
      a.confirmedDate &&
      new Date(a.confirmedDate) < now
    )
      return true;
    return false;
  });

  function handleSuccess() {
    setDialogOpen(false);
    router.refresh();
  }

  function handleCancelled() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Action bar */}
      <div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            disabled={activeCases.length === 0}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" />
            Demander un rendez-vous
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Demander un rendez-vous</DialogTitle>
            </DialogHeader>
            <AppointmentRequestForm
              cases={activeCases}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Prochains rendez-vous</h2>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm font-semibold">Aucun rendez-vous</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeCases.length > 0
                ? "Vous pouvez demander un rendez-vous avec votre avocat."
                : "Vous pourrez demander un rendez-vous une fois votre dossier pris en charge."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onCancelled={handleCancelled}
              />
            ))}
          </div>
        )}
      </section>

      {/* History section */}
      {history.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Historique</h2>
          <div className="grid gap-3">
            {history.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onCancelled={handleCancelled}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
