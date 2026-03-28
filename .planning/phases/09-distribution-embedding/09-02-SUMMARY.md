---
phase: 09-distribution-embedding
plan: 02
subsystem: ui
tags: [react, widget, shadow-dom, vite, iife, accessibility, intake-form]

# Dependency graph
requires:
  - phase: 09-distribution-embedding
    provides: "Widget scaffold (Vite build, api.ts, config.ts, widget.css)"
  - phase: 08-intake-templates-customization
    provides: "Template schema types and intake form patterns"
provides:
  - "Complete widget React UI: button, modal, multi-step intake form, confirmation"
  - "Accessible dialog with focus trap and keyboard navigation"
  - "Native HTML5 form validation (no react-hook-form)"
affects: [09-distribution-embedding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plain HTML + CSS classes for widget components (no shadcn/Tailwind)"
    - "Inline SVG icons to avoid icon library dependencies"
    - "Native HTML5 validation instead of Zod runtime in widget"
    - "Type-only imports from shared packages for bundle discipline"

key-files:
  created:
    - apps/widget/src/Widget.tsx
    - apps/widget/src/components/WidgetButton.tsx
    - apps/widget/src/components/WidgetModal.tsx
    - apps/widget/src/components/WidgetHeader.tsx
    - apps/widget/src/components/WidgetFooter.tsx
    - apps/widget/src/components/WidgetIntakeForm.tsx
    - apps/widget/src/components/WidgetStepIndicator.tsx
    - apps/widget/src/components/WidgetConfirmation.tsx
  modified:
    - apps/widget/src/main.tsx
    - apps/widget/src/styles/widget.css

key-decisions:
  - "Plain HTML elements + widget.css classes for all components -- zero UI library deps"
  - "Inline SVG strings for icons instead of lucide-react to keep bundle small"
  - "Re-implemented conditional visibility logic inline (~20 lines) to avoid shared package runtime import"

patterns-established:
  - "Widget component pattern: plain HTML + CSS class names from widget.css"
  - "Focus trap pattern: manual Tab/Shift+Tab cycling within modal"
  - "Native form validation: required attr + reportValidity() for step-by-step validation"

requirements-completed: [DIST-01]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 09 Plan 02: Widget Components Summary

**Embeddable widget React UI with floating button, accessible modal, multi-step intake form using plain HTML + native validation -- 66.89KB gzipped**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T11:30:00Z
- **Completed:** 2026-03-28T11:33:00Z
- **Tasks:** 1
- **Files modified:** 10

## Accomplishments
- Complete widget UI: floating button, modal with focus trap, multi-step form, step indicator, confirmation screen
- Accessible dialog with aria-modal, aria-labelledby, focus trap, Escape key close
- Native HTML5 validation for required fields, email, phone, date types
- Bundle size: 66.89KB gzipped (well under 150KB limit)
- Zero UI library dependencies (no shadcn, Tailwind, react-hook-form, lucide-react)

## Task Commits

Each task was committed atomically:

1. **Task 1: Widget React components (button, modal, intake form)** - `9d1437c` (feat)

## Files Created/Modified
- `apps/widget/src/Widget.tsx` - Root component: template loading via fetchTemplate, open/close state, Escape key listener
- `apps/widget/src/components/WidgetButton.tsx` - Floating circular button with chat icon SVG, aria-label, keyboard support
- `apps/widget/src/components/WidgetModal.tsx` - Dialog with aria-modal, focus trap, slide-up animation, backdrop close
- `apps/widget/src/components/WidgetHeader.tsx` - Lawyer firm name title + close button with X icon
- `apps/widget/src/components/WidgetFooter.tsx` - "Propulse par LegalConnect" + lock icon + "Chiffre bout en bout"
- `apps/widget/src/components/WidgetIntakeForm.tsx` - Multi-step form: text/textarea/select/checkbox/date/phone/email fields, native validation, Suivant/Precedent/Soumettre navigation
- `apps/widget/src/components/WidgetStepIndicator.tsx` - "Etape N/total" with dot indicators
- `apps/widget/src/components/WidgetConfirmation.tsx` - Success message with checkmark SVG, auto-close after 3s
- `apps/widget/src/main.tsx` - Updated to render Widget root component
- `apps/widget/src/styles/widget.css` - Updated styles for all widget components

## Decisions Made
- Plain HTML elements + widget.css classes for all components -- zero UI library deps
- Inline SVG strings for icons instead of lucide-react to keep bundle small
- Re-implemented conditional visibility logic inline to avoid shared package runtime import

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Widget UI complete, ready for Plan 03 (embed script and integration testing)
- All components render within Shadow DOM container from Plan 01 scaffold
- API integration wired (fetchTemplate on mount, submitWidgetIntake on form submit)

## Self-Check: PASSED

- All 8 component files exist on disk
- Commit 9d1437c verified in git log
- Build succeeds: 66.89KB gzipped
- Content checks: fetchTemplate, aria-modal, Soumettre, Votre demande, Propulse par LegalConnect all found

---
*Phase: 09-distribution-embedding*
*Completed: 2026-03-28*
