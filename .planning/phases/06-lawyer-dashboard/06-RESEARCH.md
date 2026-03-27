# Phase 6: Lawyer Dashboard - Research

**Researched:** 2026-03-27
**Domain:** Dashboard UI (data tables, filters, tabs, email notifications, settings forms)
**Confidence:** HIGH

## Summary

Phase 6 transforms the existing placeholder dashboard into a full-featured lawyer workspace. The core work is UI-heavy: a filterable/sortable case list (DataTable), a tabbed case detail view consuming the existing `CaseIntelligenceResult` data, email notifications via the established `packages/email` + Resend pattern, and a settings page for lawyer profile configuration.

The existing codebase provides strong foundations: `getCaseIntelligence()` already returns summary, timeline, and score data; the email package has a working `sendEmail()` with React Email + Resend; shadcn/ui is initialized with `base-nova` preset; and the `(app)` route group has auth-gated layout with max-w-7xl container. The main gaps are: (1) no lawyer-specific DB tables yet (`lawyer_profiles`, `lawyer_notes`), (2) the `intakeSubmissions.status` enum needs extending for the lawyer workflow, (3) no DataTable component yet (shadcn `table` component not installed), and (4) no tRPC — the project uses server actions exclusively.

**Primary recommendation:** Use server actions (established pattern) with `useTransition` for mutations and RSC data fetching for the list/detail pages. Add new shadcn components via CLI. Create `lawyer_profiles` and `lawyer_notes` Drizzle schemas. Build email notification templates following the existing `packages/email` patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tableau avec colonnes (pattern shadcn DataTable) : nom client, type probleme, score, statut, date. Tri par colonne. Responsive. Compact et scannable.
- **D-02:** Filtres : par statut (Nouveau, En cours, Termine, Archive), par specialite juridique, par tranche de score (faible/moyen/eleve), par date. Barre de recherche par nom client.
- **D-03:** Tabs horizontaux : Synthese | Documents | Timeline | Echanges IA. Score et statut visibles en header permanent au-dessus des tabs.
- **D-04:** Actions disponibles : changer le statut (Nouveau > En cours > Termine > Archive), ajouter des notes internes (pas visibles au client), regenerer la fiche IA, telecharger les documents.
- **D-05:** Email immediat par evenement : nouveau dossier soumis, nouveau message client (Phase 7). Opt-out possible par type dans les parametres. Templates React Email avec ton chaleureux (coherent D-12 Phase 1).
- **D-06:** Page Parametres dediee : selection des specialites juridiques (famille, travail, penal, immobilier, commercial, autre), nom du cabinet, coordonnees, preferences de notification (opt-out par type).

### Claude's Discretion
- Colonnes exactes du DataTable (largeurs, formatage)
- Schema Drizzle pour lawyer_profiles et lawyer_notes
- Design des templates React Email
- Composants shadcn specifiques pour les tabs et filtres
- Pagination vs infinite scroll pour la liste

### Deferred Ideas (OUT OF SCOPE)
- Export PDF de la fiche synthetique — Phase 8 (customisation)
- Edition manuelle de la timeline par l'avocat — future version
- Logo et couleurs du cabinet — Phase 8 (customisation)
- Assignation a un collaborateur — future version (multi-user cabinet)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Lawyer views all incoming requests in list view with filters by status and specialty | DataTable pattern with server-side filtering via URL search params; existing `intakeSubmissions` table extended with lawyer-facing statuses; `caseSummaries`/`qualificationScores` joins for score/domain columns |
| DASH-02 | Lawyer receives email notifications for new cases, messages, and appointment requests | Existing `packages/email` + Resend infrastructure; new BullMQ job for async email dispatch; new `notification_preferences` in `lawyer_profiles` table |
| DASH-03 | Lawyer can review complete case file (AI summary, uploaded documents, timeline, qualification score) | Existing `getCaseIntelligence()` action returns all data; tabbed UI via shadcn Tabs; document download via presigned S3 URLs |
| DASH-04 | Lawyer configures available specialties and practice areas | New `lawyer_profiles` Drizzle schema with `specialties` JSON column; settings page with checkbox group |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack:** Next.js 16, React 19, Drizzle ORM, shadcn/ui (base-nova), React Email + Resend, BullMQ + Valkey
- **Auth:** Auth.js v5 with `auth()` for session checks, roles `avocat`/`client` on users table
- **Patterns:** Server actions for mutations (no tRPC router implemented yet), Drizzle schemas with text IDs via `crypto.randomUUID()`
- **i18n:** French-first via `next-intl` with `useTranslations`
- **Security:** E2E encryption, RGPD compliance, EU hosting
- **UX:** Trust and security visual language, warm tone in all communications

