"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { regenerateCaseForLawyer } from "@/server/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { CaseIntelligenceResult } from "@/server/actions/case-intelligence.actions";

interface TabSyntheseProps {
  intelligence: CaseIntelligenceResult;
  submissionId: string;
}

export function TabSynthese({ intelligence, submissionId }: TabSyntheseProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateCaseForLawyer(submissionId);
      if (result.success) {
        toast.success("Fiche synthetique regeneree");
        router.refresh();
      } else {
        toast.error(
          "La regeneration de la fiche IA a echoue. Reessayez dans quelques instants."
        );
      }
    });
  }

  const { summary } = intelligence;

  if (!summary) {
    return (
      <Alert className="mt-4">
        <AlertTitle>Fiche synthetique non disponible</AlertTitle>
        <AlertDescription>
          La fiche synthetique n&apos;a pas encore ete generee pour ce dossier.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Synthese du dossier</CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPending}
          >
            <RefreshCw
              className={isPending ? "animate-spin" : ""}
            />
            Regenerer la fiche IA
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Situation summary */}
        {summary.situationSummary && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Situation</h3>
            <p className="text-sm text-muted-foreground">
              {summary.situationSummary}
            </p>
          </div>
        )}

        {/* Key facts */}
        {summary.keyFacts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Faits cles</h3>
            <ul className="list-disc list-inside space-y-1">
              {summary.keyFacts.map((fact, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opposing parties */}
        {summary.opposingParties.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Parties adverses</h3>
            <p className="text-sm text-muted-foreground">
              {summary.opposingParties.join(", ")}
            </p>
          </div>
        )}

        {/* Urgency assessment */}
        {summary.urgencyAssessment && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Urgence</h3>
            <Badge variant="secondary">{summary.urgencyAssessment}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
