"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { intakeSchema, type IntakeFormData } from "@legalconnect/shared";
import { StepDocuments } from "@/components/intake/step-documents";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Probleme juridique" },
  { label: "Description" },
  { label: "Documents" },
  { label: "Coordonnees" },
];

export function IntakeStepper() {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      documents: [],
    },
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Step indicator */}
      <nav aria-label="Progression du formulaire" className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                index === currentStep && "bg-primary text-primary-foreground",
                index < currentStep && "bg-primary/20 text-primary",
                index > currentStep && "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                index === currentStep && "font-medium",
                index !== currentStep && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <div className="mx-2 h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </nav>

      {/* Step content */}
      <div className="min-h-[300px]">
        {currentStep === 0 && (
          <div className="text-muted-foreground">
            {/* Step 1: Problem type - placeholder for plan 02-02 */}
            Etape 1 : Type de probleme juridique
          </div>
        )}

        {currentStep === 1 && (
          <div className="text-muted-foreground">
            {/* Step 2: Description - placeholder for plan 02-02 */}
            Etape 2 : Description de la situation
          </div>
        )}

        {currentStep === 2 && <StepDocuments form={form} />}

        {currentStep === 3 && (
          <div className="text-muted-foreground">
            {/* Step 4: Contact info - placeholder for plan 02-02 */}
            Etape 4 : Coordonnees et preferences
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          Precedent
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={currentStep === STEPS.length - 1}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
