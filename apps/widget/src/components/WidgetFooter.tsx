/**
 * WidgetFooter -- Co-branding footer with encryption badge.
 * "Propulse par LegalConnect" + lock icon + "Chiffre bout en bout"
 */

export function WidgetFooter() {
  return (
    <div className="lc-modal-footer">
      <span className="lc-footer-brand">
        Propulse par LegalConnect
      </span>
      <span className="lc-footer-trust">
        {/* Lock icon -- inline SVG */}
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Chiffre bout en bout
      </span>
    </div>
  );
}
