import type { IntakeTemplate } from "@legalconnect/shared";

// ---------------------------------------------------------------------------
// Droit de la famille — 7 questions
// ---------------------------------------------------------------------------

export const familyTemplate: IntakeTemplate = {
  specialty: "famille",
  steps: [
    {
      id: "famille-situation",
      label: "Votre situation familiale",
      questions: [
        {
          id: "situation_familiale",
          label: "Quelle est votre situation familiale actuelle ?",
          fieldType: "select",
          required: true,
          options: [
            "Marie(e)",
            "Pacse(e)",
            "Concubinage",
            "Celibataire",
            "Divorce(e)",
            "Veuf/Veuve",
          ],
        },
        {
          id: "enfants",
          label: "Avez-vous des enfants ?",
          fieldType: "select",
          required: true,
          options: ["Aucun", "1", "2", "3", "4 ou plus"],
        },
        {
          id: "ages_enfants",
          label: "Quel(s) age(s) ont vos enfants ?",
          description:
            "Indiquez les ages separes par des virgules (ex: 3, 7, 12)",
          fieldType: "text",
          required: false,
          conditionalRule: {
            sourceQuestionId: "enfants",
            operator: "notEquals",
            expectedValue: "Aucun",
          },
        },
        {
          id: "regime_matrimonial",
          label: "Quel est votre regime matrimonial ?",
          fieldType: "select",
          required: false,
          options: [
            "Communaute reduite aux acquets",
            "Separation de biens",
            "Communaute universelle",
            "Participation aux acquets",
            "Je ne sais pas",
          ],
          conditionalRule: {
            sourceQuestionId: "situation_familiale",
            operator: "equals",
            expectedValue: "Marie(e)",
          },
        },
      ],
    },
    {
      id: "famille-details",
      label: "Details de votre demande",
      questions: [
        {
          id: "procedure_en_cours",
          label: "Une procedure est-elle deja en cours ?",
          fieldType: "select",
          required: true,
          options: [
            "Non, aucune demarche",
            "Oui, procedure amiable",
            "Oui, procedure judiciaire",
            "Oui, mediation en cours",
          ],
        },
        {
          id: "resultat_souhaite",
          label: "Quel resultat souhaitez-vous obtenir ?",
          description:
            "Decrivez en quelques phrases le resultat ideal pour vous.",
          fieldType: "textarea",
          required: false,
        },
        {
          id: "description_detail",
          label: "Decrivez votre situation en detail",
          description:
            "Plus vous donnez de details, mieux l'avocat pourra evaluer votre dossier.",
          fieldType: "textarea",
          required: true,
          validation: { maxLength: 5000 },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Droit du travail — 6 questions
// ---------------------------------------------------------------------------

export const laborTemplate: IntakeTemplate = {
  specialty: "travail",
  steps: [
    {
      id: "travail-contexte",
      label: "Contexte professionnel",
      questions: [
        {
          id: "type_contrat",
          label: "Quel est votre type de contrat ?",
          fieldType: "select",
          required: true,
          options: ["CDI", "CDD", "Interim", "Stage", "Independant"],
        },
        {
          id: "anciennete",
          label: "Quelle est votre anciennete ?",
          fieldType: "select",
          required: true,
          options: [
            "Moins de 6 mois",
            "6 mois a 1 an",
            "1 a 3 ans",
            "3 a 5 ans",
            "5 a 10 ans",
            "Plus de 10 ans",
          ],
        },
        {
          id: "motif_litige",
          label: "Quel est le motif du litige ?",
          fieldType: "select",
          required: true,
          options: [
            "Licenciement",
            "Harcelement",
            "Discrimination",
            "Salaire/Remuneration",
            "Accident du travail",
            "Autre",
          ],
        },
      ],
    },
    {
      id: "travail-details",
      label: "Details de votre situation",
      questions: [
        {
          id: "employeur",
          label: "Nom de l'employeur",
          fieldType: "text",
          required: true,
        },
        {
          id: "description_travail",
          label: "Decrivez votre situation en detail",
          description:
            "Chronologie des evenements, personnes impliquees, consequences sur votre travail.",
          fieldType: "textarea",
          required: true,
          validation: { maxLength: 5000 },
        },
        {
          id: "demarches_entreprises",
          label: "Demarches deja entreprises",
          description:
            "Avez-vous contacte les RH, un syndicat, l'inspection du travail, etc. ?",
          fieldType: "textarea",
          required: false,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Droit penal — 5 questions
// ---------------------------------------------------------------------------

export const criminalTemplate: IntakeTemplate = {
  specialty: "penal",
  steps: [
    {
      id: "penal-contexte",
      label: "Contexte de l'affaire",
      questions: [
        {
          id: "qualite",
          label: "En quelle qualite etes-vous concerne(e) ?",
          fieldType: "select",
          required: true,
          options: ["Victime", "Mis en cause", "Temoin"],
        },
        {
          id: "type_infraction",
          label: "Type d'infraction",
          fieldType: "select",
          required: true,
          options: [
            "Violence",
            "Vol",
            "Escroquerie",
            "Stupefiants",
            "Routier",
            "Autre",
          ],
        },
        {
          id: "date_faits",
          label: "Date des faits",
          fieldType: "date",
          required: true,
        },
      ],
    },
    {
      id: "penal-details",
      label: "Details",
      questions: [
        {
          id: "plainte_deposee",
          label: "Une plainte a-t-elle ete deposee ?",
          fieldType: "select",
          required: true,
          options: ["Oui", "Non", "En cours"],
        },
        {
          id: "description_penal",
          label: "Decrivez les faits en detail",
          description:
            "Lieu, circonstances, personnes impliquees, preuves eventuelles.",
          fieldType: "textarea",
          required: true,
          validation: { maxLength: 5000 },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Export all seed templates
// ---------------------------------------------------------------------------

export const seedTemplates = [
  { specialty: "famille" as const, template: familyTemplate },
  { specialty: "travail" as const, template: laborTemplate },
  { specialty: "penal" as const, template: criminalTemplate },
];
