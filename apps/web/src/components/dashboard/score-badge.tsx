"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null;
  className?: string;
}

function getScoreConfig(score: number) {
  if (score >= 70)
    return {
      label: "Eleve",
      className: "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)] border-transparent",
    };
  if (score >= 40)
    return {
      label: "Moyen",
      className: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38_92%_35%)] border-transparent",
    };
  return {
    label: "Faible",
    className: "bg-destructive/15 text-destructive border-transparent",
  };
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score === null || score === undefined) return null;

  const config = getScoreConfig(score);

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      <span className="sr-only">Score de qualification: {score} sur 100, </span>
      {score} {config.label}
    </Badge>
  );
}
