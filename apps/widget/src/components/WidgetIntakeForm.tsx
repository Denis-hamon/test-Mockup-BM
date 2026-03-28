/**
 * WidgetIntakeForm -- Multi-step intake form with native HTML5 validation.
 * Simplified re-implementation of DynamicStepper without shadcn/react-hook-form/Zod.
 *
 * Template types are inlined (type-only from shared schema) to avoid runtime deps.
 */

import { useState, useRef, useCallback } from "react";
import { submitWidgetIntake } from "../lib/api";
import { WidgetStepIndicator } from "./WidgetStepIndicator";
import { WidgetConfirmation } from "./WidgetConfirmation";

// ---------------------------------------------------------------------------
// Inline type definitions (mirrors @legalconnect/shared but no runtime import)
// ---------------------------------------------------------------------------

interface ConditionalRule {
  sourceQuestionId: string;
  operator: "equals" | "notEquals";
  expectedValue: string;
}

interface TemplateQuestion {
  id: string;
  label: string;
  description?: string;
  fieldType: "text" | "textarea" | "select" | "date" | "checkbox" | "number" | "email" | "phone";
  required: boolean;
  options?: string[];
  validation?: {
    maxLength?: number;
    min?: number;
    max?: number;
  };
  conditionalRule?: ConditionalRule;
}

