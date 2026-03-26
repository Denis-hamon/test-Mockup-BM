import { z } from "zod";

export const stepProblemTypeSchema = z.object({
  problemType: z.enum([
    "famille",
    "travail",
    "penal",
    "immobilier",
    "commercial",
    "autre",
  ]),
  problemSubType: z.string().optional(),
});

export const stepDescriptionSchema = z.object({
  description: z
    .string()
    .min(20, "Decrivez votre situation en au moins 20 caracteres"),
  urgency: z
    .enum(["normal", "urgent", "tres_urgent"])
    .default("normal"),
  opposingParty: z.string().optional(),
  desiredOutcome: z.string().optional(),
});

export const stepDocumentsSchema = z.object({
  documents: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        size: z.number(),
        type: z.string(),
        encryptedKey: z.string(),
        s3Key: z.string(),
        nonce: z.string(),
      })
    )
    .default([]),
});

export const stepContactSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  phone: z.string().optional(),
  preferredContact: z
    .enum(["email", "telephone", "les_deux"])
    .default("email"),
  availabilities: z.string().optional(),
});

export const intakeSchema = stepProblemTypeSchema
  .merge(stepDescriptionSchema)
  .merge(stepDocumentsSchema)
  .merge(stepContactSchema);

export type IntakeFormData = z.infer<typeof intakeSchema>;

export const STEP_SCHEMAS = [
  stepProblemTypeSchema,
  stepDescriptionSchema,
  stepDocumentsSchema,
  stepContactSchema,
] as const;
