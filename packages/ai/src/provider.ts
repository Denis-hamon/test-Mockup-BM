import type { LanguageModel } from "ai";
import type { AIModelConfig, AIProviderType } from "./types";
import { DEFAULT_MODELS } from "./types";
import { getAIConfig } from "./config";
import { createAnthropicModel } from "./providers/anthropic";
import { createOpenAIModel } from "./providers/openai";
import { createMistralModel } from "./providers/mistral";

/**
 * Create a language model for the specified provider.
 *
 * @param type - The provider type ("anthropic" | "openai" | "mistral")
 * @param modelId - Optional model identifier. Uses provider default if not specified.
 * @returns A Vercel AI SDK LanguageModel instance
 * @throws Error if provider type is not supported
 */
export function createProvider(
  type: AIProviderType,
  modelId?: string
): LanguageModel {
  const id = modelId || DEFAULT_MODELS[type];

  switch (type) {
    case "anthropic":
      return createAnthropicModel(id);
    case "openai":
      return createOpenAIModel(id);
    case "mistral":
      return createMistralModel(id);
    default:
      throw new Error(
        `Unsupported AI provider: "${type}". Supported providers: anthropic, openai, mistral`
      );
  }
}

/**
 * Get a model instance based on configuration.
 *
 * When called without arguments, reads from environment variables:
 * - AI_PROVIDER: provider selection
 * - AI_MODEL: model identifier
 *
 * @param config - Optional partial config to override defaults
 * @returns A Vercel AI SDK LanguageModel instance
 */
export function getModel(config?: Partial<AIModelConfig>): LanguageModel {
  const defaults = getAIConfig();
  const merged: AIModelConfig = {
    ...defaults,
    ...config,
  };

  return createProvider(merged.provider, merged.model);
}
