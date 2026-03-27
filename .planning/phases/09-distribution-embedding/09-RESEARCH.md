# Phase 9: Distribution & Embedding - Research

**Researched:** 2026-03-27
**Domain:** Embeddable widget (Vite IIFE + Shadow DOM), hosted lawyer pages, distribution integration
**Confidence:** HIGH

## Summary

Phase 9 delivers two distribution channels: an embeddable widget via `<script>` tag (DIST-01) and hosted lawyer pages (DIST-02). The widget is a standalone Vite IIFE bundle rendering React 19 inside Shadow DOM, isolated from host page styles. The hosted page extends the existing `/intake/[slug]` route with a landing section above the intake form.

The existing codebase provides strong foundations: `DynamicStepper`, `CobrandingFooter`, `getTemplateBySlug`, and the `lawyerProfiles` schema are all reusable. The main engineering challenge is building the widget as a separate Vite app in the monorepo (`apps/widget`) that bundles React + form logic into a single IIFE file under 150KB gzipped. React 19 + react-dom alone is ~55KB gzipped, leaving ~95KB for widget logic, inline CSS, and form handling -- achievable but requires discipline (no shadcn, no Tailwind, no external fonts, inline SVGs only).

**Primary recommendation:** Build the widget as `apps/widget` in the Turborepo monorepo using Vite 6 library mode with IIFE output. Use `vite-plugin-css-injected-by-js` to inline all CSS into the JS bundle, then extract and inject it into Shadow DOM at runtime. Serve the built `widget.js` via a Next.js API route with cache headers and content-hash versioning query parameter.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Shadow DOM inline -- le script cree un Shadow DOM directement dans la page hote. Isolation CSS totale, pas d'iframe. Vite IIFE bundle per CLAUDE.md stack.
- **D-02:** Mode modal avec bouton flottant -- bouton en bas a droite "Prendre rendez-vous". Clic ouvre le formulaire en modal overlay dans le Shadow DOM. Pattern type Intercom/Drift.
- **D-03:** Configuration via attributs data-* sur le script tag : `<script src="https://app.legalconnect.fr/widget.js" data-slug="dupont-avocats" data-lang="fr" data-color="#1a365d">`. Simple, standard, pas de JS supplementaire.
- **D-04:** Landing page + intake : /cabinet-[slug] affiche une presentation du cabinet (nom, specialites, photo optionnelle) + call-to-action vers le formulaire d'intake en dessous. Mini site vitrine + formulaire.
- **D-05:** Meta tags dynamiques generes depuis le profil avocat. Title, description, OG image personnalises.
- **D-06:** Self-hosted /widget.js -- le fichier JS servi depuis le meme domaine que l'app. Pas de CDN tiers. Controle total, OVHcloud EU compatible.
- **D-07:** Page /settings/cabinet/integration dans l'app avec snippet `<script>` pret a copier, instructions en 3 etapes, et previsualisation du widget.

### Claude's Discretion
- Architecture du build Vite IIFE (entry point, config, output)
- Communication Shadow DOM -> app API (fetch direct ou postMessage)
- Strategie de cache/versioning du widget.js (hash dans URL ou header)
- Responsive du bouton flottant sur mobile
- OG image generation (static template ou dynamic avec satori/og)

### Deferred Ideas (OUT OF SCOPE)
- Widget iframe comme fallback pour navigateurs sans Shadow DOM -- v2
- Mode inline embed (data-mode="inline") -- v2
- CDN externe pour distribution plus rapide -- v2 si trafic important
- Analytics d'utilisation du widget (vues, conversions) -- v2
- A/B testing de la landing page -- v2
- Multi-langue dans le widget (data-lang) -- actuellement FR only
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-01 | Embeddable widget (single script tag) for lawyer's website that launches intake flow | Vite IIFE build config, Shadow DOM + createRoot pattern, widget component architecture, CSS injection strategy, data-* attribute configuration, API communication via fetch |
| DIST-02 | Hosted page per lawyer/firm (e.g., app.com/cabinet-dupont) as standalone entry point | Next.js dynamic route `/cabinet-[slug]`, generateMetadata for SEO, OG image generation via ImageResponse, reuse of existing DynamicStepper and lawyerProfiles data |
</phase_requirements>

