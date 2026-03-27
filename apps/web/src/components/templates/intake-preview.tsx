"use client";

import { useForm } from "react-hook-form";
import type { IntakeTemplate, BrandingConfig } from "@legalconnect/shared";
import { DynamicStep } from "@/components/intake/dynamic-step";

interface IntakePreviewProps {
  template: IntakeTemplate;
  branding: BrandingConfig;
}

export function IntakePreview({ template, branding }: IntakePreviewProps) {
  // Preview-only form — not submitted, just for visual rendering
  const form = useForm<Record<string, unknown>>({
    defaultValues: {},
  });

  const allQuestions = template.steps.flatMap((s) => s.questions);

  // Stepper labels: Contact + template steps + Documents
  const stepLabels = [
    "Contact",
    ...template.steps.map((s) => s.label),
    "Documents",
  ];

  return (
    <div
      role="region"
      aria-label="Apercu du formulaire d'intake"
      className="rounded-lg border bg-background overflow-hidden"
      style={
        branding.accentColor
          ? ({ "--lawyer-accent": branding.accentColor } as React.CSSProperties)
          : undefined
      }
    >
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt="Logo du cabinet"
              className="max-h-12 object-contain"
            />
          )}
          <div>
            <p className="text-sm text-muted-foreground">
              {branding.welcomeText || "Bienvenue, decrivez votre situation."}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b px-4 py-2 flex gap-2 overflow-x-auto">
        {stepLabels.map((label, i) => (
          <span
            key={label}
            className={`text-xs whitespace-nowrap px-2 py-1 rounded-full ${
              i === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Template steps */}
      <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto">
        {template.steps.map((step) => (
          <div key={step.id}>
            <h4 className="text-sm font-medium mb-3">{step.label}</h4>
            <DynamicStep
              step={step}
              allQuestions={allQuestions}
              form={form}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 text-center">
        <p className="text-xs text-muted-foreground">
          Propulse par LegalConnect
        </p>
      </div>
    </div>
  );
}
