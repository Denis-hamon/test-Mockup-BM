# Architecture Patterns

**Domain:** LegalTech SaaS - Client Intake Portal
**Researched:** 2026-03-25

## Recommended Architecture

### High-Level Overview

```
                    [Lawyer's Website]
                          |
                    [Widget (IIFE)]
                          |
[Client Browser] --> [Traefik LB/TLS] --> [Next.js 16 App]
                                               |
                          +--------------------+--------------------+
                          |                    |                    |
                    [tRPC Router]        [Auth.js v5]        [BullMQ Workers]
                          |                    |                    |
                    [Drizzle ORM]              |              [Docling Sidecar]
                          |                    |              [AI SDK Vision]
                    [PostgreSQL 16]            |                    |
                          |                    |              [Valkey Queue]
                    [pgcrypto E2E]             |
                                               |
                                    [OVHcloud S3 Storage]
                                    [SSE-C encrypted docs]
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Next.js App** | SSR, API routes, tRPC server, static pages, middleware auth | PostgreSQL, Valkey, S3, Docling |
| **tRPC Router** | Type-safe API endpoints, input validation, auth checks | Drizzle ORM, BullMQ, AI SDK |
| **Widget Bundle** | Embeddable intake form on lawyer websites | tRPC API (CORS-enabled subset) |
| **BullMQ Workers** | Async document processing, AI extraction, email sending | Docling, AI SDK, PostgreSQL, S3 |
| **Docling Sidecar** | PDF/scan OCR and structured extraction | Called by BullMQ workers via HTTP |
| **PostgreSQL** | Persistent storage, encrypted columns, RLS for multi-tenant | Drizzle ORM |
| **Valkey** | BullMQ queue backend, session cache, rate limiting | BullMQ, Next.js middleware |
| **OVHcloud S3** | Encrypted document storage | Next.js (presigned URLs), Workers |

### Data Flow

**Intake Flow:**
```
1. Client opens intake (widget or hosted page)
2. Form renders based on lawyer's specialty template
3. AI conversational supplements ask follow-up questions (streaming via AI SDK)
4. Client uploads documents -> encrypted client-side (libsodium) -> S3 (SSE-C)
5. Upload triggers BullMQ job: OCR/extraction pipeline
6. Extracted data merged into case file (PostgreSQL, encrypted columns)
7. AI generates case summary + timeline + qualification score
8. Lawyer receives notification (email + dashboard)
9. Lawyer reviews structured case file in dashboard
```

**Encryption Flow:**
```
1. Client registration -> generate X25519 keypair (libsodium)
2. Private key stored in browser (IndexedDB, non-extractable)
3. Public key stored on server (PostgreSQL)
4. Messages: encrypt with recipient's public key before sending
5. Documents: encrypt with symmetric key, key encrypted per-recipient
6. Server never sees plaintext of messages or documents
7. Lawyer keypair generated on first login (same flow)
```

## Patterns to Follow

### Pattern 1: tRPC Router Organization
**What:** Organize tRPC routers by domain with clear separation
**When:** Always. Prevents monolithic router files.
```typescript
// packages/api/src/router/index.ts
export const appRouter = router({
  intake: intakeRouter,      // form submission, AI follow-ups
  case: caseRouter,          // case files, summaries, documents
  message: messageRouter,    // E2E encrypted messaging
  lawyer: lawyerRouter,      // dashboard, settings, templates
  document: documentRouter,  // upload, download, extraction status
  auth: authRouter,          // session management
});
```

### Pattern 2: Encryption at Multiple Layers
**What:** Defense in depth - encrypt at transport, application, and storage layers
**When:** All sensitive data paths (messages, documents, personal info)
```
Layer 1: TLS (Traefik) - transport encryption
Layer 2: libsodium (client) - E2E encryption before transmission
Layer 3: pgcrypto (PostgreSQL) - column encryption at rest
Layer 4: SSE-C (S3) - document encryption at rest with client keys
```

### Pattern 3: AI Prompt Templates per Legal Specialty
**What:** Maintain structured prompt templates that define AI behavior per legal domain
**When:** Intake conversations, document extraction, case summaries
```typescript
// packages/ai/src/templates/family-law.ts
export const familyLawIntake = {
  systemPrompt: `You are a warm, empathetic legal intake assistant...`,
  followUpStrategy: 'progressive-disclosure',
  extractionSchema: z.object({
    marriageDate: z.date().optional(),
    children: z.array(childSchema),
    propertyDetails: z.array(propertySchema),
    urgencyIndicators: z.array(z.string()),
  }),
};
```

### Pattern 4: Multi-Tenant with Row-Level Security
**What:** PostgreSQL RLS policies enforce data isolation per lawyer/firm
**When:** All queries touching client data
```sql
-- Each table has a lawyer_id column
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY cases_isolation ON cases
  USING (lawyer_id = current_setting('app.current_lawyer_id')::uuid);
