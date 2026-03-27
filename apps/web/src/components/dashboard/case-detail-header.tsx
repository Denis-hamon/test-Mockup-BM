"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import { StatusDropdown } from "@/components/dashboard/status-dropdown";

interface CaseDetailHeaderProps {
  submission: {
    id: string;
    fullName: string;
    problemType: string;
    createdAt: Date;
    status: string;
  };
  score: number | null;
}

export function CaseDetailHeader({
  submission,
  score,
}: CaseDetailHeaderProps) {
  const formattedDate = new Date(submission.createdAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="sticky top-[49px] z-10 bg-background pb-4 border-b">
      <Link
        href="/dossiers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ChevronLeft className="size-4" />
        Retour aux dossiers
      </Link>

      <h1 className="text-xl font-semibold mb-2">{submission.fullName}</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary">{submission.problemType}</Badge>
        <ScoreBadge score={score} />
        <StatusDropdown
          submissionId={submission.id}
          currentStatus={submission.status}
          clientName={submission.fullName}
        />
        <span className="text-sm text-muted-foreground">
          Soumis le {formattedDate}
        </span>
      </div>
    </div>
  );
}
