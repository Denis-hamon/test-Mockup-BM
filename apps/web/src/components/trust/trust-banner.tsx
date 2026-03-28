"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function TrustBanner({ className }: { className?: string }) {
  const t = useTranslations("intake");

  return (
    <Alert
      className={cn(
        "border-[hsl(var(--trust))]/30 bg-[hsl(var(--trust))]/5",
        className
      )}
    >
      <ShieldCheck className="text-[hsl(var(--trust))]" />
      <AlertTitle>{t("trust.shieldAlt")}</AlertTitle>
      <AlertDescription>
        Vos donn\u00e9es sont prot\u00e9g\u00e9es par un chiffrement de bout en bout. Ni nous,
        ni personne d&apos;autre ne peut y acc\u00e9der.
      </AlertDescription>
    </Alert>
  );
}
