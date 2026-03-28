import type { Metadata } from "next";
import { getTemplateBySlug } from "@/server/actions/template.actions";
import { db } from "@/lib/db";
import { lawyerProfiles } from "@/lib/db/schema/lawyer";
import { eq } from "drizzle-orm";
import { DynamicStepper } from "@/components/intake/dynamic-stepper";
import { CobrandingFooter } from "@/components/intake/cobranding-footer";
import { LawyerHero } from "@/components/landing/lawyer-hero";
import { SpecialtyGrid } from "@/components/landing/specialty-card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { IntakeTemplate, BrandingConfig } from "@legalconnect/shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Metadata (D-05)
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const template = await getTemplateBySlug(slug);
  if (!template) {
    return { title: "Cabinet introuvable | LegalConnect" };
  }

  const profile = await db.query.lawyerProfiles.findFirst({
    where: eq(lawyerProfiles.userId, template.lawyerId),
  });

  const firmName = profile?.firmName ?? "Cabinet";
  const specialties = safeJsonParse<string[]>(profile?.specialties, []);
  const specialtiesText =
    specialties.length > 0 ? ` - ${specialties.join(", ")}` : "";

  return {
    title: `${firmName} | Consultation en ligne | LegalConnect`,
    description: `${firmName}${specialtiesText}. Prenez rendez-vous en ligne en toute confidentialite.`,
    openGraph: {
      type: "website",
      title: `${firmName} | Consultation en ligne`,
      description: `${firmName}${specialtiesText}. Prenez rendez-vous en ligne en toute confidentialite.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CabinetSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const template = await getTemplateBySlug(slug);

  // 404: invalid slug or inactive template
  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Cabinet introuvable</AlertTitle>
          <AlertDescription>
            Ce cabinet n&apos;existe pas ou n&apos;est plus disponible.{" "}
            <Link href="/" className="underline">
              Retour a l&apos;accueil
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch lawyer profile for hero section
  const profile = await db.query.lawyerProfiles.findFirst({
    where: eq(lawyerProfiles.userId, template.lawyerId),
  });

  const firmName = profile?.firmName ?? "Cabinet";
  const specialties = safeJsonParse<string[]>(profile?.specialties, []);

  // CSS variables for lawyer branding
  const cssVars = template.accentColor
    ? ({
        "--lawyer-accent": template.accentColor,
        "--lawyer-accent-foreground": "#fafafa",
      } as React.CSSProperties)
    : {};

  const branding: BrandingConfig = {
    logoUrl: template.logoUrl ?? undefined,
    accentColor: template.accentColor ?? undefined,
    welcomeText: template.welcomeText ?? undefined,
    slug: template.slug ?? undefined,
  };

  return (
    <div className="flex flex-col scroll-smooth" style={cssVars}>
      {/* Hero section */}
      <LawyerHero
        firmName={firmName}
        specialties={specialties}
        description={profile?.description}
        photoUrl={profile?.photoUrl}
        accentColor={template.accentColor}
      />

      {/* Specialty cards */}
      <SpecialtyGrid specialties={specialties} />

      {/* Intake form */}
      <section id="intake" className="mx-auto w-full max-w-2xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">
          Formulaire de prise de contact
        </h2>
        <DynamicStepper
          template={template.schema as IntakeTemplate}
          branding={branding}
          templateId={template.id}
        />
      </section>

      {/* Footer */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-8">
        <CobrandingFooter />
      </div>
    </div>
  );
}
