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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api, { type Article } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

type ArticleStatus = Article['status'];

function StatusBadge({ status }: { status: ArticleStatus }) {
  const config = {
    collected: { label: 'Collected', className: 'bg-muted text-muted-foreground' },
    transformed: { label: 'Transformed', className: 'bg-warning/10 text-warning' },
    translated: { label: 'Translated', className: 'bg-primary/10 text-primary' },
    published: { label: 'Published', className: 'bg-success/10 text-success' },
  };

  const { label, className } = config[status] || config.collected;

  return (
    <Badge variant="secondary" className={`${className} border-0`}>
      {label}
    </Badge>
  );
}

function ArticleRow({ article, isSelected, onSelect, onTransform, onTranslate, onPublish, onDelete }: {
  article: Article;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onTransform: () => void;
  onTranslate: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
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
        <span className="text-xs text-muted-foreground">{article.providerName}</span>
      </TableCell>
      <TableCell>
        <StatusBadge status={article.status} />
      </TableCell>
      <TableCell>
        <Badge variant="outline">{article.language.toUpperCase()}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {article.wordCount.toLocaleString()} words
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {article.translationsCount} langs
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/article/${article.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onTransform}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-transform
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTranslate}>
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPublish}>
              <Globe className="h-4 w-4 mr-2" />
              Publish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function ContentRepository() {
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

  const { data, isLoading } = useQuery({
    queryKey: ['articles', searchQuery, statusFilter, languageFilter, page],
    queryFn: () => api.getArticles({
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      language: languageFilter !== 'all' ? languageFilter : undefined,
      limit: pageSize,
      offset: page * pageSize,
      parentOnly: true,
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
    onSuccess: (result) => {
      toast.success(`${result.deleted} articles deleted`);
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const articles = data?.articles || [];
  const total = data?.total || 0;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Repository</h1>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString()} articles found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          {selectedArticles.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => batchTransformMutation.mutate(Array.from(selectedArticles))}
                disabled={batchTransformMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Transform ({selectedArticles.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => batchTranslateMutation.mutate(Array.from(selectedArticles))}
                disabled={batchTranslateMutation.isPending}
              >
                <Languages className="h-4 w-4 mr-2" />
                Translate ({selectedArticles.size})
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => batchDeleteMutation.mutate(Array.from(selectedArticles))}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedArticles.size})
              </Button>
            </>
          )}
        </div>
      </div>

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
