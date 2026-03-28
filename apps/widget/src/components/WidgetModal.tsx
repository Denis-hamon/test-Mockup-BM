/**
 * WidgetModal -- Dialog modal with focus trap and slide-up animation.
 * Contains header, intake form (or confirmation), and footer.
 */

import { useEffect, useRef, useCallback } from "react";
import { WidgetHeader } from "./WidgetHeader";
import { WidgetFooter } from "./WidgetFooter";
import { WidgetIntakeForm } from "./WidgetIntakeForm";

// ---------------------------------------------------------------------------
// Template step type (inline, no runtime import from shared)
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WidgetModalProps {
  firmName: string;
  slug: string;
  steps: TemplateStep[];
  isLeft: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Focus trap utility
// ---------------------------------------------------------------------------

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WidgetModal({
  firmName,
  slug,
  steps,
  isLeft,
  onClose,
}: WidgetModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap: cycle tab within modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab on first -> wrap to last
        if (document.activeElement === first || !modalRef.current.contains(document.activeElement as Node)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab on last -> wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  // Attach keydown listener and focus first element
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    // Focus first focusable element in modal
    if (modalRef.current) {
      const first = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (first) {
        setTimeout(() => first.focus(), 50);
      }
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Mobile backdrop */}
      <div className="lc-backdrop lc-fade-in" onClick={onClose} />

      <div
        ref={modalRef}
        className={`lc-modal lc-slide-up${isLeft ? " lc-modal--left" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lc-modal-title"
      >
        <WidgetHeader firmName={firmName} onClose={onClose} />

        <div className="lc-modal-body">
          <WidgetIntakeForm
            slug={slug}
            steps={steps}
            onSubmitted={onClose}
          />
        </div>

        <WidgetFooter />
      </div>
    </>
  );
}
