/**
 * UPL (Unauthorized Practice of Law) Guardrail Middleware.
 *
 * Per D-01: Intercepts all AI model outputs and rewrites any
 * responses containing legal advice before they reach the user.
 *
 * Implements LanguageModelMiddleware from Vercel AI SDK 6.
 */

import { containsLegalAdvice } from "./patterns";
import { rewriteWithoutAdvice } from "./rewrite";
import { shouldAddDisclaimer, addDisclaimer } from "./disclaimer";

/**
 * Process text through the UPL guardrail pipeline:
 * 1. Check for legal advice -> rewrite if found
 * 2. Check for sensitive topics -> add disclaimer if needed
 */
async function processText(text: string): Promise<string> {
  let processed = text;

  // Step 1: Rewrite legal advice
  if (containsLegalAdvice(processed)) {
    processed = await rewriteWithoutAdvice(processed);
  }

  // Step 2: Add disclaimer for sensitive topics
  if (shouldAddDisclaimer(processed)) {
    processed = addDisclaimer(processed);
  }

  return processed;
}

/**
 * UPL Guardrail Middleware for Vercel AI SDK 6.
 *
 * Wraps both generate and stream calls to intercept legal advice.
 * For streaming: uses full-buffer approach (v1) — collects the entire
 * stream, checks/rewrites, then emits the result.
 */
export const uplGuardrailMiddleware = {
  wrapGenerate: async ({ doGenerate }: { doGenerate: () => PromiseLike<any> }) => {
    const result = await doGenerate();

    if (result.text) {
      result.text = await processText(result.text);
    }

    return result;
  },

  wrapStream: async ({ doStream }: { doStream: () => PromiseLike<any> }) => {
    const { stream, ...rest } = await doStream();

    // Full-buffer approach: collect all chunks, process, then re-emit
    const transformStream = new TransformStream<any, any>({
      start() {},
      async transform(chunk, controller) {
        // Pass through non-text chunks immediately
        if (chunk.type !== "text-delta") {
          controller.enqueue(chunk);
          return;
        }
        // Buffer text-delta chunks - they'll be collected and processed at flush
        controller.enqueue(chunk);
      },
    });

    // For v1, we use a simpler approach: buffer all text, process at the end
    let fullText = "";
    const processedStream = new TransformStream<any, any>({
      async transform(chunk, controller) {
        if (chunk.type === "text-delta") {
          fullText += chunk.textDelta;
          // Don't emit yet - we'll emit the processed version at flush
        } else {
          controller.enqueue(chunk);
        }
      },
      async flush(controller) {
        if (fullText) {
          const processed = await processText(fullText);
          controller.enqueue({
            type: "text-delta",
            textDelta: processed,
          });
        }
        controller.enqueue({
          type: "finish",
          finishReason: "stop",
          usage: { promptTokens: 0, completionTokens: 0 },
        });
      },
    });

    return {
      stream: stream.pipeThrough(processedStream),
      ...rest,
    };
  },
};
