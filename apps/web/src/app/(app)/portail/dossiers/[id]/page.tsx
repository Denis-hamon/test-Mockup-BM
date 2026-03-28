import { redirect } from "next/navigation";
import Link from "next/link";
import { getClientCaseDetail } from "@/server/actions/portal.actions";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseStatusTracker } from "@/components/portal/case-status-tracker";
import { ClientTimeline } from "@/components/portal/client-timeline";
import { DocumentGrid } from "@/components/portal/document-grid";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Nouveau: "bg-primary/10 text-primary border-transparent",
  "En cours":
    "bg-[hsl(220_70%_50%/0.15)] text-[hsl(220_70%_40%)] border-transparent",
  Termine:
    "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)] border-transparent",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailClientPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "client") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const result = await getClientCaseDetail(id);

  if (!result.success || !result.data) {
    redirect("/portail/dossiers");
  }

  const { submission, timeline, documents, conversationId } = result.data;

  // Build timeline events from case timeline data
  const timelineEvents: Array<{ date: string; description: string }> = [];

  // Add submission event
  if (submission.createdAt) {
    timelineEvents.push({
      date: new Date(submission.createdAt).toISOString(),
      description: "Dossier soumis",
    });
  }

  // Add timeline events from AI extraction
  if (timeline?.events && Array.isArray(timeline.events)) {
    for (const event of timeline.events) {
      if (event && typeof event === "object" && "date" in event && "description" in event) {
        timelineEvents.push({
          date: String(event.date),
          description: String(event.description),
        });
      }
    }
  }

  // Sort by date descending
  timelineEvents.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/portail/dossiers"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a mes dossiers
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-semibold leading-[1.2]">
            {submission.problemType ?? "Dossier"}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              STATUS_STYLES[submission.status] ?? ""
            )}
          >
            {submission.status}
          </Badge>
        </div>
        <CaseStatusTracker status={submission.status} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suivi">
        <TabsList>
          <TabsTrigger value="suivi">Suivi</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="suivi" className="mt-6">
          <ClientTimeline events={timelineEvents} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentGrid documents={documents} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          {conversationId ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                La messagerie sera disponible prochainement.
              </p>
              <Link
                href={`/portail/messages?conversation=${conversationId}`}
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Acceder aux messages
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-sm font-semibold">
                Aucun message pour le moment
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Les messages appara\u00eetront ici une fois que votre avocat aura
                pris en charge votre dossier.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