## Standard Stack

### Core (Widget Build)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 6.x | Widget bundler (IIFE output) | Per CLAUDE.md stack. Library mode with IIFE format produces single self-executing bundle |
| @vitejs/plugin-react | 4.x | React JSX transform in Vite | Standard React plugin for Vite builds |
| React | 19.x | Widget UI rendering | Same version as main app, bundled inside IIFE (not externalized) |
| react-dom | 19.x | DOM rendering with createRoot | Required for React 19 client-side rendering inside Shadow DOM |
| vite-plugin-css-injected-by-js | 3.x | CSS-in-JS injection | Eliminates separate CSS file -- all styles bundled into single JS file for widget |

### Core (Main App Extensions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next/og (ImageResponse) | built-in | Dynamic OG image generation | Uses @vercel/og + satori under the hood. Built into Next.js, no extra dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| terser | latest | Minification for IIFE output | Vite uses esbuild by default but terser produces smaller IIFE bundles. Optional if bundle size is acceptable with esbuild |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-css-injected-by-js | Manual CSS string embedding | More control but more boilerplate. Plugin is well-maintained and handles edge cases |
| Next.js ImageResponse | Static OG template image | Static is simpler but loses personalization (lawyer name, specialty in image). ImageResponse is built-in |
| Next.js API route for widget.js | public/ directory | public/ has no cache-control customization. API route allows versioned cache headers |

## Architecture Patterns

### Recommended Project Structure
```
apps/
  widget/
    src/
      main.tsx              # IIFE entry: finds script tag, reads data-*, creates Shadow DOM, renders
      Widget.tsx             # Root component: manages open/close state
      components/
        WidgetButton.tsx     # Floating circular button
        WidgetModal.tsx      # Modal overlay with form
        WidgetHeader.tsx     # Lawyer name + close button
        WidgetFooter.tsx     # Co-branding + encryption badge
        WidgetIntakeForm.tsx # Simplified multi-step form (no shadcn deps)
        WidgetStepIndicator.tsx # Step dots
      styles/
        widget.css           # All widget styles (injected into Shadow DOM)
      lib/
        api.ts               # fetch() calls to app API
        config.ts            # Parse data-* attributes from script tag
        luminance.ts         # Auto-contrast calculation for accent color
    vite.config.ts           # IIFE library mode config
    package.json             # @legalconnect/widget
    tsconfig.json
  web/
    src/app/
      cabinet-[slug]/
        page.tsx             # Hosted landing page (hero + specialties + intake)
        layout.tsx           # Standalone layout (no app chrome)
        opengraph-image.tsx  # Dynamic OG image via ImageResponse
      (app)/settings/cabinet/
        integration/
          page.tsx           # Integration settings (snippet + preview)
    src/components/
      landing/
        lawyer-hero.tsx      # Hero section with photo, name, CTA
        specialty-card.tsx   # Specialty display card
      integration/
        snippet-copy-block.tsx   # Copyable code block
        widget-preview.tsx       # Static widget preview
```

### Pattern 1: IIFE Entry Point with Shadow DOM Bootstrap
**What:** The widget entry point finds its own script tag, reads data-* attributes, creates a Shadow DOM host, injects CSS, and renders React inside it.
**When to use:** Always -- this is the single entry point for the widget bundle.
**Example:**
```typescript
// apps/widget/src/main.tsx
import { createRoot } from "react-dom/client";
import { Widget } from "./Widget";
import widgetStyles from "./styles/widget.css?inline";

// Find the script tag that loaded this file
const currentScript = document.currentScript as HTMLScriptElement | null;
if (!currentScript) {
  console.warn("[LegalConnect] Widget script tag not found.");
} else {
  // Read configuration from data-* attributes
  const slug = currentScript.getAttribute("data-slug");
  const color = currentScript.getAttribute("data-color") || "#1a365d";
  const position = currentScript.getAttribute("data-position") || "bottom-right";

  if (!slug) {
    console.warn("[LegalConnect] data-slug attribute is required.");
  } else {
    // Create host element
    const host = document.createElement("div");
    host.id = "legalconnect-widget";
    document.body.appendChild(host);

    // Attach Shadow DOM
    const shadow = host.attachShadow({ mode: "open" });

    // Inject styles into Shadow DOM
    const style = document.createElement("style");
    style.textContent = widgetStyles;
    shadow.appendChild(style);

    // Create React mount point inside Shadow DOM
    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);

    // Render React app
    const root = createRoot(mountPoint);
    root.render(
      <Widget slug={slug} accentColor={color} position={position} />
    );
  }
}
```

