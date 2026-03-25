# Phase 2: Intake Form & Trust UX - Research

**Researched:** 2026-03-26
**Domain:** Multi-step forms, client-side file encryption, S3 upload, trust UX, shadcn/ui initialization
**Confidence:** HIGH

## Summary

Phase 2 builds the core intake experience: a 4-step guided form with file upload (encrypted client-side before transmission to OVHcloud Object Storage) and contextual security indicators. The codebase from Phase 1 provides solid foundations: `packages/crypto` with XChaCha20-Poly1305 encrypt/decrypt, `react-hook-form` + `zodResolver` patterns, Drizzle ORM schema conventions with text IDs, and server actions. The key gap is that **shadcn/ui is not yet initialized** -- this phase must bootstrap it.

The crypto package uses `crypto_secretbox_easy` (symmetric encryption). For file encryption, files will be encrypted with a random per-file symmetric key, then that key is encrypted with the user's X25519 public key. The `encrypt()` and `decrypt()` functions from `packages/crypto` handle the symmetric part; the `generateKeypair()` and `base64ToKey()` handle asymmetric key operations.

**Primary recommendation:** Initialize shadcn/ui first (Wave 0 dependency for all UI), then build the form stepper with react-hook-form multi-step pattern, then add encrypted upload with streaming encryption for large files, and finally layer security indicators as reusable components.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Stepper lineaire guide avec barre de progression numerotee. Navigation avant/arriere entre etapes. Style Doctolib/Typeform.
- **D-02:** 4 etapes : 1) Type de probleme juridique 2) Description de la situation 3) Pieces justificatives (upload) 4) Coordonnees et preferences.
- **D-03:** Auto-save dans localStorage a chaque etape. Si le client ferme et revient, il reprend ou il en etait. Pas de compte requis pour commencer.
- **D-04:** Drag & drop + bouton "Parcourir" en fallback. Zone de drop visuelle avec apercu des fichiers (thumbnail pour images, icone pour PDF/video). Barre de progression avec badge "Chiffre" une fois uploade.
- **D-05:** Limite 50 Mo par fichier, 200 Mo total par dossier. Types acceptes : PDF, images (JPG/PNG/HEIC), videos (MP4/MOV/WebM).
- **D-06:** Stockage sur OVHcloud Object Storage (S3-compatible). Fichiers chiffres cote client via packages/crypto (XChaCha20-Poly1305) avant envoi. SSE-C pour le chiffrement at-rest supplementaire.
- **D-07:** Style subtil et integre. Petits badges discrets (cadenas vert, bouclier) a cote des champs sensibles. Tooltip "Vos donnees sont chiffrees de bout en bout" au survol.
- **D-08:** Placement contextuel : cadenas a cote des champs description et upload. Badge "Chiffre" qui apparait apres upload reussi. Banniere de confiance en haut de l'etape 1 uniquement.
- **D-09:** Textes d'aide empathiques par etape. Message d'introduction rassurant a chaque etape. Placeholders explicatifs dans les champs. Coherent avec D-12 Phase 1 (ton chaleureux, vouvoiement).
- **D-10:** Francais uniquement en v1. Vouvoiement. next-intl config minimale (une locale FR). L'anglais sera ajoute plus tard.

