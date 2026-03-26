"use client";

import type { UseFormReturn } from "react-hook-form";
import type { IntakeFormData } from "@legalconnect/shared";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const PROBLEM_TYPES = [
  "famille",
  "travail",
  "penal",
  "immobilier",
  "commercial",
  "autre",
] as const;

export function StepProblemType({
  form,
}: {
  form: UseFormReturn<IntakeFormData>;
}) {
  const t = useTranslations("intake");
  const selectedType = form.watch("problemType");

  return (
    <FieldGroup>
      <Field data-invalid={!!form.formState.errors.problemType || undefined}>
        <FieldLabel htmlFor="problemType">
          {t("fields.problemType")}
        </FieldLabel>
        <ToggleGroup
          variant="outline"
          spacing={2}
          className="flex flex-wrap"
          value={selectedType ? [selectedType] : []}
          onValueChange={(newValue: string[]) => {
            const value = newValue[newValue.length - 1];
            if (value) {
              form.setValue(
                "problemType",
                value as IntakeFormData["problemType"],
                { shouldValidate: true }
              );
            }
          }}
        >
          {PROBLEM_TYPES.map((type) => (
            <ToggleGroupItem
              key={type}
              value={type}
              aria-label={t(`problemTypes.${type}`)}
              aria-invalid={
                !!form.formState.errors.problemType || undefined
              }
            >
              {t(`problemTypes.${type}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {form.formState.errors.problemType && (
          <FieldError>{t("errors.required")}</FieldError>
        )}
      </Field>

      {selectedType && (
        <Field>
          <FieldLabel htmlFor="problemSubType">
            {t("fields.problemSubType")}
          </FieldLabel>
          <Input
            id="problemSubType"
            {...form.register("problemSubType")}
            aria-label={t("fields.problemSubType")}
          />
        </Field>
      )}
    </FieldGroup>
  );
}
