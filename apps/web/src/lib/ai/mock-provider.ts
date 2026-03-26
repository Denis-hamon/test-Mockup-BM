/**
 * Mock AI Provider for Development
 *
 * Returns realistic French case summary data without requiring
 * an actual LLM API key. Used automatically when ANTHROPIC_API_KEY
 * is not set.
 */

import { type LanguageModelV1 } from "ai";
import type { AIProviderInfo } from "./provider";
import type { CaseSummaryOutput } from "@legalconnect/shared";

const MOCK_SUMMARIES: Record<string, CaseSummaryOutput> = {
  travail: {
    summary:
      "Le client signale un litige avec son employeur concernant un licenciement qu'il estime abusif. " +
      "Il indique avoir ete licencie apres 8 ans d'anciennete sans motif reel et serieux. " +
      "Les documents fournis incluent le contrat de travail et la lettre de licenciement. " +
      "Le client souhaite obtenir des indemnites pour licenciement sans cause reelle et serieuse.",
    keyFacts: [
      "Licenciement apres 8 ans d'anciennete",
      "Absence de motif reel et serieux invoque par le client",
      "Lettre de licenciement recue le mois dernier",
      "Contrat de travail a duree indeterminee",
    ],
    legalDomain: "Droit du travail - Licenciement abusif",
    parties: [
      { name: "Client", role: "salarie" },
      { name: "Employeur (non identifie)", role: "employeur" },
    ],
    amounts: [
      { value: 35000, currency: "EUR", context: "estimation indemnites legales" },
    ],
    urgencyAssessment: "high",
    strengthIndicators: [
      {
        category: "documentation",
        level: "moyen",
        description: "Contrat et lettre de licenciement fournis, mais pas de temoignages",
      },
      {
        category: "delais",
        level: "fort",
        description: "Action dans les delais legaux (12 mois pour saisir les prud'hommes)",
      },
    ],
  },
  famille: {
    summary:
      "Le client est confronte a une procedure de divorce et souhaite obtenir la garde partagee de ses deux enfants mineurs. " +
      "Il indique que la separation est a l'amiable mais que des desaccords subsistent sur la repartition des biens immobiliers. " +
      "Un bien immobilier commun est en jeu. Le client recherche un accompagnement pour une procedure de divorce par consentement mutuel.",
    keyFacts: [
      "Divorce souhaite par consentement mutuel",
      "Deux enfants mineurs (ages non precises)",
      "Bien immobilier commun a partager",
      "Separation a l'amiable avec desaccords ponctuels",
    ],
    legalDomain: "Droit de la famille - Divorce",
    parties: [
      { name: "Client", role: "demandeur" },
      { name: "Conjoint (non identifie)", role: "defendeur" },
    ],
    amounts: [
      { value: 250000, currency: "EUR", context: "estimation bien immobilier commun" },
    ],
    urgencyAssessment: "medium",
    strengthIndicators: [
      {
        category: "cooperation",
        level: "fort",
        description: "Divorce a l'amiable, bonne base pour consentement mutuel",
      },
      {
        category: "documentation",
        level: "faible",
        description: "Aucun document fourni a ce stade",
      },
    ],
  },
  default: {
    summary:
      "Le client presente une situation juridique necessitant une analyse approfondie. " +
      "Les elements fournis permettent d'identifier les grandes lignes du litige mais des precisions supplementaires " +
      "seront necessaires pour evaluer pleinement la situation. " +
      "Une consultation avec un avocat specialise est recommandee pour definir la strategie appropriee.",
    keyFacts: [
      "Situation juridique a qualifier precisement",
      "Elements initiaux fournis par le client",
      "Analyse complementaire necessaire",
    ],
    legalDomain: "A determiner - consultation necessaire",
    parties: [{ name: "Client", role: "demandeur" }],
    amounts: [],
    urgencyAssessment: "medium",
    strengthIndicators: [
      {
        category: "documentation",
        level: "faible",
        description: "Documentation insuffisante pour evaluation complete",
      },
    ],
  },
};

/**
 * Returns a mock AI provider for development.
 * The mock model satisfies the LanguageModelV1 interface minimally.
 */
export function getMockProvider(): AIProviderInfo {
  // Create a minimal mock that satisfies the type.
  // In practice, generateCaseSummary uses getMockSummary() directly
  // when provider.isMock is true, so this model is never actually called.
  const mockModel = {
    specificationVersion: "v1" as const,
    provider: "mock",
    modelId: "mock-dev",
    defaultObjectGenerationMode: "json" as const,
    doGenerate: async () => {
      throw new Error("Mock model: use getMockSummary() instead");
    },
    doStream: async () => {
      throw new Error("Mock model: use getMockSummary() instead");
    },
  } as unknown as LanguageModelV1;

  return {
    model: mockModel,
    modelName: "mock-dev",
    isMock: true,
  };
}

/**
 * Returns a mock case summary based on the problem type.
 */
export function getMockSummary(problemType: string): CaseSummaryOutput {
  return MOCK_SUMMARIES[problemType] ?? MOCK_SUMMARIES.default;
}
