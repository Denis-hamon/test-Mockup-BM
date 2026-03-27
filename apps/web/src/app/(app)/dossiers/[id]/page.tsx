import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCaseDetailForLawyer } from "@/server/actions/dashboard.actions";
import { CaseDetailHeader } from "@/components/dashboard/case-detail-header";
import { CaseTabs } from "@/components/dashboard/case-tabs";
import { InternalNotes } from "@/components/dashboard/internal-notes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "avocat") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const result = await getCaseDetailForLawyer(id);

  if (!result.success || !result.data) {
    redirect("/dossiers");
  }

  const { submission, intelligence, documents, aiFollowUps, notes } =
    result.data;

  return (
    <div className="flex flex-col gap-6">
      <CaseDetailHeader
        submission={submission}
        score={intelligence.score?.overallScore ?? null}
      />
      <CaseTabs
        intelligence={intelligence}
        documents={documents}
        aiFollowUps={aiFollowUps}
        submissionId={id}
      />
      <InternalNotes submissionId={id} notes={notes} />
    </div>
  );
}
