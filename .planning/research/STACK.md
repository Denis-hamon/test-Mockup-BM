# Technology Stack

**Project:** LegalConnect - Portail Client Intelligent pour Avocats
**Researched:** 2026-03-25

## Recommended Stack

### Monorepo Structure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Turborepo | latest | Monorepo orchestration | Standard for multi-app Next.js projects. Needed here: main app + embeddable widget are separate build targets sharing code | HIGH |
| pnpm | 9.x | Package manager | Workspace-native, disk-efficient, fastest installs. Default for Turborepo projects | HIGH |
| TypeScript | 5.7+ | Language | Non-negotiable for a project requiring E2E type safety across tRPC, Drizzle, and Zod schemas | HIGH |

**Monorepo layout:**
```
apps/
  web/          # Main Next.js app (lawyer dashboard, client portal)
  widget/       # Embeddable intake widget (Vite + React, Shadow DOM)
packages/
  ui/           # Shared shadcn/ui components
  db/           # Drizzle schema + migrations
  ai/           # LLM abstraction layer
  crypto/       # E2E encryption primitives
  shared/       # Zod schemas, types, constants
```

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.x (current: 16.2.1) | Full-stack framework | App Router with React 19, Server Components, Turbopack stable, React Compiler built-in. The mature choice for SaaS with SSR, API routes, and middleware auth | HIGH |
| React | 19.x | UI library | Ships with Next.js 16. View Transitions, Activity API for background rendering | HIGH |

### Embeddable Widget

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | 6.x | Widget bundler | Produces clean IIFE bundle via Rollup for embedding. Much better than Next.js for a standalone widget JS file | HIGH |
| React | 19.x | Widget UI | Same React as main app, share components via monorepo | HIGH |
| Shadow DOM | native | Style isolation | Hard CSS boundary prevents host page style leakage. Superior to iframe (sizing issues, communication overhead) and CSS namespacing (fragile) | HIGH |

**Widget embed pattern:**
```html
<script src="https://app.legalconnect.fr/widget.js" data-lawyer-id="abc123"></script>
```

### API Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| tRPC | 11.x (current: ~11.10) | Type-safe API | End-to-end type safety without code generation. Superior to Server Actions for complex SaaS: built-in caching via TanStack Query, parallel requests, subscriptions via SSE. Documenso (document signing SaaS) tried migrating to Server Actions and reverted to tRPC | HIGH |
| TanStack Query | 5.x | Client-side data fetching | Ships with @trpc/react-query. Caching, deduplication, optimistic updates, infinite scroll for message feeds | HIGH |
| Zod | 3.x | Schema validation | Single source of truth for validation: tRPC inputs, form validation, API responses. TypeScript type inference built-in | HIGH |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16.x | Primary database | Battle-tested for SaaS multi-tenant. pgcrypto for column-level encryption. Row-level security for tenant isolation. JSON columns for flexible form schemas | HIGH |
| Drizzle ORM | 0.45.x (1.0 beta in progress) | Database ORM | SQL-first, 7.4kb bundle, zero dependencies. Superior cold-start for serverless. Schema-as-code with TypeScript. Drizzle Kit for migrations. Chose over Prisma: smaller bundle, closer to SQL (important for encryption queries), better serverless perf | HIGH |
| Drizzle Kit | latest | Migrations | Generate SQL migrations from schema changes. Push/pull/generate workflow | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Auth.js (NextAuth) | v5 | Authentication | Single `auth()` method for server/client. Email/password + magic link support. Database adapter for session persistence. Middleware-based route protection. Most widely adopted auth for Next.js | MEDIUM |
| @auth/drizzle-adapter | latest | Auth DB adapter | Connects Auth.js sessions/accounts to PostgreSQL via Drizzle | MEDIUM |

**Note on Auth.js confidence:** v5 has been in beta for a long time despite wide production usage. Monitor stability. If issues arise, fallback to Lucia Auth or custom JWT implementation.

