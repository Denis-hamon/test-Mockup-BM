"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scale, Briefcase, Shield } from "lucide-react";
import { TemplateSpecialtyCard } from "./template-specialty-card";
import { saveTemplate } from "@/server/actions/template.actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { seedTemplates } from "@/lib/db/seed/intake-templates";
import type { IntakeTemplate } from "@legalconnect/shared";

interface SpecialtyInfo {
  specialty: string;
  label: string;
  questionCount: number;
}

interface ExistingTemplate {
  id: string;
  specialty: string;
}

interface TemplateSelectorProps {
  specialties: SpecialtyInfo[];
  existingTemplate: ExistingTemplate | null;
}

const SPECIALTY_ICONS = {
  famille: Scale,
  travail: Briefcase,
  penal: Shield,
} as const;

export function TemplateSelector({
  specialties,
  existingTemplate,
}: TemplateSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(specialty: string) {
    setSelected(specialty);

    const seed = seedTemplates.find((s) => s.specialty === specialty);
    if (!seed) return;

    startTransition(async () => {
      const result = await saveTemplate({
        specialty,
        schema: seed.template as IntakeTemplate,
      });

      if (result.success) {
        router.push("/settings/cabinet/template/edit");
      } else {
        toast.error("Erreur lors de la creation du template");
        setSelected(null);
      }
    });
  }

  if (existingTemplate) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[20px] font-semibold">Votre template</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vous avez deja un template configure. Vous pouvez le modifier a tout
            moment.
          </p>
        </div>
        <Button
          onClick={() => router.push("/settings/cabinet/template/edit")}
          variant="default"
        >
          Modifier mon template
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[20px] font-semibold">Choisir un template</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionnez un modèle adapté à votre spécialité. Vous pourrez
          personnaliser les questions et l&apos;apparence ensuite.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Choix du template par spécialité"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {specialties.map((s) => {
          const Icon =
            SPECIALTY_ICONS[s.specialty as keyof typeof SPECIALTY_ICONS] ??
            Scale;
          return (
            <TemplateSpecialtyCard
              key={s.specialty}
              specialty={s.specialty}
              label={s.label}
              questionCount={s.questionCount}
              icon={Icon}
              selected={selected === s.specialty}
              onSelect={() => handleSelect(s.specialty)}
            />
          );
        })}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Creation du template en cours...
        </div>
      )}
    </div>
  );
}
