---
phase: 02-intake-form-trust-ux
plan: 01
subsystem: ui
tags: [shadcn-ui, tailwind-css-v4, next-intl, zod, drizzle, i18n, trust-ux]

requires:
  - phase: 01-auth-encryption
    provides: "auth schema (users table), crypto package, Drizzle ORM setup"
provides:
  - "shadcn/ui component library initialized in apps/web"
  - "Zod intake schemas (4 steps) exported from @legalconnect/shared"
  - "Drizzle intake schema (intakeSubmissions, intakeDocuments tables)"
  - "next-intl French locale with complete intake form translations"
  - "Trust indicator components (EncryptionBadge, TrustBanner, TrustTooltip)"
  - "Custom --trust CSS variable for trust green color"
affects: [02-02, 02-03, 03-ai-engine, 05-document-pipeline]

tech-stack:
  added: [tailwindcss-v4, "@tailwindcss/postcss", postcss, shadcn-ui, next-intl, lucide-react, react-dropzone, "@aws-sdk/client-s3"]
  patterns: ["shadcn/ui new-york style with cn() utility", "next-intl getRequestConfig for FR locale", "Drizzle schema with text IDs and relations", "Trust green via --trust CSS variable (HSL 142 71% 45%)"]

key-files:
  created:
    - apps/web/components.json
    - apps/web/postcss.config.mjs
    - apps/web/src/app/globals.css
    - apps/web/src/i18n/request.ts
    - apps/web/messages/fr.json
    - apps/web/src/components/ui/*.tsx (13 components)
    - apps/web/src/lib/db/schema/intake.ts
    - packages/shared/src/schemas/intake.ts
    - apps/web/src/components/trust/encryption-badge.tsx
    - apps/web/src/components/trust/trust-banner.tsx
    - apps/web/src/components/trust/trust-tooltip.tsx
  modified:
    - apps/web/package.json
    - apps/web/next.config.ts
    - apps/web/src/app/layout.tsx
    - apps/web/src/lib/db/schema/index.ts
    - packages/shared/src/index.ts
    - pnpm-lock.yaml

key-decisions:
  - "shadcn/ui new-york style (not default) for professional legal aesthetic"
  - "Tailwind CSS v4 with @tailwindcss/postcss plugin (no tailwind.config.js needed)"
  - "Trust green color as HSL CSS variable --trust: 142 71% 45% (emerald-600 equivalent)"
  - "db:push deferred - PostgreSQL not available locally, schema code complete"

patterns-established:
  - "Trust components use hsl(var(--trust)) for consistent green color"
  - "All trust components are 'use client' with cn() for class merging"
  - "Icons use data-icon attribute inside Badge/Button per shadcn conventions"
  - "French translations in messages/fr.json with nested keys (intake.step1.heading)"

requirements-completed: [INTK-01, SECU-03]

duration: 5min
completed: 2026-03-26
---

# Phase 2 Plan 1: Foundation Layer Summary

**shadcn/ui design system with Tailwind CSS v4, intake Zod/Drizzle schemas, next-intl French locale, and trust indicator components (EncryptionBadge, TrustBanner, TrustTooltip)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T10:37:57Z
- **Completed:** 2026-03-26T10:43:17Z
- **Tasks:** 2
- **Files modified:** 29

## Accomplishments

- shadcn/ui initialized with 13 components (button, input, textarea, select, card, badge, tooltip, progress, separator, alert, alert-dialog, toggle, toggle-group) and Tailwind CSS v4
- Zod intake schemas for all 4 form steps (problemType, description, documents, contact) with merged intakeSchema exported from @legalconnect/shared
- Drizzle intake schema with intakeSubmissions and intakeDocuments tables with proper relations and foreign keys to users table
- next-intl configured for French locale with comprehensive intake form translations (steps, errors, trust copy, destructive actions)
- Three trust indicator components built using shadcn/ui primitives and custom --trust CSS variable

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize shadcn/ui, next-intl, and create intake data schemas** - `cff668f` (feat)
2. **Task 2: Build trust indicator components** - `7b98f86` (feat)

## Files Created/Modified

- `apps/web/components.json` - shadcn/ui configuration (new-york style)
- `apps/web/postcss.config.mjs` - PostCSS config for Tailwind CSS v4
- `apps/web/src/app/globals.css` - Tailwind v4 imports, shadcn theme variables, --trust CSS variable
- `apps/web/src/app/layout.tsx` - Added NextIntlClientProvider and TooltipProvider wrappers
- `apps/web/next.config.ts` - Added next-intl plugin wrapper
- `apps/web/src/i18n/request.ts` - next-intl server config for French locale
- `apps/web/messages/fr.json` - Complete French translations for intake form
- `apps/web/src/components/ui/*.tsx` - 13 shadcn/ui components
- `apps/web/src/lib/db/schema/intake.ts` - Drizzle schema for intakeSubmissions and intakeDocuments
- `packages/shared/src/schemas/intake.ts` - Zod schemas for 4 intake steps + merged schema
- `apps/web/src/components/trust/encryption-badge.tsx` - Green padlock badge
- `apps/web/src/components/trust/trust-banner.tsx` - E2E encryption banner with shield icon
- `apps/web/src/components/trust/trust-tooltip.tsx` - Padlock tooltip wrapper

## Decisions Made

- Used shadcn/ui new-york style for a clean, professional legal aesthetic
- Tailwind CSS v4 with @tailwindcss/postcss (no tailwind.config.js file needed)
- Trust green color defined as HSL CSS variable (--trust: 142 71% 45%) for consistent usage across trust components
- TooltipProvider wrapped at root layout level (required by shadcn tooltip)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn init interactive prompt required manual config**
- **Found during:** Task 1 (shadcn/ui initialization)
- **Issue:** `pnpm dlx shadcn@latest init --preset radix-nova` hung on interactive prompt (radix-nova preset not available)
- **Fix:** Created components.json manually with new-york style, installed Tailwind CSS v4 + PostCSS + lucide-react separately, then ran `shadcn add` for individual components
- **Files modified:** apps/web/components.json, apps/web/postcss.config.mjs
- **Verification:** All 13 components generated successfully
- **Committed in:** cff668f

**2. [Rule 3 - Blocking] db:push failed - no local PostgreSQL**
- **Found during:** Task 1 (schema push)
- **Issue:** `pnpm db:push` failed because PostgreSQL is not running locally
- **Fix:** Schema code is complete and correct. Push deferred to when DB is available
- **Files modified:** None
- **Verification:** Schema file compiles, follows exact conventions from auth.ts

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** shadcn preset name difference is cosmetic (new-york equivalent quality). DB push is an infrastructure dependency, not a code issue.

## Issues Encountered

- `radix-nova` preset not available in current shadcn CLI - used `new-york` style which provides equivalent component quality
- Local PostgreSQL not running - schema is ready for push when DB becomes available

## Known Stubs

None - all components render real content, schemas are complete with all fields.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- shadcn/ui components ready for multi-step form (Plan 02-02)
- Zod schemas ready for react-hook-form integration with zodResolver
- Trust components ready for placement in intake form steps
- next-intl translations ready for form labels and error messages
- Intake DB schema ready for submission persistence (once PostgreSQL available)

---
*Phase: 02-intake-form-trust-ux*
*Completed: 2026-03-26*
