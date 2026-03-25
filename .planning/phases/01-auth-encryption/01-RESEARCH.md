# Phase 1: Auth & Encryption - Research

**Researched:** 2026-03-25
**Domain:** Authentication, E2E encryption, RGPD compliance
**Confidence:** HIGH

## Summary

Phase 1 establishes the security foundation for LegalConnect: user accounts with two roles (avocat/client), email/password authentication via Auth.js v5 with Drizzle adapter, E2E encryption using libsodium-wrappers with BIP39 passphrase recovery, and RGPD compliance infrastructure (consent, export, soft delete).

The stack is well-defined in CLAUDE.md with no ambiguity. The main technical risks are: (1) Auth.js v5 is still in beta (5.0.0-beta.30 on npm) -- abstract behind a service layer as noted in STATE.md blockers; (2) the E2E encryption key management architecture requires careful design -- key derivation from password for session use, separate recovery passphrase for cross-device access; (3) Next.js 16 renamed `middleware.ts` to `proxy.ts` with Node.js runtime (no longer Edge), which changes how Auth.js session checks work in middleware.

**Primary recommendation:** Build auth behind a thin service abstraction (not raw Auth.js calls everywhere), implement E2E encryption as an isolated `packages/crypto` module in the monorepo, and use Drizzle's native RLS support for tenant isolation from day one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Passphrase de recuperation generee par le systeme -- 12 mots type BIP39, affiches une fois a l'inscription. Entropie garantie, pas de choix utilisateur.
- **D-02:** Perte de passphrase = perte definitive des donnees chiffrees. Vrai E2E, aucun recours serveur. Message d'avertissement clair a l'inscription.
- **D-03:** Passphrase presentee juste apres l'inscription, ecran dedie bloquant. L'utilisateur ne peut pas continuer sans confirmer.
- **D-04:** Verification par resaisie de 3 mots aleatoires parmi les 12. Standard crypto wallets, bonne balance securite/UX.
- **D-05:** Sessions de 30 jours avec refresh token silencieux. Standard SaaS.
- **D-06:** Sessions multiples autorisees -- PC + mobile en parallele. Chaque appareil a sa propre cle de session.
- **D-07:** Deux roles distincts des le depart : Avocat et Client. L'inscription demande le type de compte.
- **D-08:** Mot de passe minimum 8 caracteres avec indicateur visuel de force (faible/moyen/fort). Pas de regles rigides -- approche NIST.
- **D-09:** Consentement RGPD via banniere a l'inscription + page Parametres de confidentialite accessible plus tard. Consentement granulaire (donnees essentielles vs analytics).
- **D-10:** Export de donnees via bouton dans les parametres du compte. Genere un ZIP (JSON + fichiers) telechargeable ou envoye par email. Delai max 48h si gros volume.
- **D-11:** Suppression de compte en soft delete avec periode de grace de 30 jours. Compte desactive immediatement, donnees purgees apres 30 jours. Annulation possible pendant le delai. Email de confirmation.
- **D-12:** Ton professionnel chaleureux. Vouvoiement, rassurant mais pas froid.
- **D-13:** Expediteur : `LegalConnect <noreply@legalconnect.fr>`. Necessite config DNS (SPF/DKIM).
- **D-14:** Lien de verification email valable 24h. Lien de reset password expire en 1h.

### Claude's Discretion
Aucun domaine delegue -- toutes les decisions ont ete prises par l'utilisateur.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email and password | Auth.js v5 Credentials provider + custom registration endpoint + Drizzle adapter |
| AUTH-02 | User receives email verification after signup | Auth.js email verification event + React Email template + Resend delivery |
| AUTH-03 | User can log in and stay logged in across sessions | JWT sessions (30-day expiry) with silent refresh via Auth.js session callback |
| AUTH-04 | User can reset password via email link | Custom password reset flow with token table + 1h expiry + React Email template |
| SECU-01 | All data encrypted end-to-end using libsodium (client-side key management) | libsodium-wrappers-sumo for crypto_pwhash + XChaCha20-Poly1305 + @scure/bip39 for recovery passphrase |
| SECU-02 | RGPD compliance (consent management, data export, deletion rights) | Consent table + granular consent API + soft delete with 30-day purge cron + ZIP export endpoint |
</phase_requirements>

