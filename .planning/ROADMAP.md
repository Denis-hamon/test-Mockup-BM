# Roadmap: LegalConnect

## Overview

LegalConnect transforms how solo lawyers and small firms handle client intake. The roadmap builds security-first (encryption and auth as foundation), then layers the intelligent intake form, AI capabilities (extraction, summarization, qualification), lawyer-facing tools, client-facing portal, and finally distribution via embeddable widget. Each phase delivers a coherent, verifiable capability that builds on the previous ones.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Auth & Encryption** - User accounts, E2E encryption primitives, RGPD compliance infrastructure
- [ ] **Phase 2: Intake Form & Trust UX** - Multi-step intake form with file uploads and visible security indicators
- [ ] **Phase 3: AI Engine Foundation** - LLM-agnostic provider architecture with UPL guardrails
- [ ] **Phase 4: Empathetic AI Intake** - AI conversational follow-ups and document extraction during intake
- [ ] **Phase 5: Case Intelligence** - AI-generated case summaries, timelines, and qualification scores
- [ ] **Phase 6: Lawyer Dashboard** - Case management interface with filters, notifications, and configuration
- [ ] **Phase 7: Client Portal** - Encrypted messaging, document sharing, case tracking, and appointment requests
- [ ] **Phase 8: Intake Templates & Customization** - Pre-built specialty templates and lawyer customization tools
- [ ] **Phase 9: Distribution & Embedding** - Embeddable widget and hosted lawyer pages

## Phase Details

### Phase 1: Auth & Encryption
**Goal**: Users can create accounts and authenticate securely, with all data protected by E2E encryption and RGPD-compliant infrastructure in place
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SECU-01, SECU-02
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and receives a verification email before accessing the app
  2. User can log in, stay logged in across browser sessions, and reset a forgotten password
  3. All user data is encrypted client-side with libsodium before reaching the server (E2E encryption functional)
  4. User can exercise RGPD rights: export their data and request deletion
  5. Key recovery works: user on a new device can restore access via passphrase
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffolding, Docker infra, database schemas, Zod validation schemas
- [x] 01-02-PLAN.md — Auth system (Auth.js v5, registration, login, email verification, password reset, UI pages)
- [x] 01-03-PLAN.md — E2E encryption primitives (keypair, XChaCha20-Poly1305, BIP39 recovery, Argon2id KDF)
- [x] 01-04-PLAN.md — Recovery passphrase flow + RGPD compliance (consent, export, deletion)

### Phase 2: Intake Form & Trust UX
**Goal**: A client can describe their legal situation through a guided multi-step form, upload supporting documents, and feel reassured by visible security indicators throughout
**Depends on**: Phase 1
**Requirements**: INTK-01, INTK-03, INTK-04, SECU-03
**Success Criteria** (what must be TRUE):
  1. Client completes a multi-step form to describe their legal situation (structured fields, progression indicator)
  2. Client can upload PDF, images, and screenshots during intake, and files are encrypted before upload
  3. Client can upload video files as evidence during intake
  4. Padlock icons, encryption badges, and contextual security reminders are visible at every sensitive interaction
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — shadcn/ui init, next-intl FR config, Zod + Drizzle intake schemas, trust indicator components
- [x] 02-02-PLAN.md — Multi-step intake form (4-step stepper, validation, localStorage auto-save, submit action)
- [x] 02-03-PLAN.md — File upload with client-side encryption (drag & drop, XChaCha20-Poly1305, S3 upload, progress UI)
- [x] 02-04-PLAN.md — Gap closure: rewire intake-stepper.tsx to connect all orphaned step components

### Phase 3: AI Engine Foundation
**Goal**: The AI subsystem is operational with a provider-agnostic architecture and strict guardrails preventing any legal advice
**Depends on**: Phase 1
**Requirements**: AI-05, AI-06
**Success Criteria** (what must be TRUE):
  1. AI requests can be routed to Claude, GPT, or Mistral via a unified provider interface without code changes
  2. AI never provides legal advice in any interaction — UPL guardrails reject or rewrite any response containing advice
  3. All AI responses include appropriate disclaimers
**Plans**: TBD

Plans:
- [ ] 03-01: LLM-agnostic provider interface (Vercel AI SDK)
- [ ] 03-02: UPL guardrails, output filtering, and red-team test suite

