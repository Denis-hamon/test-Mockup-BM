/**
 * WidgetButton -- Floating circular button that opens the widget modal.
 * Uses inline SVG for the chat icon. No external icon library.
 */

import type { MouseEventHandler, KeyboardEventHandler } from "react";

interface WidgetButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function WidgetButton({ onClick }: WidgetButtonProps) {
  const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    <button
      className="lc-btn lc-fade-in"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label="Ouvrir le formulaire de contact"
      role="button"
      tabIndex={0}
      style={{ animationDelay: "300ms", opacity: 0 }}
    >
      {/* Chat/calendar icon -- inline SVG */}
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
      </svg>
    </button>
  );
}