## Standard Stack

### Core (Phase 1 Specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | 5.0.0-beta.30 | Authentication framework | Auth.js v5 -- single `auth()` for server/client/middleware. Beta but widely adopted. Install via `next-auth@beta` |
| @auth/drizzle-adapter | 1.11.1 | Auth DB adapter | Connects Auth.js sessions/accounts to PostgreSQL via Drizzle schema |
| drizzle-orm | 0.45.1 | Database ORM | SQL-first, native RLS support via `pgPolicy`, schema-as-TypeScript |
| drizzle-kit | 0.31.10 | Migrations | Generate/push SQL migrations from Drizzle schema changes |
| libsodium-wrappers-sumo | 0.8.2 | E2E encryption | SUMO build required for `crypto_pwhash` (Argon2id key derivation). Standard wrappers build lacks pwhash |
| @scure/bip39 | 2.0.1 | BIP39 mnemonics | Audited, TypeScript-native, minimal deps. By paulmillr (noble/scure crypto suite author) |
| bcryptjs | 3.0.3 | Password hashing | Server-side password hashing for auth. Pure JS, no native deps |
| zod | 4.3.6 | Schema validation | Input validation for auth forms, shared between client/server |
| react-hook-form | latest | Form management | Multi-step forms, password strength indicator, registration flow |
| react-email | 5.2.10 | Email templates | React components for verification, reset, welcome emails |
| resend | 6.9.4 | Email delivery | Transactional email sending API |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zxcvbn | latest | Password strength | NIST-aligned strength estimation for visual indicator (D-08) |
| next-intl | latest | i18n | French-first email and UI text. Install now, configure minimally |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-auth@beta | Lucia Auth | Lucia is stable but smaller ecosystem, no built-in Drizzle adapter |
| libsodium-wrappers-sumo | tweetnacl | Lighter (7kb) but lacks crypto_pwhash (Argon2id), fewer algorithms |
| @scure/bip39 | bip39 | bip39 3.1.0 is older, @scure is audited + TypeScript-native |
| bcryptjs | argon2 | argon2 needs native bindings, bcryptjs is pure JS -- simpler for Next.js serverless |

**Installation (Phase 1 packages):**
```bash
pnpm add next-auth@beta @auth/drizzle-adapter drizzle-orm libsodium-wrappers-sumo @scure/bip39 bcryptjs zod react-hook-form react-email resend zxcvbn
pnpm add -D drizzle-kit @types/bcryptjs @types/libsodium-wrappers-sumo
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)
```
apps/
  web/                        # Next.js 16 main app
    src/
      app/
        (auth)/               # Auth route group (no layout chrome)
          login/page.tsx
          register/page.tsx
          verify-email/page.tsx
          reset-password/page.tsx
          recovery/page.tsx   # Passphrase display + verification
        (app)/                # Authenticated route group
          settings/
            privacy/page.tsx  # RGPD consent management
            export/page.tsx   # Data export
            delete/page.tsx   # Account deletion
      lib/
        auth.ts               # Auth.js config (NextAuth export)
        auth.config.ts        # Auth.js edge-safe config (for proxy.ts)
        db/
          schema/
            auth.ts           # Users, sessions, accounts, verification tokens
            encryption.ts     # Encrypted keys table
            consent.ts        # RGPD consent records
          index.ts            # Drizzle client
          migrate.ts          # Migration runner
      server/
        actions/
          auth.actions.ts     # Server actions: register, verify, reset
          rgpd.actions.ts     # Server actions: export, delete, consent
      components/
        auth/                 # Login form, register form, password strength
    proxy.ts                  # Next.js 16 proxy (replaces middleware.ts)
    drizzle.config.ts
