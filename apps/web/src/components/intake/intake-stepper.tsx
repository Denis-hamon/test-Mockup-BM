"use client";

import { useState } from "react";
import { useIntakeForm } from "@/hooks/use-intake-form";
import { StepProblemType } from "@/components/intake/step-problem-type";
import { StepDescription } from "@/components/intake/step-description";
import { StepContact } from "@/components/intake/step-contact";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { TrustBanner } from "@/components/trust/trust-banner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { submitIntake } from "@/server/actions/intake.actions";
import type { IntakeFormData } from "@legalconnect/shared";

export function IntakeStepper() {
  const t = useTranslations("intake");
  const {
    form,
    currentStep,
    nextStep,
    prevStep,
    hasDraft,
    storageFull,
    clearDraft,
  } = useIntakeForm();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const onSubmit = async (data: IntakeFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await submitIntake(data);
        if (result.success) {
          clearDraft();
          setSubmitSuccess(true);
        } else {
          setSubmitError(t("errors.submissionFailed"));
        }
      } catch {
        setSubmitError(t("errors.submissionFailed"));
      } finally {
        setIsSubmitting(false);
      }
    };
    await form.handleSubmit(onSubmit)();
  };

  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <Alert className="border-[hsl(var(--trust))]/30 bg-[hsl(var(--trust))]/5">
          <AlertTitle>{t("success.title")}</AlertTitle>
          <AlertDescription>{t("success.body")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="text-[28px] font-semibold leading-[1.2] mb-8">
        {t("title")}
      </h1>

      {/* Stepper progress bar */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <Badge
            key={step}
            variant={
              step - 1 === currentStep
                ? "default"
                : step - 1 < currentStep
                  ? "secondary"
                  : "outline"
            }
            className={cn(
              step - 1 < currentStep &&
                "bg-[hsl(var(--trust))] text-white"
            )}
          >
            {step - 1 < currentStep ? (
              <Check data-icon className="h-3 w-3" />
            ) : (
              step
            )}
          </Badge>
        ))}
        <span className="hidden sm:inline text-sm text-muted-foreground">
          {t(`steps.${currentStep + 1}` as "steps.1")}
        </span>
      </div>
      <Progress value={(currentStep + 1) * 25} className="mb-8" />

      {/* Trust banner on step 1 only */}
      {currentStep === 0 && <TrustBanner className="mb-6" />}

      {/* Draft restored notification */}
      {hasDraft && currentStep === 0 && (
        <Alert className="mb-6">
          <AlertTitle>{t("empty.draftRestored")}</AlertTitle>
          <AlertDescription>{t("empty.draftRestoredBody")}</AlertDescription>
        </Alert>
      )}

      {/* Storage full warning */}
      {storageFull && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{t("errors.storageFull")}</AlertDescription>
        </Alert>
      )}

      {/* Submit error */}
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Step content in a Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {t(`step${currentStep + 1}.heading` as "step1.heading")}
          </CardTitle>
          <CardDescription>
            {t(`step${currentStep + 1}.intro` as "step1.intro")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && <StepProblemType form={form} />}
          {currentStep === 1 && <StepDescription form={form} />}
          {currentStep === 2 && (
            <div className="text-muted-foreground text-center py-8">
              {t("empty.noDocuments")}
              <br />
              {t("empty.noDocumentsBody")}
            </div>
          )}
          {currentStep === 3 && <StepContact form={form} />}
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              aria-label={t("nav.prev")}
            >
              {t("nav.prev")}
            </Button>
          ) : (
            <div />
          )}
          {currentStep < 3 ? (
            <Button onClick={() => nextStep()} aria-label={t("nav.next")}>
              {t("nav.next")}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              aria-label={t("nav.submit")}
            >
              {t("nav.submit")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
