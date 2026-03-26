import { describe, it, expect, beforeEach } from "vitest";
import { getAIConfig, aiConfig, aiConfigSchema } from "../config";
import { DEFAULT_MODELS } from "../types";

describe("getAIConfig", () => {
  beforeEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    delete process.env.AI_TEMPERATURE;
    delete process.env.AI_MAX_TOKENS;
  });

  it("returns default config when no env vars set", () => {
    const config = getAIConfig();
    expect(config.provider).toBe("anthropic");
    expect(config.model).toBe(DEFAULT_MODELS.anthropic);
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(4096);
  });

  it("reads AI_PROVIDER from env", () => {
    process.env.AI_PROVIDER = "openai";
    const config = getAIConfig();
    expect(config.provider).toBe("openai");
    expect(config.model).toBe(DEFAULT_MODELS.openai);
  });

  it("reads AI_MODEL from env", () => {
    process.env.AI_MODEL = "claude-3-haiku-20240307";
    const config = getAIConfig();
    expect(config.model).toBe("claude-3-haiku-20240307");
  });

  it("reads AI_TEMPERATURE from env", () => {
    process.env.AI_TEMPERATURE = "0.3";
    const config = getAIConfig();
    expect(config.temperature).toBe(0.3);
  });

  it("reads AI_MAX_TOKENS from env", () => {
    process.env.AI_MAX_TOKENS = "8192";
    const config = getAIConfig();
    expect(config.maxTokens).toBe(8192);
  });

  it("falls back to provider-specific default model", () => {
    process.env.AI_PROVIDER = "mistral";
    const config = getAIConfig();
    expect(config.model).toBe(DEFAULT_MODELS.mistral);
  });

  it("throws for invalid provider", () => {
    process.env.AI_PROVIDER = "invalid_provider";
    expect(() => getAIConfig()).toThrow();
  });
});

describe("aiConfig singleton", () => {
  beforeEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
  });

  it("returns current config via getter", () => {
    const config = aiConfig.current;
    expect(config.provider).toBe("anthropic");
  });

  it("reflects env changes on each access", () => {
    expect(aiConfig.current.provider).toBe("anthropic");
    process.env.AI_PROVIDER = "openai";
    expect(aiConfig.current.provider).toBe("openai");
  });
});

describe("aiConfigSchema", () => {
  it("validates valid config", () => {
    const result = aiConfigSchema.parse({
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      temperature: 0.5,
      maxTokens: 2048,
    });
    expect(result.provider).toBe("anthropic");
  });

  it("applies defaults for missing fields", () => {
    const result = aiConfigSchema.parse({});
    expect(result.provider).toBe("anthropic");
    expect(result.temperature).toBe(0.7);
    expect(result.maxTokens).toBe(4096);
  });

  it("rejects invalid provider", () => {
    expect(() => aiConfigSchema.parse({ provider: "invalid" })).toThrow();
  });
});
