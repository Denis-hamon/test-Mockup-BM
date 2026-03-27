"use client";

import type { UseFormReturn } from "react-hook-form";
import type { TemplateStep, TemplateQuestion } from "@legalconnect/shared";
import { isQuestionVisible } from "@legalconnect/shared";
import { DynamicField } from "./dynamic-field";

// ---------------------------------------------------------------------------
// DynamicStep — renders all questions in a step with conditional visibility
// ---------------------------------------------------------------------------

interface DynamicStepProps {
  step: TemplateStep;
  allQuestions: TemplateQuestion[];
  form: UseFormReturn<Record<string, unknown>>;
}

export function DynamicStep({ step, allQuestions, form }: DynamicStepProps) {
  const formValues = form.watch();

  return (
    <div className="space-y-4">
      {step.questions.map((question) => {
        const visible = isQuestionVisible(
          question,
          allQuestions,
          formValues as Record<string, unknown>
        );

        return (
          <DynamicField
            key={question.id}
            question={question}
            form={form}
            visible={visible}
          />
        );
      })}
    </div>
  );
}
