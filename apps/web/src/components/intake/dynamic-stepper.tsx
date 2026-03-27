"use client";

import { useState } from "react";
import type { IntakeTemplate, BrandingConfig } from "@legalconnect/shared";
import { useDynamicIntakeForm } from "@/hooks/use-dynamic-intake-form";
import { DynamicStep } from "@/components/intake/dynamic-step";
import { StepContact } from "@/components/intake/step-contact";
import { StepDocuments } from "@/components/intake/step-documents";
import { submitIntake } from "@/server/actions/intake.actions";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// DynamicStepper — template-driven multi-step intake form
// ---------------------------------------------------------------------------

interface DynamicStepperProps {
  template: IntakeTemplate;
  branding: BrandingConfig;
  templateId: string;
}

export function DynamicStepper({
  template,
  branding,
  templateId,
}: DynamicStepperProps) {
  const {
    form,
    currentStep,
    setCurrentStep,
    totalSteps,
    stepLabels,
    allQuestions,
    validateStep,
    nextStep,
    prevStep,
    hasDraft,
    clearDraft,
  } = useDynamicIntakeForm({
    template,
    slug: branding.slug ?? "default",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  async function handleSubmit() {
    const valid = await validateStep(currentStep);
    if (!valid) return;

    setIsSubmitting(true);
    try {
      const values = form.getValues();

      // Separate contact fields for the intakeSchema parse and template answers
      const { fullName, phone, preferredContact, availabilities, documents, ...templateAnswers } = values;

      const result = await submitIntake(
        {
          // intakeSchema requires problemType — use template specialty
          problemType: template.specialty,
          description: "Soumission via formulaire personnalise",
          fullName: (fullName as string) ?? "",
          phone: (phone as string) ?? undefined,
          preferredContact: (preferredContact as string) ?? "email",
          availabilities: (availabilities as string) ?? undefined,
          documents: (documents as Array<{ id: string; name: string; size: number; type: string; encryptedKey: string; s3Key: string; nonce: string }>) ?? [],
        },
        {
          templateId,
          templateAnswers: templateAnswers as Record<string, unknown>,
        }
      );

      if (result.success) {
        clearDraft();
        setSubmitSuccess(true);
      } else {
        toast.error("Une erreur est survenue lors de la soumission. Veuillez reessayer.");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  if (submitSuccess) {
    return (
      <Alert className="border-[hsl(var(--trust))]/30 bg-[hsl(var(--trust))]/5">
        <CheckCircle2 className="text-[hsl(var(--trust))]" />
        <AlertTitle>Demande envoyee avec succes</AlertTitle>
        <AlertDescription>
          Votre demande a bien ete transmise. Vous recevrez une reponse dans les
          meilleurs delais.
        </AlertDescription>
      </Alert>
    );
  }

  // -------------------------------------------------------------------------
  // Step content
  // -------------------------------------------------------------------------
  function renderStep() {
    // Step 0: Contact
    if (currentStep === 0) {
      // StepContact expects UseFormReturn<IntakeFormData> — our form is
      // Record<string, unknown> but contains the same fields. Cast safely.
      return <StepContact form={form as never} />;
    }

    // Steps 1..N-2: Specialty steps from template
    if (currentStep > 0 && currentStep < totalSteps - 1) {
      const templateStep = template.steps[currentStep - 1];
      if (templateStep) {
        return (
          <DynamicStep
            step={templateStep}
            allQuestions={allQuestions}
            form={form}
          />
        );
      }
    }

    // Step N-1: Documents
    if (currentStep === totalSteps - 1) {
      return <StepDocuments form={form as never} />;
    }

    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper header */}
      <nav
        aria-label="Progression du formulaire"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {stepLabels.map((label, index) => (
          <div key={label} className="flex items-center">
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors",
                index < currentStep &&
                  "cursor-pointer text-muted-foreground hover:text-foreground",
                index === currentStep && "font-medium",
                index > currentStep && "cursor-default text-muted-foreground/50"
              )}
              style={
                index === currentStep
                  ? { color: "var(--lawyer-accent, hsl(var(--primary)))" }
                  : undefined
              }
              onClick={() => {
                // Only allow going back to completed steps
                if (index < currentStep) {
                  setCurrentStep(index);
                }
              }}
              disabled={index > currentStep}
            >
              {index < currentStep ? (
                <CheckCircle2
                  className="size-4"
                  style={{ color: "var(--lawyer-accent, hsl(var(--primary)))" }}
                />
              ) : (
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-xs",
                    index === currentStep
                      ? "border-current font-semibold"
                      : "border-muted-foreground/30"
                  )}
                >
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </button>
            {index < stepLabels.length - 1 && (
              <div className="mx-1 hidden h-px w-6 bg-border sm:block" />
            )}
          </div>
        ))}
      </nav>

      {/* Draft restoration alert */}
      {hasDraft && currentStep === 0 && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Brouillon restaure</AlertTitle>
          <AlertDescription className="flex items-center gap-4">
            Vos reponses precedentes ont ete restaurees.
            <Button variant="outline" size="sm" onClick={clearDraft}>
              Effacer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Step content with fade transition for conditional fields */}
      <div
        className="min-h-[300px] transition-opacity duration-200"
        key={currentStep}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0 || isSubmitting}
        >
          Precedent
        </Button>

        {currentStep < totalSteps - 1 ? (
          <Button
            type="button"
            onClick={() => nextStep()}
            style={{
              backgroundColor: "var(--lawyer-accent, hsl(var(--primary)))",
              color: "var(--lawyer-accent-foreground, hsl(var(--primary-foreground)))",
            }}
          >
            Suivant
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: "var(--lawyer-accent, hsl(var(--primary)))",
              color: "var(--lawyer-accent-foreground, hsl(var(--primary-foreground)))",
            }}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Soumettre ma demande
          </Button>
        )}
      </div>
    </div>
  );
}
