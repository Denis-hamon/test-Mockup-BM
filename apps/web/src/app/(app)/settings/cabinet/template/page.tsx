import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getSpecialtyTemplates,
  getTemplateForLawyer,
} from "@/server/actions/template.actions";
import { TemplateSelector } from "@/components/templates/template-selector";

export default async function TemplateSelectionPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    redirect("/dashboard");
  }

  const [specialties, templateResult] = await Promise.all([
    getSpecialtyTemplates(),
    getTemplateForLawyer(),
  ]);

  const existingTemplate = templateResult.template
    ? { id: templateResult.template.id, specialty: templateResult.template.specialty }
    : null;

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <TemplateSelector
        specialties={specialties}
        existingTemplate={existingTemplate}
      />
    </div>
  );
}
