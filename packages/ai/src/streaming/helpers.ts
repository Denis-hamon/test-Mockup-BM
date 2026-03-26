/**
 * Streaming utility helpers for AI SDK streams.
 *
 * Per D-09: Provides utilities for collecting and processing
 * AI SDK text streams.
 */

/**
 * Collect all text-delta chunks from a ReadableStream into a single string.
 *
 * Used by the UPL guardrail middleware to buffer streaming responses
 * for legal advice checking.
 *
 * @param stream - A ReadableStream of AI SDK chunks
 * @returns The concatenated text from all text-delta chunks
 */
export async function collectStream(
  stream: ReadableStream<any>
): Promise<string> {
  const reader = stream.getReader();
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value && value.type === "text-delta" && value.textDelta) {
        text += value.textDelta;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return text;
}
