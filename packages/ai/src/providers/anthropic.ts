import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * Create an Anthropic (Claude) model instance.
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 * Primary provider for empathetic intake conversations.
 */
export function createAnthropicModel(modelId: string): LanguageModel {
  return anthropic(modelId);
}
