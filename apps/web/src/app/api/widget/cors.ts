/**
 * Shared CORS headers for widget API routes.
 * All widget endpoints must be accessible cross-origin since the widget
 * is embedded on third-party lawyer websites.
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400", // 24h preflight cache
} as const;

/**
 * Standard OPTIONS preflight response for widget API routes.
 */
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