### Claude's Discretion
- Choix entre formulaire ouvert (login a la soumission) ou login requis des le debut. Claude choisit l'approche la plus adaptee a l'UX du produit.
- Choix des champs specifiques a chaque etape (types de problemes juridiques proposes, champs de description, etc.).
- Design system shadcn/ui : choix des composants specifiques, palette de couleurs, spacing.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTK-01 | Client completes multi-step intake form to describe their legal situation | Stepper pattern with react-hook-form, 4-step structure, localStorage auto-save, Zod validation schemas |
| INTK-03 | Client can upload documents (PDF, images, screenshots) during intake | react-dropzone for drag & drop, client-side XChaCha20-Poly1305 encryption, S3 multipart upload via @aws-sdk/client-s3 |
| INTK-04 | Client can upload video files as evidence | Same upload pipeline as INTK-03, extended MIME types (MP4/MOV/WebM), chunked encryption for large files |
| SECU-03 | Visual security indicators at every sensitive interaction | Reusable EncryptionBadge, SecurityBanner, TrustTooltip components using shadcn/ui Badge and Tooltip |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Monorepo:** Turborepo + pnpm workspaces. Package manager is `pnpm@10.24.0`.
- **Framework:** Next.js 16 with App Router, React 19, Turbopack.
- **Path alias:** `@/*` maps to `./src/*` in apps/web.
- **Encryption:** libsodium-wrappers-sumo (not standard), XChaCha20-Poly1305 for symmetric, X25519 for asymmetric.
- **ORM:** Drizzle with text IDs via `crypto.randomUUID()`.
- **Forms:** react-hook-form + @hookform/resolvers + Zod.
- **shadcn/ui:** Specified in stack but NOT yet initialized. Phase 2 must initialize it.
- **Styling:** Tailwind CSS 4.x + shadcn/ui semantic colors.
- **i18n:** next-intl, French-first, minimal config.
- **Storage:** OVHcloud Object Storage (S3-compatible) with @aws-sdk/client-s3.
- **Security tone:** Empathetic, warm, vouvoiement. Never cold or bureaucratic.
- **shadcn/ui skill rules:** Use FieldGroup + Field (not raw divs), gap-* (not space-y-*), semantic colors (not raw), cn() for conditionals, ToggleGroup for option sets. See `.claude/skills/shadcn/` for full rules.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.72.0 | Form state management | Already used in Phase 1 auth forms. Multi-step forms use single useForm with per-step field validation |
| @hookform/resolvers | latest | Zod integration | Already installed. zodResolver for schema-driven validation |
| zod | 3.x | Schema validation | Already used in packages/shared/src/schemas/. Add intake schemas here |
| libsodium-wrappers-sumo | latest | Client-side encryption | Already in packages/crypto. Reuse encrypt/decrypt for file encryption |
| @aws-sdk/client-s3 | 3.1017.0 | S3-compatible upload | OVHcloud Object Storage. PutObject with SSE-C headers |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | CLI latest | Component library | Phase 2 must run `pnpm dlx shadcn@latest init` in apps/web. Add: Button, Input, Textarea, Select, Card, Badge, Tooltip, Progress, Separator, Alert |
| react-dropzone | 15.0.0 | Drag & drop file input | Step 3 (file upload). Provides onDrop callback, file type filtering, size limits |
| next-intl | 4.8.3 | Internationalization | Minimal FR-only config. Wrap layout, provide messages/fr.json |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Native HTML drag events | react-dropzone handles edge cases (folder drops, type filtering, disabled states). Worth the 8kb |
| localStorage auto-save | IndexedDB | localStorage is simpler for form JSON (~10KB). IndexedDB already used for private keys (different concern). Files NOT saved in localStorage -- only form field values |
| S3 PutObject | S3 multipart upload | PutObject works up to 5GB. Files capped at 50MB. Use PutObject for simplicity. Switch to multipart only if timeouts occur |

