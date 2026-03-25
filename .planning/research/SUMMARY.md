# Project Research Summary

**Project:** LegalConnect - Portail Client Intelligent pour Avocats
**Domain:** LegalTech SaaS - Client Intake Portal
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

LegalConnect is a B2B SaaS platform that modernizes how solo and small-firm lawyers handle client intake. The product sits at the intersection of three high-stakes domains: legal compliance (RGPD, professional secrecy, unauthorized practice of law), security (E2E encryption of sensitive legal data), and AI-assisted UX (empathetic intake conversations, document extraction, case summarization). Experts in this space build with a security-first architecture where encryption is foundational, not additive — every feature is designed around the constraint that the server must never hold plaintext client data.

The recommended approach is a Next.js 16 monorepo (Turborepo + pnpm) with tRPC for type-safe APIs, Drizzle ORM against PostgreSQL 16 with pgcrypto, and libsodium for client-side E2E encryption. Document processing is handled asynchronously via BullMQ backed by Valkey, with Docling (Python sidecar) for PDF extraction and the Vercel AI SDK for both conversational intake and vision-based document analysis. An embeddable widget (Vite IIFE + Shadow DOM) lets lawyers embed intake on their existing websites — a key distribution advantage. The French LegalTech market has few competitors combining intelligent intake with an EU-compliant encrypted client portal, creating a real window of opportunity.

The central risk is sequencing: encryption bolted on after MVP requires a complete rewrite of all data paths and cannot be applied retroactively to existing data. The second critical risk is AI regulatory liability — the product must extract and structure information without ever crossing into legal advice territory. Both risks must be addressed in Phase 1 or they become project-threatening technical debt. HDS certification (health-adjacent legal data hosting) has a months-long administrative process and must be initiated early even if technical compliance comes later.

## Key Findings

### Recommended Stack

The stack is TypeScript end-to-end: Next.js 16 (App Router, React 19) as the full-stack framework, tRPC 11 for the API layer (preferred over Server Actions for real-time messaging, widget API needs, and TanStack Query caching — Documenso publicly reverted from Server Actions to tRPC in production), and Drizzle ORM for its SQL-first approach that integrates cleanly with pgcrypto encryption queries. The Docling Python sidecar runs as a separate Docker container to avoid mixing runtimes in the main app. Auth.js v5 is the recommended auth layer but carries medium confidence due to its extended beta period — abstract it behind a service layer to enable fallback to custom JWT if needed.

**Core technologies:**
- Next.js 16 + React 19: Full-stack framework — App Router, SSR, middleware auth, Turbopack stable
- tRPC 11 + TanStack Query 5: Type-safe API — real-time via SSE, widget-compatible, deduplication + caching
- Drizzle ORM 0.45 + PostgreSQL 16: Database — SQL-first, pgcrypto integration, 7.4kb bundle
- libsodium-wrappers: Client-side E2E encryption — XChaCha20-Poly1305, audited WASM build
- Vercel AI SDK 6 (Anthropic primary, OpenAI fallback): LLM abstraction — provider-agnostic, streaming
- BullMQ 5 + Valkey 9: Async job queue — document processing, AI extraction, notifications
- Docling (Python HTTP sidecar): PDF/scan extraction — 97.9% accuracy benchmark, fully self-hosted
- OVHcloud Object Storage (S3-compatible): Document storage — EU data residency, SSE-C encryption
- shadcn/ui + Tailwind CSS 4: UI — full component ownership, accessible (Radix UI), legal-professional aesthetic
- Turborepo + pnpm 9: Monorepo — apps/web (Next.js), apps/widget (Vite IIFE), shared packages

### Expected Features

**Must have (table stakes):**
- Multi-step intake form — core product; hybrid structured fields + AI conversational follow-ups
- Document upload (PDF, images, HEIC) — clients always provide supporting evidence
- Lawyer dashboard — manage/review incoming cases with filters, search, and status
- Case file summary — AI-generated structured synthesis of client situation, editable by lawyer
- Email/password auth with email verification — standard for professional SaaS
- Email notifications — status changes, new messages, appointment requests
- Mobile-responsive design — clients fill intake on phones, lawyers check on tablets
- RGPD compliance — consent records, data export API, hard-delete cascade, DPA template
- Visual security indicators — padlocks, encryption badges, contextual trust signals throughout

