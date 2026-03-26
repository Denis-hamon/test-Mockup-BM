"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  intakeSchema,
  STEP_SCHEMAS,
  type IntakeFormData,
} from "@legalconnect/shared";
import { useEffect, useCallback, useState } from "react";

const STORAGE_KEY = "legalconnect_intake_draft";
const STEP_KEY = "legalconnect_intake_step";
const TOTAL_STEPS = 4;

function loadDraft(): Partial<IntakeFormData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<IntakeFormData>;
  } catch {
    return {};
  }
}

function loadStep(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STEP_KEY);
    if (!raw) return 0;
    const step = parseInt(raw, 10);
    return step >= 0 && step < TOTAL_STEPS ? step : 0;
  } catch {
    return 0;
  }
}

export function useIntakeForm() {
  const draft = loadDraft();
  const hasDraftData = Object.keys(draft).length > 0;

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: draft,
    mode: "onTouched",
  });

  const [currentStep, setCurrentStep] = useState<number>(loadStep);
  const [hasDraft, setHasDraft] = useState<boolean>(hasDraftData);
  const [storageFull, setStorageFull] = useState<boolean>(false);

  // Auto-save form data to localStorage on every change
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch (e) {
        if (
          e instanceof DOMException &&
          e.name === "QuotaExceededError"
        ) {
          setStorageFull(true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Persist current step to localStorage
  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(currentStep));
  }, [currentStep]);

  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const schema = STEP_SCHEMAS[stepIndex];
      if (!schema) return false;
      const fields = Object.keys(
        schema.shape
      ) as Array<keyof IntakeFormData>;
      return form.trigger(fields);
    },
    [form]
  );

  const nextStep = useCallback(async (): Promise<boolean> => {
    const valid = await validateStep(currentStep);
    if (valid && currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    return valid;
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
    form.reset({});
    setCurrentStep(0);
    setHasDraft(false);
  }, [form]);

  return {
    form,
    currentStep,
    setCurrentStep,
    validateStep,
    nextStep,
    prevStep,
    hasDraft,
    storageFull,
    clearDraft,
  };
}
