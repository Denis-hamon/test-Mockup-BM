/**
 * LegalConnect Widget -- IIFE entry point.
 *
 * Reads data-* attributes from the embedding script tag, creates a Shadow DOM
 * container, and renders the widget inside it for complete style isolation.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { parseConfig } from "./lib/config";
import { initApiBase } from "./lib/api";
import { getContrastForeground } from "./lib/luminance";
import { Widget } from "./Widget";
import widgetCss from "./styles/widget.css?inline";

// ---------------------------------------------------------------------------
// Capture script reference immediately (before any async operations)
// ---------------------------------------------------------------------------

const currentScript: HTMLScriptElement | null =
  (document.currentScript as HTMLScriptElement) ||
  document.querySelector<HTMLScriptElement>("script[data-slug]");

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

  // Set CSS custom properties on the shadow host via a wrapper div
  const wrapper = document.createElement("div");
  wrapper.style.setProperty("--lc-accent", config.accentColor);
  wrapper.style.setProperty("--lc-accent-fg", accentFg);
  wrapper.style.setProperty("--lc-surface", "#ffffff");
  wrapper.style.setProperty("--lc-fg", "#1a1a2e");
  wrapper.style.setProperty("--lc-muted", "#f5f5f5");
  wrapper.style.setProperty("--lc-border", "#e5e5e5");
  shadow.appendChild(wrapper);

  // Render React app
  const root = createRoot(wrapper);
  root.render(
    <React.StrictMode>
      <Widget
        slug={config.slug}
        accentColor={config.accentColor}
        position={config.position}
      />
    </React.StrictMode>
  );
}

// Run bootstrap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