### Phase 4: Empathetic AI Intake
**Goal**: The intake form is enhanced with AI that asks empathetic follow-up questions and extracts key information from uploaded documents
**Depends on**: Phase 2, Phase 3
**Requirements**: INTK-02, AI-01
**Success Criteria** (what must be TRUE):
  1. AI asks contextual follow-up questions adapted to the legal domain and the client's emotional state during intake
  2. AI tone is warm, supportive, and encouraging — never cold or bureaucratic
  3. AI extracts dates, parties, amounts, and key clauses from uploaded PDF/image documents automatically
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: AI conversational follow-ups in intake flow
- [ ] 04-02: Document extraction pipeline (Docling sidecar + AI vision)

### Phase 5: Case Intelligence
**Goal**: The system generates a complete, structured case file from intake data and documents — ready for lawyer review
**Depends on**: Phase 4
**Requirements**: AI-02, AI-03, AI-04
**Success Criteria** (what must be TRUE):
  1. A structured case summary (fiche synthetique) is auto-generated from intake data and uploaded documents
  2. A chronological timeline of events is built from client narrative and document contents
  3. A qualification score is computed to help lawyers prioritize cases by urgency and completeness
**Plans**: TBD

Plans:
- [ ] 05-01: AI case summary generation
- [ ] 05-02: Timeline extraction and qualification scoring

### Phase 6: Lawyer Dashboard
**Goal**: Lawyers can view, filter, and review all incoming case requests with full AI-generated case files and configure their practice settings
**Depends on**: Phase 5
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Lawyer sees all incoming requests in a list view and can filter by status and specialty
  2. Lawyer receives email notifications for new cases, messages, and appointment requests
  3. Lawyer can open a complete case file showing AI summary, uploaded documents, timeline, and qualification score
  4. Lawyer can configure their available specialties and practice areas
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 06-01: Case list view with filters and search
- [ ] 06-02: Case detail view (AI summary, documents, timeline, score)
- [ ] 06-03: Email notifications and lawyer configuration

### Phase 7: Client Portal
**Goal**: Client and lawyer have a secure shared space for ongoing communication, document exchange, case tracking, and appointment scheduling
**Depends on**: Phase 6
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04
**Success Criteria** (what must be TRUE):
  1. Client and lawyer can exchange E2E encrypted messages in real time within the portal
  2. Client and lawyer can share documents securely through the portal
  3. Client can see their case status and progress updates at any time
  4. Client can request an appointment with availability preferences, and the lawyer confirms or declines manually
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 07-01: E2E encrypted messaging system
- [ ] 07-02: Document sharing and case status tracking
- [ ] 07-03: Appointment request and manual confirmation flow

### Phase 8: Intake Templates & Customization
**Goal**: Lawyers can select from pre-built intake templates per legal specialty and customize questions, flow, and branding to match their practice
**Depends on**: Phase 4
**Requirements**: INTK-05, INTK-06
**Success Criteria** (what must be TRUE):
  1. Pre-built intake templates are available for at least 3 legal specialties (family law, labor law, criminal defense)
  2. Lawyer can customize intake questions, form flow, and branding for their practice
  3. Client sees a specialty-appropriate intake experience that matches the lawyer's branding
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 08-01: Template engine and pre-built specialty templates
- [ ] 08-02: Lawyer customization UI (questions, flow, branding)

### Phase 9: Distribution & Embedding
**Goal**: Lawyers can embed the intake flow on their own website via a single script tag, and each lawyer has a hosted page as a standalone entry point
**Depends on**: Phase 8
**Requirements**: DIST-01, DIST-02
**Success Criteria** (what must be TRUE):
  1. A single script tag on a lawyer's website launches the full intake flow in an embedded widget (Shadow DOM isolated)
  2. Each lawyer/firm has a hosted page (e.g., app.com/cabinet-dupont) that works as a standalone intake entry point
  3. Widget works correctly across different host websites without CSS conflicts or broken functionality
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 09-01: Embeddable widget (Vite IIFE + Shadow DOM)
- [ ] 09-02: Hosted lawyer/firm pages

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth & Encryption | 4/4 | Complete | 2026-03-25 |
| 2. Intake Form & Trust UX | 1/4 | In Progress|  |
| 3. AI Engine Foundation | 0/2 | Not started | - |
| 4. Empathetic AI Intake | 0/2 | Not started | - |
| 5. Case Intelligence | 0/2 | Not started | - |
| 6. Lawyer Dashboard | 0/3 | Not started | - |
| 7. Client Portal | 0/3 | Not started | - |
| 8. Intake Templates & Customization | 0/2 | Not started | - |
| 9. Distribution & Embedding | 0/2 | Not started | - |