### Pattern 2: CSS Import with ?inline Query
**What:** Vite's `?inline` query suffix imports CSS as a string instead of injecting it into the document head. This string is then manually injected into the Shadow DOM.
**When to use:** For all widget CSS -- ensures styles go into Shadow DOM, not the host page.
**Example:**
```typescript
// Import CSS as string (Vite feature)
import widgetStyles from "./styles/widget.css?inline";

// Inside Shadow DOM setup:
const style = document.createElement("style");
style.textContent = widgetStyles;
shadowRoot.appendChild(style);
```

### Pattern 3: Widget API Communication via fetch()
**What:** The widget communicates with the app backend via standard fetch() to public API endpoints. No postMessage needed since the widget runs in the same browser context.
**When to use:** For loading template data and submitting intake forms from the widget.
**Example:**
```typescript
// apps/widget/src/lib/api.ts
const API_BASE = new URL(
  document.currentScript?.getAttribute("src") ?? ""
).origin;

export async function fetchTemplate(slug: string) {
  const res = await fetch(`${API_BASE}/api/widget/template/${slug}`);
  if (!res.ok) throw new Error("Template fetch failed");
  return res.json();
}

export async function submitWidgetIntake(data: WidgetIntakeData) {
  const res = await fetch(`${API_BASE}/api/widget/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Submit failed");
  return res.json();
}
```

### Pattern 4: Vite IIFE Build Configuration
**What:** Vite library mode configured for single-file IIFE output with React bundled inside.
**When to use:** The widget build configuration.
**Example:**
```typescript
// apps/widget/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.tsx"),
      name: "LegalConnectWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      // Do NOT externalize React -- bundle it inside IIFE
      external: [],
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.warn for debug
        drop_debugger: true,
      },
    },
    cssCodeSplit: false, // Single CSS output
    target: "es2020",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
```

### Pattern 5: Next.js API Route for Widget Serving with Cache Versioning
**What:** Serve widget.js via an API route that reads the pre-built file and sets proper cache headers with content-hash versioning.
**When to use:** To serve the widget bundle from the same domain with cache control.
**Example:**
```typescript
// apps/web/src/app/api/widget/route.ts (or widget.js route)
import { readFile } from "fs/promises";
import { resolve } from "path";
import { NextResponse } from "next/server";

// Read the pre-built widget bundle
const WIDGET_PATH = resolve(process.cwd(), "../widget/dist/widget.js");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const v = url.searchParams.get("v"); // Version hash

  const content = await readFile(WIDGET_PATH, "utf-8");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/javascript",
      // If version hash present, cache immutably; otherwise short cache
      "Cache-Control": v
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
      "Access-Control-Allow-Origin": "*", // Required for cross-origin embedding
    },
  });
}
```

### Pattern 6: Dynamic OG Image with ImageResponse
**What:** Next.js file-convention based OG image generation using satori (built into next/og).
**When to use:** For the hosted lawyer page `/cabinet-[slug]`.
**Example:**
```typescript
// apps/web/src/app/cabinet-[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cabinet preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Fetch lawyer profile data
  // ... (server-side fetch or direct DB query)

  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#1a365d",
        color: "white",
        fontFamily: "system-ui",
      }}>
        <div style={{ fontSize: 48, fontWeight: 600 }}>
          {firmName}
        </div>
        <div style={{ fontSize: 24, marginTop: 16, opacity: 0.8 }}>
          {specialties}
        </div>
        <div style={{ fontSize: 20, marginTop: 32, opacity: 0.6 }}>
          Consultation en ligne | LegalConnect
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### Anti-Patterns to Avoid
- **Importing shadcn/ui in widget:** Widget must NOT use shadcn, Radix, or Tailwind. All widget UI is plain HTML + custom CSS inside Shadow DOM.
- **Externalizing React in IIFE:** React MUST be bundled inside the IIFE. If externalized, host pages without React will break.
- **Using document.head for widget CSS:** All CSS must go into Shadow DOM via style element, never into document head.
- **Using react-hook-form in widget:** Too heavy for a lightweight widget. Use native HTML validation + simple state management with useState/useReducer.
- **Loading external fonts in widget:** No @font-face or Google Fonts. Use `system-ui` font stack only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS injection into JS bundle | Manual CSS string concatenation | `?inline` Vite query or vite-plugin-css-injected-by-js | Handles PostCSS transforms, minification, source maps |
| OG image generation | Canvas-based image rendering | next/og (ImageResponse + satori) | Built into Next.js, edge-runtime optimized, flexbox layout |
| Clipboard copy | Manual execCommand("copy") | navigator.clipboard.writeText() | Modern API, simpler, async. execCommand is deprecated |
| Accent color contrast | Manual luminance math | Relative luminance formula (W3C WCAG) | Standard formula: L = 0.2126*R + 0.7152*G + 0.0722*B. Small utility, but use the standard formula |

