# Feature Landscape

**Domain:** LegalTech SaaS - Client Intake Portal
**Researched:** 2026-03-25

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-step intake form | Core product. Lawyers need structured client info before first meeting | Medium | Hybrid: form fields + AI conversational follow-ups |
| Document upload (PDF, images) | Clients always have supporting docs (contracts, letters, screenshots) | Medium | Must handle varied formats: PDF, JPEG, PNG, HEIC |
| Lawyer dashboard | Lawyers need to see/manage incoming requests | Medium | List view, filters by status/specialty, search |
| Client portal with messaging | Ongoing communication channel post-intake | High | Must be E2E encrypted, real-time notifications |
| Email notifications | Status changes, new messages, appointment requests | Low | Transactional emails with React Email |
| Email/password authentication | Standard for professional SaaS | Low | Auth.js v5, email verification mandatory |
| Mobile-responsive design | Clients fill intake on phones. Lawyers check dashboard on tablets | Medium | Responsive, not native app |
| RGPD compliance | Legal requirement in EU | Medium | Consent management, data export, deletion rights |
| SSL/TLS everywhere | Baseline security expectation | Low | Traefik auto-TLS |
| Case file summary | Lawyer sees structured synthesis of client's situation | Medium | AI-generated, editable by lawyer |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI-guided empathetic intake | Clients in distress feel supported, not interrogated. AI adapts tone and follow-up questions based on legal domain and emotional context | High | Core differentiator. System prompt engineering per legal specialty |
| AI document extraction | Auto-extract key info from uploaded docs (dates, parties, amounts, clauses). Saves lawyer hours of manual review | High | Docling for PDFs + AI Vision for photos/screenshots |
| Embeddable widget | Lawyers embed intake on their existing website. Zero friction acquisition | Medium | Shadow DOM + Vite IIFE bundle |
| Visual security indicators | Padlock icons, encryption badges, "your data is protected" contextual reminders. Clients feel safe sharing sensitive info | Low | UX design, not technical complexity |
| Timeline extraction | AI builds chronological timeline of events from client narrative + documents | Medium | Structured output from LLM with date parsing |
| Qualification score | AI scores case quality/urgency to help lawyer prioritize | Medium | Configurable per lawyer/specialty |
| Specialty-specific templates | Pre-built intake flows for divorce, labor law, criminal defense, etc. | Medium | Template system with conditional branching |
| Lawyer customization | Lawyer personalizes questions, branding, tone | Medium | Config UI + template override system |
| Appointment request flow | Client requests meeting, lawyer confirms manually | Low | Not auto-booking. Calendar view for lawyer |
| Video upload support | Clients share video evidence (surveillance, incidents) | Medium | Upload, transcode, AI transcript extraction |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-booking with calendar sync | Lawyers want control over their agenda. Auto-booking feels invasive for the legal profession | Manual appointment confirmation. Revisit post-MVP based on feedback |
| Native mobile app | Massive development cost, small initial user base. Web-first covers the use case | Responsive web app. PWA if offline needed later |
| Real-time video/voice chat | Complex infrastructure (WebRTC), regulatory implications for legal consultations | Text messaging + document sharing. Link to external video tool if needed |
| Legal advice from AI | Unauthorized practice of law (UPL). Massive liability risk | AI assists with information extraction and structuring. Never gives legal opinions or advice |
| Payment/billing integration | Out of scope for MVP. Business model not yet validated | Simple "pricing" page. Integrate Stripe post-MVP |
| Integration with legal practice management (RPVA, etc.) | Fragmented market, each software has different APIs | Standard export formats (PDF, CSV). API for third-party integration post-MVP |
| Multi-tenant admin panel | Over-engineering for early stage. Most lawyers are solo or small firms | Per-lawyer config. Firm-level features when demand proven |
| AI chatbot replacing the form | Pure chatbot feels unstructured and unreliable for legal intake | Hybrid: structured form fields with AI conversational supplements |

## Feature Dependencies

```
Authentication -> All features (gating)
Encryption primitives -> Messaging, Document upload, Client portal
Document upload -> AI document extraction -> Timeline extraction
Intake form engine -> Specialty templates -> Lawyer customization
Intake form + AI extraction -> Case file summary -> Qualification score
Lawyer dashboard -> Appointment request flow
Embeddable widget -> Intake form engine (shared components)
```

## MVP Recommendation

**Prioritize (Phase 1-2):**
1. Email/password auth with E2E encryption foundation
2. Multi-step intake form (one legal specialty: family law)
3. Document upload with basic AI extraction
4. Lawyer dashboard (view/manage requests)
5. Case file summary (AI-generated)
6. Visual security indicators throughout

**Defer:**
- Embeddable widget: Phase 3 (needs stable intake form first)
- Messaging portal: Phase 3 (intake -> dashboard flow must work first)
- Video upload: Phase 4+ (niche use case, high complexity)
- Multi-specialty templates: Phase 3 (start with one, prove the model)
- Appointment flow: Phase 3 (basic "contact lawyer" button sufficient for MVP)

## Sources

- LegalTech market trends: https://www.inventiva.co.in/trends/top-10-legaltech-saas-startups-in-2026/
- Law firm tech stack guide: https://www.spellbook.legal/learn/law-firm-tech-stack
- Legal tech trends 2026: https://www.netdocuments.com/blog/2026-legal-tech-trends/
- Client portal adoption: https://legaltech.saglobal.com/blogs/10-legal-technology-trends-reshaping-law-firms-in-2026.html