packages/
  crypto/                     # Shared E2E encryption module
    src/
      index.ts
      keypair.ts              # Generate/derive keypairs
      encrypt.ts              # XChaCha20-Poly1305 encrypt/decrypt
      recovery.ts             # BIP39 mnemonic generation + key recovery
      kdf.ts                  # Key derivation functions
  shared/                     # Shared types, Zod schemas
    src/
      schemas/
        auth.ts               # Registration, login validation schemas
        consent.ts            # RGPD consent schemas
  email/                      # Email templates package
    src/
      verification.tsx
      password-reset.tsx
      welcome.tsx
      deletion-confirmation.tsx
```

### Pattern 1: Auth.js v5 with Credentials + Service Layer

**What:** Wrap Auth.js behind a service layer to insulate from beta API changes.
**When to use:** Always -- Auth.js v5 is still beta.

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { loginSchema } from "@legalconnect/shared/schemas/auth";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (D-05)
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = loginSchema.parse(credentials);
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user || !user.passwordHash) return null;
        if (!user.emailVerified) return null; // Must verify email first
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role; // "avocat" | "client" (D-07)
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
});
```

### Pattern 2: Next.js 16 proxy.ts for Auth Protection

**What:** Next.js 16 replaced `middleware.ts` with `proxy.ts` running on Node.js runtime.
**When to use:** Route protection, redirect unauthenticated users.

```typescript
// proxy.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Important note:** proxy.ts is NOT the security boundary. Always re-validate session in server components and route handlers.

### Pattern 3: E2E Encryption Key Management Architecture

**What:** Client-side key management with passphrase recovery.
**Architecture:**

```
Registration flow:
1. User creates account (email + password)
2. Client generates X25519 keypair (crypto_box_keypair)
3. Client generates 12-word BIP39 mnemonic (@scure/bip39)
4. Client derives recovery key from mnemonic via crypto_pwhash (Argon2id)
5. Client encrypts private key with recovery key (XChaCha20-Poly1305)
6. Client sends to server: public key + encrypted private key + salt + pwhash params
7. Server stores in encryption_keys table
8. Client displays mnemonic on blocking screen (D-03)
9. User verifies 3 random words (D-04)
10. Client stores private key in IndexedDB (session use)

Login on new device:
1. User authenticates (email + password)
2. Server returns encrypted private key + salt + params
3. Client prompts for recovery passphrase
4. Client derives key from passphrase via crypto_pwhash
5. Client decrypts private key
6. Client stores in IndexedDB
```

```typescript
// packages/crypto/src/recovery.ts
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import sodium from "libsodium-wrappers-sumo";

export async function generateRecoveryMnemonic(): Promise<string> {
  await sodium.ready;
  return bip39.generateMnemonic(wordlist, 128); // 12 words
}

export async function deriveKeyFromMnemonic(
  mnemonic: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  await sodium.ready;
  const mnemonicBytes = sodium.from_string(mnemonic);
  return sodium.crypto_pwhash(
    32, // 256-bit key
    mnemonicBytes,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
}

export function encryptPrivateKey(
  privateKey: Uint8Array,
  recoveryKey: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const nonce = sodium.randombytes_buf(
    sodium.crypto_secretbox_NONCEBYTES
  );
  const ciphertext = sodium.crypto_secretbox_easy(
    privateKey,
    nonce,
    recoveryKey
  );
  return { ciphertext, nonce };
}
```

### Pattern 4: Drizzle Schema with RLS

**What:** PostgreSQL Row-Level Security defined in Drizzle schema.

```typescript
// lib/db/schema/auth.ts
import { pgTable, text, timestamp, boolean, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["avocat", "client"] }).notNull(),
  emailVerified: timestamp("email_verified"),
  publicKey: text("public_key"), // Base64-encoded X25519 public key
  encryptedPrivateKey: text("encrypted_private_key"), // Encrypted with recovery key
  recoverySalt: text("recovery_salt"), // Salt for pwhash derivation
  recoveryParams: text("recovery_params"), // JSON: opslimit, memlimit, alg
  deletedAt: timestamp("deleted_at"), // Soft delete (D-11)
  deletionScheduledAt: timestamp("deletion_scheduled_at"), // 30-day purge date
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  pgPolicy("users_own_data", {
    for: "all",
    using: sql`auth.uid() = ${table.id}`,
  }),
]);

