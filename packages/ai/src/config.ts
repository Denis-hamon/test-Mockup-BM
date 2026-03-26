import { z } from "zod";
import type { AIModelConfig, AIProviderType } from "./types";
import { DEFAULT_MODELS } from "./types";

/**
 * Zod schema for validating AI configuration from environment.
 */
export const aiConfigSchema = z.object({
  provider: z
    .enum(["anthropic", "openai", "mistral"])
    .default("anthropic"),
  model: z.string().optional(),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().int().positive().default(4096),
});

export type AIConfigInput = z.infer<typeof aiConfigSchema>;

/**
 * Read AI configuration from environment variables.
 *
 * Environment variables:
 * - AI_PROVIDER: "anthropic" | "openai" | "mistral" (default: "anthropic")
 * - AI_MODEL: model identifier (default: provider-specific default)
 * - AI_TEMPERATURE: generation temperature (default: 0.7)
 * - AI_MAX_TOKENS: max tokens (default: 4096)
 */
export function getAIConfig(): AIModelConfig {
  const raw = {
    provider: process.env.AI_PROVIDER || "anthropic",
    model: process.env.AI_MODEL,
    temperature: process.env.AI_TEMPERATURE,
    maxTokens: process.env.AI_MAX_TOKENS,
  };

  const parsed = aiConfigSchema.parse(raw);

  const provider = parsed.provider as AIProviderType;

  return {
    provider,
    model: parsed.model || DEFAULT_MODELS[provider],
    temperature: parsed.temperature,
    maxTokens: parsed.maxTokens,
  };
}

/**
 * Singleton config instance. Re-reads env on each call for flexibility.
 */
export const aiConfig = {
  get current(): AIModelConfig {
    return getAIConfig();
  },
};
