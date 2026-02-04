import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedStatusBadge } from "@/components/ui/animated-badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Languages,
  Globe,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  AlertCircle,
  Loader2,
  Pencil,
  Eye,
  Copy,
  Sparkles,
  Save,
  X,
  Image as ImageIcon,
  ImagePlus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { SEOScoreCard } from "@/components/SEOScoreCard";
import { TranslationsPanel } from "@/components/TranslationsPanel";
import { ArticleEditor } from "@/components/ArticleEditor";
import { DeepSeekTransformDialog } from "@/components/DeepSeekTransformDialog";

const ALL_LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'pl'];

function TranslationStatus({ translations, onTranslate }: {
  translations: Array<{ id: number; language: string; status: string; transformed_title?: string }>;
  onTranslate: (lang: string) => void;
}) {
  const translatedLangs = new Set(translations.map(t => t.language));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ALL_LANGUAGES.map(lang => {
        const isCompleted = translatedLangs.has(lang);
        const translation = translations.find(t => t.language === lang);

        return (
          <div
            key={lang}
            className={`flex items-center gap-2 p-3 rounded-lg border ${
              isCompleted ? 'bg-success/5 border-success/20' : 'bg-muted/50'
            }`}
          >
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{lang.toUpperCase()}</span>
            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-xs"
                onClick={() => onTranslate(lang)}
              >
                Translate
              </Button>
            )}
            {isCompleted && translation && (
              <Link
                to={`/article/${translation.id}`}
                className="ml-auto text-xs text-primary hover:underline"
              >
                View
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Title edit dialog
function TitleEditDialog({
  open,
  onOpenChange,
  currentTitle,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  onSave: (title: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(currentTitle);

  const handleSave = async () => {
    await onSave(title);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Title</DialogTitle>
          <DialogDescription>
            Update the article title. This will be used for display and SEO.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ArticleDetail() {
  const { id, articleId, id: projectId } = useParams<{ id: string; articleId: string }>();
  // Support both /article/:id and /projects/:id/article/:articleId routes
  const actualArticleId = articleId || id;
  const actualProjectId = articleId ? id : undefined; // Only set if we're in project-scoped route

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("editor");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [deepSeekTaskId, setDeepSeekTaskId] = useState<string | null>(null);
  const [showDeepSeekDialog, setShowDeepSeekDialog] = useState(false);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', actualArticleId],
    queryFn: () => api.getArticle(Number(actualArticleId)),
    enabled: !!actualArticleId,
  });

  // Back link based on context
  const backLink = actualProjectId ? `/projects/${actualProjectId}/repository` : '/repository';

  // DeepSeek transform mutation for single article re-transform
  const transformMutation = useMutation({
    mutationFn: () => api.transformSingleWithDeepSeek(Number(actualArticleId)),
    onSuccess: (result) => {
      setDeepSeekTaskId(result.taskId);
      setShowDeepSeekDialog(true);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleDeepSeekComplete = () => {
    setShowDeepSeekDialog(false);
    setDeepSeekTaskId(null);
    toast.success('Article transformed successfully with DeepSeek!');
    queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
  };

  const translateMutation = useMutation({
    mutationFn: (langs?: string[]) => api.batchTranslate([Number(actualArticleId)], langs),
    onSuccess: () => {
      toast.success('Article added to translation queue');
      queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.batchPublish([Number(actualArticleId)]),
    onSuccess: () => {
      toast.success('Article published');
      queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.approveArticle(Number(actualArticleId)),
    onSuccess: (result) => {
      toast.success(`Article approved! Translating to ${result.targetLanguages.length} languages`);
      queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateArticleMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string }) =>
      api.updateArticle(Number(actualArticleId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Edit article with learning capture (for content changes)
  const editArticleMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string }) =>
      api.editArticle(Number(actualArticleId), data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
      if (result.editId) {
        toast.success(`Edit saved & queued for AI analysis (${result.wordCountDelta > 0 ? '+' : ''}${result.wordCountDelta} words)`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Thumbnail generation mutation
  const generateThumbnailMutation = useMutation({
    mutationFn: () => api.generateThumbnail(Number(actualArticleId)),
    onSuccess: (result) => {
      toast.success('Thumbnail generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['article', actualArticleId] });
    },
    onError: (error: Error) => toast.error(`Failed to generate thumbnail: ${error.message}`),
  });

  const handleSaveContent = async (content: string, html: string) => {
    // Use editArticle to capture the edit for AI learning
    await editArticleMutation.mutateAsync({ content: html });
  };

  const handleSaveTitle = async (title: string) => {
    await updateArticleMutation.mutateAsync({ title });
    toast.success('Title updated');
  };

  const handleCopyContent = async () => {
    const content = article?.transformed_content || article?.original_content || '';
    await navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to={backLink}>Back to Repository</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    collected: 'bg-muted text-muted-foreground',
    transformed: 'bg-warning/10 text-warning border-0',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0',
    translated: 'bg-primary/10 text-primary border-0',
    published: 'bg-success/10 text-success border-0',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backLink}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {article.transformed_title || article.original_title}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditingTitle(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">{article.provider_name}</Badge>
              <Badge
                variant="secondary"
                className={statusColors[article.status] || statusColors.collected}
              >
                {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
              </Badge>
              <Badge variant="outline">{article.language.toUpperCase()}</Badge>
              <span className="text-sm text-muted-foreground">
                {article.word_count?.toLocaleString() || 0} words
              </span>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View Original <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyContent}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => transformMutation.mutate()}
            disabled={transformMutation.isPending}
          >
            {transformMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Re-transform
          </Button>
          {article.status === 'transformed' && (
            <Button
              size="sm"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve & Translate
            </Button>
          )}
          {(article.status === 'approved' || article.status === 'translated') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => translateMutation.mutate(undefined)}
              disabled={translateMutation.isPending}
            >
              {translateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Languages className="h-4 w-4 mr-2" />
              )}
              Retranslate
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || article.status === 'published'}
          >
            {publishMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            {article.status === 'published' ? 'Published' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Translations ({article.translations?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ArticleEditor
                initialContent={article.transformed_content || article.original_content || ''}
                onSave={handleSaveContent}
                readOnly={false}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Thumbnail */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Thumbnail
                    </span>
                    {article.thumbnail_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => generateThumbnailMutation.mutate()}
                        disabled={generateThumbnailMutation.isPending}
                      >
                        {generateThumbnailMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {article.thumbnail_url ? (
                    <img
                      src={article.thumbnail_url}
                      alt="Article thumbnail"
                      className="w-full rounded-lg border"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg bg-muted/30">
                      <ImagePlus className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground text-center mb-3">
                        No thumbnail yet
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateThumbnailMutation.mutate()}
                        disabled={generateThumbnailMutation.isPending || article.status === 'collected'}
                      >
                        {generateThumbnailMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Thumbnail
                          </>
                        )}
                      </Button>
                      {article.status === 'collected' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Transform the article first
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Score */}
              {article.seoScore && (
                <SEOScoreCard
                  score={article.seoScore}
                  breakdown={article.seo_breakdown}
                />
              )}

              {/* Quick Stats */}
              <AnimatedCard hoverEffect="border" delay={0.1}>
                <AnimatedCardHeader className="pb-2">
                  <AnimatedCardTitle className="text-sm">Statistics</AnimatedCardTitle>
                </AnimatedCardHeader>
                <AnimatedCardContent className="space-y-3">
                  <motion.div
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-muted-foreground">Words</span>
                    <AnimatedNumber value={article.word_count || 0} className="font-medium" />
                  </motion.div>
                  <motion.div
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-muted-foreground">Translations</span>
                    <AnimatedNumber value={article.translations?.length || 0} className="font-medium" />
                  </motion.div>
                  <motion.div
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">{article.language.toUpperCase()}</span>
                  </motion.div>
                  <Separator />
                  <motion.div
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-medium">
                      {article.created_at ? format(new Date(article.created_at), 'MMM d, yyyy') : '-'}
                    </span>
                  </motion.div>
                  {article.transformedAt && (
                    <motion.div
                      className="flex justify-between text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <span className="text-muted-foreground">Transformed</span>
                      <span className="font-medium">
                        {format(new Date(article.transformedAt), 'MMM d, yyyy')}
                      </span>
                    </motion.div>
                  )}
                </AnimatedCardContent>
              </AnimatedCard>

              {/* OVH Links */}
              {article.ovh_links && article.ovh_links.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">OVHcloud Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {article.ovh_links.slice(0, 5).map((link: { keyword: string; url: string }, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted text-xs"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-primary hover:underline truncate">{link.keyword}</span>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Comparison</CardTitle>
              <CardDescription>Original vs. transformed content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Original</Badge>
                    <span className="text-xs text-muted-foreground">{article.provider_name}</span>
                  </div>
                  <ScrollArea className="h-[600px] rounded-lg border p-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div
                        className="whitespace-pre-wrap text-sm"
                        dangerouslySetInnerHTML={{
                          __html: article.original_content || '<p class="text-muted-foreground">No original content</p>'
                        }}
                      />
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">Transformed</Badge>
                    <span className="text-xs text-muted-foreground">OVHcloud</span>
                  </div>
                  <ScrollArea className="h-[600px] rounded-lg border p-4 bg-primary/5">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div
                        className="whitespace-pre-wrap text-sm"
                        dangerouslySetInnerHTML={{
                          __html: article.transformed_content || '<p class="text-muted-foreground">Not yet transformed</p>'
                        }}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translations Tab */}
        <TabsContent value="translations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Translations
              </CardTitle>
              <CardDescription>
                {article.translations?.length || 0} of {ALL_LANGUAGES.length - 1} languages completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TranslationsPanel
                articleId={article.id}
                translations={article.translations || []}
                sourceLanguage={article.language}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Title Edit Dialog */}
      <TitleEditDialog
        open={isEditingTitle}
        onOpenChange={setIsEditingTitle}
        currentTitle={article.transformed_title || article.original_title || ''}
        onSave={handleSaveTitle}
        isSaving={updateArticleMutation.isPending}
      />

      {/* DeepSeek Transform Progress Dialog */}
      <DeepSeekTransformDialog
        open={showDeepSeekDialog}
        onOpenChange={setShowDeepSeekDialog}
        taskId={deepSeekTaskId}
        articleTitle={article.transformed_title || article.original_title || ''}
        onComplete={handleDeepSeekComplete}
      />
    </div>
  );
}
