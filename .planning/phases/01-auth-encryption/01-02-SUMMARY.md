---
phase: 01-auth-encryption
plan: 02
subsystem: auth
tags: [auth.js, next-auth, jwt, bcryptjs, react-email, resend, vitest, react-hook-form, zxcvbn]

# Dependency graph
requires:
  - phase: 01-auth-encryption/01
    provides: "Drizzle schemas (users, tokens, accounts), Zod validation schemas"
provides:
  - "Auth.js v5 config with JWT sessions (30-day), Credentials provider, DrizzleAdapter"
  - "Server actions: registerUser, verifyEmail, requestPasswordReset, resetPassword"
  - "Email templates (verification, password-reset, welcome) via React Email + Resend"
  - "Auth UI pages: register, login, verify-email, reset-password"
  - "Root vitest config + 21 behavioral auth tests (all passing)"
  - "proxy.ts route protection (Next.js 16 pattern)"
affects: [01-auth-encryption/03, 01-auth-encryption/04, dashboard, messaging]

# Tech tracking
tech-stack:
  added: [vitest, zxcvbn, clsx, tailwind-merge]
  patterns: [server-actions-for-auth, vi-hoisted-mock-pattern, in-memory-db-mock]

key-files:
  created:
    - apps/web/src/lib/auth.ts
    - apps/web/src/lib/auth.config.ts
    - apps/web/src/app/api/auth/[...nextauth]/route.ts
    - apps/web/proxy.ts
    - apps/web/src/server/actions/auth.actions.ts
    - apps/web/src/types/next-auth.d.ts
    - packages/email/src/verification.tsx
    - packages/email/src/password-reset.tsx
    - packages/email/src/welcome.tsx
    - packages/email/src/send.ts
    - apps/web/src/app/(auth)/layout.tsx
    - apps/web/src/app/(auth)/register/page.tsx
    - apps/web/src/app/(auth)/login/page.tsx
    - apps/web/src/app/(auth)/verify-email/page.tsx
    - apps/web/src/app/(auth)/reset-password/page.tsx
    - apps/web/src/components/auth/register-form.tsx
    - apps/web/src/components/auth/login-form.tsx
    - apps/web/src/components/auth/password-strength.tsx
    - apps/web/src/components/auth/reset-password-form.tsx
    - apps/web/src/components/auth/reset-password-request-form.tsx
    - apps/web/src/lib/utils.ts
    - vitest.config.ts
    - tests/setup.ts
    - tests/auth/register.test.ts
    - tests/auth/login.test.ts
    - tests/auth/verification.test.ts
    - tests/auth/reset-password.test.ts
  modified:
    - packages/email/src/index.ts
    - package.json
    - apps/web/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Used vi.hoisted() for test mock state sharing across vitest module boundaries"
  - "Installed drizzle-orm at workspace root to ensure vi.mock intercepts module in server actions"
  - "Server actions use FormData API for progressive enhancement compatibility"
  - "Token insert without .returning() for verification/reset tokens (no return value needed)"

patterns-established:
  - "Server actions pattern: 'use server' + Zod validation + FormData input"
  - "In-memory DB mock with vi.hoisted store for vitest behavioral tests"
  - "Auth UI pattern: Server page component + client form component with react-hook-form"
  - "cn() utility (clsx + tailwind-merge) for conditional Tailwind classes"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 17min
completed: 2026-03-25
---

# Phase 01 Plan 02: Auth System Summary

**Auth.js v5 with JWT sessions, registration/verification/reset server actions, French email templates via Resend, auth UI pages with role selection and password strength, and 21 passing behavioral tests**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-25T22:36:32Z
- **Completed:** 2026-03-25T22:53:05Z
- **Tasks:** 2
- **Files modified:** 31

## Accomplishments
- Complete auth system: registration with role selection (avocat/client), email verification with 24h token, login with JWT sessions (30 days), password reset with 1h token
- Email templates in French with warm professional tone, sent via Resend
- Auth UI pages under (auth) route group with password strength indicator (zxcvbn)
- 21 behavioral tests covering register (7), login (5), verification (4), reset-password (5) -- all passing
- proxy.ts route protection redirecting unauthenticated users to /login

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth.js v5 config, server actions, email templates** - `aac71fc` (feat)
2. **Task 2: Auth UI pages, vitest setup, behavioral auth tests** - `4aa8afa` (feat)

