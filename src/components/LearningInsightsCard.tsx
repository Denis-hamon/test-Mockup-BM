import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  CheckCircle,
  XCircle,
  Lightbulb,
  TrendingUp,
  Edit3,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface LearningInsightsCardProps {
  projectId: number;
}

const categoryColors: Record<string, string> = {
  tone: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  structure: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  vocabulary: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  formatting: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const categoryIcons: Record<string, React.ReactNode> = {
  tone: <Sparkles className="h-3 w-3" />,
  structure: <Edit3 className="h-3 w-3" />,
  vocabulary: <Brain className="h-3 w-3" />,
  formatting: <TrendingUp className="h-3 w-3" />,
};

export function LearningInsightsCard({ projectId }: LearningInsightsCardProps) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['learnings', projectId],
    queryFn: () => api.getProjectLearnings(projectId),
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: editStats } = useQuery({
    queryKey: ['edit-stats', projectId],
    queryFn: () => api.getEditStats(projectId),
  });

  const actionMutation = useMutation({
    mutationFn: ({ learningId, action }: { learningId: number; action: 'apply' | 'reject' }) =>
      api.learningAction(projectId, learningId, action),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['learnings', projectId] });
      toast.success(variables.action === 'apply' ? 'Rule applied to AI Guidelines!' : 'Rule dismissed');
      setActionLoading(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setActionLoading(null);
    },
  });

  const handleAction = (learningId: number, action: 'apply' | 'reject') => {
    setActionLoading(learningId);
    actionMutation.mutate({ learningId, action });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const suggestedLearnings = data?.learnings.filter(l => l.status === 'suggested') || [];
  const appliedLearnings = data?.learnings.filter(l => l.status === 'applied') || [];
  const totalEdits = data?.totalEdits || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Learning from Your Edits
        </CardTitle>
        <CardDescription>
          The AI analyzes your editorial corrections to improve future transformations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalEdits}</div>
            <div className="text-xs text-muted-foreground">Total Edits</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{editStats?.edits_this_week || 0}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{appliedLearnings.length}</div>
            <div className="text-xs text-muted-foreground">Rules Applied</div>
          </div>
        </div>

        {/* Suggested Rules */}
        {suggestedLearnings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Suggested Rules ({suggestedLearnings.length})
            </h4>
            <div className="space-y-2">
              {suggestedLearnings.slice(0, 5).map((learning) => (
                <div
                  key={learning.id}
                  className="p-3 border rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={categoryColors[learning.rule_type] || categoryColors.general}>
                          {categoryIcons[learning.rule_type]}
                          <span className="ml-1 capitalize">{learning.rule_type}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(learning.confidence_score * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm">{learning.rule_description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Detected in {learning.occurrence_count} edit{learning.occurrence_count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleAction(learning.id, 'apply')}
                        disabled={actionLoading === learning.id}
                      >
                        {actionLoading === learning.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleAction(learning.id, 'reject')}
                        disabled={actionLoading === learning.id}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applied Rules */}
        {appliedLearnings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Applied Rules ({appliedLearnings.length})
            </h4>
            <div className="space-y-2">
              {appliedLearnings.slice(0, 3).map((learning) => (
                <div
                  key={learning.id}
                  className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-900/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={categoryColors[learning.rule_type] || categoryColors.general}>
                      <span className="capitalize">{learning.rule_type}</span>
                    </Badge>
                  </div>
                  <p className="text-sm">{learning.rule_description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalEdits === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Edit3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No edits yet</p>
            <p className="text-sm">Edit articles to help the AI learn your preferences</p>
          </div>
        )}

        {totalEdits > 0 && suggestedLearnings.length === 0 && appliedLearnings.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">AI is analyzing your edits...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
