import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  FileWarning,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings,
  Play,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import api, { Provider } from "@/lib/api";

interface DiagnosticSummary {
  total: number;
  valid: number;
  invalid: number;
  botProtectionBlocked: number;
  transformable: number;
}

interface ArticleDiagnosis {
  id: number;
  title: string;
  url: string;
  status: string;
  providerId: number;
  validation: {
    isValid: boolean;
    issues: Array<{ type: string; message: string; severity: string }>;
    wordCount: number;
    contentLength: number;
    canTransform: boolean;
  };
}

function SummaryCard({
  label,
  value,
  total,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ElementType;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`p-2 rounded-full ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value} <span className="text-sm font-normal text-muted-foreground">({percentage}%)</span></p>
      </div>
    </div>
  );
}

function IssuesList({ issues }: { issues: Array<{ type: string; message: string; severity: string }> }) {
  return (
    <div className="space-y-1">
      {issues.map((issue, i) => (
        <div
          key={i}
          className={`text-xs px-2 py-1 rounded ${
            issue.severity === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-yellow-500/10 text-yellow-600'
          }`}
        >
          {issue.type === 'bot_protection_detected' && <Shield className="h-3 w-3 inline mr-1" />}
          {issue.type === 'content_too_short' && <FileWarning className="h-3 w-3 inline mr-1" />}
          {issue.message}
        </div>
      ))}
    </div>
  );
}

interface ArticleDiagnosticPanelProps {
  providerId: number;
  providerName: string;
  provider?: Provider;
  onProviderUpdate?: () => void;
}

export function ArticleDiagnosticPanel({ providerId, providerName, provider, onProviderUpdate }: ArticleDiagnosticPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['article-diagnosis', providerId],
    queryFn: () => api.diagnoseArticles({ providerId }),
    enabled: isExpanded,
    staleTime: 30000, // Cache for 30 seconds
  });

  const validateMutation = useMutation({
    mutationFn: () => api.validateArticles(providerId, true),
    onSuccess: (result) => {
      toast.success(`${result.markedInvalid} articles marqués comme invalides`);
      queryClient.invalidateQueries({ queryKey: ['article-diagnosis', providerId] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const enableJsRenderMutation = useMutation({
    mutationFn: async () => {
      // Update provider to enable JS rendering
      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsRender: true,
          scrapingMethod: 'playwright'
        })
      });
      if (!response.ok) throw new Error('Failed to update provider');
      return response.json();
    },
    onSuccess: () => {
      toast.success('JavaScript Rendering activé. Relancez la collecte.');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      onProviderUpdate?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const summary = data?.summary;
  const articles = data?.articles || [];

  const invalidArticles = articles.filter(a => !a.validation.isValid);
  const botBlockedArticles = articles.filter(a =>
    a.validation.issues.some(i => i.type === 'bot_protection_detected')
  );

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <AlertTriangle className="h-4 w-4 mr-1" />
        Diagnostiquer
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>
    );
  }

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Diagnostic des articles - {providerName}
            </CardTitle>
            <CardDescription>
              Analyse de la qualité du contenu collecté
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyse en cours...</span>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard
                label="Total"
                value={summary.total}
                total={summary.total}
                icon={FileWarning}
                color="bg-muted text-muted-foreground"
              />
              <SummaryCard
                label="Valides"
                value={summary.valid}
                total={summary.total}
                icon={CheckCircle}
                color="bg-green-500/10 text-green-600"
              />
              <SummaryCard
                label="Invalides"
                value={summary.invalid}
                total={summary.total}
                icon={XCircle}
                color="bg-destructive/10 text-destructive"
              />
              <SummaryCard
                label="Cloudflare"
                value={summary.botProtectionBlocked}
                total={summary.total}
                icon={Shield}
                color="bg-yellow-500/10 text-yellow-600"
              />
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Qualité globale</span>
                <span className="font-medium">
                  {summary.total > 0 ? Math.round((summary.valid / summary.total) * 100) : 0}% valides
                </span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${summary.total > 0 ? (summary.valid / summary.total) * 100 : 0}%` }}
                />
                <div
                  className="bg-destructive transition-all"
                  style={{ width: `${summary.total > 0 ? (summary.invalid / summary.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Warning if many invalid */}
            {summary.botProtectionBlocked > 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-700 dark:text-yellow-500">
                      Protection Cloudflare détectée
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      {summary.botProtectionBlocked} article(s) ont été bloqués par la protection anti-bot
                      du site source. Le contenu collecté est une page d'attente au lieu du vrai article.
                    </p>

                    {/* Recommendation */}
                    <div className="mt-3 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm text-blue-700 dark:text-blue-400">
                          Action recommandée
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                        Activez le rendu JavaScript avec Playwright pour contourner la protection anti-bot.
                        Cette méthode simule un vrai navigateur et peut résoudre les blocages Cloudflare.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(!provider?.jsRender || provider?.scrapingMethod !== 'playwright') && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => enableJsRenderMutation.mutate()}
                            disabled={enableJsRenderMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {enableJsRenderMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3 mr-1" />
                            )}
                            Activer JS Rendering
                          </Button>
                        )}
                        {provider?.jsRender && provider?.scrapingMethod === 'playwright' && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            JS Rendering activé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General recommendation for low success rate */}
            {summary.total > 0 && summary.invalid > summary.total * 0.3 && summary.botProtectionBlocked === 0 && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-700 dark:text-orange-500">
                      Taux d'échec élevé ({Math.round((summary.invalid / summary.total) * 100)}%)
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Beaucoup d'articles ont un contenu trop court ou invalide. Vérifiez que les sélecteurs
                      CSS sont corrects ou essayez d'activer le JavaScript Rendering.
                    </p>
                    {!provider?.jsRender && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => enableJsRenderMutation.mutate()}
                        disabled={enableJsRenderMutation.isPending}
                      >
                        {enableJsRenderMutation.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Settings className="h-3 w-3 mr-1" />
                        )}
                        Essayer JS Rendering
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(true)}
                disabled={invalidArticles.length === 0}
              >
                <FileWarning className="h-4 w-4 mr-2" />
                Voir {invalidArticles.length} invalide(s)
              </Button>
              {summary.invalid > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                >
                  {validateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Marquer invalides
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Articles invalides - {providerName}
            </DialogTitle>
            <DialogDescription>
              {invalidArticles.length} article(s) avec des problèmes de contenu
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-3 pr-4">
              {invalidArticles.map((article) => (
                <div key={article.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{article.title}</p>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                      >
                        {article.url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {article.validation.wordCount} mots
                    </Badge>
                  </div>
                  <IssuesList issues={article.validation.issues} />
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function DiagnosticBadge({ providerId }: { providerId: number }) {
  const { data } = useQuery({
    queryKey: ['article-diagnosis', providerId],
    queryFn: () => api.diagnoseArticles({ providerId }),
    staleTime: 60000, // Cache for 1 minute
  });

  if (!data?.summary) return null;

  const { valid, invalid, total } = data.summary;

  if (total === 0) return null;

  const validPercentage = Math.round((valid / total) * 100);

  if (invalid === 0) {
    return (
      <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        100% OK
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs ${
        validPercentage >= 70
          ? 'bg-yellow-500/10 text-yellow-600'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {validPercentage}% OK
    </Badge>
  );
}
