/**
 * AI Provider Abstraction
 *
 * LLM-agnostic provider using Vercel AI SDK.
 * Primary: Anthropic Claude (empathetic, nuanced tone)
 * Fallback: Mock provider for development without API keys
 */

import { type LanguageModelV1 } from "ai";

export type AIProviderInfo = {
  model: LanguageModelV1;
  modelName: string;
  isMock: boolean;
};

/**
 * Returns the configured AI model.
 * Uses Anthropic Claude as primary provider.
 * Falls back to mock provider when no API key is set.
 */
export async function getAIProvider(): Promise<AIProviderInfo> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    try {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const anthropic = createAnthropic({ apiKey: anthropicKey });
      const modelId = process.env.AI_MODEL_ID ?? "claude-sonnet-4-20250514";
      return {
        model: anthropic(modelId) as LanguageModelV1,
        modelName: modelId,
        isMock: false,
      };
    } catch {
      console.warn("[AI] Failed to initialize Anthropic provider, falling back to mock");
    }
  }

  // Development fallback
  const { getMockProvider } = await import("./mock-provider");
  return getMockProvider();
}

/**
 * Get the model name for tracking/logging purposes.
 */
export function getDefaultModelName(): string {
  return process.env.AI_MODEL_ID ?? "claude-sonnet-4-20250514";
}