interface TemplateStep {
  id: string;
  label: string;
  questions: TemplateQuestion[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WidgetIntakeFormProps {
  slug: string;
  steps: TemplateStep[];
  onSubmitted: () => void;
}

// ---------------------------------------------------------------------------
// Conditional visibility (re-implemented inline, ~20 lines)
// ---------------------------------------------------------------------------

function isQuestionVisible(
  question: TemplateQuestion,
  allQuestions: TemplateQuestion[],
  formData: Record<string, unknown>,
  visited?: Set<string>
): boolean {
  if (!question.conditionalRule) return true;

  const { sourceQuestionId, operator, expectedValue } = question.conditionalRule;
  const seen = visited ?? new Set<string>();
  if (seen.has(question.id)) return false;
  seen.add(question.id);

  const source = allQuestions.find((q) => q.id === sourceQuestionId);
  if (!source) return false;
  if (!isQuestionVisible(source, allQuestions, formData, seen)) return false;

  const currentValue = String(formData[sourceQuestionId] ?? "");
  if (operator === "equals") return currentValue === expectedValue;
  if (operator === "notEquals") return currentValue !== expectedValue;
  return true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WidgetIntakeForm({
  slug,
  steps,
  onSubmitted,
}: WidgetIntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Flatten all questions for conditional logic
  const allQuestions = steps.flatMap((s) => s.questions);

  // Current step data
  const step = steps[currentStep];
  const visibleQuestions = step
    ? step.questions.filter((q) => isQuestionVisible(q, allQuestions, formData))
    : [];

  // -------------------------------------------------------------------------
  // Field change handler
  // -------------------------------------------------------------------------

  const handleFieldChange = useCallback(
    (questionId: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [questionId]: value }));
      // Clear error for this field
      setErrors((prev) => {
        if (!prev[questionId]) return prev;
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Step validation (native HTML5 + manual required check)
  // -------------------------------------------------------------------------

  function validateCurrentStep(): boolean {
    const newErrors: Record<string, string> = {};

    for (const q of visibleQuestions) {
      const value = formData[q.id];

      // Required check
      if (q.required) {
        if (q.fieldType === "checkbox") {
          if (value !== true) {
            newErrors[q.id] = "Ce champ est obligatoire";
          }
        } else {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            newErrors[q.id] = "Ce champ est obligatoire";
          }
        }
      }

      // Max length check
      if (q.validation?.maxLength && typeof value === "string") {
        if (value.length > q.validation.maxLength) {
          newErrors[q.id] = `Maximum ${q.validation.maxLength} caracteres`;
        }
      }

      // Number range check
      if (q.fieldType === "number" && value !== undefined && value !== "") {
        const num = Number(value);
        if (isNaN(num)) {
          newErrors[q.id] = "Veuillez entrer un nombre valide";
        } else {
          if (q.validation?.min !== undefined && num < q.validation.min) {
            newErrors[q.id] = `Minimum: ${q.validation.min}`;
          }
          if (q.validation?.max !== undefined && num > q.validation.max) {
            newErrors[q.id] = `Maximum: ${q.validation.max}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  function handleNext() {
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function handlePrevious() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitWidgetIntake(slug, formData);
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError("Erreur lors de l'envoi. Veuillez reessayer.");
      }
    } catch {
      setSubmitError("Erreur lors de l'envoi. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Submitted state
  // -------------------------------------------------------------------------

  if (submitted) {
    return <WidgetConfirmation onAutoClose={onSubmitted} />;
  }

  // -------------------------------------------------------------------------
  // Field renderer
  // -------------------------------------------------------------------------

  function renderField(q: TemplateQuestion) {
    const fieldError = errors[q.id];
    const errorId = `err-${q.id}`;
    const hasError = !!fieldError;

    const commonProps = {
      id: q.id,
      name: q.id,
      "aria-required": q.required || undefined,
      "aria-invalid": hasError || undefined,
      "aria-describedby": hasError ? errorId : undefined,
    };

    let input: JSX.Element;

    switch (q.fieldType) {
      case "text":
        input = (
          <input
            {...commonProps}
            type="text"
            className={`lc-input${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
            maxLength={q.validation?.maxLength}
          />
        );
        break;

      case "textarea":
        input = (
          <textarea
            {...commonProps}
            className={`lc-textarea${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
            maxLength={q.validation?.maxLength}
          />
        );
        break;

      case "select":
        input = (
          <select
            {...commonProps}
            className={`lc-select${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
          >
            <option value="">-- Choisir --</option>
            {(q.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
        break;

      case "date":
        input = (
          <input
            {...commonProps}
            type="date"
            className={`lc-input${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
          />
        );
        break;

      case "number":
        input = (
          <input
            {...commonProps}
            type="number"
            className={`lc-input${hasError ? " lc-input--error" : ""}`}
            value={formData[q.id] !== undefined ? String(formData[q.id]) : ""}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
            min={q.validation?.min}
            max={q.validation?.max}
          />
        );
        break;

      case "email":
        input = (
          <input
            {...commonProps}
            type="email"
            className={`lc-input${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
          />
        );
        break;

      case "phone":
        input = (
          <input
            {...commonProps}
            type="tel"
            className={`lc-input${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            required={q.required}
          />
        );
        break;

      case "checkbox":
        input = (
          <label className="lc-checkbox-label">
            <input
              {...commonProps}
              type="checkbox"
              className={`lc-checkbox${hasError ? " lc-input--error" : ""}`}
              checked={!!formData[q.id]}
              onChange={(e) => handleFieldChange(q.id, e.target.checked)}
              required={q.required}
            />
            <span>{q.label}</span>
          </label>
        );
        break;

      default:
        input = (
          <input
            {...commonProps}
            type="text"
            className={`lc-input${hasError ? " lc-input--error" : ""}`}
            value={String(formData[q.id] ?? "")}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
          />
        );
    }

    return (
      <div key={q.id} className="lc-field">
        {q.fieldType !== "checkbox" && (
          <label className="lc-label" htmlFor={q.id}>
            {q.label}
            {q.required && <span className="lc-required"> *</span>}
          </label>
        )}
        {q.description && (
          <p className="lc-field-desc">{q.description}</p>
        )}
        {input}
        {hasError && (
          <p className="lc-field-error" id={errorId} role="alert">
            {fieldError}
          </p>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isLastStep = currentStep === steps.length - 1;

  return (
    <form
      ref={formRef}
      className="lc-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (isLastStep) {
          handleSubmit();
        } else {
          handleNext();
        }
      }}
      noValidate
    >
      <WidgetStepIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
      />

      <div className="lc-form-fields">
        {visibleQuestions.map(renderField)}
      </div>

      {submitError && (
        <p className="lc-field-error" role="alert" style={{ textAlign: "center", marginTop: "8px" }}>
          {submitError}
        </p>
      )}

      <div className="lc-form-nav">
        <button
          type="button"
          className="lc-btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          style={{ visibility: currentStep === 0 ? "hidden" : "visible" }}
        >
          Precedent
        </button>

        {isLastStep ? (
          <button
            type="submit"
            className="lc-btn-primary"
            disabled={submitting}
          >
            {submitting ? "Envoi..." : "Soumettre ma demande"}
          </button>
        ) : (
          <button
            type="submit"
            className="lc-btn-primary"
          >
            Suivant
          </button>
        )}
      </div>
    </form>
  );
}