**Installation:**
```bash
# In apps/web
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input textarea select card badge tooltip progress separator alert tabs

# New dependencies
pnpm add react-dropzone @aws-sdk/client-s3 next-intl
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
  app/
    (app)/
      intake/
        page.tsx              # Intake entry point (server component)
        layout.tsx            # Intake layout with trust banner
    api/
      upload/
        route.ts              # Upload endpoint (receives encrypted blob, forwards to S3)
  components/
    intake/
      intake-stepper.tsx      # Main stepper container + progress bar
      step-problem-type.tsx   # Step 1: Legal problem category
      step-description.tsx    # Step 2: Situation description
      step-documents.tsx      # Step 3: File upload
      step-contact.tsx        # Step 4: Contact info + preferences
    trust/
      encryption-badge.tsx    # Small padlock/shield badge
      trust-banner.tsx        # Top banner for step 1
      trust-tooltip.tsx       # "Vos donnees sont chiffrees" tooltip wrapper
    upload/
      file-dropzone.tsx       # Drag & drop zone with react-dropzone
      file-preview.tsx        # Thumbnail/icon preview per file
      upload-progress.tsx     # Progress bar + "Chiffre" badge
    ui/                       # shadcn/ui components (auto-generated)
  hooks/
    use-intake-form.ts        # Multi-step form logic + localStorage persistence
    use-file-encryption.ts    # Encrypt file -> upload -> track progress
  lib/
    s3.ts                     # S3 client config for OVHcloud Object Storage
    db/
      schema/
        intake.ts             # intakeSubmissions + intakeDocuments tables
  server/
    actions/
      intake.actions.ts       # Submit intake, save to DB
      upload.actions.ts       # Generate presigned URL or handle upload

packages/shared/src/
  schemas/
    intake.ts                 # Zod schemas for all 4 intake steps

messages/
  fr.json                     # French translations (next-intl)
```

### Pattern 1: Multi-Step Form with Single useForm Instance
**What:** One `useForm()` manages all 4 steps. Each step validates only its own fields via partial schema. Step transitions trigger partial validation.
**When to use:** Always for multi-step forms with back/forward navigation.
**Example:**
```typescript
// packages/shared/src/schemas/intake.ts
import { z } from "zod";

export const stepProblemTypeSchema = z.object({
  problemType: z.enum(["famille", "travail", "penal", "immobilier", "commercial", "autre"]),
  problemSubType: z.string().optional(),
});

export const stepDescriptionSchema = z.object({
  description: z.string().min(20, "Decrivez votre situation en au moins 20 caracteres"),
  urgency: z.enum(["normal", "urgent", "tres_urgent"]).default("normal"),
  opposingParty: z.string().optional(),
  desiredOutcome: z.string().optional(),
});

export const stepDocumentsSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
    encryptedKey: z.string(), // base64 encrypted symmetric key
    s3Key: z.string(),
    nonce: z.string(), // base64
  })).default([]),
});

export const stepContactSchema = z.object({
  fullName: z.string().min(2, "Votre nom est requis"),
  phone: z.string().optional(),
  preferredContact: z.enum(["email", "telephone", "les_deux"]).default("email"),
  availabilities: z.string().optional(),
});

export const intakeSchema = stepProblemTypeSchema
  .merge(stepDescriptionSchema)
  .merge(stepDocumentsSchema)
  .merge(stepContactSchema);

export type IntakeFormData = z.infer<typeof intakeSchema>;
```

```tsx
// hooks/use-intake-form.ts
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { intakeSchema, type IntakeFormData } from "@legalconnect/shared";

const STORAGE_KEY = "legalconnect_intake_draft";
const stepSchemas = [stepProblemTypeSchema, stepDescriptionSchema, stepDocumentsSchema, stepContactSchema];

export function useIntakeForm() {
  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: loadDraft(),
  });

  // Auto-save on every field change
  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const validateStep = useCallback(async (stepIndex: number) => {
    const fields = Object.keys(stepSchemas[stepIndex].shape);
    return form.trigger(fields as any);
  }, [form]);

  return { form, validateStep };
}

function loadDraft(): Partial<IntakeFormData> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}
```