export const consents = pgTable("consents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["essential", "analytics"] }).notNull(),
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(), // 1h (D-14)
  usedAt: timestamp("used_at"),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(), // 24h (D-14)
  usedAt: timestamp("used_at"),
});
```

### Anti-Patterns to Avoid

- **Storing plaintext private keys server-side:** The server must NEVER see the user's private key in plaintext. Only the encrypted version is stored.
- **Using `crypto_pwhash_OPSLIMIT_INTERACTIVE` for recovery key derivation:** Use MODERATE or SENSITIVE -- recovery is infrequent, higher cost is acceptable and more secure.
- **Relying on proxy.ts as sole auth check:** Always re-validate session in server components and API routes. Proxy is for UX (redirects), not security.
- **Mixing Auth.js adapter schema with custom fields:** Extend the users table carefully -- Auth.js adapter expects specific columns (id, email, emailVerified, image, name). Add custom fields alongside, not replacing.
- **Using standard `libsodium-wrappers` instead of `sumo`:** The standard build does NOT include `crypto_pwhash`. You MUST use `libsodium-wrappers-sumo` for Argon2id key derivation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt/argon2 wrapper | bcryptjs | Edge cases: timing attacks, salt generation, cost factor tuning |
| BIP39 mnemonics | Custom word list + entropy | @scure/bip39 | Audited implementation, proper checksum, wordlist standards |
| Session management | Custom JWT + cookie handling | Auth.js v5 | CSRF protection, token rotation, secure cookie flags |
| Email delivery | Custom SMTP client | Resend | Deliverability, SPF/DKIM, bounce handling, rate limiting |
| Password strength | Regex rules | zxcvbn | NIST-aligned, dictionary attacks, pattern detection |
| Encryption primitives | Custom XChaCha20 wrapper | libsodium-wrappers-sumo | Audited WebAssembly, constant-time operations, authenticated encryption |

**Key insight:** Cryptographic code is where "it works" and "it's secure" are completely different things. Every encryption and hashing operation must use audited library functions, never custom implementations.

## Common Pitfalls

### Pitfall 1: libsodium-wrappers vs sumo build
**What goes wrong:** Import `libsodium-wrappers` (standard) and `crypto_pwhash` is undefined at runtime.
**Why it happens:** Standard build excludes password hashing to reduce bundle size (~170KB vs ~350KB).
**How to avoid:** Always install and import `libsodium-wrappers-sumo`. The sumo build includes ALL libsodium functions.
**Warning signs:** `TypeError: sodium.crypto_pwhash is not a function`

### Pitfall 2: Auth.js v5 Credentials provider lacks built-in registration
**What goes wrong:** Developer expects Auth.js to handle signup -- it only handles signin.
**Why it happens:** Auth.js Credentials provider has `authorize()` for login only. No `register()` callback.
**How to avoid:** Build a separate registration API route/server action that creates the user, hashes the password with bcryptjs, stores in DB, then sends verification email. Auth.js only handles login after that.
**Warning signs:** Trying to use `signIn("credentials")` for registration.

### Pitfall 3: Next.js 16 proxy.ts vs middleware.ts
**What goes wrong:** Project uses `middleware.ts` which is deprecated in Next.js 16.
**Why it happens:** Most Auth.js v5 tutorials reference `middleware.ts` (written for Next.js 14/15).
**How to avoid:** Use `proxy.ts` at project root. Same API, different filename, now runs on Node.js runtime (not Edge).
**Warning signs:** `middleware.ts` being ignored or deprecation warnings.

### Pitfall 4: IndexedDB key storage and cross-tab sync
**What goes wrong:** Private key stored in IndexedDB in one tab is not available in another tab.
**Why it happens:** IndexedDB is async and doesn't have cross-tab reactivity by default.
**How to avoid:** Use BroadcastChannel API to notify other tabs when keys are stored/updated. On tab focus, check IndexedDB for key availability.
**Warning signs:** User opens new tab and encryption fails silently.

### Pitfall 5: Auth.js adapter schema conflicts
**What goes wrong:** Drizzle migrations fail or Auth.js throws "column not found" errors.
**Why it happens:** Auth.js v5 Drizzle adapter expects specific table names and columns (users, accounts, sessions, verificationTokens). Custom columns must be added alongside, not replacing defaults.
**How to avoid:** Start from the official Auth.js Drizzle schema, then extend with custom columns. Never rename the default columns.
**Warning signs:** `ERROR: column "xxx" does not exist` after migration.

### Pitfall 6: RGPD soft delete must cascade to all related data
**What goes wrong:** User "deletes" account but their consents, tokens, and encryption keys remain active.
**Why it happens:** Soft delete only marks the users row, forgetting related tables.
**How to avoid:** Create a dedicated `scheduleAccountDeletion()` function that: (1) sets `deletedAt` on user, (2) invalidates all sessions, (3) marks 30-day purge date. The purge cron must then hard delete from ALL related tables.
**Warning signs:** Deleted users' data appearing in queries, orphaned records.

### Pitfall 7: JWT session vs database session with Auth.js
**What goes wrong:** Using database sessions blocks proxy.ts because it cannot make DB calls at the edge.
**Why it happens:** Developer assumes database sessions are needed for security.
**How to avoid:** Use JWT sessions (strategy: "jwt") with 30-day maxAge (D-05). Store role in JWT token via callbacks. For session revocation needs, maintain a blacklist checked in server components, not proxy.
**Warning signs:** Database connection errors in proxy.ts.

## Code Examples

### Registration Server Action
```typescript
// server/actions/auth.actions.ts
"use server";
import { db } from "@/lib/db";
import { users, emailVerificationTokens } from "@/lib/db/schema/auth";
import { registerSchema } from "@legalconnect/shared/schemas/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@legalconnect/email";

