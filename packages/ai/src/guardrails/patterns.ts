/**
 * French legal advice detection patterns.
 *
 * Per D-01: AI responses containing legal advice must be detected
 * and rewritten before reaching the user.
 *
 * These regex patterns match common French-language legal advice formulations.
 * The patterns are intentionally broad to catch direct advice while
 * excluding safe conversational responses (empathy, referrals to lawyers, etc.).
 */

export const LEGAL_ADVICE_PATTERNS: RegExp[] = [
  // Direct statements of rights
  /vous avez le droit de/i,
  /vos droits (sont|incluent|comprennent)/i,
  /vous ([eê]tes|serez) en droit de/i,

  // Legal procedure guidance
  /la proc[eé]dure [aà] suivre est/i,
  /il faut (saisir|engager|d[eé]poser)/i,
  /vous (devez|pouvez) (engager|faire valoir)/i,

  // Legal references
  /selon (l'article|le code|la jurisprudence)/i,
  /en vertu (de la loi|du code|de l'article)/i,
  /la loi (pr[eé]voit|stipule|impose) que/i,
  /la loi vous (permet|autorise|oblige)/i,

  // Direct advice formulations
  /je vous conseille de/i,
  /vous devriez (demander|exiger|contester|engager|d[eé]poser)/i,
  /vous pourriez (demander|exiger|contester|engager|d[eé]poser)/i,

  // Actionable legal guidance
  /vous pouvez (porter plainte|saisir|engager une proc[eé]dure)/i,
  /le d[eé]lai (l[eé]gal )?(de )?prescription est de/i,

  // Additional patterns for comprehensive coverage
  /la jurisprudence (tend|montre|indique|confirme)/i,
  /vous (devez|pouvez) contester/i,
  /vous (devez|pouvez) exiger/i,
  /la loi (autorise|permet|oblige)/i,
];

/**
 * Check if a text contains French legal advice patterns.
 *
 * @param text - The text to check
 * @returns true if any legal advice pattern matches
 */
export function containsLegalAdvice(text: string): boolean {
  return LEGAL_ADVICE_PATTERNS.some((pattern) => pattern.test(text));
}