### Pattern 2: Client-Side File Encryption Before Upload
**What:** Generate random symmetric key per file, encrypt file bytes with XChaCha20-Poly1305, encrypt the symmetric key with user's X25519 public key, upload ciphertext to S3 with SSE-C.
**When to use:** All file uploads in the application.
**Example:**
```typescript
// hooks/use-file-encryption.ts
import { encrypt } from "@legalconnect/crypto";
import sodium from "libsodium-wrappers-sumo";

export async function encryptFile(
  file: File,
  userPublicKey: Uint8Array
): Promise<{ encryptedBlob: Blob; encryptedKey: string; nonce: string }> {
  await sodium.ready;

  // Read file as Uint8Array
  const buffer = new Uint8Array(await file.arrayBuffer());

  // Generate random per-file symmetric key (32 bytes)
  const fileKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);

  // Encrypt file content with symmetric key
  const { ciphertext, nonce } = await encrypt(buffer, fileKey);

  // Encrypt symmetric key with user's public key (sealed box)
  const encryptedKey = sodium.crypto_box_seal(fileKey, userPublicKey);

  return {
    encryptedBlob: new Blob([ciphertext]),
    encryptedKey: sodium.to_base64(encryptedKey, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
  };
}
```

### Pattern 3: Stepper Component
**What:** Linear stepper with numbered progress bar, forward/back navigation, step-level validation before advancing.
**When to use:** The intake form uses this as its main navigation.
**Example:**
```tsx
// Stepper uses shadcn/ui Progress + custom step indicators
// Each step is a separate component receiving form methods via props
// Current step stored in useState, synced to localStorage
```

### Anti-Patterns to Avoid
- **Do NOT use separate useForm per step.** Causes data loss on back navigation and complicates final submission. Single useForm for all steps.
- **Do NOT encrypt files on the server.** Defeats E2E encryption. All encryption happens in the browser before the file leaves the client.
- **Do NOT store file contents in localStorage.** Only form field values (text). Files are uploaded immediately after encryption. localStorage has a 5-10MB limit.
- **Do NOT use raw HTML inputs.** Phase 2 initializes shadcn/ui -- use Button, Input, Textarea, Select, Card components. Follow FieldGroup + Field pattern from shadcn skill.
- **Do NOT use `space-y-*`.** Use `flex flex-col gap-*` per shadcn/ui conventions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag & drop file upload | Custom drag event handlers | react-dropzone | Handles browser inconsistencies, folder drops, type validation, disabled state, accessibility |
| File type validation | Manual MIME checking | react-dropzone `accept` prop + Zod schema | react-dropzone validates MIME + extension, Zod validates on submission |
| Progress indicator | Custom CSS progress bar | shadcn/ui Progress component | Accessible, animated, consistent with design system |
| Tooltips | Custom hover divs | shadcn/ui Tooltip | Accessible, handles positioning, escape to close, keyboard support |
| Form field layout | Raw divs with labels | shadcn/ui FieldGroup + Field + FieldLabel | Consistent spacing, validation states, accessibility attributes |
| Stepper dots/numbers | Custom div stepper | Build on shadcn/ui primitives (Progress + Badge) | Keep visual consistency; stepper itself is simple enough to compose |

**Key insight:** The form structure is custom (intake-specific steps), but every individual UI primitive should come from shadcn/ui. The trust indicators (badges, tooltips) are thin wrappers around shadcn components, not custom implementations.

## Common Pitfalls

### Pitfall 1: Losing Form State on Step Navigation
**What goes wrong:** Data entered in step 1 disappears when going back from step 3.
**Why it happens:** Using separate form instances per step, or resetting form on navigation.
**How to avoid:** Single `useForm()` instance, steps only render/validate their subset of fields. Pass `form` object down via props or context.
**Warning signs:** `useForm()` called inside step components instead of parent.

### Pitfall 2: Large File Encryption Blocking UI
**What goes wrong:** Encrypting a 50MB video freezes the browser for several seconds.
**Why it happens:** `crypto_secretbox_easy` is synchronous and runs on the main thread.
**How to avoid:** Use a Web Worker for file encryption. Pass the file ArrayBuffer to the worker, receive encrypted result back. Show progress bar during encryption.
**Warning signs:** UI becomes unresponsive during upload of files > 10MB.

