"use client";

import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function EncryptionBadge({
  label = "Chiffre",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[hsl(var(--trust))] border-[hsl(var(--trust))]",
        className
      )}
    >
      <Lock data-icon="inline-start" />
      {label}
    </Badge>
  );
}
