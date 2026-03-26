/**
 * Mock AI Provider for Development
 *
 * Returns realistic French case summary data without requiring
 * an actual LLM API key. Used automatically when ANTHROPIC_API_KEY
 * is not set.
 */

import { type LanguageModelV1 } from "ai";
import type { AIProviderInfo } from "./provider";
import type { CaseSummaryOutput, TimelineOutput, QualificationScoreOutput } from "@legalconnect/shared";

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

// ---------------------------------------------------------------------------
// Mock Timelines (AI-03)
// ---------------------------------------------------------------------------

const MOCK_TIMELINES: Record<string, TimelineOutput> = {
  travail: {
    events: [
      {
        date: "2016-09-01",
        description: "Embauche en CDI au poste de responsable logistique",
        source: "recit",
        confidence: "high",
      },
      {
        date: "~2023-06-01",
        description: "Premiers incidents signales avec le nouveau directeur de site",
        source: "recit",
        confidence: "low",
      },
      {
        date: "2024-01-15",
        description: "Entretien prealable au licenciement convoque par lettre recommandee",
        source: "recit",
        confidence: "high",
      },
      {
        date: "2024-02-01",
        description: "Notification du licenciement pour motif personnel",
        source: "recit",
        confidence: "high",
      },
      {
        date: "2024-02-15",
        description: "Reception de la lettre de licenciement avec solde de tout compte",
        source: "document",
        confidence: "high",
      },
    ],
    undatedEvents: [
      {
        description: "Plusieurs avertissements verbaux contestes par le salarie selon son recit",
        source: "recit",
      },
    ],
  },
  famille: {
    events: [
      {
        date: "2015-06-20",
        description: "Mariage civil celebre a la mairie du 5e arrondissement de Paris",
        source: "recit",
        confidence: "high",
      },
      {
        date: "~2017-01-01",
        description: "Naissance du premier enfant (date approximative)",
        source: "recit",
        confidence: "low",
      },
      {
        date: "~2019-06-01",
        description: "Naissance du deuxieme enfant (date approximative)",
        source: "recit",
        confidence: "low",
      },
      {
        date: "2024-03-01",
        description: "Separation effective du couple et depart du domicile conjugal",
        source: "recit",
        confidence: "high",
      },
    ],
    undatedEvents: [
      {
        description: "Acquisition d'un bien immobilier commun dont la valeur est en cours d'estimation",
        source: "recit",
      },
    ],
  },
  default: {
    events: [
      {
        date: "~2024-01-01",
        description: "Debut de la situation litigieuse selon le recit du client",
        source: "recit",
        confidence: "low",
      },
      {
        date: "~2024-03-01",
        description: "Premiere demarche du client pour resoudre le litige",
        source: "recit",
        confidence: "low",
      },
    ],
    undatedEvents: [
      {
        description: "Elements complementaires a preciser lors de la consultation avec l'avocat",
        source: "recit",
      },
    ],
  },
};

/**
 * Returns a mock timeline based on the problem type.
 */
export function getMockTimeline(problemType: string): TimelineOutput {
  return MOCK_TIMELINES[problemType] ?? MOCK_TIMELINES.default;
}

// ---------------------------------------------------------------------------
// Mock Qualification Scores (AI-04)
// ---------------------------------------------------------------------------

const MOCK_SCORES: Record<string, QualificationScoreOutput> = {
  travail: {
    urgencyScore: 75,
    completenessScore: 60,
    complexityScore: 45,
    rationale:
      "Urgence elevee (75/100) : licenciement recent avec delai de contestation aux prud'hommes en cours. " +
      "Completude correcte (60/100) : description detaillee mais documents partiels (contrat et lettre de licenciement fournis, pas de bulletins de salaire). " +
      "Complexite moderee (45/100) : litige bilateral classique en droit du travail, pas de dimension internationale.",
  },
  famille: {
    urgencyScore: 40,
    completenessScore: 50,
    complexityScore: 65,
    rationale:
      "Urgence moderee (40/100) : pas de delai legal imminent, divorce a l'amiable envisage. " +
      "Completude moyenne (50/100) : situation decrite de maniere generale, peu de documents fournis a ce stade. " +
      "Complexite notable (65/100) : bien immobilier a partager, deux enfants mineurs avec question de garde, necessitant expertise en droit patrimonial et droit de la famille.",
  },
  default: {
    urgencyScore: 50,
    completenessScore: 40,
    complexityScore: 50,
    rationale:
      "Urgence standard (50/100) : pas d'element d'urgence particulier identifie dans le recit. " +
      "Completude insuffisante (40/100) : informations de base fournies mais details et documents manquants pour une evaluation complete. " +
      "Complexite moyenne (50/100) : dossier a qualifier plus precisement lors de la consultation.",
  },
};

/**
 * Returns a mock qualification score based on the problem type.
 */
export function getMockQualificationScore(problemType: string): QualificationScoreOutput {
  return MOCK_SCORES[problemType] ?? MOCK_SCORES.default;
}
