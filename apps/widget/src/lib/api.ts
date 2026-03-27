/**
 * Widget API client.
 * Derives the API base URL from the script src origin so the widget
 * can be embedded on any domain and still reach the LegalConnect backend.
 */

let API_BASE = "";

/**
 * Initialize the API base from the script tag's src attribute.
 */
export function initApiBase(scriptSrc: string): void {
  try {
    const url = new URL(scriptSrc);
    API_BASE = url.origin;
  } catch {
    // Fallback: same origin
    API_BASE = window.location.origin;
  }
}

/**
 * Fetch template data by slug.
 */
export async function fetchTemplate(
  slug: string
): Promise<{
  id: string;
  specialty: string;
  schema: unknown;
  logoUrl: string | null;
  accentColor: string | null;
  welcomeText: string | null;
  slug: string;
} | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/widget/template/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) {
      console.error(`[LegalConnect] Template fetch failed: ${res.status}`);
      return null;
    }

    return res.json();
  } catch (err) {
    console.error("[LegalConnect] Template fetch error:", err);
    return null;
  }
}

/**
 * Submit widget intake form data.
 */
export async function submitWidgetIntake(
  slug: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/widget/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ slug, responses: data }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        error: (body as { error?: string }).error || `HTTP ${res.status}`,
      };
    }

    return res.json();
  } catch (err) {
    console.error("[LegalConnect] Submit error:", err);
    return { success: false, error: "network_error" };
  }
}
