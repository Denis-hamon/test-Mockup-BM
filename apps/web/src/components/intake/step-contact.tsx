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
} from "@/components/ui/field";
import { useTranslations } from "next-intl";

const CONTACT_METHODS = ["email", "telephone", "les_deux"] as const;

export function StepContact({
  form,
}: {
  form: UseFormReturn<IntakeFormData>;
}) {
  const t = useTranslations("intake");
  const selectedContact = form.watch("preferredContact");

  return (
    <FieldGroup>
      <Field data-invalid={!!form.formState.errors.fullName || undefined}>
        <FieldLabel htmlFor="fullName">{t("fields.fullName")}</FieldLabel>
        <Input
          id="fullName"
          {...form.register("fullName")}
          aria-invalid={!!form.formState.errors.fullName || undefined}
          aria-label={t("fields.fullName")}
        />
        {form.formState.errors.fullName && (
          <FieldError>{t("errors.required")}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="phone">{t("fields.phone")}</FieldLabel>
        <Input
          id="phone"
          type="tel"
          {...form.register("phone")}
          aria-label={t("fields.phone")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="preferredContact">
          {t("fields.preferredContact")}
        </FieldLabel>
        <ToggleGroup
          variant="outline"
          spacing={2}
          value={selectedContact ? [selectedContact] : ["email"]}
          onValueChange={(newValue: string[]) => {
            const value = newValue[newValue.length - 1];
            if (value) {
              form.setValue(
                "preferredContact",
                value as IntakeFormData["preferredContact"],
                { shouldValidate: true }
              );
            }
          }}
        >
          {CONTACT_METHODS.map((method) => (
            <ToggleGroupItem
              key={method}
              value={method}
              aria-label={t(`contact.${method}`)}
            >
              {t(`contact.${method}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel htmlFor="availabilities">
          {t("fields.availabilities")}
        </FieldLabel>
        <Textarea
          id="availabilities"
          {...form.register("availabilities")}
          aria-label={t("fields.availabilities")}
          rows={3}
        />
      </Field>
    </FieldGroup>
  );
}
