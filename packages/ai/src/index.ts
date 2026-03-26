// @legalconnect/ai - LLM-agnostic AI provider package
// Uses Vercel AI SDK 6 for provider abstraction

// Types
export type {
  AIProviderType,
  AIModelConfig,
  SystemPromptConfig,
  StreamAIOptions,
  AIMessage,
  AIGenerateResult,
} from "./types";

export { DEFAULT_MODELS, LEGAL_DISCLAIMER } from "./types";

// Configuration
export { getAIConfig, aiConfig, aiConfigSchema } from "./config";
export type { AIConfigInput } from "./config";

// Provider factory
export { createProvider, getModel } from "./provider";

// Individual providers (for direct use when needed)
export { createAnthropicModel } from "./providers/anthropic";
export { createOpenAIModel } from "./providers/openai";
export { createMistralModel } from "./providers/mistral";

// Streaming
export { streamAIResponse, buildSystemPrompt } from "./stream";
