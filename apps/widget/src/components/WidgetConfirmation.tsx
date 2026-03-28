/**
 * WidgetConfirmation -- Success message shown after form submission.
 * Auto-closes the modal after 3 seconds.
 */

import { useEffect } from "react";

interface WidgetConfirmationProps {
  onAutoClose: () => void;
}

export function WidgetConfirmation({ onAutoClose }: WidgetConfirmationProps) {
  useEffect(() => {
    const timer = setTimeout(onAutoClose, 3000);
    return () => clearTimeout(timer);
  }, [onAutoClose]);

  return (
    <div className="lc-confirmation">
      {/* Checkmark icon -- inline SVG */}
      <svg
        viewBox="0 0 24 24"
        width="48"
        height="48"
        fill="none"
        stroke="hsl(142, 71%, 45%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="lc-confirmation-icon"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <h3 className="lc-confirmation-title">Votre demande a ete envoyee</h3>
      <p className="lc-confirmation-text">
        Nous vous contacterons bientot.
      </p>
    </div>
  );
}