### AI / LLM Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel AI SDK | 6.x (current: 6.0.138) | LLM abstraction | Provider-agnostic: swap Claude/GPT/Mistral with a config change. Streaming built-in. ToolLoopAgent for agentic document analysis. React hooks for real-time UI. The TypeScript standard for LLM integration | HIGH |
| @ai-sdk/anthropic | latest | Claude provider | Primary LLM for empathetic intake conversations (Claude excels at nuanced, warm tone) | HIGH |
| @ai-sdk/openai | latest | GPT provider | Fallback provider, cost optimization for simple extraction tasks | HIGH |

**LLM-agnostic architecture:**
```typescript
// Switch provider with zero code change
const model = provider === 'anthropic'
  ? anthropic('claude-sonnet-4-20250514')
  : openai('gpt-4o');

const result = await generateText({ model, prompt });
```

### Document Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| BullMQ | 5.x | Job queue | Redis-backed queue for async document processing. Retries, priorities, parent-child jobs (PDF -> OCR -> AI extract -> store). Essential: document processing is too slow for request-response | HIGH |
| Docling | latest (Python) | Document extraction | IBM Research open-source. 97.9% accuracy on complex documents. Runs self-hosted (EU data sovereignty). Handles PDF, images, tables. Deploy as a sidecar microservice called via HTTP | MEDIUM |
| Vercel AI SDK | 6.x | Vision extraction | For screenshots/photos: send directly to Claude/GPT vision API. Simpler than OCR for photos of SMS, WhatsApp conversations, handwritten notes | HIGH |
| sharp | latest | Image processing | Resize/compress uploaded images before AI processing. Node.js native, fast | HIGH |

**Document processing pipeline:**
```
Upload -> Validate -> Store encrypted in S3 -> Queue BullMQ job
  -> Docling (PDF/scans) or AI Vision (photos/screenshots)
  -> Extract structured data -> Store in case file
```

### Encryption & Security

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| libsodium-wrappers | latest | Client-side E2E encryption | WebAssembly build of libsodium. Gold standard for browser crypto. Authenticated encryption (XChaCha20-Poly1305), key exchange (X25519). Used by Signal protocol implementations | HIGH |
| pgcrypto | PostgreSQL ext | Server-side column encryption | Encrypt sensitive fields at rest in PostgreSQL. AES-256. For data that needs server-side search (encrypted indexes) | HIGH |
| Web Crypto API | native | Key management | Browser-native. Generate/store encryption keys in non-extractable CryptoKey objects. Used alongside libsodium for key derivation | HIGH |

**E2E encryption model:**
```
Client generates keypair (libsodium) -> Public key stored on server
Messages encrypted client-side before transmission
Only recipient's private key (never leaves device) can decrypt
Server stores only ciphertext
```

### File Storage

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| OVHcloud Object Storage (S3-compatible) | - | Document storage | Native S3 API, EU data residency, SSE-C encryption (client-provided keys). No need for self-hosted MinIO when OVHcloud provides managed S3 | HIGH |
| @aws-sdk/client-s3 | 3.x | S3 client | Official AWS S3 SDK works with any S3-compatible storage including OVHcloud | HIGH |

### Cache & Queue Backend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Valkey | 9.x | Cache + queue backend | Open-source Redis fork (BSD license). BullMQ-compatible. Backed by Linux Foundation, AWS, Google. Chose over Redis: truly open-source, no license ambiguity for SaaS. Redis 7.2 EOL was Feb 2026 | HIGH |

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | CLI v4 (March 2026) | Component library | Copy-paste components: full ownership, no dependency lock-in. Radix UI + Tailwind CSS. 65k+ GitHub stars. Perfect for a professional legal UI that needs custom theming (trust/security visual language) | HIGH |
| Tailwind CSS | 4.x | Styling | Utility-first, design token system. Consistent legal-professional aesthetic across main app and widget | HIGH |
| Radix UI | unified package | Accessible primitives | Accessible by default (ARIA, keyboard nav). Ships with shadcn/ui. Critical for legal compliance (accessibility laws) | HIGH |
| react-hook-form | latest | Form management | Uncontrolled components = minimal re-renders. Critical for complex multi-step intake forms. zodResolver for schema-driven validation | HIGH |
| Framer Motion | latest | Animations | Smooth transitions for multi-step forms, security badge animations. Empathetic UX: gentle, non-jarring animations | MEDIUM |