## Standard Stack

### Core (Already Installed)
| Library | Purpose | Status |
|---------|---------|--------|
| shadcn/ui (base-nova) | Component library | Installed, needs new components: table, tabs, dropdown-menu, dialog, command, popover, calendar, checkbox, switch, sheet, pagination, sonner |
| Drizzle ORM | Database schemas + queries | Installed, extend with lawyer_profiles, lawyer_notes |
| React Email + Resend | Email templates + delivery | Installed in `packages/email/`, extend with notification templates |
| BullMQ | Async job queue | Installed, extend with email notification jobs |
| next-intl | i18n | Installed, add dashboard translation keys |

### New Components to Install
```bash
cd /Users/dhamon && pnpm dlx shadcn@latest add table tabs dropdown-menu dialog command popover calendar checkbox switch sheet pagination sonner
```

### Supporting (No New Dependencies)
The phase requires no new npm packages. All functionality is covered by the existing stack.

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── app/(app)/
│   ├── dossiers/
│   │   ├── page.tsx              # Case list (RSC with search params)
│   │   └── [id]/
│   │       └── page.tsx          # Case detail (RSC)
│   └── parametres/
│       ├── layout.tsx            # Existing settings layout
│       └── cabinet/
│           └── page.tsx          # New: lawyer settings page
├── components/
│   ├── dashboard/
│   │   ├── case-data-table.tsx       # DataTable with columns, sorting, filtering
│   │   ├── case-columns.tsx          # Column definitions
│   │   ├── case-filters.tsx          # Filter bar component
│   │   ├── score-badge.tsx           # Score colored badge (faible/moyen/eleve)
│   │   ├── status-badge.tsx          # Status colored badge
│   │   ├── status-dropdown.tsx       # Status transition dropdown
│   │   ├── case-detail-header.tsx    # Client name, type, score, status, date
│   │   ├── case-tabs.tsx             # Tabs container
│   │   ├── tab-synthese.tsx          # AI summary tab content
│   │   ├── tab-documents.tsx         # Documents grid tab content
│   │   ├── tab-timeline.tsx          # Timeline vertical list
│   │   ├── tab-echanges-ia.tsx       # AI conversation history
│   │   ├── internal-notes.tsx        # Notes editor with save
│   │   ├── specialty-selector.tsx    # Checkbox group for legal specialties
│   │   └── notification-settings.tsx # Toggle switches per notification type
│   └── ui/                           # shadcn components (auto-generated)
├── lib/
│   └── db/
│       └── schema/
│           └── lawyer.ts             # New: lawyer_profiles, lawyer_notes tables
├── server/
│   └── actions/
│       ├── dashboard.actions.ts      # New: list cases, update status, manage notes
│       └── lawyer-settings.actions.ts # New: get/update lawyer profile
packages/email/src/
├── new-case-notification.tsx         # New: notification for new case
└── index.ts                          # Updated: export new email functions
```

### Pattern 1: Server-Side Filtered Data Table
**What:** RSC page reads URL search params, queries DB with filters, passes data to client DataTable component.
**When to use:** Case list page with server-side pagination, sorting, and filtering.
**Example:**
```typescript
// apps/web/src/app/(app)/dossiers/page.tsx
// RSC — reads searchParams, queries DB, renders client component
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { intakeSubmissions, caseSummaries, qualificationScores } from "@/lib/db/schema";
import { eq, and, ilike, sql, desc, asc } from "drizzle-orm";
import { CaseDataTable } from "@/components/dashboard/case-data-table";

