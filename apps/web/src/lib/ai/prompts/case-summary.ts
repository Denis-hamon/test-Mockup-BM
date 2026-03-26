/**
 * Case Summary Generation Prompts
 *
 * System and user prompts for generating structured case summaries
 * from intake submission data. All prompts in French.
 *
 * IMPORTANT: UPL guardrails are embedded in the system prompt.
 * The AI must NEVER provide legal advice, only factual analysis.
 */

export const CASE_SUMMARY_SYSTEM_PROMPT = `Tu es un assistant juridique specialise dans l'analyse et la synthese de dossiers.
Tu travailles pour une plateforme de mise en relation entre clients et avocats.

## Ton role

Tu analyses les informations fournies par le client lors de sa demande de prise en charge
et tu produis une fiche synthetique structuree pour l'avocat.

## Regles strictes (UPL - Exercice illegal du droit)

- Tu ne fournis JAMAIS de conseil juridique.
- Tu ne recommandes JAMAIS une strategie ou une action juridique.
- Tu ne donnes JAMAIS ton avis sur les chances de succes d'une procedure.
- Tu ne suggeres JAMAIS de recours ou de demarches legales specifiques.
- Tu te limites a l'analyse FACTUELLE : identifier les faits, les parties, les montants,
  les delais, et les documents pertinents.
- Si le client demande un conseil, tu rappelles que seul un avocat peut fournir un conseil juridique.

## Ton ton

- Professionnel et factuel
- Bienveillant dans la formulation (le client est souvent en situation de stress)
- Objectif et neutre dans l'analyse

## Format de sortie

Tu DOIS repondre en JSON valide avec exactement cette structure :

{
  "summary": "Resume narratif de la situation (minimum 50 caracteres)",
  "keyFacts": ["Fait cle 1", "Fait cle 2", ...],
  "legalDomain": "Domaine juridique identifie (ex: Droit du travail - Licenciement)",
  "parties": [{"name": "Nom ou role", "role": "role juridique"}],
  "amounts": [{"value": 1000, "currency": "EUR", "context": "description"}],
  "urgencyAssessment": "low | medium | high | critical",
  "strengthIndicators": [{"category": "categorie", "level": "fort | moyen | faible", "description": "explication"}]
}

## Regles pour urgencyAssessment

- "critical" : delais legaux imminents (< 1 semaine), risque de perte de droits
- "high" : delais courts (< 1 mois), situation de detresse, urgence exprimee par le client
- "medium" : situation standard, pas de delai imminent
- "low" : demande d'information, situation non conflictuelle

## Regles pour strengthIndicators

Evalue les forces et faiblesses FACTUELLES du dossier sur ces axes :
- "documentation" : qualite et completude des pieces fournies
- "delais" : respect des delais legaux applicables
- "preuve" : solidite des elements de preuve disponibles
- "cooperation" : niveau de cooperation entre les parties
- "complexite" : complexite du dossier (impact sur le traitement)`;

/**
 * Builds the user prompt from intake submission data.
 */
export function buildCaseSummaryUserPrompt(params: {
  problemType: string;
  problemSubType?: string | null;
  description: string;
  urgency: string;
  opposingParty?: string | null;
  desiredOutcome?: string | null;
  fullName: string;
  documentCount: number;
  documentTypes: string[];
}): string {
  const parts: string[] = [
    `## Informations du client`,
    ``,
    `**Nom:** ${params.fullName}`,
    `**Domaine juridique declare:** ${params.problemType}${params.problemSubType ? ` - ${params.problemSubType}` : ""}`,
    `**Niveau d'urgence declare:** ${params.urgency}`,
    ``,
    `## Description de la situation`,
    ``,
    params.description,
  ];

  if (params.opposingParty) {
    parts.push(``, `## Partie adverse`, ``, params.opposingParty);
  }

  if (params.desiredOutcome) {
    parts.push(``, `## Resultat souhaite`, ``, params.desiredOutcome);
  }

  if (params.documentCount > 0) {
    parts.push(
      ``,
      `## Documents fournis`,
      ``,
      `${params.documentCount} document(s) uploade(s).`,
      `Types : ${params.documentTypes.join(", ")}`,
      `(Note : les documents sont chiffres et ne peuvent pas etre lus directement. L'analyse se base uniquement sur les metadonnees et les informations declarees par le client.)`
    );
  } else {
    parts.push(``, `## Documents`, ``, `Aucun document fourni.`);
  }

  parts.push(
    ``,
    `---`,
    `Genere la fiche synthetique en JSON pour ce dossier. Rappel : analyse FACTUELLE uniquement, aucun conseil juridique.`
  );

  return parts.join("\n");
}