**Key insight:** The widget form is a simplified re-implementation of DynamicStepper logic without shadcn/react-hook-form dependencies. This is intentional -- the widget must be self-contained. Do NOT try to share actual component code between the main app and widget; share only the template JSON schema type definitions from `@legalconnect/shared`.

## Common Pitfalls

### Pitfall 1: CSS Leaking Out of Shadow DOM
**What goes wrong:** Widget styles affect the host page, or host page styles affect the widget.
**Why it happens:** Inherited CSS properties (font-family, color, line-height) DO penetrate Shadow DOM. Only non-inherited properties are isolated.
**How to avoid:** Set explicit `all: initial` on the Shadow DOM host, then re-declare all needed inherited properties (font-family, font-size, color, line-height) on the widget root.
**Warning signs:** Widget text appears in the host page font, or widget font size changes on different host pages.

### Pitfall 2: z-index Wars with Host Page
**What goes wrong:** Host page elements (sticky headers, modals, cookie banners) overlay the widget button or modal.
**Why it happens:** z-index stacking contexts are complex. Even z-index: 2147483647 (max 32-bit int) can be defeated by a containing stacking context.
**How to avoid:** The widget host div must be a direct child of `<body>` with position:fixed. This ensures it creates its own stacking context at the top level. UI-SPEC already specifies z-index 2147483647.
**Warning signs:** Widget button disappears behind certain page elements.

### Pitfall 3: document.currentScript is null in Async/Deferred Scripts
**What goes wrong:** `document.currentScript` returns null if the script has `async` or `defer` attributes, or is loaded dynamically.
**Why it happens:** `document.currentScript` is only set during synchronous script execution.
**How to avoid:** Capture `document.currentScript` immediately at the top of the IIFE (before any async operations). Alternatively, use a fallback: query `document.querySelector('script[data-slug]')` if currentScript is null.
**Warning signs:** Widget fails to initialize with "data-slug attribute is required" error despite correct HTML.

### Pitfall 4: Widget Bundle Size Exceeding 150KB
**What goes wrong:** React 19 + react-dom is ~55KB gzipped. Remaining budget is ~95KB for all widget code, CSS, and form logic.
**Why it happens:** Accidentally importing heavy dependencies (react-hook-form, zod, shadcn, lucide-react full bundle).
**How to avoid:** Use `npx vite-bundle-visualizer` after build. Widget must NOT import from `@legalconnect/shared` runtime code (only type imports). Use native HTML5 validation instead of Zod. Use inline SVG strings instead of lucide-react.
**Warning signs:** Bundle size grows past 150KB gzipped during development.

### Pitfall 5: CORS Blocking Widget API Calls
**What goes wrong:** Widget on external domain cannot call app API endpoints.
**Why it happens:** By default, Next.js API routes don't include CORS headers.
**How to avoid:** Create dedicated `/api/widget/*` routes with explicit CORS headers (Access-Control-Allow-Origin: *). Or configure Next.js middleware to add CORS headers for widget API paths.
**Warning signs:** Browser console shows "CORS policy" errors on external sites.

