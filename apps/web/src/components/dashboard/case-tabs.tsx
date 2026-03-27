"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TabSynthese } from "@/components/dashboard/tab-synthese";
import { TabDocuments } from "@/components/dashboard/tab-documents";
import { TabTimeline } from "@/components/dashboard/tab-timeline";
import { TabEchangesIA } from "@/components/dashboard/tab-echanges-ia";
import type { CaseIntelligenceResult } from "@/server/actions/case-intelligence.actions";

interface CaseTabsProps {
  intelligence: CaseIntelligenceResult;
  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  }>;
  aiFollowUps: Array<{
    id: string;
    stepIndex: number;
    question: string;
    answer: string | null;
    skipped: number | null;
    createdAt: Date;
  }>;
  submissionId: string;
}

export function CaseTabs({
  intelligence,
  documents,
  aiFollowUps,
  submissionId,
}: CaseTabsProps) {
  return (
    <Tabs
      defaultValue="synthese"
      onValueChange={(value) => {
        if (typeof window !== "undefined") {
          window.location.hash = value as string;
        }
      }}
    >
      <TabsList variant="line">
        <TabsTrigger value="synthese">Synthese</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="echanges">Echanges IA</TabsTrigger>
      </TabsList>

      <TabsContent value="synthese" className="min-h-[400px]">
        <TabSynthese
          intelligence={intelligence}
          submissionId={submissionId}
        />
      </TabsContent>

      <TabsContent value="documents" className="min-h-[400px]">
        <TabDocuments documents={documents} />
      </TabsContent>

      <TabsContent value="timeline" className="min-h-[400px]">
        <TabTimeline timeline={intelligence.timeline} />
      </TabsContent>

      <TabsContent value="echanges" className="min-h-[400px]">
        <TabEchangesIA aiFollowUps={aiFollowUps} />
      </TabsContent>
    </Tabs>
  );
}