```

### Pattern 5: Widget Communication via PostMessage
**What:** Secure bidirectional communication between embedded widget and host page
**When:** Widget needs to signal completion, resize, or receive config
```typescript
// Widget -> Host: intake completed
window.parent.postMessage({
  type: 'legalconnect:intake-complete',
  caseId: 'abc123',
}, targetOrigin);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Server-Side Decryption of E2E Data
**What:** Decrypting client messages on the server for processing
**Why bad:** Defeats E2E encryption. Server compromise exposes all data.
**Instead:** Process only metadata server-side. AI extraction happens client-side or on encrypted-at-rest data with explicit client consent.

### Anti-Pattern 2: Monolithic BullMQ Worker
**What:** Single worker handling all job types (OCR, AI, email, notifications)
**Why bad:** One slow PDF blocks email delivery. No independent scaling.
**Instead:** Separate worker processes per queue: `document-processing`, `ai-extraction`, `notifications`. Scale independently.

### Anti-Pattern 3: Storing Encryption Keys in the Database
**What:** Persisting client private keys in PostgreSQL
**Why bad:** Database breach = all encrypted data compromised.
**Instead:** Private keys stay in browser (IndexedDB) or device keychain. Key recovery via passphrase-derived key (Argon2 + libsodium).

### Anti-Pattern 4: Direct Database Access from Widget
**What:** Widget bundle containing database connection strings or direct API keys
**Why bad:** Client-side code is inspectable. Exposes infrastructure.
**Instead:** Widget communicates only via public tRPC endpoints with rate limiting and CORS. Lawyer identified by public ID, not secrets.

### Anti-Pattern 5: Mixing AI Advice with Legal Advice
**What:** AI responses that could be interpreted as legal counsel
**Why bad:** Unauthorized practice of law (UPL). Regulatory and liability risk.
**Instead:** AI clearly labeled as "information assistant." Explicit disclaimers. AI extracts and structures; never advises.

## Scalability Considerations

| Concern | At 100 lawyers | At 1K lawyers | At 10K lawyers |
|---------|----------------|----------------|-----------------|
| Database | Single PostgreSQL, RLS | Read replicas, connection pooling (PgBouncer) | Horizontal sharding by region |
| Document processing | 1-2 BullMQ workers | Auto-scaling worker pool, priority queues | Dedicated Docling cluster per region |
| File storage | Single S3 bucket with prefixes | Lifecycle policies, CDN for public assets | Multi-region S3 buckets |
| AI calls | Direct API calls, rate limiting | Provider load balancing (Claude + GPT), caching | Dedicated inference endpoints, batching |
| Real-time messaging | Valkey pub/sub | Valkey cluster mode | Dedicated messaging service |
| Widget CDN | Single origin | CDN (OVHcloud or Cloudflare) | Edge-cached, versioned bundles |

## Sources

- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- E2E encryption patterns: https://www.seald.io/
- OVHcloud E2E Encryption Platform: https://labs.ovhcloud.com/en/end-to-end-encryption/
- Shadow DOM widget isolation: https://www.viget.com/articles/embedable-web-applications-with-shadow-dom
- BullMQ architecture: https://docs.bullmq.io/
