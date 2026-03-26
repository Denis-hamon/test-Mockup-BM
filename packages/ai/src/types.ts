import type { LanguageModel } from "ai";

/**
 * Supported AI provider types.
 * Architecture is LLM-agnostic per PROJECT.md constraint.
 */
export type AIProviderType = "anthropic" | "openai" | "mistral";

/**
 * Configuration for selecting a specific AI model.
 */
export interface AIModelConfig {
  /** Which provider to use */
  provider: AIProviderType;
  /** Model identifier (e.g., "claude-sonnet-4-20250514", "gpt-4o", "mistral-large-latest") */
  model: string;
  /** Temperature for generation (0-1). Lower = more deterministic */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
}

/**
 * System prompt configuration for AI interactions.
 */
export interface SystemPromptConfig {
  /** The system prompt role/instructions */
  role: string;
  /** Whether to append the standard legal disclaimer */
  appendDisclaimer?: boolean;
}

/**
 * Options for streaming an AI response.
 */
export interface StreamAIOptions {
  /** Conversation messages */
  messages: AIMessage[];
  /** System prompt configuration */
  system?: string;
  /** Model configuration override (uses defaults if not provided) */
  modelConfig?: Partial<AIModelConfig>;
  /** Whether to append legal disclaimer to system prompt (default: true) */
  appendDisclaimer?: boolean;
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
}

/**
 * A message in an AI conversation.
 */
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Result from a non-streaming AI generation.
 */
export interface AIGenerateResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Default model IDs per provider.
 */
export const DEFAULT_MODELS: Record<AIProviderType, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  mistral: "mistral-large-latest",
};

/**
 * Legal disclaimer appended to AI interactions.
 * Required by AI-06: AI never provides legal advice.
 */
export const LEGAL_DISCLAIMER =
  "IMPORTANT: You are NOT a lawyer. You must NEVER provide legal advice, legal opinions, or specific legal recommendations. " +
  "You help users describe their situation and organize information. " +
  "Always remind users to consult a qualified lawyer for legal advice. " +
  "If asked for legal advice, politely decline and explain that you can only help organize their information.";
