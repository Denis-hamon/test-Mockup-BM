import { ImageResponse } from "next/og";
import { getTemplateBySlug } from "@/server/actions/template.actions";
import { db } from "@/lib/db";
import { lawyerProfiles } from "@/lib/db/schema/lawyer";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Dynamic OG image for /cabinet-[slug] (D-05)
// ---------------------------------------------------------------------------

export const runtime = "edge";
export const alt = "LegalConnect - Consultation en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const template = await getTemplateBySlug(slug);

  // Fallback generic image
  if (!template) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#1a365d",
            color: "#ffffff",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700 }}>LegalConnect</div>
          <div style={{ fontSize: 24, opacity: 0.7, marginTop: 16 }}>
            Consultation juridique en ligne
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const profile = await db.query.lawyerProfiles.findFirst({
    where: eq(lawyerProfiles.userId, template.lawyerId),
  });

  const firmName = profile?.firmName ?? "Cabinet";
  const specialties = safeJsonParse<string[]>(profile?.specialties, []);
  const bgColor = template.accentColor ?? "#1a365d";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: bgColor,
          color: "#ffffff",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {firmName}
        </div>

        {specialties.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {specialties.map((s) => (
              <div
                key={s}
                style={{
                  fontSize: 24,
                  opacity: 0.8,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "8px 20px",
                  borderRadius: 8,
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            fontSize: 20,
            opacity: 0.6,
            marginTop: 32,
          }}
        >
          Consultation en ligne | LegalConnect
        </div>
      </div>
    ),
    { ...size }
  );
}
