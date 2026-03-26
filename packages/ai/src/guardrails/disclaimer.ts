/**
 * Contextual disclaimer injection for AI responses.
 *
 * Per D-02: Contextual disclaimers appear only when the response
 * touches sensitive legal topics, not on every response.
 */

/**
 * Patterns that indicate sensitive legal topics warranting a disclaimer.
 */
export const SENSITIVE_TOPIC_PATTERNS: RegExp[] = [
  /d[eé]lai/i,
  /prescription/i,
  /proc[eé]dure/i,
  /tribunal/i,
  /obligation/i,
  /droits?\b/i,
  /juridique/i,
  /l[eé]gal/i,
  /recours/i,
  /indemnisation/i,
];

/**
 * Standard disclaimer text appended to responses touching legal topics.
 */
export const DISCLAIMER_TEXT =
  "\n\n> *Rappel : seul votre avocat peut vous donner un avis juridique adapte a votre situation personnelle.*";

/**
 * Check if a disclaimer should be added to the response.
 *
 * Returns true if the text contains sensitive legal topics
 * AND does not already contain the disclaimer.
 *
 * @param text - The response text to check
 * @returns true if a disclaimer should be appended
 */
export function shouldAddDisclaimer(text: string): boolean {
  // Don't add duplicate disclaimers
  if (text.includes("seul votre avocat peut vous donner")) {
    return false;
  }

  return SENSITIVE_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Append the contextual disclaimer to a response text.
 *
 * @param text - The response text
 * @returns The text with disclaimer appended
 */
export function addDisclaimer(text: string): string {
  return text + DISCLAIMER_TEXT;
}
