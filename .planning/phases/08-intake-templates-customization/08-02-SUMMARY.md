---
phase: 08-intake-templates-customization
plan: 02
subsystem: ui
tags: [dnd-kit, react, template-editor, drag-drop, branding, color-picker]

# Dependency graph
requires:
  - phase: 08-intake-templates-customization
    provides: "Zod schemas, server actions, DynamicField/DynamicStep components, seed templates"
provides:
  - "Template selector page with 3 specialty cards"
  - "Split-view template editor with useReducer state management"
  - "DnD-kit sortable question list with drag handles"
  - "Question edit form with field type selector and conditional rules"
  - "Branding editor with logo upload, color picker, slug validation"
  - "Live intake preview panel with DynamicStep rendering"
affects: [08-03, intake-widget, lawyer-settings]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: ["useReducer for complex editor state", "debounced text inputs 300ms", "base64 data URL for logo storage", "SortableContext + useSortable pattern"]

key-files:
  created:
    - "apps/web/src/components/templates/template-editor.tsx"
    - "apps/web/src/components/templates/template-selector.tsx"
    - "apps/web/src/components/templates/template-specialty-card.tsx"
    - "apps/web/src/components/templates/intake-preview.tsx"
    - "apps/web/src/components/templates/question-list.tsx"
    - "apps/web/src/components/templates/question-card.tsx"
    - "apps/web/src/components/templates/question-edit-form.tsx"
    - "apps/web/src/components/templates/field-type-selector.tsx"
    - "apps/web/src/components/templates/conditional-rule.tsx"
    - "apps/web/src/components/templates/branding-editor.tsx"
    - "apps/web/src/components/templates/color-picker.tsx"
    - "apps/web/src/components/templates/logo-upload.tsx"
    - "apps/web/src/app/(app)/settings/cabinet/template/page.tsx"
    - "apps/web/src/app/(app)/settings/cabinet/template/edit/page.tsx"
  modified:
    - "apps/web/package.json"

key-decisions:
  - "useReducer for editor state: single source of truth for template + branding across tabs and preview"
  - "Base64 data URL for logo storage: avoids S3 complexity for v1, stored in template jsonb"
  - "Only prior questions selectable as conditional sources: prevents circular dependency refs"
  - "Sheet bottom drawer for mobile preview: maintains split-view UX on small screens"

patterns-established:
  - "DndContext + SortableContext + useSortable pattern for drag-and-drop lists"
  - "Debounced 300ms text dispatch for useReducer state updates"
  - "AlertDialogTrigger with render prop pattern for base-ui shadcn v4"

requirements-completed: [INTK-05, INTK-06]

# Metrics
duration: 10min
completed: 2026-03-27
---

# Phase 08 Plan 02: Template Customization UI Summary

**Split-view template editor with @dnd-kit drag-and-drop questions, branding config (logo/color/slug), and real-time intake preview**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-27T22:07:39Z
- **Completed:** 2026-03-27T22:17:17Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Template selector page showing 3 specialty cards (famille/travail/penal) with radio selection and auto-redirect to editor
- Full split-view editor: Tabs (Questions/Branding) on left, live IntakePreview on right, Sheet drawer on mobile
- @dnd-kit sortable question list with pointer + keyboard sensors, drag handles, and arrayMove reordering
- Question edit with field type selector (6 types), options editor for select fields, conditional rules (equals/notEquals)
- Branding editor with logo upload (base64), 6-preset color picker with native input, welcome text, and slug with availability check
- Live preview rendering DynamicStep components with branding CSS variables

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dnd-kit + template selector + editor shell** - `28e7214` (feat)
2. **Task 2: Question list with dnd-kit + branding editor + all sub-components** - `f8f0ae0` (feat)

## Files Created/Modified
- `apps/web/src/components/templates/template-editor.tsx` - Main split-view editor with useReducer state
- `apps/web/src/components/templates/template-selector.tsx` - Specialty selection with 3 cards
- `apps/web/src/components/templates/template-specialty-card.tsx` - Radio card with icon and selection state
- `apps/web/src/components/templates/intake-preview.tsx` - Live preview with DynamicStep and branding
- `apps/web/src/components/templates/question-list.tsx` - DndContext + SortableContext drag-and-drop list
- `apps/web/src/components/templates/question-card.tsx` - Compact card with drag handle and inline edit
- `apps/web/src/components/templates/question-edit-form.tsx` - Inline form with field type, options, conditionals
- `apps/web/src/components/templates/field-type-selector.tsx` - 6-type Select with icons
- `apps/web/src/components/templates/conditional-rule.tsx` - Conditional visibility rule editor
- `apps/web/src/components/templates/branding-editor.tsx` - Logo, color, welcome text, slug editor
- `apps/web/src/components/templates/color-picker.tsx` - 6 presets + native color input + hex validation
- `apps/web/src/components/templates/logo-upload.tsx` - Drag-and-drop logo with base64 storage
- `apps/web/src/app/(app)/settings/cabinet/template/page.tsx` - RSC template selection page
- `apps/web/src/app/(app)/settings/cabinet/template/edit/page.tsx` - RSC template editor page
- `apps/web/package.json` - Added @dnd-kit dependencies

## Decisions Made
- Used useReducer (not useState) for template editor state: clean action dispatch, single source of truth for editor + preview
- Logo stored as base64 data URL in jsonb: simpler than S3 presigned URLs for v1, max 2MB
- Conditional rules only allow prior questions as source: prevents circular visibility chains
- Sheet bottom drawer for mobile preview: maintains desktop split-view UX pattern on small screens

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript 6.x requires explicit `undefined` argument for `useRef<T>()` calls (no zero-arg overload). Fixed by passing `useRef<T>(undefined)`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All template editor UI components ready for Plan 03 (integration testing/polish)
- Server actions from Plan 01 fully wired into editor components
- Preview renders live using shared DynamicStep/DynamicField from Phase 08-01

## Self-Check: PASSED

- All 12 component files exist in `apps/web/src/components/templates/`
- RSC pages exist in `apps/web/src/app/(app)/settings/cabinet/template/`
- Commit `28e7214` (Task 1) verified in git log
- Commit `f8f0ae0` (Task 2) verified in git log
- No TypeScript errors in template files
- All acceptance criteria grep checks pass

---
*Phase: 08-intake-templates-customization*
*Completed: 2026-03-27*