### Email & Notifications

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Email | latest | Email templates | React components for transactional emails. Same DX as the app. Render to HTML for sending | HIGH |
| Resend | - | Email delivery | Built by React Email team. Simple API, great deliverability. Alternative: Postmark or SES | MEDIUM |

### Internationalization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-intl | latest (v16 supports App Router) | i18n | First-class Next.js App Router support. Type-safe message keys. ICU message format. French-first but architecture for multi-language | HIGH |

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | latest | Unit/integration tests | Vite-native, faster than Jest. Same config for widget and main app | HIGH |
| Playwright | latest | E2E tests | Cross-browser, reliable. Test intake flows, encryption verification, widget embedding | HIGH |

### Infrastructure & Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Docker | - | Containerization | Standard deployment unit. Multi-stage builds for Next.js + Docling sidecar | HIGH |
| OVHcloud Managed Kubernetes | - | Orchestration | CNCF-certified. HDS certification available for Hosted Private Cloud. Auto-updates, EU data residency | HIGH |
| Traefik | 3.x | Ingress/reverse proxy | Cloud-native, auto-TLS via Let's Encrypt. Built-in rate limiting and middleware | MEDIUM |
| GitHub Actions | - | CI/CD | Standard. Turborepo remote caching + parallel builds | HIGH |

### Observability

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| OpenTelemetry | latest | Tracing/metrics | Vendor-agnostic observability. Next.js has built-in OTel support. Export to Grafana/Jaeger | HIGH |
| Sentry | latest | Error tracking | Real-time error monitoring with source maps. Next.js SDK with App Router support | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | Remix / SvelteKit | Smaller ecosystems, fewer integrations. Next.js has the strongest AI SDK, auth, and component ecosystem |
| ORM | Drizzle | Prisma 7 | Prisma improved with v7 (3x faster, TS engine), but still larger bundle. Drizzle's SQL-first approach better for encryption queries with pgcrypto |
| API | tRPC 11 | Server Actions | Server Actions lack caching, deduplication, parallel fetching. Documenso publicly reverted from Server Actions to tRPC |
| Auth | Auth.js v5 | Clerk / Supabase Auth | Third-party auth sends data outside EU. Self-hosted Auth.js keeps all auth data in our PostgreSQL on OVHcloud |
| Widget | Shadow DOM + Vite | iframe | iframes have sizing issues, communication overhead, blocked by some CSP policies. Shadow DOM is the modern standard |
| Cache | Valkey 9 | Redis 8 | Redis license ambiguity for SaaS. Valkey is BSD, Linux Foundation backed, API-compatible |
| Doc extraction | Docling | Unstructured.io | Unstructured pushes toward their managed platform. Docling is fully self-hostable, better accuracy (97.9% benchmark) |
| LLM layer | Vercel AI SDK 6 | LiteLLM | LiteLLM is Python, GIL bottleneck at scale. AI SDK is TypeScript-native, fits the stack |
| Encryption | libsodium-wrappers | TweetNaCl.js | TweetNaCl is lighter (7kb) but libsodium has more algorithms, audited WebAssembly build, better for production E2E encryption |
| UI | shadcn/ui | MUI / Ant Design | MUI/Ant have opinionated design. shadcn/ui gives full ownership for custom legal-professional aesthetic |
| Email | React Email + Resend | Nodemailer | Nodemailer requires SMTP config, no templating. React Email gives component-based templates |
| Monitoring | Sentry + OTel | Datadog | Datadog expensive for startups. Sentry free tier generous. OTel is vendor-agnostic |

