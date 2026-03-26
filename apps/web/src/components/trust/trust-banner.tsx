"use client";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrustBanner({ className }: { className?: string }) {
  return (
    <Alert
      className={cn(
        "border-[hsl(var(--trust))]/30 bg-[hsl(var(--trust))]/5",
        className
      )}
    >
      <ShieldCheck className="text-[hsl(var(--trust))]" />
      <AlertTitle>Donnees protegees</AlertTitle>
      <AlertDescription>
        {"Vos donnees sont protegees par un chiffrement de bout en bout. Ni nous, ni personne d'autre ne peut y acceder."}
      </AlertDescription>
    </Alert>
  );
}
