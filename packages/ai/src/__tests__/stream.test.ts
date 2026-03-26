import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock providers
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((modelId: string) => ({
    provider: "anthropic",
    modelId,
    _type: "language-model",
  })),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn((modelId: string) => ({
    provider: "openai",
    modelId,
    _type: "language-model",
  })),
}));

vi.mock("@ai-sdk/mistral", () => ({
  mistral: vi.fn((modelId: string) => ({
    provider: "mistral",
    modelId,
    _type: "language-model",
  })),
}));

// Mock streamText
const mockStreamText = vi.fn();
vi.mock("ai", () => ({
  streamText: (...args: any[]) => mockStreamText(...args),
}));

import { buildSystemPrompt, streamAIResponse } from "../stream";
import { LEGAL_DISCLAIMER } from "../types";

describe("buildSystemPrompt", () => {
  it("returns only disclaimer when no system prompt provided", () => {
    const result = buildSystemPrompt(undefined, true);
    expect(result).toBe(LEGAL_DISCLAIMER);
  });

  it("prepends system prompt before disclaimer", () => {
    const result = buildSystemPrompt("You are a helpful assistant.", true);
    expect(result).toContain("You are a helpful assistant.");
    expect(result).toContain(LEGAL_DISCLAIMER);
    // System prompt should come before disclaimer
    expect(result.indexOf("You are a helpful assistant.")).toBeLessThan(
      result.indexOf(LEGAL_DISCLAIMER)
    );
  });

  it("returns only system prompt when disclaimer disabled", () => {
    const result = buildSystemPrompt("You are a helpful assistant.", false);
    expect(result).toBe("You are a helpful assistant.");
    expect(result).not.toContain(LEGAL_DISCLAIMER);
  });

  it("returns empty string when no system and no disclaimer", () => {
    const result = buildSystemPrompt(undefined, false);
    expect(result).toBe("");
  });

  it("separates system prompt and disclaimer with double newline", () => {
    const result = buildSystemPrompt("Hello", true);
    expect(result).toBe(`Hello\n\n${LEGAL_DISCLAIMER}`);
  });
});

describe("streamAIResponse", () => {
  beforeEach(() => {
    mockStreamText.mockClear();
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
  });

  it("calls streamText with legal disclaimer by default", () => {
    mockStreamText.mockReturnValue({ textStream: "mock" });

    streamAIResponse({
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(mockStreamText).toHaveBeenCalledOnce();
    const call = mockStreamText.mock.calls[0][0];
    expect(call.system).toContain(LEGAL_DISCLAIMER);
  });

  it("appends disclaimer to custom system prompt", () => {
    mockStreamText.mockReturnValue({ textStream: "mock" });

    streamAIResponse({
      messages: [{ role: "user", content: "Hello" }],
      system: "You are empathetic.",
    });

    const call = mockStreamText.mock.calls[0][0];
    expect(call.system).toContain("You are empathetic.");
    expect(call.system).toContain(LEGAL_DISCLAIMER);
  });

  it("skips disclaimer when appendDisclaimer is false", () => {
    mockStreamText.mockReturnValue({ textStream: "mock" });

    streamAIResponse({
      messages: [{ role: "user", content: "Hello" }],
      system: "Custom system.",
      appendDisclaimer: false,
    });

    const call = mockStreamText.mock.calls[0][0];
    expect(call.system).toBe("Custom system.");
    expect(call.system).not.toContain(LEGAL_DISCLAIMER);
  });

  it("passes messages to streamText", () => {
    mockStreamText.mockReturnValue({ textStream: "mock" });

    streamAIResponse({
      messages: [
        { role: "user", content: "Bonjour" },
        { role: "assistant", content: "Bonjour!" },
        { role: "user", content: "J'ai un probleme" },
      ],
    });

    const call = mockStreamText.mock.calls[0][0];
    expect(call.messages).toHaveLength(3);
    expect(call.messages[0].role).toBe("user");
    expect(call.messages[0].content).toBe("Bonjour");
  });

  it("uses default model when no modelConfig provided", () => {
    mockStreamText.mockReturnValue({ textStream: "mock" });

    streamAIResponse({
      messages: [{ role: "user", content: "Hello" }],
    });

    const call = mockStreamText.mock.calls[0][0];
    // Model should be defined (anthropic default)
    expect(call.model).toBeDefined();
  });

  it("applies temperature and maxOutputTokens from config", () => {
    mockStreamText.mockReturnValue({ textStream: "mock" });

    streamAIResponse({
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.3,
      maxTokens: 2048,
    });

    const call = mockStreamText.mock.calls[0][0];
    expect(call.temperature).toBe(0.3);
    expect(call.maxOutputTokens).toBe(2048);
  });
});
