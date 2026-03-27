/**
 * LegalConnect Widget — IIFE entry point.
 *
 * Reads data-* attributes from the embedding script tag, creates a Shadow DOM
 * container, and renders the widget inside it for complete style isolation.
 */

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { parseConfig, type WidgetConfig } from "./lib/config";
import { initApiBase, fetchTemplate } from "./lib/api";
import { getContrastForeground } from "./lib/luminance";
import widgetCss from "./styles/widget.css?inline";

// ---------------------------------------------------------------------------
// Capture script reference immediately (before any async operations)
// ---------------------------------------------------------------------------

const currentScript: HTMLScriptElement | null =
  (document.currentScript as HTMLScriptElement) ||
  document.querySelector<HTMLScriptElement>("script[data-slug]");

// ---------------------------------------------------------------------------
// Widget component (placeholder — will be expanded in 09-02)
// ---------------------------------------------------------------------------

function Widget({
  config,
  template,
}: {
  config: WidgetConfig;
  template: unknown;
}) {
  const [open, setOpen] = useState(false);
  const isLeft = config.position === "bottom-left";

  return (
    <div className={`lc-widget${isLeft ? " lc-widget--left" : ""}`}>
      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="lc-backdrop lc-fade-in" onClick={() => setOpen(false)} />
          <div
            className={`lc-modal lc-slide-up${isLeft ? " lc-modal--left" : ""}`}
          >
            <div className="lc-modal-header">
              <h3>Contactez-nous</h3>
              <button
                className="lc-btn-secondary"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                style={{ padding: "4px 8px", fontSize: "18px", border: "none" }}
              >
                &times;
              </button>
            </div>
            <div className="lc-modal-body">
              <p style={{ color: "var(--lc-muted, #6b7280)" }}>
                Chargement du formulaire...
              </p>
            </div>
          </div>
        </>
      )}
      <button
        className="lc-btn lc-fade-in"
        onClick={() => setOpen(!open)}
        aria-label="Ouvrir le formulaire de contact"
        style={{ animationDelay: "300ms", opacity: 0 }}
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bootstrap: parse config, create Shadow DOM, render
// ---------------------------------------------------------------------------

function bootstrap(): void {
  if (!currentScript) {
    console.warn(
      "[LegalConnect] Could not find widget script tag. Ensure the script has a data-slug attribute."
    );
    return;
  }

  const config = parseConfig(currentScript);
  if (!config) return;

  // Initialize API base from script src
  const scriptSrc = currentScript.getAttribute("src");
  if (scriptSrc) {
    initApiBase(scriptSrc);
  }

  // Create host element
  const host = document.createElement("div");
  host.id = "legalconnect-widget-host";
  document.body.appendChild(host);

  // Attach shadow DOM
  const shadow = host.attachShadow({ mode: "open" });

  // Inject styles
  const style = document.createElement("style");
  style.textContent = widgetCss;
  shadow.appendChild(style);

  // Compute contrast foreground
  const accentFg = getContrastForeground(config.accentColor);

  // Set CSS custom properties on the host
  host.style.setProperty("--lc-accent", config.accentColor);
  host.style.setProperty("--lc-accent-fg", accentFg);
  host.style.setProperty("--lc-surface", "#ffffff");
  host.style.setProperty("--lc-fg", "#1a1a2e");
  host.style.setProperty("--lc-muted", "#6b7280");
  host.style.setProperty("--lc-border", "#e5e7eb");

  // Mount div inside shadow
  const mount = document.createElement("div");
  shadow.appendChild(mount);

  // Render React app
  const root = createRoot(mount);

  // Fetch template and render
  fetchTemplate(config.slug).then((template) => {
    root.render(
      <React.StrictMode>
        <Widget config={config} template={template} />
      </React.StrictMode>
    );
  });
}

// Run bootstrap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
