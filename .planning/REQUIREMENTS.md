# Requirements: LegalConnect

**Defined:** 2026-03-25
**Core Value:** Le client doit pouvoir exprimer sa situation juridique de manière complète et structurée, guidé par une IA empathique, dans un environnement perçu comme totalement sécurisé — pour que l'avocat reçoive un dossier parfaitement qualifié dès le premier contact.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Security

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can log in and stay logged in across sessions
- [x] **AUTH-04**: User can reset password via email link
- [x] **SECU-01**: All data encrypted end-to-end using libsodium (client-side key management)
- [x] **SECU-02**: RGPD compliance (consent management, data export, deletion rights)
- [x] **SECU-03**: Visual security indicators displayed at every sensitive interaction (padlock icons, encryption badges, contextual reminders)

### Intake & Forms

- [x] **INTK-01**: Client completes multi-step intake form to describe their legal situation
- [ ] **INTK-02**: AI asks empathetic follow-up questions adapted to legal domain and emotional context
- [x] **INTK-03**: Client can upload documents (PDF, images, screenshots) during intake
- [x] **INTK-04**: Client can upload video files as evidence
- [ ] **INTK-05**: Pre-built intake templates available per legal specialty (family law, labor law, criminal defense, etc.)
- [ ] **INTK-06**: Lawyer can customize intake questions, flow, and branding

### AI Intelligence

- [ ] **AI-01**: AI extracts key information from uploaded documents (dates, parties, amounts, clauses)
- [ ] **AI-02**: AI generates structured case summary (fiche synthétique) from intake data and documents
- [ ] **AI-03**: AI builds chronological timeline of events from client narrative and documents
- [ ] **AI-04**: AI produces qualification score to help lawyer prioritize cases by urgency/quality
- [ ] **AI-05**: AI architecture is LLM-agnostic (supports Claude, GPT, Mistral via unified provider interface)
- [ ] **AI-06**: AI never provides legal advice — UPL guardrails enforced in all interactions

### Lawyer Dashboard

- [ ] **DASH-01**: Lawyer views all incoming requests in list view with filters by status and specialty
- [ ] **DASH-02**: Lawyer receives email notifications for new cases, messages, and appointment requests
- [ ] **DASH-03**: Lawyer can review complete case file (AI summary, uploaded documents, timeline, qualification score)
- [ ] **DASH-04**: Lawyer configures available specialties and practice areas

### Client Portal

- [ ] **PORT-01**: Client and lawyer can exchange end-to-end encrypted messages
- [ ] **PORT-02**: Client and lawyer can share documents securely within the portal
- [ ] **PORT-03**: Client can track case status and progress updates
- [ ] **PORT-04**: Client can request appointment with availability preferences, lawyer confirms manually

### Distribution

- [ ] **DIST-01**: Embeddable widget (single script tag) for lawyer's website that launches intake flow
- [ ] **DIST-02**: Hosted page per lawyer/firm (e.g., app.com/cabinet-dupont) as standalone entry point

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Authentication

- **AUTH-05**: OAuth login (Google, Microsoft) for lawyers
- **AUTH-06**: Two-factor authentication (2FA)

### Advanced Features

- **ADV-01**: Auto-booking with calendar sync (Calendly-style)
- **ADV-02**: Integration with legal practice management software (RPVA, etc.)
- **ADV-03**: Multi-firm admin panel for larger organizations
- **ADV-04**: AI chatbot for pre-intake qualification (before form)
- **ADV-05**: PWA with offline support
- **ADV-06**: Real-time video/voice consultation

### Monetization

- **MON-01**: Stripe payment integration
- **MON-02**: Tiered subscription plans (solo/cabinet/enterprise)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile app (iOS/Android) | Web-first responsive covers the use case. Massive dev cost for v1 |
| Legal advice from AI | Unauthorized practice of law (UPL). Criminal penalties in France |
| Real-time video/voice chat | WebRTC complexity, regulatory implications for legal consultations |
| Payment/billing | Business model not yet validated |
| Practice management integration | Fragmented market, each software has different APIs |
| Multi-language support | French-first, internationalize later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| SECU-01 | Phase 1 | Complete |
| SECU-02 | Phase 1 | Complete |
| SECU-03 | Phase 2 | Pending |
| INTK-01 | Phase 2 | Complete |
| INTK-02 | Phase 4 | Pending |
| INTK-03 | Phase 2 | Complete |
| INTK-04 | Phase 2 | Complete |
| INTK-05 | Phase 8 | Pending |
| INTK-06 | Phase 8 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| AI-04 | Phase 5 | Pending |
| AI-05 | Phase 3 | Pending |
| AI-06 | Phase 3 | Pending |
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| DASH-03 | Phase 6 | Pending |
| DASH-04 | Phase 6 | Pending |
| PORT-01 | Phase 7 | Pending |
| PORT-02 | Phase 7 | Pending |
| PORT-03 | Phase 7 | Pending |
| PORT-04 | Phase 7 | Pending |
| DIST-01 | Phase 9 | Pending |
| DIST-02 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
