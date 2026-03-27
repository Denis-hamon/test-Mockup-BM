"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SecurityHeader() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-transparent bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)]"
    >
      <ShieldCheck className="h-4 w-4" />
      <span>Connexion securisee</span>
      <span className="sr-only">
        Votre connexion est securisee et vos donnees sont protegees
      </span>
    </Badge>
  );
}