export async function registerUser(formData: FormData) {
  const data = registerSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"), // "avocat" | "client"
  });

  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });
  if (existing) {
    return { error: "Un compte avec cet email existe deja." };
  }

  // Hash password (D-08: min 8 chars enforced by Zod schema)
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user
  const [user] = await db.insert(users).values({
    email: data.email,
    passwordHash,
    role: data.role,
  }).returning();

  // Create verification token (D-14: 24h expiry)
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Send verification email (D-12: ton professionnel chaleureux, D-13: noreply@legalconnect.fr)
  await sendVerificationEmail({
    to: data.email,
    token,
    role: data.role,
  });

  return { success: true };
}
```

### Password Strength Indicator
```typescript
// components/auth/password-strength.tsx
"use client";
import zxcvbn from "zxcvbn";

const LABELS = ["Tres faible", "Faible", "Moyen", "Fort", "Tres fort"];
const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const result = zxcvbn(password);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= result.score - 1 ? COLORS[result.score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{LABELS[result.score]}</p>
    </div>
  );
}
```

### Recovery Passphrase Verification Screen
```typescript
// Blocking screen after registration (D-03, D-04)
// User must re-enter 3 random words from the 12-word mnemonic

export function verifyPassphrase(
  mnemonic: string,
  attempts: Record<number, string>
): boolean {
  const words = mnemonic.split(" ");
  return Object.entries(attempts).every(
    ([index, word]) => words[parseInt(index)] === word.trim().toLowerCase()
  );
}

