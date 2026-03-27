import { z } from "zod";

// ---------------------------------------------------------------------------
// Field type enum
// ---------------------------------------------------------------------------

export const fieldTypeEnum = z.enum([
  "text",
  "textarea",
  "select",
  "date",
  "checkbox",
  "number",
]);

export type FieldType = z.infer<typeof fieldTypeEnum>;

// ---------------------------------------------------------------------------
// Conditional visibility rule
// ---------------------------------------------------------------------------

export const conditionalRuleSchema = z
  .object({
    sourceQuestionId: z.string(),
    operator: z.enum(["equals", "notEquals"]),
    expectedValue: z.string(),
  })
  .optional();

export type ConditionalRule = z.infer<typeof conditionalRuleSchema>;

// ---------------------------------------------------------------------------
// Template question
// ---------------------------------------------------------------------------

export const templateQuestionSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  fieldType: fieldTypeEnum,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      maxLength: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  conditionalRule: conditionalRuleSchema,
});

export type TemplateQuestion = z.infer<typeof templateQuestionSchema>;

// ---------------------------------------------------------------------------
// Template step
// ---------------------------------------------------------------------------

export const templateStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  questions: z.array(templateQuestionSchema),
});

export type TemplateStep = z.infer<typeof templateStepSchema>;

// ---------------------------------------------------------------------------
// Intake template (top-level)
// ---------------------------------------------------------------------------

export const intakeTemplateSchema = z.object({
  specialty: z.enum(["famille", "travail", "penal"]),
  steps: z.array(templateStepSchema),
});

export type IntakeTemplate = z.infer<typeof intakeTemplateSchema>;

// ---------------------------------------------------------------------------
// Branding config
// ---------------------------------------------------------------------------

export const brandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  welcomeText: z.string().max(500).optional(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export type BrandingConfig = z.infer<typeof brandingSchema>;

// ---------------------------------------------------------------------------
// Utility: build dynamic Zod schema from template questions
// ---------------------------------------------------------------------------

/**
 * Generates a dynamic Zod schema from an array of template questions.
 * Used to validate form data against the template definition.
 */
export function buildStepSchema(
  questions: TemplateQuestion[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const q of questions) {
    let fieldSchema: z.ZodTypeAny;

    switch (q.fieldType) {
      case "text":
      case "textarea":
      case "date": {
        let s = z.string();
        if (q.validation?.maxLength) {
          s = s.max(q.validation.maxLength);
        }
        fieldSchema = q.required ? s.min(1) : s;
        break;
      }
      case "select": {
        if (q.options && q.options.length > 0) {
          const [first, ...rest] = q.options;
          fieldSchema = z.enum([first, ...rest]);
        } else {
          // Graceful fallback for empty options
          fieldSchema = z.string();
        }
        break;
      }
      case "number": {
        let n = z.number();
        if (q.validation?.min !== undefined) {
          n = n.min(q.validation.min);
        }
        if (q.validation?.max !== undefined) {
          n = n.max(q.validation.max);
        }
        fieldSchema = n;
        break;
      }
      case "checkbox": {
        fieldSchema = z.boolean();
        break;
      }
      default: {
        fieldSchema = z.string();
      }
    }

    // Make optional if not required (except checkbox which defaults to false)
    if (!q.required && q.fieldType !== "checkbox") {
      fieldSchema = fieldSchema.optional();
    }

    shape[q.id] = fieldSchema;
  }

  return z.object(shape);
}

// ---------------------------------------------------------------------------
// Utility: conditional visibility evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates whether a question should be visible based on its conditional rule.
 * Supports "equals" and "notEquals" operators.
 * Enforces that the source question must itself be visible (recursive, bounded).
 */
export function isQuestionVisible(
  question: TemplateQuestion,
  allQuestions: TemplateQuestion[],
  formValues: Record<string, unknown>,
  _visited?: Set<string>
): boolean {
  // No conditional rule = always visible
  if (!question.conditionalRule) {
    return true;
  }

  const { sourceQuestionId, operator, expectedValue } =
    question.conditionalRule;

  // Prevent infinite recursion
  const visited = _visited ?? new Set<string>();
  if (visited.has(question.id)) {
    return false;
  }
  visited.add(question.id);

  // Source question must exist and itself be visible
  const sourceQuestion = allQuestions.find((q) => q.id === sourceQuestionId);
  if (!sourceQuestion) {
    return false;
  }

  if (!isQuestionVisible(sourceQuestion, allQuestions, formValues, visited)) {
    return false;
  }

  // Evaluate the rule
  const currentValue = String(formValues[sourceQuestionId] ?? "");

  switch (operator) {
    case "equals":
      return currentValue === expectedValue;
    case "notEquals":
      return currentValue !== expectedValue;
    default:
      return true;
  }
}
