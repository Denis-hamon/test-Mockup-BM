import type { Metadata } from "next";
import { getTemplateBySlug } from "@/server/actions/template.actions";
import { DynamicStepper } from "@/components/intake/dynamic-stepper";
import { CobrandingFooter } from "@/components/intake/cobranding-footer";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { IntakeTemplate, BrandingConfig } from "@legalconnect/shared";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Intake - ${slug} | LegalConnect`,
    description: "Formulaire de prise de contact personnalise",
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function IntakeSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const template = await getTemplateBySlug(slug);

  // 404: invalid slug or inactive template
  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Formulaire introuvable</AlertTitle>
          <AlertDescription>
            Ce formulaire n&apos;existe pas ou n&apos;est plus disponible.{" "}
            <Link href="/" className="underline">
              Retour a l&apos;accueil
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // CSS variables for lawyer branding (accent color)
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
    <div
      className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12"
      style={cssVars}
    >
      {/* Header: lawyer logo + welcome text */}
      <header className="flex flex-col gap-3">
        {template.logoUrl && (
          <img
            src={template.logoUrl}
            alt="Logo du cabinet"
            className="max-h-12 w-auto object-contain"
          />
        )}
        {template.welcomeText && (
          <p className="text-lg text-muted-foreground">{template.welcomeText}</p>
        )}
      </header>

      {/* Dynamic intake form */}
      <DynamicStepper
        template={template.schema as IntakeTemplate}
        branding={branding}
        templateId={template.id}
      />

      {/* Co-branding footer */}
      <CobrandingFooter />
    </div>
  );
}
