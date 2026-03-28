"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  submitted: {
    label: "Nouveau",
    className: "bg-primary/10 text-primary border-transparent",
  },
  en_cours: {
    label: "En cours",
    className: "bg-[hsl(220_70%_50%/0.15)] text-[hsl(220_70%_40%)] border-transparent",
  },
  termine: {
    label: "Termin\u00e9",
    className: "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)] border-transparent",
  },
  archive: {
    label: "Archiv\u00e9",
    className: "bg-muted text-muted-foreground border-transparent",
  },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
