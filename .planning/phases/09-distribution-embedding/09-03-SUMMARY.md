---
phase: 09-distribution-embedding
plan: 03
subsystem: ui
tags: [next.js, og-image, landing-page, widget, clipboard, integration]

# Dependency graph
requires:
  - phase: 09-01
    provides: Widget API routes and embeddable widget.js bundle
  - phase: 08-03
    provides: DynamicStepper, intake templates, branding config, /intake/[slug] pattern
provides:
  - Hosted lawyer landing page at /cabinet-[slug] with hero, specialties, and intake form
  - Dynamic OG meta tags and OG image for social sharing
  - Integration settings page with copyable widget snippet and hosted page link
  - Widget preview mockup component
affects: [distribution, seo, marketing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone public route pattern reused from /intake/[slug] for /cabinet-[slug]"
    - "buttonVariants() for anchor styled as button (no asChild in base-ui)"
    - "Clipboard API with toast feedback for copy interactions"
    - "Edge runtime OG image generation with next/og ImageResponse"

key-files:
  created:
    - apps/web/src/app/cabinet-[slug]/page.tsx
    - apps/web/src/app/cabinet-[slug]/layout.tsx
    - apps/web/src/app/cabinet-[slug]/loading.tsx
    - apps/web/src/app/cabinet-[slug]/opengraph-image.tsx
    - apps/web/src/components/landing/lawyer-hero.tsx
    - apps/web/src/components/landing/specialty-card.tsx
    - apps/web/src/app/(app)/settings/cabinet/integration/page.tsx
    - apps/web/src/components/integration/snippet-copy-block.tsx
    - apps/web/src/components/integration/widget-preview.tsx
    - apps/web/src/components/integration/hosted-link-copy.tsx
  modified:
    - apps/web/src/server/actions/template.actions.ts
    - apps/web/src/app/(app)/settings/layout.tsx

key-decisions:
  - "Used buttonVariants() for CTA anchor link instead of asChild (base-ui Button has no asChild)"
  - "Created HostedLinkCopy as separate client component for clipboard interaction isolation"
  - "Specialty icon mapping uses includes() match on lowercased name for fuzzy matching"

patterns-established:
  - "OG image generation: edge runtime + ImageResponse with dynamic data fetch"
  - "Clipboard copy pattern: useState for copied state + 2s timeout reset + sonner toast"

requirements-completed: [DIST-02]

# Metrics
duration: 5min
completed: 2026-03-28
---

# Phase 9 Plan 3: Hosted Landing Pages & Integration Settings Summary

**Hosted /cabinet-[slug] landing page with LawyerHero, specialty cards, DynamicStepper intake, dynamic OG images, and /settings/cabinet/integration with copyable widget snippet and hosted page link**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-28T10:56:52Z
- **Completed:** 2026-03-28T11:02:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Hosted lawyer landing page at /cabinet-[slug] with hero section (avatar, firm name, specialties, CTA), specialty cards grid, and reused DynamicStepper intake form
- Dynamic OG meta tags and edge-runtime OG image generated from lawyer profile data
- Integration settings page with 3-step widget installation guide, copyable script snippet, copyable hosted page link, and static widget preview mockup
- 404 error state for non-existent slugs with user-friendly messaging

## Task Commits

Each task was committed atomically:

1. **Task 1: Hosted lawyer landing page /cabinet-[slug]** - `8520532` (feat)
2. **Task 2: Integration settings page with snippet and preview** - `88a5841` (feat)

## Files Created/Modified
- `apps/web/src/app/cabinet-[slug]/page.tsx` - RSC landing page with generateMetadata, hero, specialty grid, DynamicStepper
- `apps/web/src/app/cabinet-[slug]/layout.tsx` - Standalone layout wrapper (no auth, no sidebar)
- `apps/web/src/app/cabinet-[slug]/loading.tsx` - Loading skeleton for hero + cards + stepper
- `apps/web/src/app/cabinet-[slug]/opengraph-image.tsx` - Edge-runtime dynamic OG image with firm name and specialties
- `apps/web/src/components/landing/lawyer-hero.tsx` - Hero section with avatar, firm name, specialty badges, description, CTA
- `apps/web/src/components/landing/specialty-card.tsx` - Specialty card + grid with Lucide icon mapping
- `apps/web/src/app/(app)/settings/cabinet/integration/page.tsx` - Integration settings with snippet, hosted link, preview
- `apps/web/src/components/integration/snippet-copy-block.tsx` - Copyable widget script tag with clipboard API
- `apps/web/src/components/integration/hosted-link-copy.tsx` - Copyable hosted page URL with clipboard API
- `apps/web/src/components/integration/widget-preview.tsx` - Static widget mockup preview
- `apps/web/src/server/actions/template.actions.ts` - Added lawyerId to getTemplateBySlug return
- `apps/web/src/app/(app)/settings/layout.tsx` - Added Integration nav link

## Decisions Made
- Used `buttonVariants()` for CTA anchor link instead of `asChild` prop (base-ui Button has no asChild support per Phase 07 decision)
- Created `HostedLinkCopy` as a separate client component to isolate clipboard interaction from the RSC page
- Specialty icon mapping uses `includes()` on lowercased name for fuzzy matching (e.g., "Droit de la famille" matches "famille")
- `getTemplateBySlug` now returns `lawyerId` to enable profile join for hero section data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CTA button incompatible with base-ui Button**
- **Found during:** Task 1 (LawyerHero component)
- **Issue:** Plan specified `Button asChild` wrapping an `<a>` tag, but base-ui Button does not support `asChild`
- **Fix:** Used `buttonVariants()` utility directly on `<a>` element (consistent with Phase 07 convention)
- **Files modified:** apps/web/src/components/landing/lawyer-hero.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** 8520532 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor pattern adjustment consistent with existing codebase conventions. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all components are fully wired with data from server actions and database queries.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 09 complete: widget embeddable, API routes serving, hosted landing pages, integration settings
- Ready for production deployment or UAT testing
- All distribution/embedding features (DIST-01, DIST-02) delivered

## Self-Check: PASSED

- All 9 created files verified present on disk
- Commit 8520532 (Task 1) verified in git log
- Commit 88a5841 (Task 2) verified in git log
- TypeScript clean (no errors in new files, pre-existing errors unrelated)

---
*Phase: 09-distribution-embedding*
*Completed: 2026-03-28*
