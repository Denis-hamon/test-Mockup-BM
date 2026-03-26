"use client";

import { useState } from "react";
import { useIntakeForm } from "@/hooks/use-intake-form";
import { StepProblemType } from "@/components/intake/step-problem-type";
import { StepDescription } from "@/components/intake/step-description";
import { StepDocuments } from "@/components/intake/step-documents";
import { StepContact } from "@/components/intake/step-contact";
import { TrustBanner } from "@/components/trust/trust-banner";
import { submitIntake } from "@/server/actions/intake.actions";
import { AIChatZone } from "@/components/intake/ai-chat-zone";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type IntakePhase = "step" | "chatting";

const STEPS = [
  { key: "1" },
  { key: "2" },
  { key: "3" },
  { key: "4" },
] as const;

export function IntakeStepper() {
  const {
    form,
    currentStep,
    validateStep,
    nextStep,
    prevStep,
    hasDraft,
    storageFull,
    clearDraft,
  } = useIntakeForm();

  const t = useTranslations("intake");
  const [phase, setPhase] = useState<IntakePhase>("step");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    id?: string;
    error?: string;
  } | null>(null);

  async function handleStepComplete() {
    const valid = await validateStep(currentStep);
    if (!valid) return;
    if (currentStep < 3) {
      setPhase("chatting");
    } else {
      nextStep();
    }
  }

  function handleChatComplete() {
    nextStep();
    setPhase("step");
  }

  function handleChatSkip() {
    nextStep();
    setPhase("step");
  }

  async function handleSubmit() {
    const valid = await form.trigger();
    if (!valid) return;
    setIsSubmitting(true);
    try {
      const result = await submitIntake(form.getValues());
      setSubmitResult(result);
      if (result.success) {
        clearDraft();
      }
    } catch {
      setSubmitResult({ success: false, error: "submission_failed" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitResult?.success) {
    return (
      <Alert className="border-[hsl(var(--trust))]/30 bg-[hsl(var(--trust))]/5">
        <CheckCircle2 className="text-[hsl(var(--trust))]" />
        <AlertTitle>{t("success.title")}</AlertTitle>
        <AlertDescription>{t("success.body")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />

      {/* Step indicator */}
      <nav aria-label="Progression du formulaire" className="flex items-center">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-2">
              {index < currentStep ? (
                <Badge variant="secondary">
                  <CheckCircle2 className="size-3" />
                </Badge>
              ) : index === currentStep ? (
                <Badge variant="default">{index + 1}</Badge>
              ) : (
                <Badge variant="outline">{index + 1}</Badge>
              )}
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  index === currentStep && "font-medium",
                  index !== currentStep && "text-muted-foreground",
                )}
              >
                {t(`steps.${step.key}`)}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-border" />
            )}
          </div>
        ))}
      </nav>

      {/* Draft restoration alert */}
      {hasDraft && currentStep === 0 && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t("empty.draftRestored")}</AlertTitle>
          <AlertDescription className="flex items-center gap-4">
            {t("empty.draftRestoredBody")}
            <Button variant="outline" size="sm" onClick={clearDraft}>
              {t("destructive.clear")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Storage full warning */}
      {storageFull && (
        <p className="text-sm text-amber-600">{t("errors.storageFull")}</p>
      )}

      {/* TrustBanner on first step */}
      {currentStep === 0 && <TrustBanner className="mb-4" />}

      {/* Step content */}
      <div className="min-h-[300px]">
        {currentStep === 0 && <StepProblemType form={form} />}
        {currentStep === 1 && <StepDescription form={form} />}
        {currentStep === 2 && <StepDocuments form={form} />}
        {currentStep === 3 && <StepContact form={form} />}
      </div>

      {/* AI Chat Zone — shown between steps 0-2 when phase is chatting */}
      {phase === "chatting" && currentStep < 3 && (
        <AIChatZone
          stepIndex={currentStep}
          stepData={form.getValues() as Record<string, unknown>}
          onComplete={handleChatComplete}
          onSkip={handleChatSkip}
        />
      )}

      {/* Submit error */}
      {submitResult?.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{t("errors.submissionFailed")}</AlertTitle>
        </Alert>
      )}

      {/* Navigation buttons — hidden during AI chatting phase */}
      {phase !== "chatting" && (
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || isSubmitting}
          >
            {t("nav.prev")}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleStepComplete}>
              {t("nav.next")}
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isSubmitting ? t("nav.submit") : t("nav.submit")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
