"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EncryptionBadgeProps {
  variant: "inline" | "header";
  className?: string;
}

const TOOLTIP_TEXT =
  "Vos messages sont chiffres de bout en bout. Personne d'autre ne peut les lire.";

export function EncryptionBadge({ variant, className }: EncryptionBadgeProps) {
  if (variant === "inline") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            className={cn(
              "inline-flex items-center gap-1 text-xs text-muted-foreground",
              className,
            )}
          >
            <Lock className="size-4" data-icon />
            <span aria-hidden="true">Chiffre bout en bout</span>
            <span className="sr-only">{TOOLTIP_TEXT}</span>
          </TooltipTrigger>
          <TooltipContent>{TOOLTIP_TEXT}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // variant === "header"
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "inline-flex h-5 shrink-0 items-center gap-1 rounded-4xl px-2 py-0.5 text-xs font-medium",
            "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)]",
            className,
          )}
        >
          <Lock className="size-3" data-icon />
          Chiffre bout en bout
          <span className="sr-only">{TOOLTIP_TEXT}</span>
        </TooltipTrigger>
        <TooltipContent>{TOOLTIP_TEXT}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
