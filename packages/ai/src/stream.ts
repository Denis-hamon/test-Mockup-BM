import { streamText } from "ai";
import type { StreamAIOptions } from "./types";
import { LEGAL_DISCLAIMER } from "./types";
import { getModel } from "./provider";
import { getAIConfig } from "./config";

/**
 * Build a system prompt with optional legal disclaimer.
 *
 * Per AI-06: AI never provides legal advice.
 * Disclaimer is appended by default to all interactions.
 */
export function buildSystemPrompt(
  system?: string,
  appendDisclaimer: boolean = true
): string {
  const parts: string[] = [];

  if (system) {
    parts.push(system);
  }

  if (appendDisclaimer) {
    parts.push(LEGAL_DISCLAIMER);
  }

  return parts.join("\n\n");
}

/**
 * Stream an AI response through the unified provider interface.
 *
 * Wraps Vercel AI SDK's `streamText` with:
 * - Automatic provider/model selection from config
 * - Legal disclaimer injection (default: enabled)
 * - Temperature and maxTokens from config or overrides
 *
 * @param options - Streaming options
 * @returns Vercel AI SDK StreamTextResult
 */
export function streamAIResponse(
  options: StreamAIOptions
): ReturnType<typeof streamText> {
  const {
    messages,
    system,
    modelConfig,
    appendDisclaimer = true,
    temperature,
    maxTokens,
  } = options;

  const config = getAIConfig();
  const model = getModel(modelConfig);

  const systemPrompt = buildSystemPrompt(system, appendDisclaimer);

  return streamText({
    model,
    system: systemPrompt || undefined,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    temperature: temperature ?? modelConfig?.temperature ?? config.temperature,
    maxOutputTokens: maxTokens ?? modelConfig?.maxTokens ?? config.maxTokens,
  });
}
