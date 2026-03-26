"use client";

import type { UseFormReturn } from "react-hook-form";
import type { IntakeFormData } from "@legalconnect/shared";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { TrustTooltip } from "@/components/trust/trust-tooltip";
import { useTranslations } from "next-intl";

const URGENCY_LEVELS = ["normal", "urgent", "tres_urgent"] as const;

export function StepDescription({
  form,
}: {
  form: UseFormReturn<IntakeFormData>;
}) {
  const t = useTranslations("intake");
  const selectedUrgency = form.watch("urgency");

  return (
    <FieldGroup>
      <Field data-invalid={!!form.formState.errors.description || undefined}>
        <FieldLabel htmlFor="description" className="flex items-center gap-2">
          {t("fields.description")}
          <TrustTooltip content={t("trust.tooltipDescription")} />
        </FieldLabel>
        <Textarea
          id="description"
          {...form.register("description")}
          aria-invalid={!!form.formState.errors.description || undefined}
          aria-label={t("fields.description")}
          rows={6}
        />
        {form.formState.errors.description ? (
          <FieldError>{t("errors.descriptionTooShort")}</FieldError>
        ) : (
          <FieldDescription>
            {t("errors.descriptionTooShort")}
          </FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="urgency">{t("fields.urgency")}</FieldLabel>
        <ToggleGroup
          variant="outline"
          spacing={2}
          value={selectedUrgency ? [selectedUrgency] : ["normal"]}
          onValueChange={(newValue: string[]) => {
            const value = newValue[newValue.length - 1];
            if (value) {
              form.setValue(
                "urgency",
                value as IntakeFormData["urgency"],
                { shouldValidate: true }
              );
            }
          }}
        >
          {URGENCY_LEVELS.map((level) => (
            <ToggleGroupItem
              key={level}
              value={level}
              aria-label={t(`urgency.${level}`)}
            >
              {t(`urgency.${level}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel htmlFor="opposingParty">
          {t("fields.opposingParty")}
        </FieldLabel>
        <Input
          id="opposingParty"
          {...form.register("opposingParty")}
          aria-label={t("fields.opposingParty")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="desiredOutcome">
          {t("fields.desiredOutcome")}
        </FieldLabel>
        <Textarea
          id="desiredOutcome"
          {...form.register("desiredOutcome")}
          aria-label={t("fields.desiredOutcome")}
          rows={3}
        />
      </Field>
    </FieldGroup>
  );
}