### Pitfall 6: Hosted Page Route Conflict with Existing Routes
**What goes wrong:** `/cabinet-[slug]` might conflict with other dynamic routes or static paths.
**Why it happens:** Next.js App Router uses file-system routing. Dynamic segments can clash.
**How to avoid:** Use `/cabinet-[slug]` prefix (not bare `/[slug]`) to avoid conflicts with other top-level routes. The CONTEXT.md already specifies this prefix.
**Warning signs:** 404 errors or wrong page rendering for specific slugs.

## Code Examples

### Widget CSS Strategy (Inside Shadow DOM)
```css
/* apps/widget/src/styles/widget.css */

/* Reset inherited properties from host page */
:host {
  all: initial;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--lc-fg, #1a1a1a);
  -webkit-font-smoothing: antialiased;
}

/* Widget container */
.lc-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: inherit;
}

/* Floating button */
.lc-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background-color: var(--lc-accent, #1a365d);
  color: var(--lc-accent-fg, #ffffff);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 150ms ease;
}

.lc-btn:hover {
  transform: scale(1.05);
}

/* Modal */
.lc-modal {
  position: fixed;
  bottom: 104px; /* 24px + 56px button + 24px gap */
  right: 24px;
  width: 420px;
  max-height: 640px;
  background: var(--lc-surface, #ffffff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Mobile responsive */
@media (max-width: 639px) {
  .lc-btn {
    width: 48px;
    height: 48px;
  }
  .lc-modal {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: 90vh;
    border-radius: 12px 12px 0 0;
  }
}
```

### Accent Color Luminance Calculation
```typescript
// apps/widget/src/lib/luminance.ts
export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastForeground(accentHex: string): string {
  return relativeLuminance(accentHex) < 0.5 ? "#ffffff" : "#1a1a1a";
}
```

### Hosted Page with generateMetadata
```typescript
// apps/web/src/app/cabinet-[slug]/page.tsx
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Fetch lawyer profile + template by slug
  const profile = await getLawyerProfileBySlug(slug);
  if (!profile) {
    return { title: "Cabinet introuvable | LegalConnect" };
  }

  return {
    title: `${profile.firmName} | Consultation en ligne | LegalConnect`,
    description: `${profile.firmName} - ${profile.specialties.join(", ")}. Decrivez votre situation juridique en toute confidentialite.`,
    openGraph: {
      title: profile.firmName,
      description: `Consultation en ligne - ${profile.specialties.join(", ")}`,
      type: "website",
    },
  };
}
```

### Turborepo Integration for Widget Build
```json
// turbo.json (addition)
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```
The `dist/**` output is already in turbo.json, so Turborepo will cache the widget build output. The widget's `package.json` needs a `build` script: `"build": "vite build"`.