## Installation

```bash
# Monorepo setup
pnpm create turbo@latest legalconnect

# Core framework (apps/web)
pnpm add next@16 react@19 react-dom@19

# API layer
pnpm add @trpc/server@^11 @trpc/client@^11 @trpc/react-query@^11 @tanstack/react-query zod

# Database
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit

# Authentication
pnpm add next-auth@beta @auth/drizzle-adapter

# AI
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai

# Encryption
pnpm add libsodium-wrappers
pnpm add -D @types/libsodium-wrappers

# File storage
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Job queue
pnpm add bullmq

# UI
pnpm dlx shadcn@latest init
pnpm add react-hook-form @hookform/resolvers framer-motion
pnpm add tailwindcss@4

# Email
pnpm add @react-email/components resend

# i18n
pnpm add next-intl

# Observability
pnpm add @sentry/nextjs @opentelemetry/api

# Dev dependencies
pnpm add -D vitest @playwright/test typescript @types/node
```

## Key Architecture Decisions

### Why tRPC over Server Actions for this project

Server Actions are fine for simple mutations. LegalConnect needs:
- **Real-time messaging** (tRPC subscriptions via SSE)
- **Complex form state** (TanStack Query caching during multi-step intake)
- **Parallel data fetching** (dashboard with multiple data sources)
- **Widget API** (the embeddable widget needs a proper API, not Server Actions)

### Why Drizzle over Prisma for this project

- Column-level encryption with pgcrypto requires raw SQL fragments. Drizzle's `sql` template literal is natural; Prisma's `$queryRaw` breaks type safety
- 7.4kb vs ~1.6MB (Prisma 7) matters for serverless cold starts on OVHcloud
- Schema-as-TypeScript-code integrates cleanly with Zod schemas in the monorepo `packages/shared`

### Why Docling as a separate microservice

Docling is Python-based. Instead of mixing runtimes:
- Deploy as a Docker sidecar with a simple HTTP API
- BullMQ worker calls Docling service for PDF/scan processing
- For photos/screenshots, bypass Docling entirely and use AI SDK vision APIs
- This keeps the Node.js app pure TypeScript while getting best-in-class document extraction

### Why libsodium over Web Crypto API alone

Web Crypto API has a complex, error-prone interface. libsodium provides:
- High-level, hard-to-misuse API (authenticated encryption by default)
- XChaCha20-Poly1305 (not available in Web Crypto)
- Audited WebAssembly build
- Same API server-side (Node.js) and client-side (browser)

## Sources

- Next.js 16 release: https://nextjs.org/blog/next-16
- Next.js 16.2: https://nextjs.org/blog/next-16-2
- Vercel AI SDK 6: https://vercel.com/blog/ai-sdk-6
- tRPC v11 announcement: https://trpc.io/blog/announcing-trpc-v11
- Documenso Server Actions revert: https://documenso.com/blog/removing-server-actions
- Drizzle ORM: https://orm.drizzle.team/
- Docling (IBM Research): https://github.com/docling-project/docling
- Docling benchmark (97.9% accuracy): https://procycons.com/en/blogs/pdf-data-extraction-benchmark/
- shadcn/ui CLI v4: https://ui.shadcn.com/docs/changelog/2026-03-cli-v4
- Valkey 9: https://valkey.io/
- OVHcloud Object Storage: https://www.ovhcloud.com/en/public-cloud/object-storage/
- OVHcloud HDS certification: https://www.ovhcloud.com/en/compliance/hds/
- Auth.js v5: https://authjs.dev/
- libsodium.js: https://www.npmjs.com/package/libsodium
- BullMQ: https://bullmq.io/
- Embeddable widgets with Shadow DOM: https://makerkit.dev/blog/tutorials/embeddable-widgets-react
- Drizzle vs Prisma 2026: https://makerkit.dev/blog/tutorials/drizzle-vs-prisma