## Files Created/Modified
- `apps/web/src/lib/auth.ts` - Auth.js v5 config with Credentials provider, JWT callbacks
- `apps/web/src/lib/auth.config.ts` - Edge-safe auth config for proxy.ts
- `apps/web/proxy.ts` - Route protection (Next.js 16 pattern)
- `apps/web/src/server/actions/auth.actions.ts` - registerUser, verifyEmail, requestPasswordReset, resetPassword
- `apps/web/src/types/next-auth.d.ts` - Type augmentation for role in JWT/Session
- `packages/email/src/verification.tsx` - Verification email template (French)
- `packages/email/src/password-reset.tsx` - Password reset email template (French)
- `packages/email/src/welcome.tsx` - Welcome email template (French)
- `packages/email/src/send.ts` - Resend wrapper
- `packages/email/src/index.ts` - Convenience email sending functions
- `apps/web/src/app/(auth)/layout.tsx` - Centered auth layout
- `apps/web/src/components/auth/register-form.tsx` - Registration with role selection
- `apps/web/src/components/auth/login-form.tsx` - Login with password reset link
- `apps/web/src/components/auth/password-strength.tsx` - zxcvbn-based strength indicator
- `vitest.config.ts` - Root vitest config with path aliases
- `tests/setup.ts` - In-memory DB mock with vi.hoisted pattern

## Decisions Made
- Used `vi.hoisted()` to share mutable state between vitest mock factories and test code -- standard vitest pattern for complex mocking
- Installed `drizzle-orm` at workspace root devDependency to ensure `vi.mock("drizzle-orm")` intercepts imports from `apps/web/src/` (pnpm strict resolution)
- Server actions accept `FormData` for progressive enhancement compatibility
- Used separate `auth.config.ts` for edge-safe config (proxy.ts) vs full `auth.ts` (with DB)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added clsx and tailwind-merge dependencies**
- **Found during:** Task 2 (Auth UI components)
- **Issue:** RegisterForm uses `cn()` utility which requires clsx and tailwind-merge
- **Fix:** Added clsx, tailwind-merge to web app dependencies; created `src/lib/utils.ts`
- **Files modified:** apps/web/package.json, apps/web/src/lib/utils.ts
- **Verification:** Components compile correctly
- **Committed in:** 4aa8afa (Task 2 commit)

**2. [Rule 3 - Blocking] Installed drizzle-orm at workspace root for test mocking**
- **Found during:** Task 2 (vitest setup)
- **Issue:** vi.mock("drizzle-orm") did not intercept imports from auth.actions.ts because drizzle-orm was only in apps/web/node_modules (pnpm strict hoisting)
- **Fix:** Added drizzle-orm as workspace root devDependency
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** All 21 tests pass
- **Committed in:** 4aa8afa (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for compilation and test execution. No scope creep.

## Issues Encountered
- vitest mock hoisting: `vi.mock()` factory functions cannot access variables from outer scope. Solved with `vi.hoisted()` to create shared state accessible from both mock factories and test code.
- pnpm strict module resolution: Mocking `drizzle-orm` from root-level tests doesn't intercept imports that resolve to `apps/web/node_modules/drizzle-orm`. Fixed by installing at root.

## User Setup Required

None - no external service configuration required. Email sending via Resend will require `RESEND_API_KEY` environment variable when deployed.

## Known Stubs

None - all auth flows are fully wired. Email sending depends on `RESEND_API_KEY` env var at runtime but the code path is complete.

## Next Phase Readiness
- Auth foundation complete: registration, verification, login, password reset all functional
- Ready for Plan 03 (E2E encryption with libsodium) and Plan 04 (RGPD compliance)
- Auth session available via `auth()` for all server components and route handlers

## Self-Check: PASSED

All key files verified present. Both commits (aac71fc, 4aa8afa) verified in git log. 21/21 tests pass.

---
*Phase: 01-auth-encryption*
*Completed: 2026-03-25*
