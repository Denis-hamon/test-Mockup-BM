import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLawyerProfile } from "@/server/actions/lawyer-settings.actions";
import { getTemplateForLawyer } from "@/server/actions/template.actions";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { SnippetCopyBlock } from "@/components/integration/snippet-copy-block";
import { HostedLinkCopy } from "@/components/integration/hosted-link-copy";
import { WidgetPreview } from "@/components/integration/widget-preview";

// ---------------------------------------------------------------------------
// Integration settings page (D-07)
// ---------------------------------------------------------------------------

export default async function IntegrationSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    redirect("/dashboard");
  }

  const profileResult = await getLawyerProfile();
  const templateResult = await getTemplateForLawyer();

  const profile = profileResult.profile;
  const template = templateResult.template;

  // No template configured yet
  if (!template?.slug) {
    return (
      <div className="flex max-w-2xl flex-col gap-8">
        <h1 className="text-xl font-semibold">Integration</h1>
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Configuration requise</AlertTitle>
          <AlertDescription>
            Completez votre profil cabinet pour generer le code
            d&apos;integration.{" "}
            <Link href="/settings/cabinet/template" className="underline">
              Configurer mon formulaire
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const firmName = profile?.firmName ?? "Mon cabinet";
  const accentColor = template.accentColor ?? "#1a365d";

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* Section 1: Widget snippet */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold">Integration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Integrez le formulaire d&apos;intake directement sur votre site web.
          </p>
        </div>

        {/* Step 1 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">
            Etape 1 : Copiez le code
          </p>
          <SnippetCopyBlock slug={template.slug} accentColor={accentColor} />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">
            Etape 2 : Collez-le avant &lt;/body&gt;
          </p>
          <p className="text-sm text-muted-foreground">
            Ajoutez ce code juste avant la balise &lt;/body&gt; de votre site.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">
            Etape 3 : C&apos;est pret !
          </p>
          <p className="text-sm text-muted-foreground">
            Le bouton flottant apparaitra en bas a droite de votre site.
          </p>
        </div>
      </div>

      <Separator />

      {/* Section 2: Hosted page link */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Page hebergee</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Partagez ce lien avec vos clients :
          </p>
        </div>
        <HostedLinkCopy slug={template.slug} />
      </div>

      <Separator />

      {/* Section 3: Widget preview */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Apercu du widget</h2>
        <WidgetPreview accentColor={accentColor} firmName={firmName} />
      </div>
    </div>
  );
}
