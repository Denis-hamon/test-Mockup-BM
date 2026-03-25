---
phase: 01-auth-encryption
plan: 03
subsystem: encryption
tags: [libsodium, xchacha20-poly1305, x25519, argon2id, bip39, e2e-encryption]

# Dependency graph
requires:
  - phase: 01-auth-encryption/01-01
    provides: "Monorepo scaffold with packages/crypto package.json and tsconfig"
provides:
  - "@legalconnect/crypto package with keypair, encrypt, decrypt, KDF, recovery"
  - "X25519 keypair generation"
  - "XChaCha20-Poly1305 authenticated encryption"
  - "Argon2id key derivation"
  - "BIP39 12-word mnemonic recovery system"
  - "Passphrase word verification (D-04)"
affects: [01-auth-encryption/01-04, 02-document-upload, 07-messaging]

# Tech tracking
tech-stack:
  added: [libsodium-wrappers-sumo, "@scure/bip39", vitest]
  patterns: [async-sodium-ready, tdd-red-green]

key-files:
  created:
    - packages/crypto/src/types.ts
    - packages/crypto/src/keypair.ts
    - packages/crypto/src/encrypt.ts
    - packages/crypto/src/kdf.ts
    - packages/crypto/src/recovery.ts
    - packages/crypto/vitest.config.ts
    - packages/crypto/src/__tests__/keypair.test.ts
    - packages/crypto/src/__tests__/encrypt.test.ts
    - packages/crypto/src/__tests__/kdf.test.ts
    - packages/crypto/src/__tests__/recovery.test.ts
  modified:
    - packages/crypto/src/index.ts
    - packages/crypto/package.json

key-decisions:
  - "Used libsodium-wrappers-sumo (not standard) for Argon2id crypto_pwhash support"
  - "BIP39 wordlist import requires .js extension for @scure/bip39 v2 ESM exports"
  - "All sodium functions wrapped as async (await sodium.ready) for safe initialization"
  - "KDF constants exported as mutable lets initialized via sodium.ready.then()"

patterns-established:
  - "Async sodium pattern: every function awaits sodium.ready before operations"
  - "TDD workflow: write failing tests first, then implement, then verify"
  - "Base64 encoding uses sodium.base64_variants.ORIGINAL for consistency"

requirements-completed: [SECU-01]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 01 Plan 03: E2E Encryption Primitives Summary

**X25519 keypair, XChaCha20-Poly1305 encrypt/decrypt, Argon2id KDF, and BIP39 12-word mnemonic recovery in @legalconnect/crypto**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T22:36:25Z
- **Completed:** 2026-03-25T22:40:33Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- X25519 keypair generation with base64 serialization
- XChaCha20-Poly1305 authenticated encryption/decryption
- Argon2id key derivation with MODERATE parameters (crypto_pwhash)
- BIP39 12-word mnemonic generation (128-bit entropy) for key recovery
- Private key wrapping/unwrapping with mnemonic-derived key
- Passphrase word verification (D-04: verify 3 random words)
- 21 passing unit tests covering all functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Keypair, encrypt/decrypt, KDF with tests** - `0748651` (feat)
2. **Task 2: BIP39 recovery, barrel export** - `906d28a` (feat)

_Note: TDD tasks — tests written first (RED), then implementation (GREEN)_

## Files Created/Modified
- `packages/crypto/src/types.ts` - KeyPair, EncryptedData, RecoveryBundle interfaces
- `packages/crypto/src/keypair.ts` - X25519 keypair generation via crypto_box_keypair
- `packages/crypto/src/encrypt.ts` - XChaCha20-Poly1305 encrypt/decrypt via crypto_secretbox
- `packages/crypto/src/kdf.ts` - Argon2id key derivation via crypto_pwhash
- `packages/crypto/src/recovery.ts` - BIP39 mnemonic, private key wrapping, word verification
- `packages/crypto/src/index.ts` - Barrel export for all crypto functions
- `packages/crypto/vitest.config.ts` - Vitest configuration with globals
- `packages/crypto/package.json` - Added test script
- `packages/crypto/src/__tests__/keypair.test.ts` - 4 tests for keypair operations
- `packages/crypto/src/__tests__/encrypt.test.ts` - 4 tests for encrypt/decrypt
- `packages/crypto/src/__tests__/kdf.test.ts` - 4 tests for key derivation
- `packages/crypto/src/__tests__/recovery.test.ts` - 9 tests for recovery mnemonic

## Decisions Made
- Used `libsodium-wrappers-sumo` (not standard build) because standard lacks `crypto_pwhash` (Argon2id)
- BIP39 wordlist import requires `.js` extension (`@scure/bip39/wordlists/english.js`) due to v2 ESM exports map
- All sodium-dependent functions are async, awaiting `sodium.ready` before every operation
- KDF constants exported as mutable `let` initialized via `sodium.ready.then()` to avoid top-level await issues

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed @scure/bip39 wordlist import path**
- **Found during:** Task 2 (BIP39 recovery implementation)
- **Issue:** `@scure/bip39/wordlists/english` not exported under node conditions; v2 requires `.js` extension
- **Fix:** Changed import to `@scure/bip39/wordlists/english.js` in both recovery.ts and test
- **Files modified:** packages/crypto/src/recovery.ts, packages/crypto/src/__tests__/recovery.test.ts
- **Verification:** All 21 tests pass
- **Committed in:** 906d28a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Import path fix necessary for module resolution. No scope creep.

## Issues Encountered
None beyond the import path fix documented above.

## Known Stubs
None - all functions are fully implemented with real libsodium operations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @legalconnect/crypto package is complete and independently testable
- Ready for plan 01-04 (auth flow integration) which will wire keypair generation into user registration
- Ready for Phase 2 (document upload encryption) and Phase 7 (messaging encryption)

## Self-Check: PASSED

- All 12 files verified present on disk
- Commit 0748651 verified in git log (Task 1)
- Commit 906d28a verified in git log (Task 2)
- 21/21 tests passing

---
*Phase: 01-auth-encryption*
*Completed: 2026-03-25*
