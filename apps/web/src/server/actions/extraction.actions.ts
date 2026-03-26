"use server";

/**
 * Server actions for document extraction pipeline.
 *
 * - triggerExtraction: Creates pending extraction record and enqueues BullMQ job
 * - getExtractionResults: Queries extraction results for given document IDs
 * - updateExtractionResult: Updates extraction fields (client edits)
 */

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { extractionResults } from "@/lib/db/schema/intake";
import { extractionQueue } from "../workers/extraction.worker";

interface TriggerExtractionInput {
  documentId: string;
  s3Key: string;
  mimeType: string;
  fileName: string;
  encryptedKey: string;
  nonce: string;
  ssecKeyHash?: string;
}

/**
 * Trigger document extraction for an uploaded file.
 *
 * 1. Inserts a pending extraction_results row
 * 2. Adds a job to the BullMQ extraction queue
 *
 * Per Pitfall 6: Form submission is NOT blocked on extraction completion.
 */
export async function triggerExtraction(data: TriggerExtractionInput) {
  try {
    // 1. Insert pending extraction result
    const [inserted] = await db
      .insert(extractionResults)
      .values({
        documentId: data.documentId,
        status: "pending",
      })
      .returning({ id: extractionResults.id });

    // 2. Enqueue BullMQ job
    await extractionQueue.add(
      "extract-document",
      {
        documentId: data.documentId,
        s3Key: data.s3Key,
        mimeType: data.mimeType,
        fileName: data.fileName,
        ssecKeyHash: data.ssecKeyHash || "",
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    return { success: true, extractionId: inserted.id };
  } catch (error: unknown) {
    console.error("Failed to trigger extraction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get extraction results for multiple documents.
 *
 * Used by StepDocuments polling to check extraction status.
 */
export async function getExtractionResults(documentIds: string[]) {
  if (documentIds.length === 0) return [];

  const results = await db
    .select()
    .from(extractionResults)
    .where(inArray(extractionResults.documentId, documentIds));

  return results.map((r) => ({
    id: r.id,
    documentId: r.documentId,
    status: r.status as "pending" | "processing" | "done" | "failed",
    extractionMethod: r.extractionMethod as "docling" | "vision" | null,
    dates: r.dates ? (JSON.parse(r.dates) as string[]) : [],
    parties: r.parties ? (JSON.parse(r.parties) as string[]) : [],
    amounts: r.amounts
      ? (JSON.parse(r.amounts) as Array<{ value: string; currency: string }>)
      : [],
    keyClauses: r.keyClauses ? (JSON.parse(r.keyClauses) as string[]) : [],
    documentType: r.documentType || "",
    summary: r.summary || "",
    userEdited: r.userEdited === 1,
    error: r.error,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Update extraction result fields (client edits).
 *
 * Per D-04: Client can correct extracted values before submission.
 * Sets userEdited flag to 1.
 */
export async function updateExtractionResult(
  id: string,
  fields: Partial<{
    dates: string[];
    parties: string[];
    amounts: Array<{ value: string; currency: string }>;
    keyClauses: string[];
    documentType: string;
    summary: string;
  }>
) {
  try {
    const updateData: Record<string, unknown> = {
      userEdited: 1,
      updatedAt: new Date(),
    };

    if (fields.dates !== undefined) {
      updateData.dates = JSON.stringify(fields.dates);
    }
    if (fields.parties !== undefined) {
      updateData.parties = JSON.stringify(fields.parties);
    }
    if (fields.amounts !== undefined) {
      updateData.amounts = JSON.stringify(fields.amounts);
    }
    if (fields.keyClauses !== undefined) {
      updateData.keyClauses = JSON.stringify(fields.keyClauses);
    }
    if (fields.documentType !== undefined) {
      updateData.documentType = fields.documentType;
    }
    if (fields.summary !== undefined) {
      updateData.summary = fields.summary;
    }

    await db
      .update(extractionResults)
      .set(updateData)
      .where(eq(extractionResults.id, id));

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update extraction result:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error",
    };
  }
}
