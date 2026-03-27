"use client";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TabEchangesIAProps {
  aiFollowUps: Array<{
    id: string;
    stepIndex: number;
    question: string;
    answer: string | null;
    skipped: number | null;
    createdAt: Date;
  }>;
}

export function TabEchangesIA({ aiFollowUps }: TabEchangesIAProps) {
  if (aiFollowUps.length === 0) {
    return (
      <Alert className="mt-4">
        <AlertTitle>Aucun echange IA</AlertTitle>
        <AlertDescription>
          Aucun echange IA n&apos;a ete enregistre pour ce dossier.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {aiFollowUps.map((followUp) => (
        <div key={followUp.id} className="space-y-2">
          {/* AI question - left aligned */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">{followUp.question}</p>
            </div>
          </div>

          {/* Client answer - right aligned */}
          <div className="flex justify-end">
            {followUp.skipped ? (
              <div className="rounded-lg p-3 max-w-[80%]">
                <p className="text-sm text-muted-foreground italic">
                  (Question passee)
                </p>
              </div>
            ) : (
              <div className="bg-primary/10 rounded-lg p-3 max-w-[80%]">
                <p className="text-sm">{followUp.answer}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
