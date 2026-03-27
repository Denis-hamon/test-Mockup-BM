import { cn } from "@/lib/utils";

export type DisplayStatus =
  | "en_attente"
  | "confirme"
  | "refuse"
  | "annule"
  | "passe";

interface AppointmentStatusBadgeProps {
  status: DisplayStatus;
  className?: string;
}

const statusConfig: Record<
  DisplayStatus,
  { label: string; bg: string; text: string }
> = {
  en_attente: {
    label: "En attente",
    bg: "hsl(38 92% 50% / 0.15)",
    text: "hsl(38 92% 35%)",
  },
  confirme: {
    label: "Confirme",
    bg: "hsl(142 71% 45% / 0.15)",
    text: "hsl(142 71% 30%)",
  },
  refuse: {
    label: "Refuse",
    bg: "hsl(0 84% 60% / 0.15)",
    text: "hsl(0 84% 45%)",
  },
  annule: {
    label: "Annule",
    bg: "hsl(0 0% 90%)",
    text: "hsl(0 0% 45%)",
  },
  passe: {
    label: "Passe",
    bg: "hsl(0 0% 90%)",
    text: "hsl(0 0% 45%)",
  },
};

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}
