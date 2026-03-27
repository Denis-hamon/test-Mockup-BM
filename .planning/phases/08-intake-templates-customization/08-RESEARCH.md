# Phase 8: Intake Templates & Customization - Research

**Researched:** 2026-03-27
**Domain:** Dynamic form templates, drag & drop reordering, JSON schema-driven forms, lawyer branding
**Confidence:** HIGH

## Summary

This phase transforms the hardcoded 4-step intake stepper into a template-driven dynamic form system. The core challenge is threefold: (1) designing a JSON schema that can represent arbitrary form structures with conditional logic, (2) building a split-view editor where lawyers customize their template, and (3) rendering client-facing intake forms dynamically from that schema with the lawyer's branding applied via CSS variables.

The existing codebase provides solid foundations: `intake-stepper.tsx` with react-hook-form + Zod validation, `use-intake-form.ts` with localStorage draft persistence, `lawyerProfiles` table with specialties JSON, `file-dropzone.tsx` for uploads, and the server actions pattern with `requireAvocat` auth guards. The main work is creating the `intakeTemplates` table with jsonb schema, the template editor UI with @dnd-kit for question reordering, and refactoring the stepper to read dynamically from the template.

**Primary recommendation:** Use `jsonb` columns in Drizzle for template schema storage, @dnd-kit/core 6.3.1 + @dnd-kit/sortable 10.0.0 (stable pair) for drag & drop, and a Zod-based template schema type that serves as single source of truth for both editor validation and runtime form rendering.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Templates stockes en JSON schema en base de donnees (table intakeTemplates). Chaque template definit les etapes, questions, types de champs, validations. L'intake stepper lit le schema dynamiquement.
- **D-02:** Logique conditionnelle basique : show/hide de questions selon les reponses precedentes. Arbre simple (si reponse X -> afficher question Y), pas de boucles. Suffisant pour v1.
- **D-03:** Pas de versioning en v1. L'avocat modifie directement. Les soumissions existantes gardent leur snapshot (stocker les reponses avec la structure template au moment de la soumission).
- **D-04:** L'avocat peut personnaliser : questions (ajouter/modifier/supprimer), ordre des etapes, texte d'accueil, logo, couleurs d'accent. Couvre INTK-06 completement.
- **D-05:** Interface formulaire structure dans les parametres : sections pour questions (liste editable, drag & drop pour reordonner), branding (logo upload, color picker, texte d'accueil), et previsualisation. Pas de builder visuel type Typeform.
- **D-06:** L'avocat part d'un template pre-rempli par specialite qu'il peut modifier. Meilleur onboarding que le template vierge.
- **D-07:** Preview live cote : split view editeur a gauche, preview du formulaire a droite. L'avocat voit en temps reel l'impact de ses modifications.
- **D-08:** 3 specialites : Droit de la famille, Droit du travail, Droit penal.
- **D-09:** 5-8 questions specifiques par template en plus des questions communes (contact, description).
- **D-10:** URL dediee par avocat : /intake/[slug-cabinet]. Le template personnalise se charge automatiquement.
- **D-11:** Co-branding : "Propulse par LegalConnect" en footer + logo avocat en header.

### Claude's Discretion
- Structure exacte du JSON schema (champs, types, validation rules)
- Types de champs supportes (texte, select, date, checkbox, textarea, etc.)
- Pattern de snapshot des reponses au moment de la soumission
- Mecanisme de drag & drop pour reordonner les questions (dnd-kit vs native)

### Deferred Ideas (OUT OF SCOPE)
- Builder visuel drag & drop type Typeform -- complexite v2
- Versioning de templates avec historique -- v2 si audit requis
- Templates pour specialites supplementaires (immobilier, commercial, etc.) -- ajoutables facilement
- White-label complet (pas de mention LegalConnect) -- offre premium future
- Logique conditionnelle avancee (boucles, calculs) -- v2
- Import/export de templates entre avocats -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTK-05 | Pre-built intake templates available per legal specialty (family law, labor law, criminal defense) | JSON schema structure for templates, seed data pattern for 3 specialties, template selection UI |
| INTK-06 | Lawyer can customize intake questions, flow, and branding | Template editor with @dnd-kit sortable, branding fields on lawyerProfiles, CSS variable override pattern |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack:** Next.js 16.x, React 19, Drizzle ORM, react-hook-form + Zod, shadcn/ui, Tailwind CSS 4, TypeScript 5.7+
- **Auth:** Auth.js v5 with requireAvocat/requireClient guards
- **i18n:** next-intl for translations
- **Patterns:** Server actions with auth guards, RSC pages with server-side data fetching, cn() utility, URL searchParams as source of truth
- **ID generation:** Text IDs with crypto.randomUUID()
- **Security:** E2E encryption with libsodium, RGPD compliance
- **Monorepo:** Turborepo + pnpm, shared schemas in packages/shared

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | latest | Form management | Already used for intake. DynamicStepper will use it for template-driven validation |
| zod | 3.x | Schema validation | Single source of truth: template schema validation + dynamic form field validation |
| drizzle-orm | 0.45.x | ORM | `jsonb` column type from `drizzle-orm/pg-core` for template schema storage |
| next-intl | ^4.8.3 | i18n | Already used. Template UI copy in French via translation keys |

### New Dependencies
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @dnd-kit/core | 6.3.1 | Drag & drop engine | Stable release. Required peer dependency for @dnd-kit/sortable. Provides DndContext, sensors, collision detection |
| @dnd-kit/sortable | 10.0.0 | Sortable preset | Latest stable (peers on @dnd-kit/core ^6.3.0). Provides useSortable, SortableContext, verticalListSortingStrategy, arrayMove |
| @dnd-kit/utilities | 3.2.2 | CSS utilities | CSS.Transform.toString helper for transform styles. Peer of sortable |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit (stable) | @dnd-kit/react 0.3.2 (new API) | New API is cleaner but pre-release (0.x). Stable pair is battle-tested. Migrate later when 1.0 ships |
| @dnd-kit | react-beautiful-dnd | Unmaintained (archived by Atlassian). @dnd-kit is the standard replacement |
| @dnd-kit | HTML Drag & Drop API (native) | No keyboard accessibility, no smooth animations, no sortable helpers. @dnd-kit provides all of this |
| jsonb column | text column (JSON.stringify) | Existing codebase uses text for JSON, but jsonb enables PostgreSQL operators (`->`, `->>`, `@>`) for potential future querying. Cleaner semantics |

**Installation:**
```bash
pnpm add @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2 --filter apps/web
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
  lib/db/schema/
    intake-templates.ts          # intakeTemplates + intakeTemplateSnapshots tables
  components/intake/
    intake-stepper.tsx           # REFACTOR: read from template JSON
    dynamic-field.tsx            # Renders a single field from schema (text/select/date/etc.)
    dynamic-step.tsx             # Renders a step's fields from template schema
    cobranding-footer.tsx        # "Propulse par LegalConnect" footer
  components/templates/
    template-selector.tsx        # Card grid for 3 specialty templates
    template-specialty-card.tsx  # Individual specialty card
    template-editor.tsx          # Split view: editor + preview
    question-list.tsx            # @dnd-kit sortable list of questions
    question-card.tsx            # Individual question with drag handle
    question-edit-form.tsx       # Inline edit form (expanded state)
    field-type-selector.tsx      # Select dropdown for field types
    conditional-rule.tsx         # "Afficher si [Q] = [V]" UI
    branding-editor.tsx          # Logo, color, welcome text, slug
    color-picker.tsx             # input[type=color] + swatches + hex
    logo-upload.tsx              # file-dropzone variant for logo
    intake-preview.tsx           # Live preview panel
  server/actions/
    template.actions.ts          # CRUD for templates, slug uniqueness check
  app/(app)/settings/cabinet/template/
    page.tsx                     # Template selection (RSC)
    edit/page.tsx                # Template editor (RSC + client)
  app/intake/[slug]/
    page.tsx                     # Client-facing dynamic intake (RSC, no app layout)
    layout.tsx                   # Standalone layout (no sidebar)
packages/shared/src/schemas/
    intake-template.ts           # Zod schema for template JSON structure
```

### Pattern 1: JSON Template Schema (TypeScript/Zod)
**What:** A Zod schema defining the template structure stored in jsonb
**When to use:** Everywhere -- editor validation, API input validation, runtime form rendering

```typescript
// packages/shared/src/schemas/intake-template.ts
import { z } from "zod";

export const fieldTypeEnum = z.enum([
  "text", "textarea", "select", "date", "checkbox", "number"
]);

export const conditionalRuleSchema = z.object({
  sourceQuestionId: z.string(),
  expectedValue: z.string(),
}).optional();

export const templateQuestionSchema = z.object({
  id: z.string(), // crypto.randomUUID()
  label: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  fieldType: fieldTypeEnum,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select type
  validation: z.object({
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  conditionalRule: conditionalRuleSchema,
});

export const templateStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  questions: z.array(templateQuestionSchema),
});

export const intakeTemplateSchema = z.object({
  specialty: z.enum(["famille", "travail", "penal"]),
  steps: z.array(templateStepSchema),
  // Common steps (contact, documents) are always injected at render time,
  // not stored in the template. Only specialty-specific steps here.
});

export type IntakeTemplate = z.infer<typeof intakeTemplateSchema>;
export type TemplateQuestion = z.infer<typeof templateQuestionSchema>;
export type TemplateStep = z.infer<typeof templateStepSchema>;
export type FieldType = z.infer<typeof fieldTypeEnum>;
```

### Pattern 2: Database Schema (Drizzle)
**What:** Tables for templates and submission snapshots

```typescript
// apps/web/src/lib/db/schema/intake-templates.ts
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const intakeTemplates = pgTable("intake_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id").notNull().references(() => users.id),
  specialty: text("specialty").notNull(), // "famille" | "travail" | "penal"
  schema: jsonb("schema").notNull(), // IntakeTemplate JSON
  // Branding
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"), // hex e.g. "#1a1a1a"
  welcomeText: text("welcome_text"),
  slug: text("slug").unique(), // e.g. "dupont-avocats"
  isActive: text("is_active").default("1"), // "1" = active template
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
```

### Pattern 3: Snapshot at Submission Time (D-03)
**What:** Store the template structure alongside each submission so historical submissions are preserved even if the lawyer modifies the template later.

```typescript
// Extend intakeSubmissions with:
templateSnapshotId: text("template_snapshot_id"),

// New table for snapshots
export const intakeTemplateSnapshots = pgTable("intake_template_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id").notNull().references(() => intakeTemplates.id),
  schema: jsonb("schema").notNull(), // Frozen copy of template at submission time
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
```

The snapshot is created during `submitIntake()` -- take the current template schema, insert into snapshots, link to submission. This preserves the exact form structure the client answered.

### Pattern 4: Dynamic Zod Schema Generation at Runtime
**What:** Generate a Zod validation schema from the template JSON at form render time

```typescript
// Build Zod schema from template questions dynamically
function buildStepSchema(questions: TemplateQuestion[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const q of questions) {
    let field: z.ZodTypeAny;
    switch (q.fieldType) {
      case "text":
        field = z.string().max(q.validation?.maxLength ?? 200);
        break;
      case "textarea":
        field = z.string().max(q.validation?.maxLength ?? 2000);
        break;
      case "select":
        field = z.enum(q.options as [string, ...string[]]);
        break;
      case "date":
        field = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
        break;
      case "checkbox":
        field = z.boolean();
        break;
      case "number":
        field = z.coerce.number();
        if (q.validation?.min != null) field = (field as z.ZodNumber).min(q.validation.min);
        if (q.validation?.max != null) field = (field as z.ZodNumber).max(q.validation.max);
        break;
    }
    shape[q.id] = q.required ? field : field.optional();
  }

  return z.object(shape);
}
```

### Pattern 5: @dnd-kit Sortable Vertical List
**What:** Drag & drop reordering of questions in the template editor

```typescript
// Stable API: @dnd-kit/core 6.3.1 + @dnd-kit/sortable 10.0.0
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableQuestion({ id, question }: { id: string; question: TemplateQuestion }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <GripVertical {...listeners} className="cursor-grab" />
      {/* Question card content */}
    </div>
  );
}

function QuestionList({ questions, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      onReorder(arrayMove(questions, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
        {questions.map(q => (
          <SortableQuestion key={q.id} id={q.id} question={q} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 6: CSS Variables for Lawyer Branding
**What:** Override `--primary` with the lawyer's accent color on `/intake/[slug]` pages

```typescript
// In app/intake/[slug]/page.tsx (RSC)
export default async function IntakePage({ params }: { params: { slug: string } }) {
  const template = await getTemplateBySlug(params.slug);
  if (!template) return notFound();

  const cssVars = template.accentColor
    ? { "--lawyer-accent": template.accentColor,
        "--lawyer-accent-foreground": "#fafafa" } as React.CSSProperties
    : {};

  return (
    <div style={cssVars} className="min-h-screen">
      <DynamicIntake template={template} />
    </div>
  );
}
```

Then in components, use `var(--lawyer-accent, var(--primary))` as the fallback pattern.

### Pattern 7: Split-View Editor
**What:** Left panel (editor tabs) + right panel (live preview), 50/50 on desktop, stacked on mobile

```typescript
// Use a simple flex layout, no complex resizable panels needed for v1
<div className="flex flex-col lg:flex-row gap-8">
  <div className="w-full lg:w-1/2">
    <Tabs defaultValue="questions">
      <TabsList>
        <TabsTrigger value="questions">Questions</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
      </TabsList>
      <TabsContent value="questions"><QuestionList /></TabsContent>
      <TabsContent value="branding"><BrandingEditor /></TabsContent>
    </Tabs>
  </div>
  <div className="hidden lg:block w-full lg:w-1/2 border rounded-lg p-6">
    <IntakePreview template={currentTemplate} />
  </div>
</div>
```

On mobile, the preview is accessible via a Sheet component (from shadcn) triggered by a "Voir l'apercu" button.

### Anti-Patterns to Avoid
- **Storing templates as stringified JSON in text column:** Use `jsonb` -- it validates JSON at the DB level, enables operators, and Drizzle handles serialization
- **Building Zod schemas at import time from DB data:** Build schemas dynamically per-request in the form component, not at module scope
- **Putting conditional logic in the database query:** Evaluate conditional show/hide client-side only. The DB stores the rules; the React component evaluates them
- **Hardcoding common steps in the template schema:** Contact and Documents steps should NOT be in the template JSON. They are always rendered by the stepper and injected around the specialty-specific steps

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag & drop reordering | Custom mouse/touch event handlers | @dnd-kit/sortable 10.0.0 | Keyboard accessibility, smooth animations, collision detection, mobile support all included |
| Form validation from JSON | Custom validation engine | Zod dynamic schema generation | Consistent with existing react-hook-form + zodResolver pattern. One validation system |
| Color picker | Full custom color widget | `<input type="color">` + preset swatches | Native color picker is accessible, works on all browsers. Add preset swatches (6 colors) for quick selection |
| Slug uniqueness check | Polling or WebSocket | Debounced server action on blur | Simple, fits existing pattern. Server action calls `db.select().where(eq(slug, value))` |
| Template seed data | Manual SQL inserts | Drizzle migration seed script | Reproducible, version-controlled. 3 template records with preset questions per specialty |

## Common Pitfalls

### Pitfall 1: Stale Preview State
**What goes wrong:** Preview doesn't update when the editor changes, or updates are laggy/janky
**Why it happens:** Using separate React state for editor and preview, requiring manual sync
**How to avoid:** Use a single state source (e.g., `useReducer` for the template) that both editor and preview read from. Debounce text inputs (300ms per UI spec) but update state immediately for structural changes (add/delete/reorder)
**Warning signs:** Preview showing different data than editor, or noticeable lag

### Pitfall 2: Conditional Logic Circular References
**What goes wrong:** Question A shows if B = "yes", Question B shows if A = "no" -- infinite loop
**Why it happens:** No validation on conditional rule targets
**How to avoid:** A question can only reference questions that appear BEFORE it in the list (lower index). Enforce in both the UI selector (filter available source questions) and the Zod schema
**Warning signs:** Form rendering freezing or fields flickering

### Pitfall 3: Form Data Loss on Step Navigation
**What goes wrong:** Client fills Step 2, goes back to Step 1, returns to Step 2 -- data is gone
**Why it happens:** re-mounting step components destroys local state
**How to avoid:** The existing `use-intake-form.ts` already solves this with react-hook-form (persistent form state + localStorage). Extend this pattern for dynamic fields. The form should register ALL fields across ALL steps, not just the current step's fields
**Warning signs:** Data disappearing on back/forward navigation

### Pitfall 4: Dynamic Zod Schema Type Safety
**What goes wrong:** TypeScript can't infer field types from a dynamically generated Zod schema
**Why it happens:** `z.object(shape)` produces `z.ZodObject<any>` when shape is built at runtime
**How to avoid:** Accept the `any` type at the dynamic boundary. Use explicit typing for the form data as `Record<string, unknown>` and validate with `.safeParse()`. Don't try to make dynamic schemas fully type-safe -- that's impossible by nature
**Warning signs:** Excessive type gymnastics, `as any` casts everywhere

### Pitfall 5: Slug Conflicts and Race Conditions
**What goes wrong:** Two lawyers pick the same slug simultaneously
**Why it happens:** Check-then-insert without DB-level constraint
**How to avoid:** The `slug` column already has `.unique()` constraint. The server action should use an upsert or catch the unique violation error and return a user-friendly message. The UI checks on blur (debounced), but the DB constraint is the real guard
**Warning signs:** 500 errors on template save

### Pitfall 6: @dnd-kit Strict Mode Double Render
**What goes wrong:** React 18/19 Strict Mode causes double mount, which can break @dnd-kit sensor registration
**Why it happens:** StrictMode double-invokes effects in development
**How to avoid:** Use the latest @dnd-kit/core 6.3.1 which handles this. Don't disable StrictMode as a workaround
**Warning signs:** Drag not working in dev but working in production

## Code Examples

### Seed Data for 3 Specialty Templates

```typescript
// Seed data structure for "Droit de la famille" template
const familyTemplate: IntakeTemplate = {
  specialty: "famille",
  steps: [
    {
      id: "step-situation",
      label: "Situation familiale",
      questions: [
        {
          id: "q-family-status",
          label: "Quelle est votre situation familiale actuelle ?",
          fieldType: "select",
          required: true,
          options: ["Marie(e)", "Pacse(e)", "Concubinage", "Celibataire", "Divorce(e)", "Veuf/Veuve"],
        },
        {
          id: "q-children",
          label: "Avez-vous des enfants ?",
          fieldType: "select",
          required: true,
          options: ["Aucun", "1 enfant", "2 enfants", "3 enfants ou plus"],
        },
        {
          id: "q-children-ages",
          label: "Quel age ont vos enfants ?",
          fieldType: "text",
          required: false,
          conditionalRule: {
            sourceQuestionId: "q-children",
            expectedValue: "1 enfant", // Note: conditional shows for any non-"Aucun" value
          },
        },
        {
          id: "q-patrimoine",
          label: "Quel est votre regime matrimonial ?",
          fieldType: "select",
          required: false,
          options: ["Communaute legale", "Separation de biens", "Communaute universelle", "Je ne sais pas"],
          conditionalRule: {
            sourceQuestionId: "q-family-status",
            expectedValue: "Marie(e)",
          },
        },
        {
          id: "q-urgency-detail",
          label: "Y a-t-il une procedure en cours ?",
          fieldType: "select",
          required: true,
          options: ["Aucune procedure", "Procedure en cours", "Jugement rendu, je souhaite faire appel"],
        },
        {
          id: "q-desired-outcome",
          label: "Quel resultat souhaitez-vous obtenir ?",
          fieldType: "textarea",
          required: false,
          description: "Decrivez en quelques lignes votre objectif principal.",
        },
        {
          id: "q-description",
          label: "Decrivez votre situation en detail",
          fieldType: "textarea",
          required: true,
          description: "Prenez le temps d'expliquer votre situation. Toutes les informations sont confidentielles.",
        },
      ],
    },
  ],
};
```

### Dynamic Field Renderer

```typescript
// apps/web/src/components/intake/dynamic-field.tsx
"use client";

import { type TemplateQuestion } from "@legalconnect/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type UseFormReturn } from "react-hook-form";

interface DynamicFieldProps {
  question: TemplateQuestion;
  form: UseFormReturn<Record<string, unknown>>;
  visible: boolean;
}

export function DynamicField({ question, form, visible }: DynamicFieldProps) {
  if (!visible) return null;

  const fieldName = question.id;
  const error = form.formState.errors[fieldName];

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {question.label}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {question.description && (
        <p className="text-sm text-muted-foreground">{question.description}</p>
      )}
      {/* Render based on fieldType */}
      {question.fieldType === "text" && (
        <Input id={fieldName} {...form.register(fieldName)} />
      )}
      {question.fieldType === "textarea" && (
        <Textarea id={fieldName} rows={3} {...form.register(fieldName)} />
      )}
      {question.fieldType === "select" && (
        <Select onValueChange={(v) => form.setValue(fieldName, v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {question.fieldType === "date" && (
        <Input id={fieldName} type="date" {...form.register(fieldName)} />
      )}
      {question.fieldType === "checkbox" && (
        <Checkbox
          id={fieldName}
          onCheckedChange={(v) => form.setValue(fieldName, v)}
        />
      )}
      {question.fieldType === "number" && (
        <Input id={fieldName} type="number" {...form.register(fieldName)} />
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert" aria-describedby={fieldName}>
          {String(error.message)}
        </p>
      )}
    </div>
  );
}
```

### Conditional Visibility Evaluation

```typescript
// Evaluate whether a question should be visible based on current form values
function isQuestionVisible(
  question: TemplateQuestion,
  allQuestions: TemplateQuestion[],
  formValues: Record<string, unknown>
): boolean {
  if (!question.conditionalRule) return true;

  const { sourceQuestionId, expectedValue } = question.conditionalRule;
  const currentValue = formValues[sourceQuestionId];

  // Source question must itself be visible (recursive check, but max depth = question count)
  const sourceQuestion = allQuestions.find(q => q.id === sourceQuestionId);
  if (sourceQuestion && !isQuestionVisible(sourceQuestion, allQuestions, formValues)) {
    return false;
  }

  return String(currentValue) === expectedValue;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @dnd-kit/sortable 7.x | @dnd-kit/sortable 10.0.0 | Oct 2024 | Internal improvements, still same API surface with @dnd-kit/core 6.x |
| react-beautiful-dnd | @dnd-kit | 2023 (rbd archived) | @dnd-kit is the standard drag & drop library for React |
| JSON.stringify in text columns | jsonb in PostgreSQL | Always available | Better semantics, validation, operators. Drizzle supports natively |
| @dnd-kit/react 0.3.x | N/A (pre-release) | In development | Future replacement with simpler API, but not production-ready yet |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (workspace root config) |
| Config file | `/Users/dhamon/vitest.config.ts` |
| Quick run command | `pnpm vitest run tests/templates/ --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTK-05-a | Template schema validates correctly (valid/invalid JSON) | unit | `pnpm vitest run tests/templates/template-schema.test.ts -t "schema"` | -- Wave 0 |
| INTK-05-b | 3 specialty seed templates pass schema validation | unit | `pnpm vitest run tests/templates/template-schema.test.ts -t "seed"` | -- Wave 0 |
| INTK-05-c | getTemplateBySlug returns correct template | unit | `pnpm vitest run tests/templates/template-actions.test.ts -t "getBySlug"` | -- Wave 0 |
| INTK-06-a | saveTemplate creates/updates template for lawyer | unit | `pnpm vitest run tests/templates/template-actions.test.ts -t "save"` | -- Wave 0 |
| INTK-06-b | Slug uniqueness validation rejects duplicate | unit | `pnpm vitest run tests/templates/template-actions.test.ts -t "slug"` | -- Wave 0 |
| INTK-06-c | Dynamic Zod schema generation produces valid schema | unit | `pnpm vitest run tests/templates/dynamic-schema.test.ts` | -- Wave 0 |
| INTK-06-d | Conditional visibility logic evaluates correctly | unit | `pnpm vitest run tests/templates/conditional-logic.test.ts` | -- Wave 0 |
| INTK-06-e | Snapshot created at submission time | unit | `pnpm vitest run tests/templates/template-actions.test.ts -t "snapshot"` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/templates/ --reporter=verbose`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/templates/template-schema.test.ts` -- covers INTK-05-a, INTK-05-b
- [ ] `tests/templates/template-actions.test.ts` -- covers INTK-05-c, INTK-06-a, INTK-06-b, INTK-06-e
- [ ] `tests/templates/dynamic-schema.test.ts` -- covers INTK-06-c
- [ ] `tests/templates/conditional-logic.test.ts` -- covers INTK-06-d

## Open Questions

1. **Conditional rule: exact match vs "not equal"**
   - What we know: D-02 specifies "si reponse X -> afficher question Y", simple tree
   - What's unclear: Should conditional support "equals" only, or also "not equals"? Example: show "ages des enfants" when children != "Aucun" (any of the other 3 values)
   - Recommendation: Support both `equals` and `notEquals` operators in the conditionalRule schema. Minimal extra complexity, high practical value for the 3 templates

2. **Logo storage location**
   - What we know: OVHcloud S3 is used for document storage with SSE-C encryption
   - What's unclear: Should logos go to the same S3 bucket (they are not sensitive data, no encryption needed) or a separate public bucket?
   - Recommendation: Same bucket, different prefix (`logos/`), no SSE-C. Logos need to be publicly readable for the client intake page. Use a separate S3 presigned URL or make the prefix publicly accessible

3. **Template-to-submission association**
   - What we know: Currently `intakeSubmissions` has no link to any template
   - What's unclear: Should `intakeSubmissions` get a `templateId` column in addition to the snapshot?
   - Recommendation: Add both `templateId` (for filtering "submissions from my template") and `templateSnapshotId` (for exact form structure at submission time)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/web/src/lib/db/schema/intake.ts`, `lawyer.ts`, `intake-stepper.tsx`, `use-intake-form.ts` -- directly inspected
- @dnd-kit npm registry -- verified versions: core 6.3.1, sortable 10.0.0, utilities 3.2.2
- @dnd-kit official docs -- https://dndkit.com/presets/sortable (migration guide: https://dndkit.com/react/guides/migration)

### Secondary (MEDIUM confidence)
- @dnd-kit/react 0.3.2 (new API) status -- npm registry shows 0.x pre-release, not production-ready
- Drizzle ORM jsonb support -- part of `drizzle-orm/pg-core` exports, well-documented

### Tertiary (LOW confidence)
- None -- all findings verified against code or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified in npm, existing codebase patterns clear
- Architecture: HIGH -- JSON template schema is a well-understood pattern, existing code provides clear integration points
- Pitfalls: HIGH -- derived from direct code inspection (e.g., existing form state management, Drizzle schema patterns)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain, no fast-moving dependencies)
