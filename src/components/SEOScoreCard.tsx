import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Search, FileText, Layout, Tag } from "lucide-react";

interface SEOBreakdown {
  keywords?: number;
  readability?: number;
  structure?: number;
  meta?: number;
}

interface SEOScoreCardProps {
  score: number;
  breakdown?: SEOBreakdown;
}

function ScoreCircle({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 50) return "Good";
    return "Needs Work";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getColor(score)}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-xs text-muted-foreground">{getLabel(score)}</span>
      </div>
    </div>
  );
}

function BreakdownItem({
  icon: Icon,
  label,
  score,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  score: number;
}) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="font-medium">{score}</span>
      </div>
      <Progress value={score} className={`h-2 [&>div]:${getColor(score)}`} />
    </div>
  );
}

export function SEOScoreCard({ score, breakdown }: SEOScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          SEO Score
        </CardTitle>
        <CardDescription>
          Content optimization analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScoreCircle score={score} />

        {breakdown && (
          <div className="space-y-4 pt-4 border-t">
            <BreakdownItem
              icon={Search}
              label="Keywords"
              score={breakdown.keywords || 0}
            />
            <BreakdownItem
              icon={FileText}
              label="Readability"
              score={breakdown.readability || 0}
            />
            <BreakdownItem
              icon={Layout}
              label="Structure"
              score={breakdown.structure || 0}
            />
            <BreakdownItem
              icon={Tag}
              label="Meta Tags"
              score={breakdown.meta || 0}
            />
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Recommendations</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {score < 80 && (
              <>
                {(!breakdown?.keywords || breakdown.keywords < 70) && (
                  <li className="flex items-start gap-2">
                    <span className="text-warning">-</span>
                    Add more relevant keywords to the content
                  </li>
                )}
                {(!breakdown?.readability || breakdown.readability < 70) && (
                  <li className="flex items-start gap-2">
                    <span className="text-warning">-</span>
                    Improve sentence structure for better readability
                  </li>
                )}
                {(!breakdown?.structure || breakdown.structure < 70) && (
                  <li className="flex items-start gap-2">
                    <span className="text-warning">-</span>
                    Add more headings and organize content better
                  </li>
                )}
                {(!breakdown?.meta || breakdown.meta < 70) && (
                  <li className="flex items-start gap-2">
                    <span className="text-warning">-</span>
                    Optimize meta description and title tags
                  </li>
                )}
              </>
            )}
            {score >= 80 && (
              <li className="flex items-start gap-2">
                <span className="text-success">-</span>
                Content is well optimized for SEO
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
