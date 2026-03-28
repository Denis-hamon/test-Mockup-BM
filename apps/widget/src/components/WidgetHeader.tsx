/**
 * WidgetHeader -- Modal header with firm name and close button.
 */

interface WidgetHeaderProps {
  firmName: string;
  onClose: () => void;
}

export function WidgetHeader({ firmName, onClose }: WidgetHeaderProps) {
  return (
    <div className="lc-modal-header">
      <h3 id="lc-modal-title">{firmName}</h3>
      <button
        className="lc-btn-close"
        onClick={onClose}
        aria-label="Fermer"
        type="button"
      >
        {/* X icon -- inline SVG */}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
