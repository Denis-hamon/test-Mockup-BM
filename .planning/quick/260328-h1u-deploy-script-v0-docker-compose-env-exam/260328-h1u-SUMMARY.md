---
phase: quick
plan: 260328-h1u
subsystem: infra
tags: [docker, docker-compose, postgresql, valkey, seed, deployment]

requires:
  - phase: 01-09
    provides: "Full application codebase with Drizzle schema"
provides:
  - "Docker Compose infrastructure (PostgreSQL 16, Valkey 9, Next.js)"
  - "Multi-stage Dockerfile for Next.js standalone build"
  - "Complete .env.example with OVH AI Endpoints config"
  - "Seed script with test data (users, templates, dossier, AI summary)"
  - "5-step deploy guide in French"
affects: [deployment, devops, onboarding]

tech-stack:
  added: [tsx]
  patterns: [multi-stage-docker-build, drizzle-kit-push-seed]

key-files:
  created:
    - scripts/seed.ts
    - README-DEPLOY.md
  modified:
    - docker-compose.yml
    - apps/web/Dockerfile
    - .env.example

key-decisions:
  - "Used node-postgres (drizzle-orm/node-postgres) in seed script for consistency with app DB driver"
  - "drizzle-kit push --force for schema application in seed (no migration files needed for dev)"

patterns-established:
  - "Seed script pattern: check existing data before inserting, exit cleanly if already seeded"

requirements-completed: [DEPLOY-V0]

duration: 5min
completed: 2026-03-28
---

# Quick 260328-h1u: Deploy Script v0 Summary

**Docker Compose infrastructure with PostgreSQL/Valkey/Next.js, seed script creating 2 test users + 3 templates + 1 dossier with AI summary, and 5-step French deploy guide**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-28
- **Completed:** 2026-03-28
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Docker Compose with 3 services (PostgreSQL 16, Valkey 9, Next.js) with healthchecks and restart policies
- Seed script creates complete test dataset: avocat Me Sophie Martin, client Jean Dupont, 3 intake templates (famille/travail/penal), 1 submitted dossier, 1 AI case summary
- README-DEPLOY.md with 5-step guide including OVH AI Endpoints configuration instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Docker Compose + Dockerfile + .env.example** - `d181009` (chore)
2. **Task 2: Seed script + README-DEPLOY.md** - `4f4d538` (feat)

## Files Created/Modified

- `docker-compose.yml` - Added restart: unless-stopped to all 3 services
- `apps/web/Dockerfile` - 4-stage multi-stage build (already existed, unchanged)
- `.env.example` - Complete env var reference with OVH AI Endpoints (already existed, unchanged)
- `scripts/seed.ts` - DB seed script with drizzle-kit push + test data insertion
- `README-DEPLOY.md` - 5-step deployment guide in French

## Decisions Made

- Used `drizzle-orm/node-postgres` in seed script (consistent with `apps/web/src/lib/db/index.ts` which uses the same driver)
- `drizzle-kit push --force` for schema application in seed — no migration files needed for development/staging
- Seed checks `count(*) from users` to skip if already seeded — idempotent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dockerfile and .env.example already existed**
- **Found during:** Task 1
- **Issue:** Plan assumed these files needed to be created from scratch, but they already existed from prior work
- **Fix:** Only added `restart: unless-stopped` to docker-compose.yml services (the only missing piece)
- **Files modified:** docker-compose.yml
- **Committed in:** d181009

**2. [Rule 1 - Bug] Used node-postgres instead of postgres.js**
- **Found during:** Task 2
- **Issue:** Plan specified `drizzle-orm/postgres-js` + `postgres` driver, but the app uses `drizzle-orm/node-postgres`
- **Fix:** Used `drizzle-orm/node-postgres` for consistency with the actual app code
- **Files modified:** scripts/seed.ts
- **Committed in:** 4f4d538

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both deviations align implementation with actual codebase state. No scope creep.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required for the seed script itself.

## Next Phase Readiness

- Deploy kit ready for first deployment on ubuntu@141.95.99.214
- User must add `output: "standalone"` to next.config.ts before Docker build (documented in README-DEPLOY.md)

## Self-Check: PASSED

- docker-compose.yml: FOUND
- apps/web/Dockerfile: FOUND
- .env.example: FOUND
- scripts/seed.ts: FOUND
- README-DEPLOY.md: FOUND
- SUMMARY.md: FOUND
- Commit d181009: FOUND (Task 1)
- Commit 4f4d538: FOUND (Task 2)

---
*Plan: quick-260328-h1u*
*Completed: 2026-03-28*
