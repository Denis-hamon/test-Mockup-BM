/**
 * BullMQ worker start script.
 *
 * Run as a separate process in development:
 *   tsx apps/web/src/server/workers/start.ts
 *
 * Per Pitfall 4: BullMQ workers MUST NOT be initialized inside
 * Next.js API routes — they run as a separate long-lived process.
 */

import { extractionWorker } from "./extraction.worker";

console.log("Starting document extraction worker...");
console.log(
  `Connected to Valkey at ${process.env.VALKEY_HOST || "localhost"}:${process.env.VALKEY_PORT || "6379"}`
);

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await extractionWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await extractionWorker.close();
  process.exit(0);
});

console.log("Document extraction worker is running. Press Ctrl+C to stop.");