### Pitfall 3: SSE-C Key Management with OVHcloud
**What goes wrong:** Uploaded files cannot be decrypted because SSE-C key was not stored.
**Why it happens:** SSE-C (Server-Side Encryption with Customer-Provided Keys) requires the SAME key for download. If you use a random SSE-C key and don't store it, the file is permanently inaccessible.
**How to avoid:** Two approaches: (a) Don't use SSE-C at all since files are already client-side encrypted (double encryption is redundant but D-06 explicitly requires it), or (b) derive the SSE-C key deterministically from the per-file symmetric key so it can be reconstructed. Recommendation: use a KDF on the per-file key to derive the SSE-C key. Store the encrypted per-file key in the database -- from it, the SSE-C key can be re-derived.
**Warning signs:** 403 errors when downloading files from S3.

### Pitfall 4: localStorage Size Limits
**What goes wrong:** Auto-save fails silently when form data exceeds ~5MB.
**Why it happens:** localStorage has a 5-10MB limit per origin. If users paste long descriptions, it can fill up.
**How to avoid:** Only store form field values (not file data). Catch QuotaExceededError in the save function and show a non-blocking warning. Estimated max size for form text: ~50KB (well under limit).
**Warning signs:** `try/catch` around `localStorage.setItem` missing.

### Pitfall 5: HEIC Files Not Displayable in Browser
**What goes wrong:** iPhone photos (HEIC format) show no thumbnail preview.
**Why it happens:** Most browsers don't support HEIC natively. Safari does, Chrome/Firefox do not.
**How to avoid:** For HEIC files, show a generic image icon instead of a thumbnail. Do NOT attempt client-side conversion (adds 2MB+ of WASM). The server/AI pipeline (Phase 4) will handle conversion later.
**Warning signs:** `createObjectURL()` for HEIC files returns a URL but renders nothing.

### Pitfall 6: shadcn/ui Init in Monorepo
**What goes wrong:** `shadcn init` generates components in the wrong directory or with wrong import paths.
**Why it happens:** Monorepo path resolution can confuse the CLI.
**How to avoid:** Run `pnpm dlx shadcn@latest init` from within `apps/web/` directory. Verify `components.json` points to correct paths (`@/components/ui`, `@/lib/utils`). Verify tsconfig paths alias matches.
**Warning signs:** Import errors after adding components.

## Code Examples

### S3 Client Configuration for OVHcloud
```typescript
// apps/web/src/lib/s3.ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.OVH_S3_REGION!, // e.g., "gra"
  endpoint: process.env.OVH_S3_ENDPOINT!, // e.g., "https://s3.gra.io.cloud.ovh.net"
  credentials: {
    accessKeyId: process.env.OVH_S3_ACCESS_KEY!,
    secretAccessKey: process.env.OVH_S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for OVHcloud S3
});
```

### Upload Encrypted File to S3 with SSE-C
```typescript
// apps/web/src/server/actions/upload.actions.ts
"use server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import crypto from "node:crypto";

export async function uploadEncryptedFile(
  formData: FormData
): Promise<{ s3Key: string }> {
  const encryptedBlob = formData.get("file") as Blob;
  const fileName = formData.get("fileName") as string;
  const ssecKeyBase64 = formData.get("ssecKey") as string;

  const s3Key = `intake/${crypto.randomUUID()}/${fileName}`;
  const ssecKey = Buffer.from(ssecKeyBase64, "base64");
  const ssecKeyMd5 = crypto.createHash("md5").update(ssecKey).digest("base64");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.OVH_S3_BUCKET!,
      Key: s3Key,
      Body: Buffer.from(await encryptedBlob.arrayBuffer()),
      SSECustomerAlgorithm: "AES256",
      SSECustomerKey: ssecKeyBase64,
      SSECustomerKeyMD5: ssecKeyMd5,
    })
  );

  return { s3Key };
}
```

