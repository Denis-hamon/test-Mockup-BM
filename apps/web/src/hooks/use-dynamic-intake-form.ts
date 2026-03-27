"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  stepContactSchema,
  stepDocumentsSchema,
  buildStepSchema,
  isQuestionVisible,
  type IntakeTemplate,
  type TemplateQuestion,
} from "@legalconnect/shared";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";

// ---------------------------------------------------------------------------
// useDynamicIntakeForm — template-driven multi-step form with dynamic Zod
// ---------------------------------------------------------------------------

interface UseDynamicIntakeFormProps {
  template: IntakeTemplate;
  slug: string;
}

function getStorageKey(slug: string) {
  return `lc-intake-draft-${slug}`;
}

function getStepKey(slug: string) {
  return `lc-intake-step-${slug}`;
}

function loadDraft(slug: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey(slug));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function loadStep(slug: string, totalSteps: number): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(getStepKey(slug));
    if (!raw) return 0;
    const step = parseInt(raw, 10);
    return step >= 0 && step < totalSteps ? step : 0;
  } catch {
    return 0;
  }
}

/**
 * Compute default values for all fields across all steps.
 * Registers all fields at form init to prevent data loss on step navigation.
 */
function computeDefaultValues(template: IntakeTemplate): Record<string, unknown> {
  const defaults: Record<string, unknown> = {
    // Contact step fields
    fullName: "",
    phone: "",
    preferredContact: "email",
    availabilities: "",
    // Documents step fields
    documents: [],
  };

  // Template specialty fields
  for (const step of template.steps) {
    for (const q of step.questions) {
      switch (q.fieldType) {
        case "text":
        case "textarea":
        case "date":
          defaults[q.id] = "";
          break;
        case "select":
          defaults[q.id] = undefined;
          break;
        case "checkbox":
          defaults[q.id] = false;
          break;
        case "number":
          defaults[q.id] = undefined;
          break;
      }
    }
  }

  return defaults;
}

/**
 * Flatten all template questions for conditional rule evaluation.
 */
export function getAllQuestions(template: IntakeTemplate): TemplateQuestion[] {
  return template.steps.flatMap((step) => step.questions);
}

export function useDynamicIntakeForm({ template, slug }: UseDynamicIntakeFormProps) {
  // Total steps: Contact + specialty steps + Documents
  const totalSteps = 1 + template.steps.length + 1;

  // Step labels: Contact + template step labels + Documents
  const stepLabels = useMemo(() => {
    const labels = ["Contact"];
    for (const step of template.steps) {
      labels.push(step.label);
    }
    labels.push("Documents");
    return labels;
  }, [template.steps]);

  // All questions flattened for conditional evaluation
  const allQuestions = useMemo(() => getAllQuestions(template), [template]);

  // Compute default values (merge with draft)
  const defaults = useMemo(() => computeDefaultValues(template), [template]);
  const draft = loadDraft(slug);
  const hasDraftData = Object.keys(draft).length > 0;
  const mergedDefaults = useMemo(
    () => ({ ...defaults, ...draft }),
    [defaults, draft]
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues: mergedDefaults,
    mode: "onTouched",
  });

  const [currentStep, setCurrentStep] = useState<number>(() =>
    loadStep(slug, totalSteps)
  );
  const [hasDraft, setHasDraft] = useState<boolean>(hasDraftData);

  // Auto-save to localStorage every 10 seconds (per UI spec)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      try {
        const values = form.getValues();
        localStorage.setItem(getStorageKey(slug), JSON.stringify(values));
      } catch {
        // Silently fail on quota exceeded
      }
    }, 10_000);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
    };
  }, [form, slug]);

  // Persist current step
  useEffect(() => {
    localStorage.setItem(getStepKey(slug), String(currentStep));
  }, [currentStep, slug]);

  /**
   * Build the Zod schema for a given step index.
   * Step 0 = Contact, Steps 1..N-2 = specialty, Step N-1 = Documents.
   */
  const getStepSchema = useCallback(
    (stepIndex: number): z.ZodTypeAny => {
      if (stepIndex === 0) {
        return stepContactSchema;
      }
      if (stepIndex === totalSteps - 1) {
        return stepDocumentsSchema;
      }
      // Specialty step — only validate VISIBLE questions
      const templateStep = template.steps[stepIndex - 1];
      if (!templateStep) return z.object({});

      const formValues = form.getValues() as Record<string, unknown>;
      const visibleQuestions = templateStep.questions.filter((q) =>
        isQuestionVisible(q, allQuestions, formValues)
      );
      return buildStepSchema(visibleQuestions);
    },
    [template.steps, totalSteps, allQuestions, form]
  );

  /**
   * Validate only the current step's fields.
   */
  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const schema = getStepSchema(stepIndex);
      const values = form.getValues();

      // Extract only the fields relevant to this step
      const result = schema.safeParse(values);
      if (result.success) {
        return true;
      }

      // Trigger validation on the specific fields to show errors
      if (stepIndex === 0) {
        return form.trigger(["fullName", "phone", "preferredContact", "availabilities"]);
      }
      if (stepIndex === totalSteps - 1) {
        return form.trigger(["documents"]);
      }

      // Specialty step — trigger only visible question fields
      const templateStep = template.steps[stepIndex - 1];
      if (!templateStep) return true;

      const formValues = values as Record<string, unknown>;
      const visibleFieldIds = templateStep.questions
        .filter((q) => isQuestionVisible(q, allQuestions, formValues))
        .map((q) => q.id);

      // Set errors manually via resolver since fields are dynamic
      let hasError = false;
      for (const [key, issue] of Object.entries(result.error.flatten().fieldErrors)) {
        if (visibleFieldIds.includes(key) && issue && issue.length > 0) {
          form.setError(key, { type: "manual", message: issue[0] });
          hasError = true;
        }
      }

      return !hasError;
    },
    [getStepSchema, form, totalSteps, template.steps, allQuestions]
  );

  const nextStep = useCallback(async (): Promise<boolean> => {
    const valid = await validateStep(currentStep);
    if (valid && currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    return valid;
  }, [currentStep, totalSteps, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(getStorageKey(slug));
    localStorage.removeItem(getStepKey(slug));
    form.reset(defaults);
    setCurrentStep(0);
    setHasDraft(false);
  }, [form, defaults, slug]);

  return {
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
  };
}
