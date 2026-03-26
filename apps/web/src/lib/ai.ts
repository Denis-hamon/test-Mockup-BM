/**
 * App-level AI configuration and convenience re-exports.
 *
 * Use these for AI interactions within the Next.js app.
 * The underlying @legalconnect/ai package handles provider abstraction.
 */

export {
  getModel,
  streamAIResponse,
  buildSystemPrompt,
  aiConfig,
  createProvider,
  LEGAL_DISCLAIMER,
} from "@legalconnect/ai";

export type {
  AIMessage,
  AIModelConfig,
  StreamAIOptions,
  AIProviderType,
} from "@legalconnect/ai";
