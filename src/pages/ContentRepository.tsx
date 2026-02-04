import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedStatusBadge } from "@/components/ui/animated-badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedList } from "@/components/ui/animated-list";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Languages,
  Globe,
  Download,
  Trash2,
  Grid,
  List,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  Zap,
  Filter,
  Calendar,
  ArrowUpDown,
  Image,
  TrendingUp,
  X,
  Target,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import api, { type Article } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleStatusBadge } from "@/components/ArticleStatusBadge";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { RelevanceScoringPanel, RelevanceScoreCompact } from "@/components/RelevanceScoringPanel";
import { RelevanceScoreBadge } from "@/components/RelevanceScoreBadge";

function ArticleRow({ article, isSelected, onSelect, onTransform, onTranslate, onPublish, onDelete, onScore, isScoring, projectId }: {
  article: Article;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onTransform: () => void;
  onTranslate: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onScore: () => void;
  isScoring?: boolean;
  projectId?: string;
}) {
  const handleCopyTitle = async () => {
    const title = article.transformed_title || article.original_title || article.title || '';
    await navigator.clipboard.writeText(title);
    toast.success('Title copied to clipboard');
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(article.source_url);
    toast.success('URL copied to clipboard');
  };

  // Determine next action based on status
  const getNextAction = () => {
    switch (article.status) {
      case 'collected':
        return { label: 'Transform', icon: Sparkles, action: onTransform, color: 'text-yellow-600' };
      case 'transformed':
        return { label: 'Translate', icon: Languages, action: onTranslate, color: 'text-blue-600' };
      case 'translated':
        return { label: 'Publish', icon: Globe, action: onPublish, color: 'text-green-600' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell className="max-w-[400px]">
        <Link to={projectId ? `/projects/${projectId}/article/${article.id}` : `/article/${article.id}`} className="hover:underline">
          <span className="font-medium line-clamp-2">{article.transformed_title || article.original_title || article.title || 'Untitled'}</span>
        </Link>
        <span className="text-xs text-muted-foreground">{article.provider_name}</span>
      </TableCell>
      <TableCell>
        <ArticleStatusBadge status={article.status} />
      </TableCell>
      <TableCell>
        <Badge variant="outline">{article.language.toUpperCase()}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {(article.word_count || 0).toLocaleString()} words
      </TableCell>
      <TableCell>
        <RelevanceScoreBadge
          score={article.relevance_score}
          reason={article.relevance_reason}
          size="sm"
        />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {article.translationsCount || 0} langs
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Score button - show if not scored */}
          {(article.relevance_score === null || article.relevance_score === undefined) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-600"
              onClick={onScore}
              disabled={isScoring}
              title="Score Relevance"
            >
              {isScoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
            </Button>
          )}
          {/* Quick action button */}
          {nextAction && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${nextAction.color}`}
              onClick={nextAction.action}
              title={nextAction.label}
            >
              <nextAction.icon className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={projectId ? `/projects/${projectId}/article/${article.id}` : `/article/${article.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyTitle}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {article.status === 'collected' && (
                <DropdownMenuItem onClick={onTransform}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Transform
                </DropdownMenuItem>
              )}
              {(article.status === 'transformed' || article.status === 'collected') && (
                <DropdownMenuItem onClick={onTranslate}>
                  <Languages className="h-4 w-4 mr-2" />
                  Translate
                </DropdownMenuItem>
              )}
              {article.status !== 'published' && (
                <DropdownMenuItem onClick={onPublish}>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onTransform}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-transform
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onScore} disabled={isScoring}>
                <Target className="h-4 w-4 mr-2" />
                {article.relevance_score !== null && article.relevance_score !== undefined ? 'Re-score Relevance' : 'Score Relevance'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ContentRepository() {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [wordCountFilter, setWordCountFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [hasTranslations, setHasTranslations] = useState<string>("all");
  const [relevanceFilter, setRelevanceFilter] = useState<string>("all");
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showRelevancePanel, setShowRelevancePanel] = useState(false);
  const [page, setPage] = useState(0);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 50;

  const queryClient = useQueryClient();
  const parsedProjectId = projectId ? parseInt(projectId) : undefined;

  // Fetch providers for the filter
  const { data: providers = [] } = useQuery({
    queryKey: ['providers', parsedProjectId],
    queryFn: () => api.getProviders(parsedProjectId),
  });

  // Fetch stats separately (without status filter) so cards always show correct totals
  const { data: statsData } = useQuery({
    queryKey: ['articles-stats', parsedProjectId, providerFilter, languageFilter],
    queryFn: () => api.getArticles({
      language: languageFilter !== 'all' ? languageFilter : undefined,
      providerId: providerFilter !== 'all' ? parseInt(providerFilter) : undefined,
      projectId: parsedProjectId,
      limit: 1000, // Get enough to count stats
      offset: 0,
    }),
    staleTime: 10000, // Cache for 10 seconds
  });

  const { data, isLoading } = useQuery({
    queryKey: ['articles', searchQuery, statusFilter, languageFilter, providerFilter, dateFilter, wordCountFilter, sortBy, hasTranslations, page, parsedProjectId],
    queryFn: () => api.getArticles({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      language: languageFilter !== 'all' ? languageFilter : undefined,
      providerId: providerFilter !== 'all' ? parseInt(providerFilter) : undefined,
      projectId: parsedProjectId,
      limit: pageSize,
      offset: page * pageSize,
    }),
    placeholderData: (previousData) => previousData,
  });

  // Count active filters
  const activeFilterCount = [
    statusFilter !== 'all',
    languageFilter !== 'all',
    providerFilter !== 'all',
    dateFilter !== 'all',
    wordCountFilter !== 'all',
    hasTranslations !== 'all',
    relevanceFilter !== 'all',
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
    setLanguageFilter('all');
    setProviderFilter('all');
    setDateFilter('all');
    setWordCountFilter('all');
    setHasTranslations('all');
    setRelevanceFilter('all');
    setSearchQuery('');
    setPage(0);
  };

  // Apply client-side filters for date, word count, translations (until backend supports them)
  const filterArticles = (articles: Article[]) => {
    let filtered = [...articles];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(a => {
        const created = new Date(a.created_at);
        switch (dateFilter) {
          case 'today': return created >= today;
          case 'week': return created >= weekAgo;
          case 'month': return created >= monthAgo;
          case 'older': return created < monthAgo;
          default: return true;
        }
      });
    }

    // Word count filter
    if (wordCountFilter !== 'all') {
      filtered = filtered.filter(a => {
        const wc = a.word_count || 0;
        switch (wordCountFilter) {
          case 'short': return wc < 500;
          case 'medium': return wc >= 500 && wc <= 1500;
          case 'long': return wc > 1500;
          default: return true;
        }
      });
    }

    // Has translations filter
    if (hasTranslations !== 'all') {
      filtered = filtered.filter(a => {
        const count = a.translationsCount || 0;
        return hasTranslations === 'yes' ? count > 0 : count === 0;
      });
    }

    // Relevance score filter
    if (relevanceFilter !== 'all') {
      filtered = filtered.filter(a => {
        const score = a.relevance_score;
        if (relevanceFilter === 'unscored') return score === null || score === undefined;
        if (score === null || score === undefined) return false;
        switch (relevanceFilter) {
          case 'high': return score >= 80;
          case 'medium': return score >= 60 && score < 80;
          case 'moderate': return score >= 40 && score < 60;
          case 'low': return score < 40;
          default: return true;
        }
      });
    }

    // Search filter (client-side for better UX)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        (a.transformed_title || a.original_title || a.title || '').toLowerCase().includes(query) ||
        (a.provider_name || '').toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'longest':
          return (b.word_count || 0) - (a.word_count || 0);
        case 'shortest':
          return (a.word_count || 0) - (b.word_count || 0);
        case 'alphabetical':
          return (a.transformed_title || a.original_title || '').localeCompare(b.transformed_title || b.original_title || '');
        case 'relevance_high':
          return (b.relevance_score ?? -1) - (a.relevance_score ?? -1);
        case 'relevance_low':
          return (a.relevance_score ?? 101) - (b.relevance_score ?? 101);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  };

  // Single article mutations
  const transformSingleMutation = useMutation({
    mutationFn: (id: number) => api.batchTransform([id]),
    onSuccess: () => {
      toast.success('Article queued for transformation');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const translateSingleMutation = useMutation({
    mutationFn: (id: number) => api.batchTranslate([id]),
    onSuccess: () => {
      toast.success('Article queued for translation');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishSingleMutation = useMutation({
    mutationFn: (id: number) => api.batchPublish([id]),
    onSuccess: () => {
      toast.success('Article published');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSingleMutation = useMutation({
    mutationFn: (id: number) => api.batchDelete([id]),
    onSuccess: () => {
      toast.success('Article deleted');
      setDeletingArticle(null);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Batch mutations
  const batchTransformMutation = useMutation({
    mutationFn: (ids: number[]) => api.batchTransform(ids),
    onSuccess: () => {
      toast.success('Articles added to transform queue');
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const batchTranslateMutation = useMutation({
    mutationFn: (ids: number[]) => api.batchTranslate(ids),
    onSuccess: () => {
      toast.success('Articles added to translation queue');
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.batchDelete(ids),
    onSuccess: (result: { message: string; deleted: number }) => {
      toast.success(`${result.deleted} articles deleted`);
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Single article scoring
  const [scoringArticleId, setScoringArticleId] = useState<number | null>(null);
  const scoreSingleMutation = useMutation({
    mutationFn: (id: number) => {
      setScoringArticleId(id);
      return api.scoreArticleRelevance(id);
    },
    onSuccess: (result) => {
      toast.success(`Article scored: ${result.score}% - ${result.recommendation}`);
      setScoringArticleId(null);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['relevance-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setScoringArticleId(null);
    },
  });

  // Batch scoring mutation
  const batchScoreMutation = useMutation({
    mutationFn: (ids: number[]) => api.batchScoreRelevance(ids, parsedProjectId),
    onSuccess: (result) => {
      toast.success(`${result.scored} articles scored, ${result.errors} errors`);
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['relevance-stats'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rawArticles = data?.articles || [];
  const articles = filterArticles(rawArticles);
  const total = data?.total || rawArticles.length;
  const filteredTotal = articles.length;
  const languages = Object.keys(data?.counts || {});

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(new Set(articles.map(a => a.id)));
    } else {
      setSelectedArticles(new Set());
    }
  };

  const toggleSelectArticle = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedArticles(newSelected);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvData = await api.exportArticles({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        language: languageFilter !== 'all' ? languageFilter : undefined,
        format: 'csv',
      });

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `articles-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Export downloaded');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate pipeline stats from stats query (independent of status filter)
  const allArticlesForStats = statsData?.articles || [];
  const pipelineStats = {
    collected: allArticlesForStats.filter(a => a.status === 'collected').length,
    transformed: allArticlesForStats.filter(a => a.status === 'transformed').length,
    translated: allArticlesForStats.filter(a => a.status === 'translated').length,
    published: allArticlesForStats.filter(a => a.status === 'published').length,
  };

  const collectedIds = allArticlesForStats.filter(a => a.status === 'collected').map(a => a.id);
  const transformedIds = allArticlesForStats.filter(a => a.status === 'transformed').map(a => a.id);

  // Transform all collected articles
  const transformAllMutation = useMutation({
    mutationFn: () => api.batchTransform(collectedIds),
    onSuccess: () => {
      toast.success(`${collectedIds.length} articles queued for transformation`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Translate all transformed articles
  const translateAllMutation = useMutation({
    mutationFn: () => api.batchTranslate(transformedIds),
    onSuccess: () => {
      toast.success(`${transformedIds.length} articles queued for translation`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!projectId ? (
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Repository</h1>
            <p className="text-muted-foreground mt-1">
              {total.toLocaleString()} articles found
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {total.toLocaleString()} article{total !== 1 ? 's' : ''} in this project
          </p>
        )}
        <div className="flex gap-2">
          {parsedProjectId && (
            <Button
              variant={showRelevancePanel ? "secondary" : "outline"}
              onClick={() => setShowRelevancePanel(!showRelevancePanel)}
            >
              <Target className="h-4 w-4 mr-2" />
              Relevance AI
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Relevance Scoring Panel */}
      <AnimatePresence>
        {showRelevancePanel && parsedProjectId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <RelevanceScoringPanel
              projectId={parsedProjectId}
              articles={allArticlesForStats}
              onComplete={() => queryClient.invalidateQueries({ queryKey: ['articles'] })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Overview - Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnimatedCard
          hoverEffect="lift"
          delay={0}
          className={`cursor-pointer ${statusFilter === 'collected' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'collected' ? 'all' : 'collected')}
        >
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <AnimatedNumber value={pipelineStats.collected} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <FileText className="h-8 w-8 text-muted-foreground" />
              </motion.div>
            </div>
            {pipelineStats.collected > 0 && (
              <AnimatedButton
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  transformAllMutation.mutate();
                }}
                disabled={transformAllMutation.isPending}
              >
                {transformAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Transform All
              </AnimatedButton>
            )}
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard
          hoverEffect="lift"
          delay={0.1}
          className={`cursor-pointer ${statusFilter === 'transformed' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'transformed' ? 'all' : 'transformed')}
        >
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Transformed</p>
                <AnimatedNumber value={pipelineStats.transformed} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </motion.div>
            </div>
            {pipelineStats.transformed > 0 && (
              <AnimatedButton
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  translateAllMutation.mutate();
                }}
                disabled={translateAllMutation.isPending}
              >
                {translateAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4 mr-2" />
                )}
                Translate All
              </AnimatedButton>
            )}
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard
          hoverEffect="lift"
          delay={0.2}
          className={`cursor-pointer ${statusFilter === 'translated' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'translated' ? 'all' : 'translated')}
        >
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Translated</p>
                <AnimatedNumber value={pipelineStats.translated} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <Languages className="h-8 w-8 text-blue-500" />
              </motion.div>
            </div>
            {pipelineStats.translated > 0 && (
              <p className="text-xs text-muted-foreground text-center">Ready to publish</p>
            )}
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard
          hoverEffect="glow"
          delay={0.3}
          className={`cursor-pointer ${statusFilter === 'published' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'published' ? 'all' : 'published')}
        >
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <AnimatedNumber value={pipelineStats.published} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Complete</p>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Selection Actions Bar */}
      {selectedArticles.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedArticles.size} article{selectedArticles.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => batchTransformMutation.mutate(Array.from(selectedArticles))}
                  disabled={batchTransformMutation.isPending}
                >
                  {batchTransformMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Transform
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => batchTranslateMutation.mutate(Array.from(selectedArticles))}
                  disabled={batchTranslateMutation.isPending}
                >
                  {batchTranslateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Languages className="h-4 w-4 mr-2" />
                  )}
                  Translate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => batchScoreMutation.mutate(Array.from(selectedArticles))}
                  disabled={batchScoreMutation.isPending}
                >
                  {batchScoreMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  Score
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => batchDeleteMutation.mutate(Array.from(selectedArticles))}
                  disabled={batchDeleteMutation.isPending}
                >
                  {batchDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedArticles(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Main filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="transformed">Transformed</SelectItem>
                <SelectItem value="translated">Translated</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={(v) => { setLanguageFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="relevance_high">Most Relevant</SelectItem>
                <SelectItem value="relevance_low">Least Relevant</SelectItem>
                <SelectItem value="longest">Longest</SelectItem>
                <SelectItem value="shortest">Shortest</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none h-9 w-9"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced filters row */}
          {showAdvancedFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
              <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="older">Older</SelectItem>
                </SelectContent>
              </Select>
              <Select value={wordCountFilter} onValueChange={(v) => { setWordCountFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[150px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Length</SelectItem>
                  <SelectItem value="short">Short (&lt;500 words)</SelectItem>
                  <SelectItem value="medium">Medium (500-1500)</SelectItem>
                  <SelectItem value="long">Long (&gt;1500 words)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={hasTranslations} onValueChange={(v) => { setHasTranslations(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <Languages className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Translations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Articles</SelectItem>
                  <SelectItem value="yes">With Translations</SelectItem>
                  <SelectItem value="no">Without Translations</SelectItem>
                </SelectContent>
              </Select>
              <Select value={relevanceFilter} onValueChange={(v) => { setRelevanceFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <Target className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Relevance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (80+)</SelectItem>
                  <SelectItem value="medium">Medium (60-79)</SelectItem>
                  <SelectItem value="moderate">Moderate (40-59)</SelectItem>
                  <SelectItem value="low">Low (&lt;40)</SelectItem>
                  <SelectItem value="unscored">Not Scored</SelectItem>
                </SelectContent>
              </Select>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          )}

          {/* Active filters summary */}
          {activeFilterCount > 0 && !showAdvancedFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
              <span>•</span>
              <span>{filteredTotal} of {total} articles</span>
              <Button
                variant="link"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground h-auto p-0"
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {articles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isSelected={selectedArticles.has(article.id)}
                    onSelect={(checked) => toggleSelectArticle(article.id, checked)}
                    onTransform={() => transformSingleMutation.mutate(article.id)}
                    onTranslate={() => translateSingleMutation.mutate(article.id)}
                    onPublish={() => publishSingleMutation.mutate(article.id)}
                    onDelete={() => setDeletingArticle(article)}
                  />
                ))}
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {Math.ceil(total / pageSize)} • Showing {articles.length} of {total} articles
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (page > 0) setPage(page - 1);
                    }}
                    disabled={page === 0 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page + 1} / {Math.ceil(total / pageSize) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if ((page + 1) * pageSize < total) setPage(page + 1);
                    }}
                    disabled={(page + 1) * pageSize >= total || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedArticles.size === articles.length && articles.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Relevance</TableHead>
                    <TableHead>Translations</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map(article => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      isSelected={selectedArticles.has(article.id)}
                      onSelect={(checked) => toggleSelectArticle(article.id, checked)}
                      onTransform={() => transformSingleMutation.mutate(article.id)}
                      onTranslate={() => translateSingleMutation.mutate(article.id)}
                      onPublish={() => publishSingleMutation.mutate(article.id)}
                      onDelete={() => setDeletingArticle(article)}
                      onScore={() => scoreSingleMutation.mutate(article.id)}
                      isScoring={scoringArticleId === article.id}
                      projectId={projectId}
                    />
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {Math.ceil(total / pageSize)} • Showing {articles.length} of {total} articles
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (page > 0) setPage(page - 1);
                    }}
                    disabled={page === 0 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page + 1} / {Math.ceil(total / pageSize) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if ((page + 1) * pageSize < total) setPage(page + 1);
                    }}
                    disabled={(page + 1) * pageSize >= total || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingArticle}
        onOpenChange={(open) => !open && setDeletingArticle(null)}
        title="Delete Article"
        description={`Are you sure you want to delete "${deletingArticle?.title}"? This action cannot be undone.`}
        onConfirm={() => deletingArticle && deleteSingleMutation.mutate(deletingArticle.id)}
        isLoading={deleteSingleMutation.isPending}
      />
    </div>
  );
}
