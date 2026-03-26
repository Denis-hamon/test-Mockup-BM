/**
 * BullMQ worker for document extraction.
 *
 * Routes by MIME type:
 * - application/pdf -> Docling HTTP service
 * - image/* -> AI Vision (Claude multimodal)
 *
 * Files are SSE-C encrypted in S3. The worker downloads using the
 * SSE-C key, decrypts in memory, then passes to the extraction service.
 *
 * Per Pitfall 4: Workers run as a SEPARATE process (via start.ts),
 * NOT inside Next.js API routes.
 */

import { Worker, Queue } from "bullmq";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { s3Client } from "@/lib/s3";
import { db } from "@/lib/db";
import { extractionResults } from "@/lib/db/schema/intake";
import { extractWithDocling } from "../services/docling.service";
import {
  extractWithVision,
  parseDoclingToExtractionResult,
} from "../services/extraction.service";
import type { ExtractionResult } from "../services/extraction.service";

export interface ExtractionJobData {
  documentId: string;
  s3Key: string;
  mimeType: string;
  fileName: string;
  ssecKeyHash: string; // base64 SSE-C key hash for S3 download
}

const S3_BUCKET = process.env.OVH_S3_BUCKET || "legalconnect-uploads";

const connection = {
  host: process.env.VALKEY_HOST || "localhost",
  port: parseInt(process.env.VALKEY_PORT || "6379"),
};

/**
 * Extraction job queue. Used by the trigger action to enqueue jobs.
 */
export const extractionQueue = new Queue<ExtractionJobData>(
  "document-extraction",
  { connection }
);

/**
 * Download a file from S3 using SSE-C key.
 */
async function downloadFromS3(
  s3Key: string,
  ssecKeyHash: string
): Promise<Buffer> {
  const ssecKeyBuffer = Buffer.from(ssecKeyHash, "base64");

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    SSECustomerAlgorithm: "AES256",
    SSECustomerKey: ssecKeyHash,
    SSECustomerKeyMD5: Buffer.from(
      await crypto.subtle.digest("SHA-256", ssecKeyBuffer)
    )
      .toString("base64")
      .slice(0, 24), // MD5 of key for verification
  });

  const response = await s3Client.send(command);
  const stream = response.Body;
  if (!stream) {
    throw new Error(`Empty response from S3 for key: ${s3Key}`);
  }

  // Convert readable stream to Buffer
  const chunks: Uint8Array[] = [];
  const reader = stream.transformToByteArray();
  const bytes = await reader;
  return Buffer.from(bytes);
}

/**
 * BullMQ worker for document extraction jobs.
 */
export const extractionWorker = new Worker<ExtractionJobData>(
  "document-extraction",
  async (job) => {
    const { documentId, s3Key, mimeType, fileName, ssecKeyHash } = job.data;

    // 1. Update status to processing
    await db
      .update(extractionResults)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(extractionResults.documentId, documentId));

    try {
      // 2. Download file from S3 using SSE-C key
      const fileBuffer = await downloadFromS3(s3Key, ssecKeyHash);

      // 3. Route by MIME type
      const isPDF = mimeType === "application/pdf";
      const isImage = mimeType.startsWith("image/");

      let result: ExtractionResult;
      let method: "docling" | "vision";

      if (isPDF) {
        // Try Docling first, fallback to Vision on failure
        try {
          const doclingResult = await extractWithDocling(fileBuffer, fileName);
          result = await parseDoclingToExtractionResult(doclingResult);
          method = "docling";
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          // Fallback to Vision if Docling unavailable or fails
          if (
            message.includes("DOCLING_UNAVAILABLE") ||
            message.includes("5")
          ) {
            console.warn(
              `Docling failed for ${fileName}, falling back to Vision: ${message}`
            );
            result = await extractWithVision(fileBuffer, "application/pdf");
            method = "vision";
          } else {
            throw error;
          }
        }
      } else if (isImage) {
        result = await extractWithVision(fileBuffer, mimeType);
        method = "vision";
      } else {
        // Unsupported type — mark as skipped
        await db
          .update(extractionResults)
          .set({
            status: "done",
            summary: "Type de fichier non supporte pour l'extraction.",
            updatedAt: new Date(),
          })
          .where(eq(extractionResults.documentId, documentId));

        return { status: "skipped", reason: "unsupported_type" };
      }

      // 4. Save extraction result to DB
      await db
        .update(extractionResults)
        .set({
          status: "done",
          extractionMethod: method,
          dates: JSON.stringify(result.dates),
          parties: JSON.stringify(result.parties),
          amounts: JSON.stringify(result.amounts),
          keyClauses: JSON.stringify(result.keyClauses),
          documentType: result.documentType,
          summary: result.summary,
          rawOutput: JSON.stringify(result),
          updatedAt: new Date(),
        })
        .where(eq(extractionResults.documentId, documentId));

      return { status: "done", documentId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      // 5. Mark as failed with error message
      await db
        .update(extractionResults)
        .set({
          status: "failed",
          error: message.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(extractionResults.documentId, documentId));

      throw error; // Re-throw for BullMQ retry logic
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

// Graceful shutdown
extractionWorker.on("failed", (job, error) => {
  console.error(
    `Extraction job ${job?.id} failed for document ${job?.data?.documentId}:`,
    error.message
  );
});

extractionWorker.on("completed", (job) => {
  console.log(
    `Extraction job ${job.id} completed for document ${job.data.documentId}`
  );
});
