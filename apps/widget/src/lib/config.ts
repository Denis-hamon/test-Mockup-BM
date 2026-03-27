/**
 * Widget configuration parsed from script tag data-* attributes.
 */
export interface WidgetConfig {
  slug: string;
  accentColor: string;
  position: "bottom-right" | "bottom-left";
}

/**
 * Parse configuration from the embedding script tag's data-* attributes.
 */
export function parseConfig(script: HTMLScriptElement): WidgetConfig | null {
  const slug = script.getAttribute("data-slug");
  if (!slug) {
    console.warn("[LegalConnect] data-slug attribute is required.");
    return null;
  }

  const accentColor = script.getAttribute("data-color") || "#1a365d";
  const positionRaw = script.getAttribute("data-position") || "bottom-right";
  const position =
    positionRaw === "bottom-left" ? "bottom-left" : "bottom-right";

  return { slug, accentColor, position };
}
