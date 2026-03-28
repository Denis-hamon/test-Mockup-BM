/**
 * Widget -- Root component managing open/close state and template loading.
 *
 * Props come from main.tsx after parsing data-* attributes and fetching template.
 * Renders the floating button (always) and modal overlay (when open).
 */

import { useState, useEffect, useCallback } from "react";
import { fetchTemplate } from "./lib/api";
import { WidgetButton } from "./components/WidgetButton";
import { WidgetModal } from "./components/WidgetModal";

// ---------------------------------------------------------------------------
// Template types (inline, no runtime import from shared)
// ---------------------------------------------------------------------------

interface TemplateStep {
  id: string;
  label: string;
  questions: Array<{
    id: string;
    label: string;
    description?: string;
    fieldType: "text" | "textarea" | "select" | "date" | "checkbox" | "number" | "email" | "phone";
    required: boolean;
    options?: string[];
    validation?: {
      maxLength?: number;
      min?: number;
      max?: number;
    };
    conditionalRule?: {
      sourceQuestionId: string;
      operator: "equals" | "notEquals";
      expectedValue: string;
    };
  }>;
}

interface TemplateData {
  id: string;
  specialty: string;
  schema: {
    steps: TemplateStep[];
  };
  logoUrl: string | null;
  accentColor: string | null;
  welcomeText: string | null;
  slug: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WidgetProps {
  slug: string;
  accentColor: string;
  position: "bottom-right" | "bottom-left";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Widget({ slug, accentColor, position }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLeft = position === "bottom-left";

  // -------------------------------------------------------------------------
  // Fetch template on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await fetchTemplate(slug);

      if (cancelled) return;

      if (!result) {
        setError("Impossible de charger le formulaire. Rechargez la page.");
      } else {
        setTemplate(result as unknown as TemplateData);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // -------------------------------------------------------------------------
  // Open / Close handlers
  // -------------------------------------------------------------------------

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // -------------------------------------------------------------------------
  // Derive firm name from template or slug
  // -------------------------------------------------------------------------

  const firmName = template?.slug
    ? template.slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : slug;

  const steps = template?.schema?.steps ?? [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className={`lc-widget${isLeft ? " lc-widget--left" : ""}`}>
      {isOpen && (
        <>
          {loading && (
            <>
              <div className="lc-backdrop lc-fade-in" onClick={handleClose} />
              <div
                className={`lc-modal lc-slide-up${isLeft ? " lc-modal--left" : ""}`}
                role="dialog"
                aria-modal="true"
              >
                <div className="lc-modal-header">
                  <h3 id="lc-modal-title">Chargement...</h3>
                </div>
                <div className="lc-modal-body">
                  <div className="lc-loading">
                    <div className="lc-skeleton" style={{ height: "20px", width: "60%", marginBottom: "16px" }} />
                    <div className="lc-skeleton" style={{ height: "36px", width: "100%", marginBottom: "12px" }} />
                    <div className="lc-skeleton" style={{ height: "36px", width: "100%", marginBottom: "12px" }} />
                    <div className="lc-skeleton" style={{ height: "36px", width: "100%" }} />
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <>
              <div className="lc-backdrop lc-fade-in" onClick={handleClose} />
              <div
                className={`lc-modal lc-slide-up${isLeft ? " lc-modal--left" : ""}`}
                role="dialog"
                aria-modal="true"
              >
                <div className="lc-modal-header">
                  <h3 id="lc-modal-title">Erreur</h3>
                  <button
                    className="lc-btn-close"
                    onClick={handleClose}
                    aria-label="Fermer"
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="lc-modal-body">
                  <p className="lc-error-message">{error}</p>
                </div>
              </div>
            </>
          )}

          {!loading && !error && template && (
            <WidgetModal
              firmName={firmName}
              slug={slug}
              steps={steps}
              isLeft={isLeft}
              onClose={handleClose}
            />
          )}
        </>
      )}

      <WidgetButton onClick={handleToggle} />
    </div>
  );
}
