# Domain Pitfalls

**Domain:** LegalTech SaaS - Client Intake Portal
**Researched:** 2026-03-25

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: E2E Encryption Bolted On After MVP
**What goes wrong:** Building features first, adding encryption later requires rewriting every data path (storage, retrieval, search, export).
**Why it happens:** Encryption adds complexity to every feature. Tempting to defer.
**Consequences:** Complete rewrite of data layer. Existing data cannot be retroactively encrypted without migration. Lost trust if breach occurs before encryption is live.
**Prevention:** Encryption primitives (libsodium keypair generation, encrypted storage helpers) must be in Phase 1. Every feature builds on encrypted-by-default data layer.
**Detection:** If you can read client messages in the database with a SQL query, encryption is not E2E.

### Pitfall 2: AI Giving Legal Advice
**What goes wrong:** AI responses interpreted as legal counsel. "Based on your situation, you should file for divorce" = unauthorized practice of law.
**Why it happens:** LLMs naturally give advice when asked questions. Without strict guardrails, AI will cross the line.
**Consequences:** Regulatory action against lawyers using the platform. Platform liability. Loss of bar association trust.
**Prevention:** System prompts with explicit "never advise" instructions. Output filtering layer. Mandatory disclaimers on all AI-generated content. Legal review of AI prompt templates before launch.
**Detection:** Red-team AI responses with adversarial prompts. "What should I do?" must always redirect to "your lawyer will advise you."

### Pitfall 3: RGPD Non-Compliance from Day 1
**What goes wrong:** Processing legal data without proper consent records, data processing agreements, right-to-deletion implementation.
**Why it happens:** RGPD seems like paperwork, not code. Developers skip implementation.
**Consequences:** Fines up to 4% of revenue. Platform shutdown order from CNIL. Lawyer clients face their own RGPD violations.
**Prevention:** Consent collection with timestamps stored immutably. Data export API (right of access). Hard delete cascade for right-to-erasure. DPA template for lawyer-platform relationship.
**Detection:** Can you export all data for a given client? Can you fully delete a client and prove it?

### Pitfall 4: Multi-Tenant Data Leakage
**What goes wrong:** Lawyer A sees Lawyer B's clients. Or client of Lawyer A sees another client's documents.
**Why it happens:** Forgot to add tenant filter on a query. ORM makes it easy to fetch all records.
**Consequences:** Professional secrecy violation. Catastrophic trust loss. Potential criminal liability for lawyers.
**Prevention:** PostgreSQL Row-Level Security as the safety net (not just application-level filtering). Every table with client data has `lawyer_id` and RLS policy. Drizzle middleware that sets `app.current_lawyer_id` on every connection.
**Detection:** Automated tests: create two lawyers, verify complete data isolation. Penetration testing.

### Pitfall 5: Key Management Disaster
**What goes wrong:** Client loses device = loses private encryption key = permanently locked out of their case data.
**Why it happens:** E2E encryption means the server cannot recover data. No key recovery = data loss.
**Consequences:** Client data permanently inaccessible. Lawyer cannot access case files. Legal malpractice exposure.
**Prevention:** Key recovery mechanism from day 1: passphrase-based key derivation (Argon2id) that can regenerate the private key. Lawyer has a separate recovery path. Consider key escrow with the lawyer (encrypted backup of client key).
**Detection:** Test scenario: new device login, can the user access all their previous data?

## Moderate Pitfalls

### Pitfall 1: Widget CSS Conflicts
**What goes wrong:** Widget styles clash with host website. Broken layout on lawyer's site.
**Prevention:** Shadow DOM for hard style isolation. Never use global CSS in widget. Test on 10+ different lawyer website templates.

### Pitfall 2: LLM Provider Lock-In
**What goes wrong:** Hardcoding Claude API calls throughout the codebase. When Claude has an outage or pricing changes, everything breaks.
**Prevention:** Vercel AI SDK provider abstraction. All LLM calls go through the `packages/ai` package. Provider is a config parameter, not hardcoded.

### Pitfall 3: Document Processing Timeout
**What goes wrong:** Large PDF (100+ pages) or slow OCR blocks the request. User sees a loading spinner for minutes.
**Prevention:** Always async via BullMQ. Show upload success immediately, extraction status via polling/SSE. Progress indicators for long-running jobs.

### Pitfall 4: French Legal Terminology in AI
**What goes wrong:** AI uses English legal terms, or incorrect French legal terminology. Lawyers lose trust.
**Prevention:** French-first prompt engineering. Legal glossary in system prompts. Validation by a legal professional before launch. Use `next-intl` for all user-facing strings.

### Pitfall 5: Auth.js v5 Beta Instability
**What goes wrong:** Auth.js v5 has been in beta for years. Breaking changes in patch releases.
**Prevention:** Pin exact version. Abstract auth behind a service layer. Have a fallback plan (custom JWT + session table). Monitor Auth.js GitHub issues actively.

### Pitfall 6: Over-Engineering Multi-Tenancy
**What goes wrong:** Building complex firm hierarchy (admin, partner, associate, paralegal) before having 10 paying customers.
**Prevention:** Phase 1: one lawyer = one account. Add firm/team features only when demand is proven. RLS structure supports it without code changes.

## Minor Pitfalls

### Pitfall 1: Oversized Widget Bundle
**What goes wrong:** Widget JS file grows beyond 200kb. Slows down lawyer's website.
**Prevention:** Dedicated Vite build with aggressive tree-shaking. No heavy dependencies in widget (no Framer Motion, no full shadcn). Monitor bundle size in CI.

### Pitfall 2: Email Deliverability
**What goes wrong:** Transactional emails (verification, notifications) land in spam.
**Prevention:** Proper SPF/DKIM/DMARC from day 1. Use Resend (good deliverability track record). Warm up sending domain before launch.

### Pitfall 3: Image Upload from Mobile
**What goes wrong:** iPhone photos are 5-10MB HEIC files. Upload fails or is very slow on mobile networks.
**Prevention:** Client-side image compression before upload (sharp or browser-native). Accept HEIC, convert server-side. Progressive upload with resume capability.

### Pitfall 4: Valkey Compatibility Edge Cases
**What goes wrong:** Rare BullMQ features assume Redis-specific commands not yet in Valkey.
**Prevention:** Test BullMQ flows against Valkey in CI. Valkey 9 has very high Redis compatibility, but verify features you actually use.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Auth + Encryption setup | Key recovery not designed | Design key recovery flow before writing any encryption code |
| Intake form engine | Form builder becomes over-complex | Start with hardcoded family law template. Template engine in phase 2+ |
| AI integration | AI gives legal advice | Red-team AI responses before any user testing |
| Document processing | Docling Python sidecar deployment | Dockerize Docling early. Test on OVHcloud K8s before building features around it |
| Widget embedding | CORS and CSP issues on lawyer sites | Comprehensive CORS config. Test with restrictive CSP policies |
| Messaging | E2E encryption UX is confusing | Clear visual indicators. "Sending encrypted message..." states |
| Multi-specialty templates | Template schema becomes unmaintainable | JSON Schema for templates. Version templates. Migration path for schema changes |
| HDS certification | Certification process takes months | Start administrative process in Phase 1, even if technical compliance comes later |

## Sources

- CNIL RGPD enforcement: https://www.cnil.fr/
- LegalTech regulatory considerations: https://www.spellbook.legal/learn/law-firm-tech-stack
- E2E encryption key recovery patterns: https://www.seald.io/
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Auth.js v5 stability discussion: https://github.com/nextauthjs/next-auth/discussions/13382
