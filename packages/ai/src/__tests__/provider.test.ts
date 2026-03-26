import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock providers before imports
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

import { createProvider, getModel } from "../provider";
import { DEFAULT_MODELS } from "../types";

describe("createProvider", () => {
  it("creates an Anthropic model with default model ID", () => {
    const model = createProvider("anthropic") as any;
    expect(model.provider).toBe("anthropic");
    expect(model.modelId).toBe(DEFAULT_MODELS.anthropic);
  });

  it("creates an Anthropic model with custom model ID", () => {
    const model = createProvider("anthropic", "claude-3-haiku-20240307") as any;
    expect(model.provider).toBe("anthropic");
    expect(model.modelId).toBe("claude-3-haiku-20240307");
  });

  it("creates an OpenAI model with default model ID", () => {
    const model = createProvider("openai") as any;
    expect(model.provider).toBe("openai");
    expect(model.modelId).toBe(DEFAULT_MODELS.openai);
  });

  it("creates an OpenAI model with custom model ID", () => {
    const model = createProvider("openai", "gpt-4o-mini") as any;
    expect(model.provider).toBe("openai");
    expect(model.modelId).toBe("gpt-4o-mini");
  });

  it("creates a Mistral model with default model ID", () => {
    const model = createProvider("mistral") as any;
    expect(model.provider).toBe("mistral");
    expect(model.modelId).toBe(DEFAULT_MODELS.mistral);
  });

  it("creates a Mistral model with custom model ID", () => {
    const model = createProvider("mistral", "mistral-small-latest") as any;
    expect(model.provider).toBe("mistral");
    expect(model.modelId).toBe("mistral-small-latest");
  });

  it("throws for unsupported provider", () => {
    expect(() => createProvider("invalid" as any)).toThrow(
      'Unsupported AI provider: "invalid"'
    );
  });
});

describe("getModel", () => {
  beforeEach(() => {
    // Clear env vars
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
  });

  it("uses default config when no args provided", () => {
    const model = getModel() as any;
    // Default is anthropic with claude-sonnet-4-20250514
    expect(model.provider).toBe("anthropic");
    expect(model.modelId).toBe(DEFAULT_MODELS.anthropic);
  });

  it("uses custom config when provided", () => {
    const model = getModel({ provider: "openai", model: "gpt-4o" }) as any;
    expect(model.provider).toBe("openai");
    expect(model.modelId).toBe("gpt-4o");
  });

  it("reads provider from AI_PROVIDER env var", () => {
    process.env.AI_PROVIDER = "mistral";
    const model = getModel() as any;
    expect(model.provider).toBe("mistral");
    expect(model.modelId).toBe(DEFAULT_MODELS.mistral);
  });

  it("reads model from AI_MODEL env var", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "gpt-4o-mini";
    const model = getModel() as any;
    expect(model.provider).toBe("openai");
    expect(model.modelId).toBe("gpt-4o-mini");
  });

  it("config override takes precedence over env vars", () => {
    process.env.AI_PROVIDER = "openai";
    const model = getModel({ provider: "anthropic" }) as any;
    expect(model.provider).toBe("anthropic");
  });
});