interface Props {
  searchParams: Promise<{
    page?: string;
    status?: string;
    specialty?: string;
    score?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function DossiersPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 20;

  // Build query with filters...
  // Pass results + pagination info to client component
  return <CaseDataTable data={cases} total={total} page={page} pageSize={pageSize} />;
}
```

### Pattern 2: Server Action Mutations with useTransition
**What:** Client components call server actions for mutations (status change, note save), using `useTransition` for loading states.
**When to use:** All mutation operations (status update, note save, settings save, AI regeneration).
**Example:**
```typescript
// Server action
"use server";
export async function updateCaseStatus(submissionId: string, newStatus: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    return { success: false, error: "unauthorized" };
  }
  await db.update(intakeSubmissions)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(intakeSubmissions.id, submissionId));
  return { success: true };
}

// Client component
"use client";
function StatusDropdown({ submissionId, currentStatus }) {
  const [isPending, startTransition] = useTransition();
  const handleChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateCaseStatus(submissionId, newStatus);
      if (result.success) toast.success("Statut mis a jour");
    });
  };
}
```

### Pattern 3: Email Notification via Existing Package
**What:** New React Email templates in `packages/email/src/`, dispatched via `sendEmail()`.
**When to use:** New case notification, message notification.
**Example:**
```typescript
// packages/email/src/new-case-notification.tsx
import { Body, Container, Head, Heading, Hr, Html, Preview, Text, Button } from "@react-email/components";

interface NewCaseNotificationProps {
  lawyerName?: string;
  clientName: string;
  problemType: string;
  submissionDate: string;
  caseUrl: string;
}

