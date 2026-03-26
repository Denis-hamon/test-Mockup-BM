/**
 * LLM-based rewrite of legal advice responses.
 *
 * Per D-01: When legal advice is detected in an AI response,
 * it is rewritten to remove the advice and redirect to the lawyer.
 */

import { generateText, type LanguageModel } from "ai";
import { createOpenAIModel } from "../providers/openai";

/**
 * System prompt for the rewrite model.
 * Instructs the model to remove legal advice while keeping empathetic tone.
 */
const REWRITE_SYSTEM_PROMPT = `Tu es un assistant de reecriture. Ta tache est de reformuler le texte suivant en :
1. SUPPRIMANT tout conseil juridique, avis juridique, ou recommandation legale
2. CONSERVANT le ton empathique et bienveillant
3. CONSERVANT les informations factuelles et descriptives
4. AJOUTANT une redirection vers l'avocat : "Votre avocat sera la personne la plus qualifiee pour vous repondre sur ce point."
5. NE JAMAIS dire "vous avez le droit de", "vous devriez", "la loi prevoit", etc.

Reponds UNIQUEMENT avec le texte reecrit, sans explication.`;

/**
 * Hardcoded safe fallback when rewrite fails.
 */
const SAFE_FALLBACK =
  "Je comprends votre question. Ce sujet necessite l'expertise de votre avocat, qui pourra vous donner un avis adapte a votre situation. Souhaitez-vous que je vous aide a preparer votre dossier pour votre avocat?";

/**
 * Track rewritten texts to prevent re-checking (avoid infinite loops).
 */
const rewrittenTexts = new WeakSet<{ text: string }>();

/**
 * Test-only: override the model used for rewriting.
 */
let testModel: LanguageModel | null = null;

export function _setRewriteModelForTest(model: LanguageModel | null): void {
  testModel = model;
}

/**
 * Get the model to use for rewriting.
 * Uses test model if set, otherwise creates OpenAI gpt-4.1-mini.
 */
function getRewriteModel(): LanguageModel {
  if (testModel) {
    return testModel;
  }
  return createOpenAIModel("gpt-4.1-mini");
}

/**
 * Rewrite a text to remove legal advice and redirect to lawyer.
 *
 * Uses a fast LLM model to intelligently rewrite the response,
 * preserving empathetic content while stripping legal advice.
 *
 * @param text - The text containing legal advice
 * @returns Rewritten text without legal advice
 */
export async function rewriteWithoutAdvice(text: string): Promise<string> {
  try {
    const result = await generateText({
      model: getRewriteModel(),
      system: REWRITE_SYSTEM_PROMPT,
      prompt: text,
      maxOutputTokens: 1024,
      temperature: 0.3,
    });

    return result.text || SAFE_FALLBACK;
  } catch {
    // If the rewrite call fails, return a hardcoded safe response
    return SAFE_FALLBACK;
  }
}
