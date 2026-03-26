import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  containsLegalAdvice,
  LEGAL_ADVICE_PATTERNS,
} from "../guardrails/patterns";
import {
  shouldAddDisclaimer,
  addDisclaimer,
  DISCLAIMER_TEXT,
  SENSITIVE_TOPIC_PATTERNS,
} from "../guardrails/disclaimer";
import { uplGuardrailMiddleware } from "../guardrails/upl-middleware";
import { rewriteWithoutAdvice, _setRewriteModelForTest } from "../guardrails/rewrite";

describe("Legal Advice Detection (containsLegalAdvice)", () => {
  it("detects 'Vous avez le droit de contester cette decision'", () => {
    expect(containsLegalAdvice("Vous avez le droit de contester cette decision")).toBe(true);
  });

  it("detects 'La procedure a suivre est de saisir le tribunal'", () => {
    expect(containsLegalAdvice("La procedure a suivre est de saisir le tribunal")).toBe(true);
  });

  it("detects 'Selon l'article 1240 du Code civil'", () => {
    expect(containsLegalAdvice("Selon l'article 1240 du Code civil")).toBe(true);
  });

  it("detects 'Je vous conseille de porter plainte'", () => {
    expect(containsLegalAdvice("Je vous conseille de porter plainte")).toBe(true);
  });

  it("detects 'Vous devriez demander une indemnisation'", () => {
    expect(containsLegalAdvice("Vous devriez demander une indemnisation")).toBe(true);
  });

  it("detects 'Vos droits incluent le droit au logement'", () => {
    expect(containsLegalAdvice("Vos droits incluent le droit au logement")).toBe(true);
  });

  it("does NOT flag 'Je comprends que cette situation est difficile'", () => {
    expect(containsLegalAdvice("Je comprends que cette situation est difficile")).toBe(false);
  });

  it("does NOT flag 'Pourriez-vous me decrire ce qui s'est passe?'", () => {
    expect(containsLegalAdvice("Pourriez-vous me decrire ce qui s'est passe?")).toBe(false);
  });

  it("does NOT flag 'Vous pouvez telecharger votre document'", () => {
    expect(containsLegalAdvice("Vous pouvez telecharger votre document")).toBe(false);
  });

  it("does NOT flag 'Votre avocat pourra vous conseiller'", () => {
    expect(containsLegalAdvice("Votre avocat pourra vous conseiller")).toBe(false);
  });

  it("exports at least 15 regex patterns", () => {
    expect(LEGAL_ADVICE_PATTERNS.length).toBeGreaterThanOrEqual(15);
  });
});

describe("Contextual Disclaimer (shouldAddDisclaimer / addDisclaimer)", () => {
  it("shouldAddDisclaimer returns true for 'Le delai de prescription est generalement...'", () => {
    expect(shouldAddDisclaimer("Le delai de prescription est generalement de 5 ans.")).toBe(true);
  });

  it("shouldAddDisclaimer returns false for 'Bonjour, comment puis-je vous aider?'", () => {
    expect(shouldAddDisclaimer("Bonjour, comment puis-je vous aider?")).toBe(false);
  });

  it("addDisclaimer appends text containing 'avocat'", () => {
    const result = addDisclaimer("Some text");
    expect(result).toContain("avocat");
  });

  it("addDisclaimer appends the DISCLAIMER_TEXT", () => {
    const result = addDisclaimer("Some text");
    expect(result).toContain(DISCLAIMER_TEXT);
  });

  it("shouldAddDisclaimer returns false if disclaimer already present", () => {
    const textWithDisclaimer = "Le delai de prescription est de 5 ans. " + DISCLAIMER_TEXT;
    expect(shouldAddDisclaimer(textWithDisclaimer)).toBe(false);
  });

  it("exports SENSITIVE_TOPIC_PATTERNS array", () => {
    expect(Array.isArray(SENSITIVE_TOPIC_PATTERNS)).toBe(true);
    expect(SENSITIVE_TOPIC_PATTERNS.length).toBeGreaterThan(0);
  });
});

describe("UPL Guardrail Middleware", () => {
  it("uplGuardrailMiddleware.wrapGenerate exists and is a function", () => {
    expect(typeof uplGuardrailMiddleware.wrapGenerate).toBe("function");
  });

  it("uplGuardrailMiddleware.wrapStream exists and is a function", () => {
    expect(typeof uplGuardrailMiddleware.wrapStream).toBe("function");
  });
});

describe("rewriteWithoutAdvice", () => {
  beforeEach(() => {
    // Inject a mock model for testing that returns safe rewritten text
    _setRewriteModelForTest({
      doGenerate: async () => ({
        text: "Je comprends votre question. Votre avocat sera la personne la plus qualifiee pour vous repondre sur ce point.",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        rawCall: { rawPrompt: "", rawSettings: {} },
        response: { id: "test", modelId: "test", timestamp: new Date() },
      }),
    } as any);
  });

  it("returns text that does NOT contain legal advice patterns", async () => {
    const result = await rewriteWithoutAdvice("Vous avez le droit de contester cette decision");
    expect(containsLegalAdvice(result)).toBe(false);
  });

  it("output contains 'avocat' (redirects to lawyer)", async () => {
    const result = await rewriteWithoutAdvice("Vous avez le droit de contester cette decision");
    expect(result).toContain("avocat");
  });
});