export function NewCaseNotification({ lawyerName, clientName, problemType, submissionDate, caseUrl }: NewCaseNotificationProps) {
  // Follow existing warm tone pattern from WelcomeEmail
}
```

### Anti-Patterns to Avoid
- **Do not introduce tRPC routers.** The project uses server actions exclusively. Adding tRPC for this phase would create two parallel API patterns. Keep consistency.
- **Do not client-side filter/sort.** With 20+ items per page, all filtering/sorting/pagination must be server-side via URL search params. The client DataTable component is purely presentational.
- **Do not use `space-y-*` or `space-x-*`.** Per shadcn skill rules, use `flex` with `gap-*` for spacing.
- **Do not use raw color values.** Use semantic tokens (`bg-primary`, `text-muted-foreground`, `bg-destructive`). Custom score badge colors should use CSS variables defined once.
- **Do not create a separate notification microservice.** Use BullMQ jobs triggered inline after submission creation — same pattern as extraction worker.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table with sorting/filtering | Custom table from scratch | shadcn DataTable pattern (Table + manual column/sort/filter logic) | Standard pattern, accessible, well-documented |
| Date range picker | Custom calendar component | shadcn popover + calendar + date-fns | Complex date edge cases, locale handling |
| Rich text notes editor | Full WYSIWYG editor | Plain textarea with markdown-like shortcuts | D-04 says "gras, italique, listes" — keep simple, defer rich editing |
| Toast notifications | Custom toast system | shadcn sonner (toast) | Already handles stacking, animation, aria-live |
| Dropdown menus | Custom menu | shadcn dropdown-menu (Radix) | Keyboard navigation, focus management, accessibility |
| Mobile filter panel | Custom drawer | shadcn sheet | Slide-in panel with proper focus trap |

**Key insight:** This phase is a composition exercise — combining existing shadcn primitives with existing server actions and data. There is very little new business logic to build.

## Database Schema Design

### New Tables

#### lawyer_profiles
```typescript
export const lawyerProfiles = pgTable("lawyer_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id),
  firmName: text("firm_name"),
  phone: text("phone"),
  specialties: text("specialties").notNull().default("[]"), // JSON string[]
  notifyNewCase: integer("notify_new_case").default(1).notNull(), // 1=on, 0=off
  notifyNewMessage: integer("notify_new_message").default(1).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
```

#### lawyer_notes
```typescript
export const lawyerNotes = pgTable("lawyer_notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id").notNull().references(() => intakeSubmissions.id),
  lawyerId: text("lawyer_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
```

### Existing Table Modifications

#### intakeSubmissions.status — extend enum
Current: `["draft", "submitted", "assigned", "reviewed"]`
Needed: Add lawyer-facing statuses. The D-01/D-02 decisions define: `Nouveau`, `En cours`, `Termine`, `Archive`.

**Recommendation:** Map the existing `submitted` status to display as "Nouveau" in the lawyer UI. Add `en_cours`, `termine`, `archive` to the status enum. The full enum becomes:
```
["draft", "submitted", "en_cours", "termine", "archive"]
```

Where:
- `draft` — client still editing (not visible to lawyer)
- `submitted` — maps to "Nouveau" in lawyer UI
- `en_cours` — lawyer is working on it
- `termine` — case resolved
- `archive` — archived, still accessible

This requires a Drizzle migration to alter the enum.

### Authorization Model

The `getCaseIntelligence()` currently checks `intakeSubmissions.userId === session.user.id` (client ownership). For the lawyer dashboard, we need a different authorization path:

**Recommendation:** For v1 (single lawyer per installation), allow any user with `role === "avocat"` to view all submissions with status `!= "draft"`. This is simple and matches the target — one lawyer sees all incoming cases.

Future multi-lawyer requires an `assigned_to` column on submissions, but that is explicitly deferred.

## Common Pitfalls

### Pitfall 1: Mixing Client and Server Authorization
**What goes wrong:** The existing `getCaseIntelligence()` checks client ownership. Calling it from the lawyer dashboard returns "submission_not_found" because the lawyer is not the submission owner.
**Why it happens:** Auth check assumes `userId === session.user.id` which is the client, not the lawyer.
**How to avoid:** Create new server actions for the lawyer dashboard that check `role === "avocat"` instead of submission ownership. Do NOT modify existing client-facing actions.
**Warning signs:** "submission_not_found" errors when lawyer tries to view cases.

### Pitfall 2: Status Enum Migration
**What goes wrong:** Adding new values to a PostgreSQL enum requires `ALTER TYPE ... ADD VALUE` which cannot run inside a transaction in older PG versions.
**Why it happens:** Drizzle Kit generates migrations that may wrap enum changes in transactions.
**How to avoid:** Review the generated migration SQL. If needed, split the enum alteration into a separate non-transactional migration step. PostgreSQL 16 (our version) supports `ADD VALUE` inside transactions with `ALTER TYPE ... ADD VALUE IF NOT EXISTS`.
**Warning signs:** Migration fails with "cannot alter enum inside transaction".

### Pitfall 3: URL Search Params Hydration Mismatch
**What goes wrong:** Server-rendered table with filters doesn't match client-side hydration when searchParams change.
**Why it happens:** Next.js App Router `searchParams` is a Promise in Next.js 16. Forgetting to await it causes hydration errors.
**How to avoid:** Always `await searchParams` in RSC pages. Pass serialized filter state to client components as props, not by reading URL directly.
**Warning signs:** Hydration warnings in console, filters resetting on navigation.

### Pitfall 4: Forgetting shadcn Skill Rules
**What goes wrong:** Code review flags `space-y-*`, raw color values, missing `data-icon`, Items not inside Groups.
**Why it happens:** Default coding habits override shadcn-specific conventions.
**How to avoid:** Follow the shadcn skill critical rules — `gap-*` not `space-y-*`, `size-*` for equal dimensions, `cn()` for conditionals, Items inside Groups, `data-icon` on icons in buttons.
**Warning signs:** Inconsistent spacing, broken dark mode, accessibility failures.

### Pitfall 5: Email Sending Blocking the Request
**What goes wrong:** Email notification call in server action blocks the response, adding 1-3s latency to the user action.
**Why it happens:** `await sendEmail()` is synchronous in the request path.
**How to avoid:** Fire-and-forget pattern (don't await) or better: dispatch via BullMQ job. The existing extraction worker pattern shows how to do this.
**Warning signs:** Slow status changes, slow form submissions.

## Code Examples

### shadcn DataTable Column Definitions
```typescript
// Source: shadcn/ui DataTable pattern
"use client";

import { ColumnDef } from "@tanstack/react-table"; // Note: shadcn DataTable uses TanStack Table internally
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";

export type CaseRow = {
  id: string;
  clientName: string;
  problemType: string;
  overallScore: number | null;
  status: string;
  createdAt: Date;
};

export const columns: ColumnDef<CaseRow>[] = [
  {
    accessorKey: "clientName",
    header: "Client",
  },
  {
    accessorKey: "problemType",
    header: "Type",
  },
  {
    accessorKey: "overallScore",
    header: "Score",
    cell: ({ row }) => <ScoreBadge score={row.getValue("overallScore")} />,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatRelativeDate(row.getValue("createdAt")),
  },
];
```

### Score Badge Component
```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score === null) return null;

  const { label, className } = getScoreConfig(score);

  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      <span className="sr-only">Score de qualification: {score} sur 100, </span>
      {label}
    </Badge>
  );
}

