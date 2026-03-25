---
status: partial
phase: 01-auth-encryption
source: [01-VERIFICATION.md]
started: 2026-03-26T12:00:00Z
updated: 2026-03-26T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Run crypto tests
expected: 21 tests pass (keypair, encrypt, kdf, recovery)
command: `pnpm --filter @legalconnect/crypto test`
result: [pending]

### 2. Run auth tests
expected: 21 auth behavioral tests pass
command: `pnpm vitest run tests/auth/`
result: [pending]

### 3. Run RGPD tests
expected: 8 RGPD behavioral tests pass
command: `pnpm vitest run tests/rgpd/`
result: [pending]

### 4. Registration flow + recovery passphrase
expected: Registration form with email, password (strength indicator), role selection (avocat/client) renders correctly. After registration, user sees 12-word passphrase on blocking screen (no skip), then verifies 3 random words, then reaches dashboard.
command: `pnpm dev` then visit `/register`
result: [pending]

### 5. Settings pages (RGPD)
expected: Consent toggles (essential locked, analytics toggleable), JSON export download, 30-day deletion with cancel
command: visit `/settings/privacy`, `/settings/export`, `/settings/delete`
result: [pending]

### 6. Docker infrastructure
expected: PostgreSQL and Valkey containers running, `pnpm --filter web db:push` succeeds
command: `docker compose up -d && pnpm --filter web db:push`
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
