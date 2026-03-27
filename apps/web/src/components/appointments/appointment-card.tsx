"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AppointmentStatusBadge,
  type DisplayStatus,
} from "./appointment-status-badge";
import { cancelAppointment } from "@/server/actions/appointment.actions";
import { toast } from "sonner";
import { Video, MapPin, ExternalLink } from "lucide-react";

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
  lawyerName?: string;
}

function getDisplayStatus(appointment: Appointment): DisplayStatus {
  if (
    appointment.status === "confirme" &&
    appointment.confirmedDate &&
    appointment.confirmedDate < new Date()
  ) {
    return "passe";
  }
  return (appointment.status ?? "en_attente") as DisplayStatus;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AppointmentCardProps {
  appointment: Appointment;
  onCancelled?: () => void;
}

export function AppointmentCard({
  appointment,
  onCancelled,
}: AppointmentCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const displayStatus = getDisplayStatus(appointment);
  const isPast = displayStatus === "passe";
  const isConfirmed = displayStatus === "confirme";
  const isPending = displayStatus === "en_attente";

  async function handleCancel() {
    setCancelling(true);
    try {
      const result = await cancelAppointment(appointment.id);
      if (result.success) {
        toast.success("Demande de rendez-vous annulee");
        onCancelled?.();
      } else {
        toast.error("Impossible d'annuler la demande");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header: date + badges */}
        <div className="flex flex-wrap items-center gap-2">
          {appointment.confirmedDate ? (
            <span className="text-sm font-semibold">
              {formatDate(appointment.confirmedDate)} -{" "}
              {formatTime(appointment.confirmedDate)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Date a confirmer
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {appointment.type === "visio" ? (
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" /> Visio
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Presentiel
              </span>
            )}
          </Badge>
          <AppointmentStatusBadge status={displayStatus} />
        </div>

        {/* Case info */}
        <p className="text-sm text-muted-foreground">
          {appointment.problemType}
          {appointment.lawyerName && ` — ${appointment.lawyerName}`}
        </p>

        {/* Confirmed + visio + not past: show link */}
        {isConfirmed && appointment.type === "visio" && appointment.visioLink && (
          <a
            href={appointment.visioLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Lien visio
          </a>
        )}

        {/* Confirmed + presentiel + not past: show address */}
        {isConfirmed &&
          appointment.type === "presentiel" &&
          appointment.cabinetAddress && (
            <p className="text-sm">
              <MapPin className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
              {appointment.cabinetAddress}
            </p>
          )}

        {/* Pending: waiting message + cancel */}
        {isPending && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              En attente de confirmation de votre avocat
            </p>
            <AlertDialog>
              <AlertDialogTrigger
                disabled={cancelling}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-xs hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
              >
                Annuler
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la demande ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Etes-vous sur de vouloir annuler votre demande de
                    rendez-vous ? Vous pourrez en refaire une a tout moment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Non, garder</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Oui, annuler
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