function getScoreConfig(score: number) {
  if (score >= 70) return { label: "Eleve", className: "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)] border-transparent" };
  if (score >= 40) return { label: "Moyen", className: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38_92%_35%)] border-transparent" };
  return { label: "Faible", className: "bg-destructive/15 text-destructive border-transparent" };
}
```

### Lawyer Dashboard Query Pattern
```typescript
// Server action: list cases for lawyer with filters
"use server";

import { db } from "@/lib/db";
import { intakeSubmissions, caseSummaries, qualificationScores } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, ilike, inArray, gte, lte, sql, desc, asc } from "drizzle-orm";

interface ListCasesParams {
  page: number;
  pageSize: number;
  status?: string;
  specialty?: string;
  scoreRange?: "faible" | "moyen" | "eleve";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listCasesForLawyer(params: ListCasesParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    return { success: false, error: "unauthorized" };
  }

  // Build WHERE conditions
  const conditions = [
    // Exclude drafts — lawyer only sees submitted+
    sql`${intakeSubmissions.status} != 'draft'`,
  ];

  if (params.status) {
    conditions.push(eq(intakeSubmissions.status, params.status));
  }
  if (params.search) {
    conditions.push(ilike(intakeSubmissions.fullName, `%${params.search}%`));
  }
  // ... more filters

  const offset = (params.page - 1) * params.pageSize;