### Drizzle Schema for Intake
```typescript
// apps/web/src/lib/db/schema/intake.ts
import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const intakeSubmissions = pgTable("intake_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id), // nullable: form can start before login
  problemType: text("problem_type").notNull(),
  problemSubType: text("problem_sub_type"),
  description: text("description").notNull(), // encrypted
  descriptionNonce: text("description_nonce"), // for E2E decryption
  urgency: text("urgency", { enum: ["normal", "urgent", "tres_urgent"] }).default("normal"),
  opposingParty: text("opposing_party"),
  desiredOutcome: text("desired_outcome"),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  preferredContact: text("preferred_contact", { enum: ["email", "telephone", "les_deux"] }).default("email"),
  availabilities: text("availabilities"),
  status: text("status", { enum: ["draft", "submitted", "assigned", "reviewed"] }).default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const intakeDocuments = pgTable("intake_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id").notNull().references(() => intakeSubmissions.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  s3Key: text("s3_key").notNull(),
  encryptedKey: text("encrypted_key").notNull(), // base64 sealed box
  nonce: text("nonce").notNull(), // base64 libsodium nonce
  ssecKeyHash: text("ssec_key_hash"), // for SSE-C re-derivation
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const intakeSubmissionsRelations = relations(intakeSubmissions, ({ one, many }) => ({
  user: one(users, { fields: [intakeSubmissions.userId], references: [users.id] }),
  documents: many(intakeDocuments),
}));

export const intakeDocumentsRelations = relations(intakeDocuments, ({ one }) => ({
  submission: one(intakeSubmissions, { fields: [intakeDocuments.submissionId], references: [intakeSubmissions.id] }),
}));
```

### next-intl Minimal FR Config
```typescript
// apps/web/src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => ({
  locale: "fr",
  messages: (await import("../../messages/fr.json")).default,
}));
```

