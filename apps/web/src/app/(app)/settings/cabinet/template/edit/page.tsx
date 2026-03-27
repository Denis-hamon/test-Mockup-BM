import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTemplateForLawyer } from "@/server/actions/template.actions";
import { TemplateEditor } from "@/components/templates/template-editor";
import type { IntakeTemplate, BrandingConfig } from "@legalconnect/shared";

export default async function TemplateEditPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    redirect("/dashboard");
  }

  const result = await getTemplateForLawyer();

  if (!result.template) {
    redirect("/settings/cabinet/template");
  }

  const template = result.template;
  const schema = template.schema as IntakeTemplate;
  const branding: BrandingConfig = {
    logoUrl: template.logoUrl ?? undefined,
    accentColor: template.accentColor ?? undefined,
    welcomeText: template.welcomeText ?? undefined,
    slug: template.slug ?? undefined,
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <TemplateEditor
        initialTemplate={schema}
        initialBranding={branding}
        templateId={template.id}
      />
    </div>
  );
}