export function selectRandomWordIndices(count: number = 3): number[] {
  const indices = Array.from({ length: 12 }, (_, i) => i);
  const selected: number[] = [];
  for (let i = 0; i < count; i++) {
    const randomIdx = Math.floor(Math.random() * indices.length);
    selected.push(indices.splice(randomIdx, 1)[0]);
  }
  return selected.sort((a, b) => a - b);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts (Edge) | proxy.ts (Node.js) | Next.js 16 (2026) | Auth.js session checks now have full Node.js API access in proxy |
| Auth.js v4 (NextAuth) | Auth.js v5 (beta) | 2024-ongoing | Single `auth()` API, universal server/client. Still beta on npm |
| Drizzle RLS via raw SQL | Drizzle `pgPolicy` in schema | Drizzle 0.40+ | Native RLS definition alongside table schema |
| bip39 (bitcoinjs) | @scure/bip39 | 2023 | Audited, TypeScript-native, no Node.js polyfills needed in browser |

**Deprecated/outdated:**
- `middleware.ts` in Next.js 16: replaced by `proxy.ts`
- `next-auth` v4 API (`getServerSession`, `useSession`): replaced by unified `auth()` in v5
- Auth.js v5 `@auth/nextjs`: experimental package, use `next-auth@beta` instead

## Open Questions

1. **Auth.js v5 beta stability for production**
   - What we know: v5 has been in beta since late 2023. Widely used but no stable release.
   - What's unclear: Timeline to stable. Breaking changes still possible.
   - Recommendation: Abstract behind service layer as planned. Monitor beta changelog.

2. **RLS policy enforcement with Drizzle**
   - What we know: Drizzle supports `pgPolicy` in schema definition. PostgreSQL RLS works at DB level.
   - What's unclear: How to inject `auth.uid()` into Drizzle queries for RLS context. May need `SET app.current_user_id` on each connection.
   - Recommendation: Research Drizzle + RLS context injection during Plan 01-01 implementation. May use `db.execute(sql\`SET app.current_user_id = ${userId}\`)` before queries.

3. **IndexedDB for private key storage security**
   - What we know: IndexedDB is the standard for client-side persistent storage. Non-extractable CryptoKeys preferred.
   - What's unclear: Whether libsodium key format is compatible with Web Crypto API's non-extractable keys (likely not -- libsodium uses raw Uint8Array).
   - Recommendation: Store libsodium private key in IndexedDB encrypted with a session-derived key. Clear on logout.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v20.19.6 | -- |
| pnpm | Package manager | Yes | 10.24.0 | -- |
| Docker | PostgreSQL/Valkey | Yes | 28.5.2 | -- |
| PostgreSQL | Database | Via Docker | -- | docker-compose up |
| Valkey | Sessions/cache (future) | Via Docker | -- | docker-compose up |

**Missing dependencies with no fallback:** None -- all tools available.

**Missing dependencies with fallback:**
- Turborepo CLI not globally installed -- will be installed as devDependency via `pnpm add -D turbo`

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:all` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User creates account with email/password | integration | `pnpm vitest run tests/auth/register.test.ts -x` | Wave 0 |
| AUTH-02 | Email verification sent after signup | unit | `pnpm vitest run tests/auth/verification.test.ts -x` | Wave 0 |
| AUTH-03 | Login + persistent session (30 days) | integration | `pnpm vitest run tests/auth/login.test.ts -x` | Wave 0 |
| AUTH-04 | Password reset via email link | integration | `pnpm vitest run tests/auth/reset-password.test.ts -x` | Wave 0 |
| SECU-01 | E2E encryption with libsodium | unit | `pnpm vitest run tests/crypto/encryption.test.ts -x` | Wave 0 |
| SECU-02 | RGPD consent, export, deletion | integration | `pnpm vitest run tests/rgpd/compliance.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --changed`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- root config with path aliases
- [ ] `packages/crypto/vitest.config.ts` -- crypto package config
- [ ] `tests/auth/register.test.ts` -- covers AUTH-01
- [ ] `tests/auth/verification.test.ts` -- covers AUTH-02
- [ ] `tests/auth/login.test.ts` -- covers AUTH-03
- [ ] `tests/auth/reset-password.test.ts` -- covers AUTH-04
- [ ] `tests/crypto/encryption.test.ts` -- covers SECU-01 (keypair gen, encrypt/decrypt, recovery)
- [ ] `tests/rgpd/compliance.test.ts` -- covers SECU-02 (consent CRUD, soft delete, export)
- [ ] `tests/setup.ts` -- shared test setup (DB, mocks)

## Project Constraints (from CLAUDE.md)

- **Monorepo:** Turborepo + pnpm workspaces
- **Language:** TypeScript 5.7+ throughout
- **Framework:** Next.js 16.x with App Router
- **ORM:** Drizzle ORM (not Prisma)
- **Auth:** Auth.js v5 (next-auth@beta) with @auth/drizzle-adapter
- **Encryption:** libsodium-wrappers (sumo build needed for pwhash)
- **Email:** React Email + Resend
- **UI:** shadcn/ui + Tailwind CSS 4.x + Radix UI
- **Forms:** react-hook-form with zodResolver
- **Hosting:** OVHcloud (EU, RGPD-compatible)
- **Security:** E2E encryption, pgcrypto for column-level encryption
- **shadcn conventions:** FieldGroup/Field for forms, gap-* not space-*, semantic colors, cn() for conditional classes

## Sources

### Primary (HIGH confidence)
- [Auth.js Drizzle Adapter](https://authjs.dev/getting-started/adapters/drizzle) -- official adapter setup
- [Auth.js Credentials Provider](https://authjs.dev/getting-started/authentication/credentials) -- email/password auth
- [Auth.js Edge Compatibility](https://authjs.dev/guides/edge-compatibility) -- JWT vs DB sessions in proxy/middleware
- [Drizzle ORM RLS](https://orm.drizzle.team/docs/rls) -- pgPolicy definition in schema
- [Libsodium pwhash API](https://libsodium.gitbook.io/doc/password_hashing/default_phf) -- Argon2id key derivation
- [Libsodium XChaCha20-Poly1305](https://libsodium.gitbook.io/doc/secret-key_cryptography/aead/chacha20-poly1305/xchacha20-poly1305_construction) -- AEAD encryption
- [@scure/bip39 GitHub](https://github.com/paulmillr/scure-bip39) -- audited BIP39 implementation
- [Next.js 16 Blog](https://nextjs.org/blog/next-16) -- proxy.ts, Node.js runtime
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- migration from middleware.ts

### Secondary (MEDIUM confidence)
- [Auth.js v5 + Next.js 16 Guide](https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg) -- community guide, aligns with official docs
- [GDPR Soft Delete Pattern](https://gdpr4saas.eu/deleting-personal-data) -- RGPD deletion compliance
- [CNIL Security Guide](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf) -- French data protection authority

### Tertiary (LOW confidence)
- Next.js 16 proxy.ts behavior with Auth.js -- limited real-world examples yet, extrapolated from official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified on npm, versions confirmed
- Architecture: HIGH -- patterns drawn from official docs and established cryptographic practices
- Pitfalls: HIGH -- documented from known Auth.js v5 beta issues and libsodium API gotchas
- E2E encryption architecture: MEDIUM -- pattern is sound cryptographically but IndexedDB key storage strategy needs validation during implementation

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days -- Auth.js v5 beta may release new versions)
