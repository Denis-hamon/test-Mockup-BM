import { mistral } from "@ai-sdk/mistral";
import type { LanguageModel } from "ai";

/**
 * Create a Mistral model instance.
 *
 * Requires MISTRAL_API_KEY environment variable.
 * EU-based provider option for data sovereignty compliance.
 */
export function createMistralModel(modelId: string): LanguageModel {
  return mistral(modelId);
}
