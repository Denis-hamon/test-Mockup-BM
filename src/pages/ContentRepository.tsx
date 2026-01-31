import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import api, { type Article } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleStatusBadge } from "@/components/ArticleStatusBadge";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

function ArticleRow({ article, isSelected, onSelect, onTransform, onTranslate, onPublish, onDelete }: {
  article: Article;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onTransform: () => void;
  onTranslate: () => void;
  onPublish: () => void;
  onDelete: () => void;
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
      <TableCell className="max-w-[300px]">
        <Link to={`/article/${article.id}`} className="hover:underline">
          <span className="font-medium truncate block">{article.title}</span>
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
      <TableCell className="text-muted-foreground text-sm">
        {article.translationsCount || 0} langs
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
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
                <Link to={`/article/${article.id}`}>
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
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(0);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 50;

  const queryClient = useQueryClient();
  const parsedProjectId = projectId ? parseInt(projectId) : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['articles', searchQuery, statusFilter, languageFilter, page, parsedProjectId],
    queryFn: () => api.getArticles({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      language: languageFilter !== 'all' ? languageFilter : undefined,
      projectId: parsedProjectId,
      limit: pageSize,
      offset: page * pageSize,
    }),
    placeholderData: (previousData) => previousData,
  });

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

  const articles = data?.articles || [];
  const total = data?.total || articles.length;
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

  // Calculate pipeline stats
  const pipelineStats = {
    collected: articles.filter(a => a.status === 'collected').length,
    transformed: articles.filter(a => a.status === 'transformed').length,
    translated: articles.filter(a => a.status === 'translated').length,
    published: articles.filter(a => a.status === 'published').length,
  };

  const collectedIds = articles.filter(a => a.status === 'collected').map(a => a.id);
  const transformedIds = articles.filter(a => a.status === 'transformed').map(a => a.id);

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

      {/* Pipeline Overview - Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`cursor-pointer transition-colors ${statusFilter === 'collected' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => setStatusFilter(statusFilter === 'collected' ? 'all' : 'collected')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold">{pipelineStats.collected}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            {pipelineStats.collected > 0 && (
              <Button
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
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-colors ${statusFilter === 'transformed' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => setStatusFilter(statusFilter === 'transformed' ? 'all' : 'transformed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Transformed</p>
                <p className="text-2xl font-bold">{pipelineStats.transformed}</p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
            {pipelineStats.transformed > 0 && (
              <Button
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
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-colors ${statusFilter === 'translated' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => setStatusFilter(statusFilter === 'translated' ? 'all' : 'translated')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Translated</p>
                <p className="text-2xl font-bold">{pipelineStats.translated}</p>
              </div>
              <Languages className="h-8 w-8 text-blue-500" />
            </div>
            {pipelineStats.translated > 0 && (
              <p className="text-xs text-muted-foreground text-center">Ready to publish</p>
            )}
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-colors ${statusFilter === 'published' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => setStatusFilter(statusFilter === 'published' ? 'all' : 'published')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{pipelineStats.published}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground text-center">Complete</p>
          </CardContent>
        </Card>
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
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
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
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                  Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * pageSize >= total}
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
                    />
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * pageSize >= total}
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
