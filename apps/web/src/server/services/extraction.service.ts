/**
 * AI Vision extraction service for images and document text analysis.
 *
 * Uses Vercel AI SDK generateText with multimodal content parts
 * to extract structured data from images (photos, screenshots, scans).
 * Also provides parseDoclingToExtractionResult for converting Docling
 * raw text output into structured extraction results.
 */

import { generateText } from "ai";
import { getModel } from "@legalconnect/ai";
import type { DoclingResult } from "./docling.service";

export interface ExtractionResult {
  dates: string[];
  parties: string[];
  amounts: Array<{ value: string; currency: string }>;
  keyClauses: string[];
  documentType: string;
  summary: string;
}

const EXTRACTION_PROMPT = `Analysez ce document et extrayez les informations suivantes en JSON:
- dates: tableau de dates mentionnees (format ISO YYYY-MM-DD)
- parties: noms des personnes ou entites impliquees
- montants: tableau d'objets {value, currency} pour chaque montant financier
- clauses_cles: phrases ou clauses importantes (texte exact)
- type_document: type de document (contrat, courrier, facture, SMS, capture d'ecran, note, etc.)
- resume: resume en 2-3 phrases du contenu du document

Repondez UNIQUEMENT avec le JSON valide, sans texte supplementaire, sans backticks.`;

/**
 * Extract structured data from an image using AI Vision (Claude/GPT multimodal).
 *
 * @param imageBuffer - Raw image bytes (decrypted)
 * @param mimeType - MIME type of the image (e.g., "image/jpeg", "image/png")
 * @returns Structured extraction result
 */
export async function extractWithVision(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  const result = await generateText({
    model: getModel({ provider: "anthropic" }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageBuffer,
            mimeType,
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
    maxOutputTokens: 1000,
    temperature: 0.1, // Low temperature for extraction accuracy
  });

  return parseExtractionJSON(result.text);
}

/**
 * Convert Docling raw text output into structured extraction result.
 *
 * Uses AI to analyze the extracted text from Docling and produce
 * the same structured format as vision extraction.
 *
 * @param doclingResult - Raw output from Docling service
 * @returns Structured extraction result
 */
export async function parseDoclingToExtractionResult(
  doclingResult: DoclingResult
): Promise<ExtractionResult> {
  // Build context from Docling output
  let documentText = doclingResult.text;

  if (doclingResult.tables.length > 0) {
    documentText += "\n\nTableaux extraits:\n";
    for (const table of doclingResult.tables) {
      if (table.headers.length > 0) {
        documentText += `En-tetes: ${table.headers.join(" | ")}\n`;
      }
      for (const row of table.rows) {
        documentText += `${row.join(" | ")}\n`;
      }
      documentText += "\n";
    }
  }

  const result = await generateText({
    model: getModel({ provider: "anthropic" }),
    messages: [
      {
        role: "user",
        content: `Voici le texte extrait d'un document:\n\n${documentText}\n\n${EXTRACTION_PROMPT}`,
      },
    ],
    maxOutputTokens: 1000,
    temperature: 0.1,
  });

  return parseExtractionJSON(result.text);
}

/**
 * Parse JSON from AI response with graceful fallback.
 * Returns partial result if full parsing fails.
 */
function parseExtractionJSON(text: string): ExtractionResult {
  const empty: ExtractionResult = {
    dates: [],
    parties: [],
    amounts: [],
    keyClauses: [],
    documentType: "",
    summary: "",
  };

  try {
    // Try to extract JSON from the response (in case AI adds extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return empty;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      parties: Array.isArray(parsed.parties) ? parsed.parties : [],
      amounts: Array.isArray(parsed.montants)
        ? parsed.montants.map(
            (m: { value?: string; currency?: string }) => ({
              value: String(m.value || ""),
              currency: String(m.currency || "EUR"),
            })
          )
        : [],
      keyClauses: Array.isArray(parsed.clauses_cles)
        ? parsed.clauses_cles
        : [],
      documentType: String(parsed.type_document || ""),
      summary: String(parsed.resume || ""),
    };
  } catch {
    // JSON parse failure — return empty result
    return empty;
  }
}
