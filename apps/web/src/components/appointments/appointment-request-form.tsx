"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { requestAppointment } from "@/server/actions/appointment.actions";
import { toast } from "sonner";
import { CalendarIcon, X, Video, MapPin } from "lucide-react";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const appointmentRequestSchema = z.object({
  submissionId: z.string().min(1, "Selectionnez un dossier"),
  type: z.enum(["visio", "presentiel"]),
  preferredDates: z
    .array(z.string())
    .min(1, "Selectionnez au moins une date")
    .max(3, "Maximum 3 dates"),
  preferredSlots: z
    .array(z.enum(["matin", "apres_midi", "fin_journee"]))
    .min(1, "Selectionnez au moins un creneau"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof appointmentRequestSchema>;

interface ClientCase {
  id: string;
  problemType: string;
}

interface AppointmentRequestFormProps {
  cases: ClientCase[];
  onSuccess?: () => void;
}

const slotOptions = [
  { value: "matin" as const, label: "Matin (9h-12h)" },
  { value: "apres_midi" as const, label: "Apres-midi (14h-17h)" },
  { value: "fin_journee" as const, label: "Fin de journee (17h-19h)" },
];

export function AppointmentRequestForm({
  cases,
  onSuccess,
}: AppointmentRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: {
      submissionId: cases.length === 1 ? cases[0].id : "",
      type: "visio",
      preferredDates: [],
      preferredSlots: [],
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedDates = watch("preferredDates");
  const selectedSlots = watch("preferredSlots");
  const selectedType = watch("type");

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const iso = format(date, "yyyy-MM-dd");
    if (selectedDates.includes(iso)) {
      setValue(
        "preferredDates",
        selectedDates.filter((d) => d !== iso),
        { shouldValidate: true },
      );
    } else if (selectedDates.length < 3) {
      setValue("preferredDates", [...selectedDates, iso], {
        shouldValidate: true,
      });
    }
  }

  function removeDate(iso: string) {
    setValue(
      "preferredDates",
      selectedDates.filter((d) => d !== iso),
      { shouldValidate: true },
    );
  }

  function toggleSlot(slot: "matin" | "apres_midi" | "fin_journee") {
    if (selectedSlots.includes(slot)) {
      setValue(
        "preferredSlots",
        selectedSlots.filter((s) => s !== slot),
        { shouldValidate: true },
      );
    } else {
      setValue("preferredSlots", [...selectedSlots, slot], {
        shouldValidate: true,
      });
    }
  }

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const result = await requestAppointment({
        submissionId: data.submissionId,
        type: data.type,
        preferredDates: data.preferredDates,
        preferredSlots: data.preferredSlots,
        notes: data.notes,
      });
      if (result.success) {
        toast.success("Demande de rendez-vous envoyee");
        onSuccess?.();
      } else {
        toast.error("Impossible d'envoyer la demande");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Case selection */}
      <div className="flex flex-col gap-1.5">
        <Label>Dossier concerne</Label>
        <Select
          value={watch("submissionId")}
          onValueChange={(val) =>
            setValue("submissionId", val ?? "", { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selectionnez un dossier" />
          </SelectTrigger>
          <SelectContent>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.problemType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.submissionId && (
          <p className="text-xs text-destructive">
            {errors.submissionId.message}
          </p>
        )}
      </div>

      {/* Type selection */}
      <div className="flex flex-col gap-1.5">
        <Label>Type de rendez-vous</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={selectedType === "visio" ? "default" : "outline"}
            size="sm"
            onClick={() => setValue("type", "visio")}
            className="flex items-center gap-1"
          >
            <Video className="h-3.5 w-3.5" /> Visio
          </Button>
          <Button
            type="button"
            variant={selectedType === "presentiel" ? "default" : "outline"}
            size="sm"
            onClick={() => setValue("type", "presentiel")}
            className="flex items-center gap-1"
          >
            <MapPin className="h-3.5 w-3.5" /> Presentiel
          </Button>
        </div>
      </div>

      {/* Preferred dates (up to 3) */}
      <div className="flex flex-col gap-1.5">
        <Label>Dates preferees (jusqu&apos;a 3)</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className={cn(
              "inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal shadow-xs hover:bg-accent hover:text-accent-foreground",
              selectedDates.length === 0 && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {selectedDates.length === 0
              ? "Choisir des dates"
              : `${selectedDates.length} date(s) selectionnee(s)`}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              locale={fr}
              disabled={(date) => date < new Date()}
              modifiers={{
                selected: selectedDates.map((d) => new Date(d)),
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                },
              }}
            />
          </PopoverContent>
        </Popover>
        {selectedDates.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedDates.map((d) => (
              <Badge key={d} variant="secondary" className="gap-1">
                {format(new Date(d), "d MMM yyyy", { locale: fr })}
                <button
                  type="button"
                  onClick={() => removeDate(d)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {errors.preferredDates && (
          <p className="text-xs text-destructive">
            {errors.preferredDates.message}
          </p>
        )}
      </div>

      {/* Preferred slots */}
      <div className="flex flex-col gap-1.5">
        <Label>Creneaux preferes</Label>
        <div className="flex flex-col gap-2">
          {slotOptions.map((slot) => (
            <label
              key={slot.value}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedSlots.includes(slot.value)}
                onCheckedChange={() => toggleSlot(slot.value)}
              />
              {slot.label}
            </label>
          ))}
        </div>
        {errors.preferredSlots && (
          <p className="text-xs text-destructive">
            {errors.preferredSlots.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Notes (optionnel)</Label>
        <Textarea
          {...register("notes")}
          placeholder="Precisions sur votre disponibilite ou l'objet du rendez-vous..."
          rows={3}
        />
      </div>

      {/* Submit */}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Envoi en cours..." : "Envoyer la demande"}
      </Button>
    </form>
  );
}
