import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null;
  className?: string;
}

function getScoreConfig(score: number) {
  if (score >= 70) {
    return {
      label: "Eleve",
      bg: "bg-[hsl(142_71%_45%/15%)]",
      text: "text-[hsl(142_71%_30%)]",
    };
  }
  if (score >= 40) {
    return {
      label: "Moyen",
      bg: "bg-[hsl(38_92%_50%/15%)]",
      text: "text-[hsl(38_92%_35%)]",
    };
  }
  return {
    label: "Faible",
    bg: "bg-destructive/15",
    text: "text-destructive",
  };
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score === null || score === undefined) return null;

  const config = getScoreConfig(score);

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {score}
      <span className="sr-only">
        Score de qualification: {score} sur 100, {config.label.toLowerCase()}
      </span>
      <span aria-hidden="true">{config.label}</span>
    </span>
  );
}