### Discretion Recommendation: Open Form, Login at Submission
**Recommendation:** Allow anonymous form filling (steps 1-3), require login/signup only at step 4 submission. Rationale:
1. D-03 explicitly says "Pas de compte requis pour commencer"
2. Reduces friction -- the client has already invested time in describing their situation
3. localStorage draft persists regardless of auth state
4. At step 4, check session: if logged in, submit; if not, show inline login/register and submit after auth
5. This matches the Doctolib pattern (book first, account later)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom stepper components | shadcn/ui Tabs + Progress composition | shadcn CLI v4 (March 2026) | Use shadcn primitives for stepper, don't install a separate stepper library |
| FormData-based file upload | Server Actions with FormData | Next.js 16 (2026) | Server actions handle FormData natively; no need for separate API routes (though API route is fine for upload progress) |
| CSS Modules for component styling | Tailwind CSS 4 with CSS-first config | Tailwind v4 (2025) | No tailwind.config.js -- use CSS `@theme` blocks |
| Manual S3 SDK setup | @aws-sdk/client-s3 v3 modular | Stable since 2023 | Import only PutObjectCommand, not entire SDK |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (workspace root) |
| Config file | `/Users/dhamon/vitest.config.ts` |
| Quick run command | `pnpm test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTK-01 | Intake Zod schemas validate correctly | unit | `pnpm vitest run tests/intake-schemas.test.ts` | Wave 0 |
| INTK-01 | localStorage auto-save/restore works | unit | `pnpm vitest run tests/intake-persistence.test.ts` | Wave 0 |
| INTK-03 | File encryption produces valid ciphertext | unit | `pnpm vitest run tests/file-encryption.test.ts` | Wave 0 |
| INTK-04 | Video files accepted by validation schema | unit | `pnpm vitest run tests/intake-schemas.test.ts` | Wave 0 |
| SECU-03 | Security indicator components render | unit | `pnpm vitest run tests/trust-components.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/intake-schemas.test.ts` -- validates all 4 step schemas + merged schema
- [ ] `tests/intake-persistence.test.ts` -- localStorage save/load with mock
- [ ] `tests/file-encryption.test.ts` -- encrypt file bytes, verify decrypt roundtrip
- [ ] `tests/trust-components.test.ts` -- render security badge/tooltip components

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Assumed (monorepo runs) | -- | -- |
| pnpm | Package management | Assumed (monorepo) | 10.24.0 | -- |
| shadcn CLI | Component init | Available via pnpm dlx | latest | -- |
| OVHcloud Object Storage | File upload (D-06) | External service | S3-compatible | Needs env vars: OVH_S3_ENDPOINT, OVH_S3_ACCESS_KEY, OVH_S3_SECRET_KEY, OVH_S3_BUCKET |
| PostgreSQL | Intake submission storage | External (Phase 1 infra) | 16.x | -- |

**Missing dependencies with no fallback:**
- OVHcloud Object Storage S3 credentials must be provisioned. Upload functionality is blocked without these env vars. Plan should include a setup task or mock for local dev.

**Missing dependencies with fallback:**
- S3 storage can be mocked with a local filesystem adapter for development if OVH credentials are not yet available.

## Open Questions

1. **OVHcloud S3 credentials provisioning**
   - What we know: D-06 specifies OVHcloud Object Storage with S3 API
   - What's unclear: Whether the bucket and access keys are already provisioned
   - Recommendation: Plan should include a task to create bucket + IAM credentials, or use env vars with a local mock fallback

2. **File encryption for anonymous users (no keypair yet)**
   - What we know: D-03 says no account required to start. But encryption requires a public key (from user's keypair generated at registration)
   - What's unclear: How to encrypt files for users who haven't registered yet
   - Recommendation: Generate a temporary ephemeral keypair stored in sessionStorage. At registration, re-encrypt the file keys with the permanent keypair. OR: defer actual upload until after login (step 4). The simpler approach: files are uploaded encrypted with a temporary key, then upon login the temporary key is re-encrypted with the user's permanent public key. Document metadata links temporary -> permanent key.

3. **Tailwind CSS v4 configuration in monorepo**
   - What we know: Tailwind v4 uses CSS-first config (`@theme` blocks) instead of tailwind.config.js
   - What's unclear: How shadcn/ui init handles Tailwind v4 in a Next.js 16 monorepo
   - Recommendation: Run `pnpm dlx shadcn@latest init` inside apps/web and follow prompts. Verify the generated CSS file uses `@theme` syntax.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `packages/crypto/src/encrypt.ts`, `packages/crypto/src/keypair.ts` -- verified encrypt/decrypt and keypair APIs
- Existing codebase: `apps/web/src/components/auth/register-form.tsx` -- verified react-hook-form + Zod patterns
- Existing codebase: `apps/web/src/lib/db/schema/` -- verified Drizzle schema conventions (text IDs, relations, timestamps)
- `.claude/skills/shadcn/SKILL.md` -- shadcn/ui rules for forms, styling, composition
- `.claude/skills/shadcn/rules/forms.md` -- FieldGroup + Field pattern, validation states

### Secondary (MEDIUM confidence)
- npm registry: @aws-sdk/client-s3@3.1017.0, react-dropzone@15.0.0, next-intl@4.8.3 -- verified current versions
- OVHcloud S3 API compatibility -- documented in CLAUDE.md as S3-compatible with forcePathStyle

### Tertiary (LOW confidence)
- Tailwind v4 + shadcn/ui interaction in monorepo -- not yet tested in this project, may need adjustments during init

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project or explicitly specified in CLAUDE.md
- Architecture: HIGH -- patterns follow Phase 1 conventions (server actions, Drizzle schemas, react-hook-form)
- Pitfalls: HIGH -- based on direct codebase analysis (crypto API signatures, localStorage limitations, S3 SSE-C docs)
- File encryption flow: MEDIUM -- crypto_box_seal (sealed box) pattern is standard libsodium, but the ephemeral key question for anonymous users needs design decision

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable stack, no fast-moving dependencies)
