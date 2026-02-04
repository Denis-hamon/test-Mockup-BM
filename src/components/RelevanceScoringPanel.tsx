import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Target,
  AlertCircle,
  Brain,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import api, { type Article } from "@/lib/api";
import { ProjectIntentionModal } from "./ProjectIntentionModal";

interface RelevanceScoringPanelProps {
  projectId: number;
  articles: Article[];
  onComplete?: () => void;
}

export function RelevanceScoringPanel({
  projectId,
  articles,
}: RelevanceScoringPanelProps) {
  const [showIntentionModal, setShowIntentionModal] = useState(false);

  // Fetch relevance stats
  const { data: stats } = useQuery({
    queryKey: ["relevance-stats", projectId],
    queryFn: () => api.getRelevanceStats(projectId),
    enabled: !!projectId,
    refetchInterval: 10000, // Refresh every 10s to show auto-scoring progress
  });

  // Get unscored articles count
  const unscoredCount = articles.filter(
    (a) => a.relevance_score === null || a.relevance_score === undefined
  ).length;

  const totalArticles = parseInt(stats?.total_articles || "0");
  const scoredArticles = parseInt(stats?.scored_articles || "0");
  const scoringPercentage =
    totalArticles > 0 ? Math.round((scoredArticles / totalArticles) * 100) : 0;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Relevance Scoring
            <Badge variant="outline" className="ml-auto text-xs bg-green-500/10 text-green-600 border-green-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-background/50"
              >
                <div className="text-2xl font-bold text-green-600">
                  {stats.highly_relevant}
                </div>
                <div className="text-xs text-muted-foreground">
                  Highly Relevant (80+)
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-3 rounded-lg bg-background/50"
              >
                <div className="text-2xl font-bold text-blue-600">
                  {stats.relevant}
                </div>
                <div className="text-xs text-muted-foreground">
                  Relevant (60-79)
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center p-3 rounded-lg bg-background/50"
              >
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.moderate}
                </div>
                <div className="text-xs text-muted-foreground">
                  Moderate (40-59)
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-3 rounded-lg bg-background/50"
              >
                <div className="text-2xl font-bold text-red-600">
                  {stats.low_relevance}
                </div>
                <div className="text-xs text-muted-foreground">
                  Low (&lt;40)
                </div>
              </motion.div>
            </div>
          )}

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {scoredArticles} / {totalArticles} articles scored
              </span>
              <span className="font-medium">{scoringPercentage}%</span>
            </div>
            <Progress value={scoringPercentage} className="h-2" />
            {stats?.avg_score && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Average score: <span className="font-medium">{stats.avg_score}%</span>
              </div>
            )}
          </div>

          {/* Project Intention Status */}
          {!stats?.has_intention && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Project intention required</p>
                <p className="text-xs text-muted-foreground">
                  Define the project intention to enable automatic AI relevance scoring
                </p>
              </div>
              <Button size="sm" onClick={() => setShowIntentionModal(true)}>
                <Target className="h-4 w-4 mr-1" />
                Define
              </Button>
            </div>
          )}

          {stats?.has_intention && stats?.intention_preview && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Project Intention</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 text-xs"
                  onClick={() => setShowIntentionModal(true)}
                >
                  Edit
                </Button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {stats.intention_preview}...
              </p>
            </div>
          )}

          {/* Auto-scoring status */}
          {stats?.has_intention && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Scoring automatique actif
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80">
                  Les nouveaux articles sont automatiquement scorés par l'IA
                  {unscoredCount > 0 && ` (${unscoredCount} en attente)`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectIntentionModal
        open={showIntentionModal}
        onOpenChange={setShowIntentionModal}
        projectId={projectId}
        currentIntention={stats?.intention_preview}
      />
    </>
  );
}

// Compact version for inline display
export function RelevanceScoreCompact({
  score,
  reason,
}: {
  score?: number | null;
  reason?: string;
}) {
  if (score === null || score === undefined) {
    return (
      <span className="text-xs text-muted-foreground">-</span>
    );
  }

  const getColor = () => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <span className={`text-sm font-medium ${getColor()}`} title={reason}>
      {score}%
    </span>
  );
}
