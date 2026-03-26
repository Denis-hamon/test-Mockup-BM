import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Create an OpenAI (GPT) model instance.
 *
 * Requires OPENAI_API_KEY environment variable.
 * Fallback provider and cost optimization for simple extraction tasks.
 */
export function createOpenAIModel(modelId: string): LanguageModel {
  return openai(modelId);
}
