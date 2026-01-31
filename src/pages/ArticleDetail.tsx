import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { SEOScoreCard } from "@/components/SEOScoreCard";
import { TranslationsPanel } from "@/components/TranslationsPanel";

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

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.getArticle(Number(id)),
    enabled: !!id,
  });

  const transformMutation = useMutation({
    mutationFn: () => api.batchTransform([Number(id)]),
    onSuccess: () => {
      toast.success('Article added to transform queue');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const translateMutation = useMutation({
    mutationFn: (langs?: string[]) => api.batchTranslate([Number(id)], langs),
    onSuccess: () => {
      toast.success('Article added to translation queue');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.batchPublish([Number(id)]),
    onSuccess: () => {
      toast.success('Article published');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

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
              <Link to="/repository">Back to Repository</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    collected: 'bg-muted text-muted-foreground',
    transformed: 'bg-warning/10 text-warning border-0',
    translated: 'bg-primary/10 text-primary border-0',
    published: 'bg-success/10 text-success border-0',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/repository">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {article.transformed_title || article.original_title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{article.provider_name}</Badge>
              <Badge
                variant="secondary"
                className={statusColors[article.status] || statusColors.collected}
              >
                {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
              </Badge>
              <Badge variant="outline">{article.language.toUpperCase()}</Badge>
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
            onClick={() => transformMutation.mutate()}
            disabled={transformMutation.isPending}
          >
            {transformMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-transform
          </Button>
          <Button
            variant="outline"
            onClick={() => translateMutation.mutate(undefined)}
            disabled={translateMutation.isPending}
          >
            {translateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Languages className="h-4 w-4 mr-2" />
            )}
            Translate All
          </Button>
          <Button
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Content Comparison</CardTitle>
              <CardDescription>Original vs. transformed content</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="side-by-side">
                <TabsList>
                  <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  <TabsTrigger value="original">Original</TabsTrigger>
                  <TabsTrigger value="transformed">Transformed</TabsTrigger>
                </TabsList>
                <TabsContent value="side-by-side" className="mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Original</Badge>
                        <span className="text-xs text-muted-foreground">{article.provider_name}</span>
                      </div>
                      <ScrollArea className="h-[400px] rounded-lg border p-4">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {article.original_content || 'No original content'}
                          </pre>
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary">Transformed</Badge>
                        <span className="text-xs text-muted-foreground">OVHcloud</span>
                      </div>
                      <ScrollArea className="h-[400px] rounded-lg border p-4 bg-primary/5">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {article.transformed_content || 'Not yet transformed'}
                          </pre>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="original" className="mt-4">
                  <ScrollArea className="h-[500px] rounded-lg border p-4">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {article.original_content || 'No original content'}
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="transformed" className="mt-4">
                  <ScrollArea className="h-[500px] rounded-lg border p-4 bg-primary/5">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {article.transformed_content || 'Not yet transformed'}
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Translation Management */}
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SEO Score */}
          {article.seoScore && (
            <SEOScoreCard
              score={article.seoScore}
              breakdown={article.seo_breakdown}
            />
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{article.word_count?.toLocaleString() || 0} words</p>
                  <p className="text-xs text-muted-foreground">Word count</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {article.created_at ? format(new Date(article.created_at), 'MMM d, yyyy') : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">Collected date</p>
                </div>
              </div>
              {article.transformedAt && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(article.transformedAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">Transformed date</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OVH Links */}
          {article.ovh_links && article.ovh_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>OVHcloud Links</CardTitle>
                <CardDescription>Related documentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {article.ovh_links.map((link: { keyword: string; url: string }, i: number) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <span className="text-primary hover:underline">{link.keyword}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          {article.disclaimer && (
            <Card>
              <CardHeader>
                <CardTitle>Disclaimer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{article.disclaimer}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