**Should have (competitive differentiators):**
- AI-guided empathetic intake — adapts tone per legal specialty and emotional context of client
- AI document extraction — auto-extract dates, parties, amounts, clauses from uploaded docs
- Embeddable widget — lawyers embed intake on their own website (Shadow DOM + Vite IIFE)
- Timeline extraction — AI builds chronological event timeline from narrative + documents
- Qualification score — AI scores case urgency to help lawyer prioritize
- Specialty-specific templates — pre-built flows for divorce, labor law, criminal defense
- Client messaging portal — E2E encrypted post-intake communication channel

**Defer (v2+):**
- Multi-specialty template engine — start with one hardcoded specialty (family law), generalize later
- Video upload and AI transcription — niche use case, high infrastructure complexity
- Auto-booking calendar sync — lawyers want manual control; revisit when demand is proven
- Payment/billing integration — business model not yet validated
- Native mobile app — responsive web covers the use case; PWA if offline needed
- Multi-tenant firm hierarchy — over-engineering before proven demand; RLS structure already supports it

### Architecture Approach

The architecture is a monorepo with two build targets: the main Next.js app (lawyer dashboard + hosted client portal) and a Vite-built embeddable widget (Shadow DOM for style isolation, PostMessage for host-page communication). Security is layered in depth: TLS at transport (Traefik), libsodium E2E encryption client-side before transmission, pgcrypto column encryption at rest in PostgreSQL, and SSE-C for documents in S3. Multi-tenant data isolation uses PostgreSQL Row-Level Security as the authoritative safety net — not just application-level filters — with automated two-lawyer isolation tests mandatory. Docling runs as a Python sidecar called via HTTP from BullMQ workers, keeping the main app pure TypeScript.

**Major components:**
1. Next.js App — SSR, tRPC server, Auth.js middleware, static pages for widget hosting
2. tRPC Router (domain-organized) — intake, case, message, lawyer, document, auth
3. BullMQ Workers (separate processes per queue) — document-processing, ai-extraction, notifications
4. Docling Sidecar — Python HTTP service for PDF/scan OCR; called by workers, never by the main app directly
5. PostgreSQL 16 — persistent storage with RLS policies per lawyer, pgcrypto column encryption
6. Valkey 9 — BullMQ queue backend, session cache, rate limiting
7. OVHcloud S3 — encrypted document storage with SSE-C (client-provided keys, never stored server-side)
8. Widget Bundle — Vite IIFE, Shadow DOM isolation, CORS-gated tRPC subset only

### Critical Pitfalls

1. **E2E encryption bolted on after MVP** — encryption primitives must be in Phase 1; retroactive encryption requires a complete data layer rewrite and cannot be applied to existing records; prevention: design key recovery (Argon2id passphrase-derived key regeneration) before writing any encryption code
2. **AI giving legal advice** — LLMs naturally give advice; strict "never advise" system prompts, output filtering, mandatory disclaimers, and red-team testing before any user exposure are non-negotiable
3. **RGPD non-compliance from day 1** — consent timestamps, data export API, hard-delete cascade, and DPA template for the lawyer-platform relationship must be designed upfront; fines up to 4% of revenue from CNIL
4. **Multi-tenant data leakage** — PostgreSQL RLS is the safety net (not just app-level filtering); automated isolation tests with two lawyer accounts are mandatory; professional secrecy violation = potential criminal liability for lawyers
5. **Key management disaster** — device loss without key recovery = permanent data loss = legal malpractice exposure; passphrase-based key recovery must be designed and tested in Phase 1, not added later

## Implications for Roadmap

Based on combined research, feature dependencies, and pitfall sequencing, the following phase structure is recommended:

### Phase 1: Security Foundation
**Rationale:** E2E encryption and RGPD compliance cannot be retrofitted. Every subsequent feature builds on this layer. Key recovery must be designed before any encryption code is written. HDS certification administrative process starts now even though technical compliance comes later.
**Delivers:** Auth (Auth.js v5 + Drizzle adapter), E2E encryption primitives (libsodium keypair generation, encrypted storage helpers, key recovery via Argon2id), PostgreSQL schema with RLS policies per lawyer, RGPD consent + deletion infrastructure, Valkey + BullMQ scaffolding, OVHcloud S3 integration with SSE-C, Traefik TLS, OVHcloud K8s baseline deployment.
**Addresses features:** Email/password auth, RGPD compliance, SSL/TLS, visual security indicators (foundational).
**Avoids pitfalls:** Encryption bolted on (#1), RGPD non-compliance (#3), multi-tenant data leakage (#4), key management disaster (#5).

### Phase 2: Core Intake + Lawyer Dashboard
**Rationale:** With the secure data layer established, build the core product loop — client fills intake, lawyer reviews structured case. Start with one hardcoded specialty (family law) to avoid premature template engine complexity. Validate the AI value proposition early.
**Delivers:** Multi-step intake form (family law, hardcoded), AI conversational follow-ups (Vercel AI SDK + Anthropic, streaming), document upload (PDF + images + HEIC, encrypted client-side before upload), basic AI extraction (Docling sidecar Dockerized on K8s), AI case file summary, lawyer dashboard (list/filter/view), email notifications (React Email + Resend), qualification score.
**Uses:** tRPC intake + case + document routers, BullMQ document-processing + ai-extraction workers, Docling sidecar.
**Avoids pitfalls:** AI legal advice (#2 — red-team before launch), document processing timeout (always async via BullMQ), over-engineering template system.

### Phase 3: Distribution + Communication
**Rationale:** With a working intake-to-dashboard loop proven on one specialty, embed it everywhere and keep the relationship going. Both the widget and messaging portal require the stable intake engine from Phase 2. Expand to multiple specialties once the template schema is validated with one.
**Delivers:** Embeddable widget (Vite IIFE + Shadow DOM, PostMessage host communication), E2E encrypted messaging portal (tRPC SSE subscriptions, real-time), appointment request flow, timeline extraction, multi-specialty templates (divorce, labor law, criminal defense), lawyer customization UI.
**Avoids pitfalls:** Widget CSS conflicts (Shadow DOM), CORS + CSP issues on lawyer sites (comprehensive CORS config, test with restrictive policies), template schema becoming unmaintainable (JSON Schema + versioning from the start).

### Phase 4: Scale + Certification
**Rationale:** HDS certification technical compliance can now be finalized (administrative process started in Phase 1). Infrastructure scales for growth. Full observability and E2E test coverage before wider launch.
**Delivers:** OVHcloud HDS certification completion, read replicas + PgBouncer for PostgreSQL connection pooling, CDN for widget bundles, Sentry + OpenTelemetry observability stack, Playwright E2E test suite (two-lawyer isolation tests mandatory), video upload + AI transcript extraction.
**Avoids pitfalls:** HDS certification bottleneck (administrative started Phase 1), scaling from 100 to 1K lawyers requires read replicas.

### Phase Ordering Rationale

- **Security before everything** is the single most important constraint from research. Encryption cannot be retrofitted; RGPD cannot be bolted on. Every feature after Phase 1 inherits the encrypted-by-default data layer.
- **One specialty before a template engine** prevents over-engineering before user demand is proven. The template system is designed for extensibility (JSON Schema + versioned templates) but not built generically until Phase 3.
- **Widget after intake is stable** because the widget shares the intake form engine and components via the monorepo. Building the widget on an unstable form foundation creates double the rework.
- **Messaging after dashboard** because lawyers need to see the structured intake value before they invest in the portal communication layer.
- **HDS certification process starts in Phase 1** even though technical compliance completes in Phase 4, because the administrative process (CNIL filings, OVHcloud HDS agreement) takes months and cannot be parallelized with technical work.
- **Docling sidecar Dockerized in Phase 2** so it can be validated on real French legal documents before the full extraction pipeline is built around it in Phase 3.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Key recovery UX (Argon2id passphrase derivation in browser, IndexedDB non-extractable key storage — sparse documentation for production implementations at this security level)
- **Phase 1:** HDS certification administrative requirements and timeline (regulatory/administrative process, needs legal/compliance consultation with OVHcloud and CNB)
- **Phase 2:** AI prompt engineering for French legal terminology (legal professional validation required before any user testing; no established French legal AI dataset)
- **Phase 2:** Docling accuracy on French legal documents (benchmarked at 97.9% on English sustainability reports; French legal contract/court order performance unverified — needs hands-on validation)

Phases with standard patterns (skip research-phase):
- **Phase 1:** Auth.js v5 + Drizzle adapter setup (well-documented, widely adopted in production)
- **Phase 1:** PostgreSQL RLS policies (official documentation comprehensive, standard SaaS pattern)
- **Phase 3:** Shadow DOM widget isolation + PostMessage communication (established pattern, good community resources)
- **Phase 4:** OpenTelemetry + Sentry with Next.js (first-class SDK support, standard setup)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major technology choices backed by official docs and production case studies. Versions verified for March 2026. One exception: Auth.js v5 is MEDIUM due to extended beta period. |
| Features | HIGH | Grounded in LegalTech market analysis and clear domain constraints (UPL law, RGPD, professional secrecy). Feature dependencies are explicit and well-reasoned. |
| Architecture | HIGH | Well-established patterns (PostgreSQL RLS, BullMQ, Shadow DOM widgets, multi-layer encryption) with clear rationale for each component boundary. |
| Pitfalls | HIGH | Grounded in regulatory reality (CNIL enforcement record, bar association rules) and well-documented failure modes. Phase-specific warnings are actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Auth.js v5 beta stability:** Pin exact version. Abstract auth behind a service layer with a clear interface so fallback to custom JWT + session table is achievable in Phase 1 if instability blocks development.
- **Docling on OVHcloud K8s with French legal documents:** Resource requirements (CPU vs GPU) for French legal document OCR are unbenchmarked for this use case. Validate with a real document sample set at the start of Phase 2 before building the full extraction pipeline.
- **Key recovery UX design:** The technical pattern (Argon2id passphrase-derived key regeneration) is documented. The UX flow — what a client experiences on a new device — needs design validation. Poor UX here means data loss or support burden.
- **HDS certification scope:** Whether LegalConnect strictly requires HDS certification depends on whether the legal matters handled include health-adjacent data (accidents, medical negligence). Needs legal/compliance clarification. OVHcloud HDS covers Hosted Private Cloud — confirm Managed Kubernetes eligibility.
- **Key escrow regulations:** French professional secrecy law (secret professionnel) may have specific requirements around encryption key escrow for lawyer-client communications. Needs legal research before finalizing the key management architecture.
- **Valkey BullMQ edge cases:** Valkey 9 has high Redis compatibility, but verify the specific BullMQ features used (parent-child jobs, priority queues, repeatable jobs) against Valkey in CI before relying on them in production.

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/blog/next-16 — Next.js 16 release features
- https://nextjs.org/blog/next-16-2 — Next.js 16.2 updates
- https://vercel.com/blog/ai-sdk-6 — Vercel AI SDK 6 capabilities
- https://trpc.io/blog/announcing-trpc-v11 — tRPC v11 features and SSE subscriptions
- https://documenso.com/blog/removing-server-actions — Documenso Server Actions to tRPC revert (production case study)
- https://orm.drizzle.team/ — Drizzle ORM official documentation
- https://github.com/docling-project/docling — Docling (IBM Research) project
- https://procycons.com/en/blogs/pdf-data-extraction-benchmark/ — Docling 97.9% accuracy benchmark
- https://ui.shadcn.com/docs/changelog/2026-03-cli-v4 — shadcn/ui CLI v4 changelog
- https://valkey.io/ — Valkey 9 documentation
- https://www.ovhcloud.com/en/public-cloud/object-storage/ — OVHcloud S3-compatible storage
- https://www.ovhcloud.com/en/compliance/hds/ — OVHcloud HDS certification
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html — PostgreSQL RLS documentation
- https://bullmq.io/ — BullMQ architecture documentation
- https://www.npmjs.com/package/libsodium — libsodium-wrappers WASM build

### Secondary (MEDIUM confidence)
- https://authjs.dev/ — Auth.js v5 documentation (medium confidence due to extended beta period)
- https://makerkit.dev/blog/tutorials/drizzle-vs-prisma — Drizzle vs Prisma 2026 comparison
- https://makerkit.dev/blog/tutorials/embeddable-widgets-react — Shadow DOM widget pattern
- https://www.seald.io/ — E2E encryption key recovery patterns
- https://www.cnil.fr/ — CNIL RGPD enforcement guidance
- https://github.com/nextauthjs/next-auth/discussions/13382 — Auth.js v5 stability community discussion
- https://labs.ovhcloud.com/en/end-to-end-encryption/ — OVHcloud E2E Encryption Platform

### Tertiary (LOW confidence, needs validation)
- https://www.inventiva.co.in/trends/top-10-legaltech-saas-startups-in-2026/ — LegalTech market trends 2026
- https://www.netdocuments.com/blog/2026-legal-tech-trends/ — Legal tech trends 2026
- https://legaltech.saglobal.com/blogs/10-legal-technology-trends-reshaping-law-firms-in-2026.html — Client portal adoption rates
- https://www.spellbook.legal/learn/law-firm-tech-stack — Law firm tech stack guide

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