  // Query with joins for score and domain
  const cases = await db
    .select({
      id: intakeSubmissions.id,
      clientName: intakeSubmissions.fullName,
      problemType: intakeSubmissions.problemType,
      status: intakeSubmissions.status,
      createdAt: intakeSubmissions.createdAt,
      overallScore: qualificationScores.overallScore,
      legalDomain: caseSummaries.legalDomain,
    })
    .from(intakeSubmissions)
    .leftJoin(qualificationScores, eq(qualificationScores.submissionId, intakeSubmissions.id))
    .leftJoin(caseSummaries, eq(caseSummaries.submissionId, intakeSubmissions.id))
    .where(and(...conditions))
    .orderBy(params.sortOrder === "asc" ? asc(intakeSubmissions.createdAt) : desc(intakeSubmissions.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  // Count total for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(intakeSubmissions)
    .where(and(...conditions));

  return { success: true, data: cases, total: count };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side DataTable filtering | Server-side filtering via URL params | Next.js 14+ | All filter state in URL, shareable, no hydration issues |
| `useSearchParams()` in client | `searchParams` prop in RSC (Promise) | Next.js 16 | Must `await searchParams` in page components |
| Custom toast implementations | shadcn sonner integration | shadcn v4 | Built-in, accessible, pre-styled |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (configured in packages/ai, packages/crypto) |
| Config file | No config in apps/web — Wave 0 must create `apps/web/vitest.config.ts` |
| Quick run command | `pnpm --filter web test` |
| Full suite command | `pnpm test` (turborepo delegates to all workspaces) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | List cases with filters for lawyer role | unit | `pnpm --filter web vitest run src/server/actions/dashboard.actions.test.ts -x` | Wave 0 |
| DASH-02 | Email notification dispatch on new case | unit | `pnpm --filter email vitest run src/new-case-notification.test.ts -x` | Wave 0 |
| DASH-03 | Case detail fetches full intelligence for lawyer | unit | `pnpm --filter web vitest run src/server/actions/dashboard.actions.test.ts -x` | Wave 0 |
| DASH-04 | Lawyer settings CRUD (specialties, profile) | unit | `pnpm --filter web vitest run src/server/actions/lawyer-settings.actions.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter web vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` — Vitest config for the web app (currently missing)
- [ ] `apps/web/src/server/actions/dashboard.actions.test.ts` — covers DASH-01, DASH-03
- [ ] `apps/web/src/server/actions/lawyer-settings.actions.test.ts` — covers DASH-04
- [ ] `packages/email/src/new-case-notification.test.ts` — covers DASH-02
- [ ] Test fixtures: mock session for `role: "avocat"`, mock intake submissions with case intelligence data

## Open Questions

1. **How are cases assigned to a specific lawyer?**
   - What we know: v1 is single-lawyer. All `role === "avocat"` users see all cases.
   - What's unclear: Should there be a `lawyerId` on `intakeSubmissions` for future multi-lawyer support?
   - Recommendation: Skip for now (deferred), but design the query to be easily filterable by lawyer in future.

2. **Should status transitions be validated (state machine)?**
   - What we know: Statuses are Nouveau > En cours > Termine > Archive (D-04).
   - What's unclear: Can a lawyer skip steps (e.g., Nouveau directly to Termine)?
   - Recommendation: Allow any forward transition but prevent backward (Archive to Nouveau). Simple validation in server action, not a full state machine.

3. **How to handle "Echanges IA" tab content?**
   - What we know: `aiFollowUps` table stores AI follow-up Q&A from Phase 4.
   - What's unclear: Is this a read-only history view, or can the lawyer interact with the AI?
   - Recommendation: Read-only display of the AI conversation that happened during intake. Lawyer-AI interaction is Phase 7+ scope.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/web/src/lib/db/schema/case-intelligence.ts` — caseSummaries, caseTimelines, qualificationScores tables
- Existing codebase: `apps/web/src/server/actions/case-intelligence.actions.ts` — getCaseIntelligence(), CaseIntelligenceResult interface
- Existing codebase: `apps/web/src/lib/db/schema/intake.ts` — intakeSubmissions (status enum, fields)
- Existing codebase: `apps/web/src/lib/db/schema/auth.ts` — users table with role enum ["avocat", "client"]
- Existing codebase: `packages/email/src/` — sendEmail(), React Email templates pattern
- Existing codebase: `apps/web/src/app/(app)/layout.tsx` — app layout with auth gate, max-w-7xl
- shadcn/ui SKILL.md — critical rules for component composition, styling, forms
- Phase 6 UI-SPEC: `.planning/phases/06-lawyer-dashboard/06-UI-SPEC.md` — full design contract

### Secondary (MEDIUM confidence)
- shadcn DataTable pattern — well-documented in shadcn docs, uses TanStack Table
- Next.js 16 searchParams as Promise — documented in Next.js 16 release notes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components already in the project, no new dependencies
- Architecture: HIGH — follows established server actions + RSC patterns from existing code
- Pitfalls: HIGH — identified from actual codebase inspection (auth model mismatch, status enum)
- Database schema: HIGH — follows existing Drizzle patterns with text IDs, timestamps, relations

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable — UI composition phase, no external API changes)