### Widget API Routes (Next.js)
```typescript
// apps/web/src/app/api/widget/template/[slug]/route.ts
import { NextResponse } from "next/server";
import { getTemplateBySlug } from "@/server/actions/template.actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(template, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| iframe embedding | Shadow DOM + IIFE bundle | 2023-2024 | Better performance, no sizing issues, same-origin API access |
| Webpack IIFE build | Vite library mode IIFE | 2024 | Faster builds, simpler config, built-in CSS handling |
| Custom OG image APIs | Next.js ImageResponse (satori) | Next.js 13+ | Built-in, edge-optimized, JSX-based image templates |
| execCommand("copy") | navigator.clipboard.writeText() | 2020+ | Async, modern, better browser support |

## Open Questions

1. **Widget form validation strategy**
   - What we know: The main app uses react-hook-form + Zod via `useDynamicIntakeForm`. The widget cannot use these (too heavy).
   - What's unclear: Exact subset of validation needed in the widget (are all field types supported, or simplified?).
   - Recommendation: Use native HTML5 validation (required, pattern, maxlength) + simple useState-based step management. Only validate required fields and basic formats. The full Zod validation happens server-side on submit.

2. **Widget template data loading**
   - What we know: `getTemplateBySlug` is a server action (cannot be called from widget on external domain).
   - What's unclear: Exact API route shape for widget consumption.
   - Recommendation: Create `/api/widget/template/[slug]` GET route that internally calls the same DB query. Add CORS headers.

3. **lawyerProfiles schema gaps for hosted pages**
   - What we know: Current `lawyerProfiles` has firmName, phone, specialties. Missing: photo URL, description text, slug.
   - What's unclear: Whether to add fields to lawyerProfiles or derive from intakeTemplates (which already has slug, logoUrl, accentColor, welcomeText).
   - Recommendation: The template already has slug/branding. For the hosted page, fetch template by slug + join with lawyerProfile for firmName/specialties. Add optional `description` and `photoUrl` fields to lawyerProfiles if needed (small schema migration).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest) |
| Config file | No vitest.config at apps/web level -- uses root workspace config |
| Quick run command | `pnpm test -- --run` |
| Full suite command | `pnpm turbo test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01a | Widget Vite build produces single IIFE JS file | integration | `pnpm --filter widget build && test -f apps/widget/dist/widget.js` | No -- Wave 0 |
| DIST-01b | Widget entry reads data-* attributes and creates Shadow DOM | unit | `pnpm vitest run apps/widget/src/__tests__/main.test.ts` | No -- Wave 0 |
| DIST-01c | Widget API routes return template data with CORS headers | unit | `pnpm vitest run apps/web/src/app/api/widget/__tests__/` | No -- Wave 0 |
| DIST-01d | Widget bundle size under 150KB gzipped | integration | `gzip -c apps/widget/dist/widget.js | wc -c` (check < 153600) | No -- Wave 0 |
| DIST-02a | /cabinet-[slug] renders landing page with lawyer profile | unit | `pnpm vitest run apps/web/src/app/cabinet-[slug]/__tests__/` | No -- Wave 0 |
| DIST-02b | generateMetadata produces correct OG meta tags | unit | `pnpm vitest run apps/web/src/app/cabinet-[slug]/__tests__/metadata.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --changed`
- **Per wave merge:** `pnpm turbo test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/widget/vitest.config.ts` -- widget test configuration
- [ ] `apps/widget/src/__tests__/main.test.ts` -- Shadow DOM bootstrap test
- [ ] `apps/web/src/app/api/widget/__tests__/template.test.ts` -- API route test
- [ ] Widget build script in `apps/widget/package.json`

## Project Constraints (from CLAUDE.md)

- **Monorepo:** Turborepo + pnpm workspaces. Widget is `apps/widget`.
- **TypeScript:** Required for all code including widget.
- **Security:** E2E encryption, RGPD compliance. Widget must show encryption badge.
- **Hosting:** OVHcloud EU -- self-hosted widget.js, no external CDN.
- **UI:** shadcn/ui for main app only. Widget uses custom lightweight components.
- **Stack:** Vite 6 for widget, React 19, Shadow DOM native.

## Sources

### Primary (HIGH confidence)
- [Vite Build Options (official docs)](https://vite.dev/config/build-options) -- IIFE format, library mode, cssCodeSplit
- [Next.js Metadata & OG Images (official docs)](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) -- generateMetadata, ImageResponse
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) -- satori-based OG generation
- [MakerKit React Embeddable Widget Guide](https://makerkit.dev/blog/tutorials/embeddable-widgets-react) -- Referenced in CLAUDE.md, production-ready widget architecture
- [MakerKit React Embeddable Widget (GitHub)](https://github.com/makerkit/react-embeddable-widget) -- Reference implementation with React 19 + Vite + Shadow DOM

### Secondary (MEDIUM confidence)
- [vite-plugin-css-injected-by-js (npm)](https://www.npmjs.com/package/vite-plugin-css-injected-by-js) -- CSS injection into JS bundle
- [React 19 bundle size (~55KB gzipped)](https://x.com/JLarky/status/1792276494112411977) -- Bundle size data point
- [Next.js public folder caching](https://nextjs.org/docs/pages/api-reference/file-conventions/public-folder) -- Static file serving behavior

### Tertiary (LOW confidence)
- None -- all findings verified against official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Vite IIFE, Shadow DOM, React 19 are all per CLAUDE.md locked decisions with official docs support
- Architecture: HIGH -- Existing codebase patterns (DynamicStepper, templates, lawyerProfiles) are well-understood from code review
- Pitfalls: HIGH -- Shadow DOM CSS inheritance, CORS, and currentScript gotchas are well-documented in official specs and community

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain, no fast-moving APIs)
