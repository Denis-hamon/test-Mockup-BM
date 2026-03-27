/**
 * Color luminance utilities for computing contrast-safe foreground colors.
 * Uses WCAG 2.1 relative luminance formula with sRGB linearization.
 */

/**
 * Parse a hex color string (#RRGGBB) into [r, g, b] in 0-255 range.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

/**
 * Linearize an sRGB channel value (0-255) to linear light.
 */
function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Compute WCAG 2.1 relative luminance from a hex color.
 * Returns a value between 0 (black) and 1 (white).
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Get a contrast-safe foreground color for the given background hex.
 * Returns white for dark backgrounds, dark for light backgrounds.
 */
export function getContrastForeground(backgroundHex: string): string {
  const lum = relativeLuminance(backgroundHex);
  return lum < 0.5 ? "#ffffff" : "#1a1a2e";
}
