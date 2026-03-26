/**
 * Docling HTTP client for PDF document extraction.
 *
 * Calls Docling Serve's /v1/convert/file endpoint with multipart upload.
 * Files are SSE-C encrypted in S3, so the BullMQ worker decrypts first
 * and passes the buffer here (Pitfall 1 from RESEARCH.md).
 */

const DOCLING_URL = process.env.DOCLING_URL || "http://localhost:5001";

export interface DoclingResult {
  text: string;
  tables: Array<{ headers: string[]; rows: string[][] }>;
  metadata: Record<string, unknown>;
}

/**
 * Extract text and structured data from a PDF via Docling Serve.
 *
 * Uses /v1/convert/file (multipart) — NOT URL-based endpoint,
 * because files are SSE-C encrypted and must be decrypted first.
 *
 * @param fileBuffer - Decrypted file content
 * @param fileName - Original file name (helps Docling detect format)
 * @throws Error with status code on failure, specific error on ECONNREFUSED
 */
export async function extractWithDocling(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingResult> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: "application/pdf" });
  formData.append("files", blob, fileName);

  let response: Response;
  try {
    response = await fetch(`${DOCLING_URL}/v1/convert/file`, {
      method: "POST",
      body: formData,
    });
  } catch (error: unknown) {
    const err = error as { cause?: { code?: string } };
    if (
      err.cause?.code === "ECONNREFUSED" ||
      (error instanceof Error && error.message.includes("ECONNREFUSED"))
    ) {
      throw new Error("DOCLING_UNAVAILABLE: Docling service is not reachable");
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Docling extraction failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Parse Docling response into our structured format
  // Docling returns a document object with pages and content
  const result: DoclingResult = {
    text: "",
    tables: [],
    metadata: {},
  };

  if (data.document) {
    // Extract text from document body
    if (data.document.body) {
      result.text = data.document.body
        .filter(
          (item: { type: string }) =>
            item.type === "paragraph" || item.type === "text"
        )
        .map((item: { text?: string }) => item.text || "")
        .join("\n");
    }

    // Extract tables
    if (data.document.tables) {
      result.tables = data.document.tables.map(
        (table: { data?: { headers?: string[]; rows?: string[][] } }) => ({
          headers: table.data?.headers || [],
          rows: table.data?.rows || [],
        })
      );
    }

    // Copy metadata
    if (data.document.metadata) {
      result.metadata = data.document.metadata;
    }
  } else if (typeof data === "string") {
    // Simple text response fallback
    result.text = data;
  } else {
    // Fallback: stringify entire response
    result.text = JSON.stringify(data);
    result.metadata = data;
  }

  return result;
}
