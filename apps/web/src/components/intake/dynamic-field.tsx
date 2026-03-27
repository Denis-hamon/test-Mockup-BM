"use client";

import type { UseFormReturn } from "react-hook-form";
import type { TemplateQuestion } from "@legalconnect/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

// ---------------------------------------------------------------------------
// DynamicField — renders a single template question
// ---------------------------------------------------------------------------

interface DynamicFieldProps {
  question: TemplateQuestion;
  form: UseFormReturn<Record<string, unknown>>;
  visible: boolean;
}

export function DynamicField({ question, form, visible }: DynamicFieldProps) {
  if (!visible) return null;

  const error = form.formState.errors[question.id];
  const errorMessage = error?.message as string | undefined;

  return (
    <Field data-invalid={!!error || undefined}>
      {question.fieldType !== "checkbox" && (
        <FieldLabel htmlFor={question.id}>
          {question.label}
          {question.required && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </FieldLabel>
      )}

      {question.description && (
        <p className="text-sm text-muted-foreground mb-1">
          {question.description}
        </p>
      )}

      {renderField(question, form)}

      {errorMessage && (
        <FieldError id={`${question.id}-error`}>{errorMessage}</FieldError>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Field renderer by type
// ---------------------------------------------------------------------------

function renderField(
  question: TemplateQuestion,
  form: UseFormReturn<Record<string, unknown>>
) {
  switch (question.fieldType) {
    case "text":
      return (
        <Input
          id={question.id}
          {...form.register(question.id)}
          aria-invalid={!!form.formState.errors[question.id] || undefined}
          aria-describedby={
            form.formState.errors[question.id]
              ? `${question.id}-error`
              : undefined
          }
        />
      );

    case "textarea":
      return (
        <Textarea
          id={question.id}
          rows={3}
          {...form.register(question.id)}
          aria-invalid={!!form.formState.errors[question.id] || undefined}
          aria-describedby={
            form.formState.errors[question.id]
              ? `${question.id}-error`
              : undefined
          }
        />
      );

    case "number":
      return (
        <Input
          id={question.id}
          type="number"
          {...form.register(question.id, { valueAsNumber: true })}
          aria-invalid={!!form.formState.errors[question.id] || undefined}
          aria-describedby={
            form.formState.errors[question.id]
              ? `${question.id}-error`
              : undefined
          }
        />
      );

    case "date":
      return (
        <Input
          id={question.id}
          type="date"
          {...form.register(question.id)}
          aria-invalid={!!form.formState.errors[question.id] || undefined}
          aria-describedby={
            form.formState.errors[question.id]
              ? `${question.id}-error`
              : undefined
          }
        />
      );

    case "select":
      return (
        <Select
          value={(form.watch(question.id) as string) ?? ""}
          onValueChange={(val) => {
            if (val !== null) {
              form.setValue(question.id, val, { shouldValidate: true });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={question.id}
            checked={(form.watch(question.id) as boolean) ?? false}
            onCheckedChange={(checked: boolean) =>
              form.setValue(question.id, checked, { shouldValidate: true })
            }
            aria-invalid={!!form.formState.errors[question.id] || undefined}
            aria-describedby={
              form.formState.errors[question.id]
                ? `${question.id}-error`
                : undefined
            }
          />
          <FieldLabel htmlFor={question.id} className="mb-0">
            {question.label}
            {question.required && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </FieldLabel>
        </div>
      );

    default:
      return null;
  }
}
